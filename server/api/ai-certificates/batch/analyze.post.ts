import { aiCertificateRepository } from "../../../repositories/aiCertificateRepository";
import { CertificateAIProcessor } from "../../../utils/ai/certificateAIProcessor";
import { StudentMatcher } from "../../../utils/ai/studentMatcher";
import { getStudentsForMatching } from "../../../repositories/studentRepository";
import { pdfConverter } from "../../../utils/ai/pdfConverter";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { logActivityDirect } from "../../../utils/activityLogger";
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
 * Batch Analyze API
 * - Принимает опциональный organizationId для сужения радиуса поиска
 * - Использует облегчённый запрос студентов (без JOIN сертификатов)
 * - Параллельная обработка файлов через AI
 */
export default defineEventHandler(
  async (event): Promise<BatchAnalysisResult> => {
    await requirePermission(event, Permission.CERTIFICATES_ISSUE);

    const body = await readBody(event);
    const { fileIds, organizationId } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw createError({ statusCode: 400, message: "File IDs required" });
    }

    console.log(
      `[Batch Analyze] Starting analysis for ${fileIds.length} files${organizationId ? ` (org: ${organizationId})` : " (all orgs)"}`,
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
          rawText = await pdfConverter.extractText(filePath);
          console.log(
            `[Batch Analyze] Extracted ${rawText?.length || 0} chars from PDF: ${log.originalFilename}`,
          );
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
        console.error(`[Batch Analyze] Error preparing file ${fileId}:`, error);
      }
    }

    // AI-обработка (параллельная, concurrency=3)
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

    // Загружаем студентов ОДИН РАЗ облегчённым запросом (без сертификатов)
    // Если задана организация — берём только её студентов (сужаем радиус поиска)
    const studentsForMatching = await getStudentsForMatching(organizationId || null);
    console.log(
      `[Batch Analyze] Loaded ${studentsForMatching.length} students for matching${organizationId ? " (filtered by org)" : " (all)"}`,
    );

    // Параллельное сопоставление студентов для всех успешных файлов
    const finalResults = await Promise.all(
      processedResults.map(async (res) => {
        if (!res.success || !res.extractedData) return res;
        const match = await StudentMatcher.findMatchingStudent(
          res.extractedData,
          studentsForMatching,
        );
        return { ...res, matchResult: match };
      }),
    );

    const userId = event.context.user?.id || "system";
    await logActivityDirect(
      userId,
      "IMPORT",
      "CERTIFICATE",
      "batch",
      `AI анализ ${fileIds.length} сертификатов`,
      {
        fileCount: fileIds.length,
        successCount: finalResults.filter((r) => r.success).length,
        organizationId: organizationId || null,
        studentsSearched: studentsForMatching.length,
      },
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

