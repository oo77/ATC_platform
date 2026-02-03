import { aiCertificateRepository } from "../../repositories/aiCertificateRepository";
import { createStandaloneCertificate } from "../../repositories/certificateTemplateRepository";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { storage } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const body = await readBody(event);
  const { fileId, studentId, overrideData } = body;

  if (!fileId)
    throw createError({ statusCode: 400, message: "File ID required" });
  if (!studentId)
    throw createError({ statusCode: 400, message: "Student ID required" });

  const log = await aiCertificateRepository.getLogById(fileId);
  if (!log) throw createError({ statusCode: 404, message: "Log not found" });

  if (log.status === "success" && log.certificateId) {
    return {
      success: true,
      certificateId: log.certificateId,
      alreadyCreated: true,
    };
  }

  // Слияние данных: override > AI extracted
  const baseData = log.extractedData || {};
  const finalData = { ...baseData, ...overrideData };

  // Получам URL файла
  // @ts-ignore
  const fileUuid = log.extractedData?._internal?.fileUuid;

  const pdfUrl = fileUuid ? storage.getPublicUrl(fileUuid) : null;

  // Убираем _internal из финальных данных для чистоты
  if ("_internal" in finalData) {
    delete (finalData as any)._internal;
  }

  try {
    // 1. Создаем базовый сертификат
    const cert = await createStandaloneCertificate({
      studentId: studentId,
      certificateNumber: finalData.certificateNumber || "UNKNOWN",
      issueDate: new Date(finalData.issueDate || Date.now()),
      expiryDate: finalData.expiryDate ? new Date(finalData.expiryDate) : null,
      courseName: finalData.courseName || "Unknown Course",
      courseHours: finalData.courseHours
        ? Number(finalData.courseHours)
        : undefined,
      sourceType: "import",
      importSource: "ai_scan",
      pdfFileUrl: pdfUrl || undefined,
      issuedBy: context.userId,
      notes: `AI Import (Log ID: ${fileId})`,
    });

    // 2. Прикрепляем AI метаданные
    // Игнорируем ошибку updateCertificateWithAiData если она есть в типах, т.к. мы только что добавили метод
    // @ts-ignore
    await aiCertificateRepository.updateCertificateWithAiData(cert.id, {
      extractedData: finalData,
      confidence: log.aiConfidence || 1.0,
      processingStatus: "completed",
      originalFileUrl: pdfUrl || undefined,
    });

    // 3. Обновляем лог
    await aiCertificateRepository.updateLog(fileId, {
      certificateId: cert.id,
      matchedStudentId: studentId,
      matchMethod: "manual",
      matchConfidence: 1.0,
      extractedData: finalData, // Сохраняем "чистые" данные
      status: "success" as any,
    });

    return { success: true, certificateId: cert.id };
  } catch (error: any) {
    console.error("Confirmation error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create certificate",
    });
  }
});
