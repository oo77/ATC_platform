/**
 * API endpoint для AI-анализа загруженных файлов сертификатов
 * Используется представителями организаций в Telegram Mini App
 *
 * Особенности:
 * - Поиск студентов ТОЛЬКО в пределах организации представителя
 * - Создание новых студентов ЗАПРЕЩЕНО
 *
 * POST /api/tg-app/certificates/ai-batch/analyze
 */

import { aiCertificateRepository } from "../../../../repositories/aiCertificateRepository";
import { CertificateAIProcessor } from "../../../../utils/ai/certificateAIProcessor";
import { StudentMatcher } from "../../../../utils/ai/studentMatcher";
import { getStudentsByOrganizationId } from "../../../../repositories/studentRepository";
import { pdfConverter } from "../../../../utils/ai/pdfConverter";
import { executeQuery } from "../../../../utils/db";
import fs from "fs/promises";
import type {
  ProcessingLogStatus,
  BatchAIProcessingResult,
  ExtractedCertificateData,
  StudentMatchMethod,
} from "../../../../types/aiCertificateImport";
import type { Student } from "../../../../types/student";
import type { RowDataPacket } from "mysql2/promise";

interface CertificateCheckRow extends RowDataPacket {
  id: string;
  certificate_number: string;
  student_id: string;
  student_name: string;
}

