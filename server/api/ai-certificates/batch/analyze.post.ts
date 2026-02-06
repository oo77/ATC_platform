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
 * Batch Analyze API
 * Endpoint: POST /api/ai-certificates/batch/analyze
 *
 * Выполняет batch AI-анализ загруженных файлов:
 * 1. Параллельная обработка файлов через AI Vision
 * 2. Единый batch-запрос к БД для всех студентов
 * 3. AI-сопоставление с топ-5 кандидатами для каждого сертификата
 *
 * @returns BatchAnalysisResult с результатами анализа и топ-5 совпадениями
 */
export default defineEventHandler(
  async (event): Promise<BatchAnalysisResult> => {
    await requirePermission(event, Permission.CERTIFICATES_ISSUE);

    const body = await readBody(event);
    const { fileIds } = body;

    // 1. Валидация входных данных
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "File IDs array is required",
      });
    }

    console.log(
      `[Batch Analyze] Starting analysis for ${fileIds.length} files`,
    );

    // 2. Подготовка файлов для batch-обработки
    const filesToProcess: Array<{
      fileId: string;
      filename: string;
      buffer: Buffer;
      mimeType: string;
      log: any;
      rawTextFromPdf?: string;
    }> = [];

    // 2.1 Загрузка всех файлов и проверка их статуса
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      try {
        const log = await aiCertificateRepository.getLogById(fileId);
        if (!log) {
          console.error(`[Batch Analyze] Log not found for fileId: ${fileId}`);
          continue;
        }

        // Проверка, не обработан ли уже файл
        if (
          log.status === "success" &&
          log.extractedData &&
          !("_internal" in log.extractedData)
        ) {
          console.log(
            `[Batch Analyze] File ${i + 1}/${fileIds.length} already processed: ${log.originalFilename}`,
          );
          // Добавляем как уже обработанный
          filesToProcess.push({
            fileId: log.id,
            filename: log.originalFilename,
            buffer: Buffer.from(""), // Пустой буфер для уже обработанных
            mimeType: "",
            log,
          });
          continue;
        }

        // Получение пути к файлу
        // @ts-ignore
        const internalData = log.extractedData?._internal;
        if (!internalData || !internalData.tempFilePath) {
          console.error(
            `[Batch Analyze] File path not found for ${log.originalFilename}`,
          );
          continue;
        }

        const filePath = internalData.tempFilePath;
        const mimeType = internalData.mimeType;

        // Обновление статуса на processing
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
              `[Batch Analyze] PDF error for ${log.originalFilename}:`,
              pdfError,
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed" as ProcessingLogStatus,
              errorMessage: `PDF Processing error: ${pdfError.message}`,
              processingCompletedAt: new Date(),
            });
            continue;
          }
        } else {
          try {
            imageBuffer = await fs.readFile(filePath);
          } catch (readError: any) {
            console.error(
              `[Batch Analyze] File read error for ${log.originalFilename}:`,
              readError,
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed" as ProcessingLogStatus,
              errorMessage: `File read error: ${readError.message}`,
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
        console.error(`[Batch Analyze] Error preparing file ${i + 1}:`, error);
      }
    }

    console.log(
      `[Batch Analyze] Prepared ${filesToProcess.length} files for processing`,
    );

    // 3. Batch AI-обработка через CertificateAIProcessor.processBatch()
    // Этот метод уже реализует последовательную обработку с задержками
    const aiProcessingResult = await CertificateAIProcessor.processBatch(
      filesToProcess.map((f) => ({
        fileId: f.fileId,
        filename: f.filename,
        buffer: f.buffer,
        mimeType: f.mimeType,
      })),
    );

    console.log(
      `[Batch Analyze] Batch processing completed: ${aiProcessingResult.successCount} success, ${aiProcessingResult.errorCount} failed`,
    );

    // 4. Обновление логов с результатами AI-анализа
    const processedResults: BatchAIProcessingResult[] = [];

    for (const result of aiProcessingResult.results) {
      const fileData = filesToProcess.find((f) => f.fileId === result.fileId);
      if (!fileData) continue;

      if (result.success && result.extractedData) {
        // Добавление текста из PDF если есть
        if (fileData.rawTextFromPdf) {
          result.extractedData.rawText =
            (result.extractedData.rawText
              ? result.extractedData.rawText + "\n\nPDF RAW:\n"
              : "PDF RAW:\n") + fileData.rawTextFromPdf.substring(0, 500);
        }

        // Обновление лога с результатами
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "success" as ProcessingLogStatus,
          processingCompletedAt: new Date(),
          processingDurationMs: result.processingTime,
          aiTokensUsed: result.tokensUsed?.total || 0,
          aiCostUsd: result.tokensUsed
            ? CertificateAIProcessor.estimateCost(result.tokensUsed.total)
            : 0,
          aiConfidence: result.extractedData.confidence,
          extractedData: result.extractedData,
        });

        processedResults.push({
          success: true,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: result.extractedData,
          matchResult: null, // Будет заполнено позже при сопоставлении студентов
          tokensUsed: result.tokensUsed || undefined,
          processingTime: result.processingTime,
          aiCost: result.tokensUsed
            ? CertificateAIProcessor.estimateCost(
                result.tokensUsed.total,
              ).toFixed(4)
            : undefined,
        });
      } else {
        // Обработка ошибки
        const errorMessage = result.error || "Unknown error";
        let userMessage = "Ошибка анализа сертификата";
        let errorType = "unknown";

        if (
          errorMessage.includes("402") ||
          errorMessage.includes("credits") ||
          errorMessage.includes("afford")
        ) {
          errorType = "insufficient_credits";
          userMessage = "Недостаточно кредитов на аккаунте API";
        } else if (
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          errorType = "invalid_key";
          userMessage = "Неверный API ключ";
        } else if (
          errorMessage.includes("429") ||
          errorMessage.includes("rate")
        ) {
          errorType = "rate_limit";
          userMessage = "Превышен лимит запросов к API";
        } else if (errorMessage.includes("Пустой ответ")) {
          errorType = "empty_response";
          userMessage = "Пустой ответ от AI (возможно rate limiting)";
        }

        await aiCertificateRepository.updateLog(result.fileId, {
          status: "failed" as ProcessingLogStatus,
          errorMessage: `[${errorType}] ${userMessage}`,
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

    // 5. Подсчёт успешных анализов
    const successfulAnalyses = processedResults.filter(
      (r) => r.success && r.extractedData,
    );

    console.log(
      `[Batch Analyze] AI Analysis completed: ${successfulAnalyses.length} success, ${processedResults.filter((r) => !r.success).length} failed`,
    );

    // 6. Единый batch-поиск студентов для всех успешных анализов
    let matchResults: Map<
      string,
      {
        student: Student | null;
        confidence: number;
        matchMethod: string;
        topAlternatives: Array<{
          student: Student;
          matchScore: number;
        }>;
      }
    > = new Map();

    if (successfulAnalyses.length > 0) {
      try {
        console.log(
          `[Batch Analyze] Starting batch student matching for ${successfulAnalyses.length} certificates`,
        );

        // 6.1 Единый запрос к БД для получения всех студентов (оптимизация!)
        const allStudents = await getAllStudents();
        console.log(
          `[Batch Analyze] Loaded ${allStudents.length} students from database`,
        );

        // 6.2 Для каждого успешного анализа находим топ-5 кандидатов
        const matchPromises = successfulAnalyses.map(async (analysis) => {
          if (!analysis.extractedData) return null;

          try {
            // Используем существующий метод поиска
            const matchResult = await StudentMatcher.findMatchingStudent(
              analysis.extractedData,
              allStudents,
            );

            return {
              fileId: analysis.fileId,
              matchResult,
            };
          } catch (matchError: any) {
            console.error(
              `[Batch Analyze] Error matching students for ${analysis.filename}:`,
              matchError,
            );
            return {
              fileId: analysis.fileId,
              matchResult: {
                student: null,
                confidence: 0,
                matchMethod: "none" as StudentMatchMethod,
                topAlternatives: [],
              },
            };
          }
        });

        const matchResultsArray = await Promise.allSettled(matchPromises);

        // 6.3 Формирование Map с результатами сопоставления
        matchResultsArray.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            matchResults.set(result.value.fileId, result.value.matchResult);
          }
        });

        console.log(
          `[Batch Analyze] Student matching completed for ${matchResults.size} certificates`,
        );
      } catch (dbError: any) {
        console.error(
          "[Batch Analyze] Error loading students from database:",
          dbError,
        );
      }
    }

    // 7. Обогащение результатов данными о сопоставлении
    const enrichedResults: BatchAIProcessingResult[] = processedResults.map(
      (result) => {
        if (!result.success || !result.extractedData) {
          return result;
        }

        const matchData = matchResults.get(result.fileId);
        if (!matchData) {
          return result;
        }

        // topAlternatives уже в правильном формате из StudentMatcher
        const topAlternatives = matchData.topAlternatives || [];

        return {
          ...result,
          matchResult: {
            student: matchData.student,
            confidence: matchData.confidence,
            matchMethod: matchData.matchMethod as StudentMatchMethod,
            topAlternatives: topAlternatives,
          },
        };
      },
    );

    // 8. Подсчёт итоговой статистики
    const totalFiles = fileIds.length;
    const successCount = processedResults.filter((r) => r.success).length;
    const failedCount = processedResults.filter((r) => !r.success).length;
    const matchedCount = enrichedResults.filter(
      (r) => r.success && r.matchResult?.student,
    ).length;

    // 9. Подсчёт общей стоимости и токенов
    const totalCost = enrichedResults
      .filter((r) => r.success && r.aiCost)
      .reduce((sum, r) => sum + parseFloat(r.aiCost || "0"), 0);

    const totalTokens = enrichedResults
      .filter((r) => r.success && r.tokensUsed)
      .reduce((sum, r) => sum + (r.tokensUsed?.total || 0), 0);

    console.log(
      `[Batch Analyze] Final stats: ${successCount} success, ${failedCount} failed, ${matchedCount} matched`,
    );
    console.log(
      `[Batch Analyze] Total cost: $${totalCost.toFixed(4)}, tokens: ${totalTokens}`,
    );

    // 10. Формирование финального результата
    const totalProcessingTime = enrichedResults
      .filter((r) => r.success && r.processingTime)
      .reduce((sum, r) => sum + (r.processingTime || 0), 0);

    const batchResult: BatchAnalysisResult = {
      results: enrichedResults,
      successCount,
      errorCount: failedCount,
      totalCost: totalCost.toFixed(4),
      totalProcessingTime,
      totalTokensUsed: totalTokens,
    };

    return batchResult;
  },
);
