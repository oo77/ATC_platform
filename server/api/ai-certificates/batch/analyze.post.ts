import { aiCertificateRepository } from "../../../repositories/aiCertificateRepository";
import { CertificateAIProcessor } from "../../../utils/ai/certificateAIProcessor";
import { StudentMatcher } from "../../../utils/ai/studentMatcher";
import { getAllStudents } from "../../../repositories/studentRepository";
import { pdfConverter } from "../../../utils/ai/pdfConverter";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import fs from "fs/promises";
import type {
  ProcessingLogStatus,
  BatchAnalysisResult,
  BatchAIProcessingResult,
  ExtractedCertificateData,
  StudentMatchMethod,
} from "../../../types/aiCertificateImport";
import type { Student } from "../../../types/student";

/**
 * Batch Analyze API (Senior Refactored)
 * - Убрана зависимость от серверного рендеринга PDF в изображение
 * - PDF обрабатываются через текстовый анализ
 * - Изображения обрабатываются через Vision
 */
export default defineEventHandler(
  async (event): Promise<BatchAnalysisResult> => {
    await requirePermission(event, Permission.CERTIFICATES_ISSUE);

    const body = await readBody(event);
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw createError({ statusCode: 400, message: "File IDs required" });
    }

    console.log(
      `[Batch Analyze] Starting analysis for ${fileIds.length} files`,
    );

    const filesToProcess: any[] = [];

    for (const fileId of fileIds) {
      try {
        const log = await aiCertificateRepository.getLogById(fileId);
        if (!log) continue;

        // @ts-ignore
        const internalData = log.extractedData?._internal;
        if (!internalData?.tempFilePath) continue;

        const filePath = internalData.tempFilePath;
        const mimeType = internalData.mimeType;

        await aiCertificateRepository.updateLog(fileId, {
          status: "processing" as ProcessingLogStatus,
        });

        let buffer: Buffer | null = null;
        let rawText: string | undefined;

        if (mimeType === "application/pdf") {
          // Для PDF извлекаем только текст (без тяжелого рендеринга)
          rawText = await pdfConverter.extractText(filePath);
          console.log(
            `[Batch Analyze] Extracted ${rawText?.length || 0} chars from PDF: ${log.originalFilename}`,
          );
        } else {
          // Для изображений читаем буфер для Vision
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
        console.error(`[Batch Analyze] Error preparing file ${fileId}:`, error);
      }
    }

    // AI-обработка
    const aiProcessingResult =
      await CertificateAIProcessor.processBatch(filesToProcess);

    const processedResults: BatchAIProcessingResult[] = [];
    for (const result of aiProcessingResult.results) {
      if (result.success && result.extractedData) {
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "success" as ProcessingLogStatus,
          processingCompletedAt: new Date(),
          processingDurationMs: result.processingTime,
          aiTokensUsed: result.tokensUsed?.total || 0,
          aiCostUsd: CertificateAIProcessor.estimateCost(
            result.tokensUsed?.total || 0,
          ),
          extractedData: result.extractedData,
        });

        processedResults.push({
          success: true,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: result.extractedData,
          matchResult: null,
          tokensUsed: result.tokensUsed || undefined,
          processingTime: result.processingTime,
          aiCost: result.tokensUsed
            ? CertificateAIProcessor.estimateCost(
                result.tokensUsed.total,
              ).toFixed(4)
            : undefined,
        });
      } else {
        processedResults.push({
          success: false,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: null,
          matchResult: null,
          error: result.error || "Unknown error",
        });
      }
    }

    // Сопоставление студентов (batch)
    const allStudents = await getAllStudents();
    const finalResults = await Promise.all(
      processedResults.map(async (res) => {
        if (!res.success || !res.extractedData) return res;
        const match = await StudentMatcher.findMatchingStudent(
          res.extractedData,
          allStudents,
        );
        return { ...res, matchResult: match };
      }),
    );

    return {
      results: finalResults,
      successCount: finalResults.filter((r) => r.success).length,
      errorCount: finalResults.filter((r) => !r.success).length,
      totalCost: aiProcessingResult.totalCost,
      totalProcessingTime: aiProcessingResult.totalTime,
      totalTokensUsed: aiProcessingResult.totalTokens,
    };
  },
);