export default defineEventHandler(
  async (
    event,
  ): Promise<{
    success: boolean;
    results: BatchAIProcessingResult[];
    stats: {
      total: number;
      success: number;
      failed: number;
      duplicates: number;
      totalCost: string;
    };
    organizationStudentsCount: number;
  }> => {
    console.log(
      "[TG-App] POST /api/tg-app/certificates/ai-batch/analyze - AI анализ",
    );

    const body = await readBody(event);
    const { fileIds, organizationId } = body;

    // 1. Валидация
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "fileIds обязателен (массив ID файлов)",
      });
    }

    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId обязателен",
      });
    }

    console.log(
      `[TG-App] Анализ ${fileIds.length} файлов для organizationId=${organizationId}`,
    );

    // 2. Загружаем студентов ТОЛЬКО этой организации
    const organizationStudents =
      await getStudentsByOrganizationId(organizationId);
    console.log(
      `[TG-App] Загружено ${organizationStudents.length} студентов организации`,
    );

    if (organizationStudents.length === 0) {
      throw createError({
        statusCode: 400,
        message:
          "В вашей организации нет слушателей. Добавьте слушателей перед импортом сертификатов.",
      });
    }

    // 3. Подготовка файлов для обработки
    const filesToProcess: Array<{
      fileId: string;
      filename: string;
      buffer: Buffer;
      mimeType: string;
      log: any;
      rawTextFromPdf?: string;
    }> = [];

    for (const fileId of fileIds) {
      try {
        const log = await aiCertificateRepository.getLogById(fileId);
        if (!log) {
          console.error(`[TG-App] Лог не найден для fileId: ${fileId}`);
          continue;
        }

        // Проверяем, что файл принадлежит этой организации
        const internalData = (log.extractedData as any)?._internal;
        if (internalData?.organizationId !== organizationId) {
          console.error(
            `[TG-App] Файл ${fileId} не принадлежит организации ${organizationId}`,
          );
          continue;
        }

        // Проверка, не обработан ли уже
        if (
          log.status === "success" &&
          log.extractedData &&
          !("_internal" in log.extractedData)
        ) {
          filesToProcess.push({
            fileId: log.id,
            filename: log.originalFilename,
            buffer: Buffer.from(""),
            mimeType: "",
            log,
          });
          continue;
        }

        if (!internalData?.tempFilePath) {
          console.error(
            `[TG-App] Путь к файлу не найден для ${log.originalFilename}`,
          );
          continue;
        }

        const filePath = internalData.tempFilePath;
        const mimeType = internalData.mimeType;

        // Обновляем статус
        await aiCertificateRepository.updateLog(fileId, {
          status: "processing" as ProcessingLogStatus,
          aiModel: process.env.OPENAI_VISION_MODEL || "gpt-4o",
        });

        // Подготовка файла (конвертация PDF если нужно)
        let imageBuffer: Buffer;
        let processingMimeType = mimeType;
        let rawTextFromPdf: string | undefined;

        if (mimeType === "application/pdf") {
          try {
            imageBuffer = await pdfConverter.convertFirstPageToImage(filePath);
            processingMimeType = "image/jpeg";
            rawTextFromPdf = await pdfConverter.extractText(filePath);
          } catch (pdfError: any) {
            console.error(
              `[TG-App] Ошибка PDF для ${log.originalFilename}:`,
              pdfError,
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed" as ProcessingLogStatus,
              errorMessage: `Ошибка обработки PDF: ${pdfError.message}`,
              processingCompletedAt: new Date(),
            });
            continue;
          }
        } else {
          try {
            imageBuffer = await fs.readFile(filePath);
          } catch (readError: any) {
            console.error(
              `[TG-App] Ошибка чтения файла ${log.originalFilename}:`,
              readError,
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed" as ProcessingLogStatus,
              errorMessage: `Ошибка чтения файла: ${readError.message}`,
              processingCompletedAt: new Date(),
            });
            continue;
          }
        }

        filesToProcess.push({
          fileId: log.id,
          filename: log.originalFilename,
          buffer: imageBuffer,
          mimeType: processingMimeType,
          log,
          rawTextFromPdf,
        });
      } catch (error: any) {
        console.error(`[TG-App] Ошибка подготовки файла ${fileId}:`, error);
      }
    }

    console.log(
      `[TG-App] Подготовлено ${filesToProcess.length} файлов для обработки`,
    );

    // 4. AI-анализ через CertificateAIProcessor
    const aiProcessingResult = await CertificateAIProcessor.processBatch(
      filesToProcess.map((f) => ({
        fileId: f.fileId,
        filename: f.filename,
        buffer: f.buffer,
        mimeType: f.mimeType,
      })),
    );

    console.log(
      `[TG-App] AI анализ завершён: ${aiProcessingResult.successCount} успешно, ${aiProcessingResult.errorCount} ошибок`,
    );

    // 5. Обработка результатов и сопоставление студентов
    const processedResults: BatchAIProcessingResult[] = [];
    let duplicatesCount = 0;

    for (const result of aiProcessingResult.results) {
      const fileData = filesToProcess.find((f) => f.fileId === result.fileId);
      if (!fileData) continue;

      if (result.success && result.extractedData) {
        // Добавление текста из PDF
        if (fileData.rawTextFromPdf) {
          result.extractedData.rawText =
            (result.extractedData.rawText
              ? result.extractedData.rawText + "\n\nPDF RAW:\n"
              : "PDF RAW:\n") + fileData.rawTextFromPdf.substring(0, 500);
        }

        // 5.1 Проверка дублирования сертификата
        let isDuplicate = false;
        let duplicateInfo: string | null = null;
        const certNumber = result.extractedData.certificateNumber;

        if (certNumber) {
          const existingCerts = await executeQuery<CertificateCheckRow[]>(
            `SELECT ic.id, ic.certificate_number, ic.student_id, s.full_name as student_name
             FROM issued_certificates ic
             JOIN students s ON ic.student_id = s.id
             WHERE ic.certificate_number = ? LIMIT 1`,
            [certNumber.trim()],
          );

          if (existingCerts.length > 0) {
            isDuplicate = true;
            duplicateInfo = `Сертификат уже существует (выдан: ${existingCerts[0].student_name})`;
            duplicatesCount++;
          }
        }

        // 5.2 Поиск студента в пределах организации
        let matchResult: {
          student: Student | null;
          confidence: number;
          matchMethod: StudentMatchMethod;
          topAlternatives: Array<{ student: Student; matchScore: number }>;
        } = {
          student: null,
          confidence: 0,
          matchMethod: "none" as StudentMatchMethod,
          topAlternatives: [],
        };

        try {
          console.log(
            `[TG-App] 🔍 Поиск студента для "${result.extractedData.fullName}" среди ${organizationStudents.length} слушателей организации ${organizationId}`,
          );

          // Используем StudentMatcher с ограниченным списком студентов ТОЛЬКО этой организации
          const match = await StudentMatcher.findMatchingStudent(
            result.extractedData,
            organizationStudents,
          );

          matchResult = {
            student: match.student,
            confidence: match.confidence,
            matchMethod: match.matchMethod,
            topAlternatives: match.topAlternatives || [],
          };

          if (match.student) {
            console.log(
              `[TG-App] ✅ Найден студент: ${match.student.fullName} (уверенность: ${Math.round(match.confidence * 100)}%, метод: ${match.matchMethod})`,
            );
          } else {
            console.log(
              `[TG-App] ⚠️ Студент не найден. Причина: ${match.explanation || "Нет совпадений"}`,
            );
            console.log(
              `[TG-App] 📊 Топ-альтернатив: ${match.topAlternatives?.length || 0}`,
            );
          }
        } catch (matchError: any) {
          console.error(
            `[TG-App] ❌ КРИТИЧЕСКАЯ ОШИБКА при поиске студента для "${result.filename}":`,
          );
          console.error(`[TG-App]    Тип ошибки: ${matchError.name}`);
          console.error(`[TG-App]    Сообщение: ${matchError.message}`);
          console.error(`[TG-App]    Stack trace:`, matchError.stack);

          // Даже при ошибке AI пытаемся получить топ-альтернатив локальным методом
          try {
            console.log(`[TG-App] 🔄 Попытка локального поиска альтернатив...`);
            const { StudentMatcher: LocalMatcher } =
              await import("../../../../utils/ai/studentMatcher");

            // Получаем топ-5 кандидатов локальным методом (без AI)
            const candidates = (LocalMatcher as any).getTopCandidates(
              result.extractedData.fullName || "",
              organizationStudents,
              5,
            );

            if (candidates && candidates.length > 0) {
              matchResult.topAlternatives = candidates.map((c: any) => ({
                student: {
                  id: c.id,
                  fullName: c.fullName,
                  organization: c.organization,
                  position: c.position,
                  pinfl: c.pinfl,
                  passportSeries: c.passportSeries,
                  passportNumber: c.passportNumber,
                  organizationId: c.organizationId,
                  createdAt: c.createdAt,
                  updatedAt: c.updatedAt,
                },
                matchScore: c.matchScore || 0,
              }));

              console.log(
                `[TG-App] ✅ Локальный поиск нашёл ${matchResult.topAlternatives.length} альтернатив`,
              );
            } else {
              console.log(`[TG-App] ⚠️ Локальный поиск не нашёл альтернатив`);
            }
          } catch (fallbackError: any) {
            console.error(
              `[TG-App] ❌ Ошибка локального поиска:`,
              fallbackError.message,
            );
          }

          // Сохраняем информацию об ошибке для пользователя
          matchResult.matchMethod = "none";
          matchResult.confidence = 0;
        }

        // 5.3 Обновление лога
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "success" as ProcessingLogStatus,
          processingCompletedAt: new Date(),
          processingDurationMs: result.processingTime,
          aiTokensUsed: result.tokensUsed?.total || 0,
          aiCostUsd: result.tokensUsed
            ? CertificateAIProcessor.estimateCost(result.tokensUsed.total)
            : 0,
          aiConfidence: result.extractedData.confidence,
          extractedData: {
            ...result.extractedData,
            // Добавляем служебные поля для информации о дубликатах
            _isDuplicate: isDuplicate,
            _duplicateInfo: duplicateInfo,
          } as any, // Type assertion для служебных полей
        });

        processedResults.push({
          success: true,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: {
            ...result.extractedData,
            _isDuplicate: isDuplicate,
            _duplicateInfo: duplicateInfo,
          } as ExtractedCertificateData,
          matchResult: matchResult,
          tokensUsed: result.tokensUsed || undefined,
          processingTime: result.processingTime,
          aiCost: result.tokensUsed
            ? CertificateAIProcessor.estimateCost(
                result.tokensUsed.total,
              ).toFixed(4)
            : undefined,
        });
      } else {
        // Ошибка обработки
        const errorMessage = result.error || "Неизвестная ошибка";
        let userMessage = "Ошибка анализа сертификата";

        if (errorMessage.includes("402") || errorMessage.includes("credits")) {
          userMessage = "Недостаточно кредитов на аккаунте API";
        } else if (
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          userMessage = "Неверный API ключ";
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate")
        ) {
          userMessage = "Превышен лимит запросов к API";
        }

        await aiCertificateRepository.updateLog(result.fileId, {
          status: "failed" as ProcessingLogStatus,
          errorMessage: `${userMessage}: ${errorMessage}`,
          processingCompletedAt: new Date(),
        });

        processedResults.push({
          success: false,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: null,
          matchResult: null,
          error: `${userMessage}: ${errorMessage}`,
        });
      }
    }

    // 6. Подсчёт статистики
    const successCount = processedResults.filter((r) => r.success).length;
    const failedCount = processedResults.filter((r) => !r.success).length;
    const totalCost = processedResults
      .filter((r) => r.success && r.aiCost)
      .reduce((sum, r) => sum + parseFloat(r.aiCost || "0"), 0);

    console.log(
      `[TG-App] Анализ завершён: ${successCount} успешно, ${failedCount} ошибок, ${duplicatesCount} дубликатов`,
    );

    return {
      success: successCount > 0,
      results: processedResults,
      stats: {
        total: fileIds.length,
        success: successCount,
        failed: failedCount,
        duplicates: duplicatesCount,
        totalCost: totalCost.toFixed(4),
      },
      organizationStudentsCount: organizationStudents.length,
    };
  },
);
