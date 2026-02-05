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

    // 2. Параллельная обработка файлов через AI Vision
    const analysisPromises = fileIds.map(
      async (fileId: string, index: number) => {
        try {
          // 2.1 Получение лога
          const log = await aiCertificateRepository.getLogById(fileId);
          if (!log) {
            throw new Error(`Log not found for fileId: ${fileId}`);
          }

          // 2.2 Проверка, не обработан ли уже файл
          if (
            log.status === "success" &&
            log.extractedData &&
            !("_internal" in log.extractedData)
          ) {
            console.log(
              `[Batch Analyze] File ${index + 1}/${fileIds.length} already processed: ${log.originalFilename}`,
            );
            return {
              success: true,
              fileId: log.id,
              filename: log.originalFilename,
              extractedData: log.extractedData,
              alreadyProcessed: true,
            };
          }

          // 2.3 Получение пути к файлу
          // @ts-ignore
          const internalData = log.extractedData?._internal;
          if (!internalData || !internalData.tempFilePath) {
            throw new Error(`File path not found for ${log.originalFilename}`);
          }

          const filePath = internalData.tempFilePath;
          const mimeType = internalData.mimeType;

          // 2.4 Обновление статуса на processing
          await aiCertificateRepository.updateLog(fileId, {
            status: "processing" as ProcessingLogStatus,
            aiModel: process.env.OPENAI_VISION_MODEL || "gpt-4o",
          });

          // 2.5 Подготовка файла (конвертация PDF если нужно)
          let imageBuffer: Buffer;
          let processingMimeType = mimeType;
          let rawTextFromPdf = "";

          if (mimeType === "application/pdf") {
            try {
              imageBuffer =
                await pdfConverter.convertFirstPageToImage(filePath);
              processingMimeType = "image/jpeg";
              rawTextFromPdf = await pdfConverter.extractText(filePath);
            } catch (pdfError: any) {
              throw new Error(`PDF Processing error: ${pdfError.message}`);
            }
          } else {
            try {
              imageBuffer = await fs.readFile(filePath);
            } catch (readError: any) {
              throw new Error(`File read error: ${readError.message}`);
            }
          }

          // 2.6 AI-анализ изображения
          console.log(
            `[Batch Analyze] Processing file ${index + 1}/${fileIds.length}: ${log.originalFilename}`,
          );

          const aiResult = await CertificateAIProcessor.processCertificate(
            imageBuffer,
            processingMimeType,
            log.originalFilename,
          );

          // Добавление текста из PDF если есть
          if (rawTextFromPdf) {
            aiResult.extractedData.rawText =
              (aiResult.extractedData.rawText
                ? aiResult.extractedData.rawText + "\n\nPDF RAW:\n"
                : "PDF RAW:\n") + rawTextFromPdf.substring(0, 500);
          }

          // 2.7 Обновление лога с результатами AI-анализа
          await aiCertificateRepository.updateLog(fileId, {
            status: "success" as ProcessingLogStatus,
            processingCompletedAt: new Date(),
            processingDurationMs: aiResult.processingTime,
            aiTokensUsed: aiResult.tokensUsed.total,
            aiCostUsd: CertificateAIProcessor.estimateCost(
              aiResult.tokensUsed.total,
            ),
            aiConfidence: aiResult.extractedData.confidence,
            extractedData: aiResult.extractedData,
          });

          console.log(
            `[Batch Analyze] ✓ File ${index + 1}/${fileIds.length} analyzed successfully`,
          );

          return {
            success: true,
            fileId: log.id,
            filename: log.originalFilename,
            extractedData: aiResult.extractedData,
            tokensUsed: aiResult.tokensUsed,
            processingTime: aiResult.processingTime,
            aiCost: CertificateAIProcessor.estimateCost(
              aiResult.tokensUsed.total,
            ).toFixed(4),
          };
        } catch (error: any) {
          console.error(
            `[Batch Analyze] ✗ Error processing file ${index + 1}/${fileIds.length}:`,
            error,
          );

          // Обработка ошибки для конкретного файла
          const log = await aiCertificateRepository.getLogById(fileId);
          const filename = log?.originalFilename || `unknown_${index}`;

          // Классификация ошибки
          const errorMessage = error.message || String(error);
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
          } else if (
            errorMessage.includes("context length") ||
            errorMessage.includes("16385 tokens")
          ) {
            errorType = "context_overflow";
            userMessage = "Слишком длинный контекст запроса";
          }

          // Обновление лога с ошибкой
          if (log) {
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed" as ProcessingLogStatus,
              errorMessage: `[${errorType}] ${userMessage}`,
              processingCompletedAt: new Date(),
            });
          }

          return {
            success: false,
            fileId,
            filename,
            error: `${userMessage}: ${errorMessage}`,
          };
        }
      },
    );

    // 3. Ожидание завершения всех AI-анализов
    const analysisResults = await Promise.allSettled(analysisPromises);

    // 4. Разделение на успешные и неудачные
    const processedResults: BatchAIProcessingResult[] = [];
    const errors: string[] = [];

    analysisResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        processedResults.push(result.value);
        if (!result.value.success) {
          errors.push(
            `Файл ${index + 1} (${result.value.filename}): ${result.value.error}`,
          );
        }
      } else {
        errors.push(
          `Файл ${index + 1}: Критическая ошибка - ${result.reason?.message || "Unknown error"}`,
        );
        processedResults.push({
          success: false,
          fileId: fileIds[index],
          filename: `unknown_${index}`,
          error: result.reason?.message || "Критическая ошибка обработки",
        });
      }
    });

    // 5. Подсчёт успешных анализов
    const successfulAnalyses = processedResults.filter(
      (r) => r.success && r.extractedData,
    );

    console.log(
      `[Batch Analyze] AI Analysis completed: ${successfulAnalyses.length} success, ${errors.length} failed`,
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
                matchMethod: "error",
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
        errors.push(`Ошибка загрузки студентов из БД: ${dbError.message}`);
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

        // Преобразуем alternatives в topAlternatives с matchScore
        let topAlternatives: Array<{
          student: Student;
          matchScore: number;
        }> = [];

        if (matchData.topAlternatives && matchData.topAlternatives.length > 0) {
          // Если topAlternatives уже есть (из нового метода)
          topAlternatives = matchData.topAlternatives.map((alt) => ({
            student: alt.student,
            matchScore: Math.round((alt.matchScore || 0) * 100), // Преобразуем 0-1 в 0-100
          }));
        } else if (
          matchData.alternatives &&
          matchData.alternatives.length > 0
        ) {
          // Fallback на alternatives (из старого метода)
          topAlternatives = matchData.alternatives.map((student, index) => ({
            student: student,
            // Генерируем matchScore на основе позиции (первый = 85%, второй = 75%, и т.д.)
            matchScore: Math.max(50, 85 - index * 10),
          }));
        }

        return {
          ...result,
          matchResult: {
            student: matchData.student,
            confidence: matchData.confidence,
            matchMethod: matchData.matchMethod,
            explanation: matchData.explanation || "",
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
    const batchResult: BatchAnalysisResult = {
      success: successCount > 0,
      totalFiles,
      successCount,
      failedCount,
      matchedCount,
      results: enrichedResults,
      totalCost: totalCost.toFixed(4),
      totalTokens,
      errors: errors.length > 0 ? errors : undefined,
    };

    return batchResult;
  },
);
