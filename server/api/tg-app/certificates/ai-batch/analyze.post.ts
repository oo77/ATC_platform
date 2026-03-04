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

/**
 * TG-App AI Analysis (Senior Refactored)
 * - PDF обрабатываются через текстовый анализ
 * - Серверный рендеринг в изображение полностью удален
 * - Оптимизирован под OpenAI Vision & Text
 */
export default defineEventHandler(
  async (
    event,
  ): Promise<{
    success: boolean;
    results: any;
    stats: any;
    organizationStudentsCount: number;
  }> => {
    console.log("[TG-App] Batch AI анализ (рефакторинг)...");
    const { fileIds, organizationId } = await readBody(event);

    if (!fileIds?.length || !organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId и fileIds обязательны",
      });
    }

    const organizationStudents =
      await getStudentsByOrganizationId(organizationId);
    if (organizationStudents.length === 0) {
      throw createError({
        statusCode: 400,
        message: "В вашей организации нет слушателей",
      });
    }

    const filesToProcess: any[] = [];

    for (const fileId of fileIds) {
      try {
        const log = await aiCertificateRepository.getLogById(fileId);
        if (
          !log ||
          (log.extractedData as any)?._internal?.organizationId !==
            organizationId
        )
          continue;

        const internalData = (log.extractedData as any)?._internal;
        const filePath = internalData?.tempFilePath;
        const mimeType = internalData?.mimeType;

        await aiCertificateRepository.updateLog(fileId, {
          status: "processing" as ProcessingLogStatus,
        });

        let buffer: Buffer | null = null;
        let rawText: string | undefined;

        if (mimeType === "application/pdf") {
          rawText = await pdfConverter.extractText(filePath);
        } else {
          buffer = await fs.readFile(filePath);
        }

        filesToProcess.push({
          fileId: log.id,
          filename: log.originalFilename,
          buffer,
          mimeType,
          rawTextFromPdf: rawText,
        });
      } catch (error: any) {
        console.error(`[TG-App] Ошибка подготовки файла ${fileId}:`, error);
      }
    }

    const aiProcessingResult =
      await CertificateAIProcessor.processBatch(filesToProcess);

    const processedResults: any[] = [];
    let duplicatesCount = 0;

    for (const result of aiProcessingResult.results) {
      if (result.success && result.extractedData) {
        // Проверка дубликатов
        let isDuplicate = false;
        let duplicateInfo: string | null = null;
        const certNumber = result.extractedData.certificateNumber;

        if (certNumber) {
          const existing = await executeQuery<CertificateCheckRow[]>(
            `SELECT ic.id, s.full_name as student_name FROM issued_certificates ic JOIN students s ON ic.student_id = s.id WHERE ic.certificate_number = ? LIMIT 1`,
            [certNumber.trim()],
          );
          if (existing.length > 0) {
            isDuplicate = true;
            duplicateInfo = `Уже выдан: ${existing[0].student_name}`;
            duplicatesCount++;
          }
        }

        // Сопоставление студента
        const match = await StudentMatcher.findMatchingStudent(
          result.extractedData,
          organizationStudents,
        );

        await aiCertificateRepository.updateLog(result.fileId, {
          status: "success" as ProcessingLogStatus,
          processingCompletedAt: new Date(),
          processingDurationMs: result.processingTime,
          extractedData: {
            ...result.extractedData,
            _isDuplicate: isDuplicate,
            _duplicateInfo: duplicateInfo,
          } as any,
        });

        processedResults.push({
          success: true,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: {
            ...result.extractedData,
            _isDuplicate: isDuplicate,
            _duplicateInfo: duplicateInfo,
          },
          matchResult: match,
        });
      } else {
        processedResults.push({
          success: false,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: null,
          matchResult: null,
          error: result.error || "Ошибка анализа",
        });
      }
    }

    return {
      success: processedResults.some((r) => r.success),
      results: processedResults,
      stats: {
        total: fileIds.length,
        success: processedResults.filter((r) => r.success).length,
        failed: processedResults.filter((r) => !r.success).length,
        duplicates: duplicatesCount,
        totalCost: aiProcessingResult.totalCost,
      },
      organizationStudentsCount: organizationStudents.length,
    };
  },
);
