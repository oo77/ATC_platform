import { aiCertificateRepository } from "../../../repositories/aiCertificateRepository";
import { createStandaloneCertificate } from "../../../repositories/certificateTemplateRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { storage } from "../../../utils/storage";
import { executeTransaction } from "../../../utils/db";
import type {
  BatchConfirmInput,
  BatchConfirmResult,
  BatchConfirmItemResult,
  ExtractedCertificateData,
} from "../../../types/aiCertificateImport";

/**
 * Batch Confirm API
 * Endpoint: POST /api/ai-certificates/batch/confirm
 *
 * Выполняет транзакционное сохранение всех сертификатов (все или ничего)
 * Если хотя бы один сертификат не удалось создать — откатывает все изменения
 *
 * @returns BatchConfirmResult с результатами импорта
 */
export default defineEventHandler(
  async (event): Promise<BatchConfirmResult> => {
    const context = await requirePermission(
      event,
      Permission.CERTIFICATES_ISSUE,
    );

    const body = await readBody<BatchConfirmInput>(event);
    const { items } = body;

    // 1. Валидация входных данных
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Items array is required",
      });
    }

    console.log(
      `[Batch Confirm] Starting batch import for ${items.length} certificates`,
    );

    // 2. Валидация каждого элемента
    const validationErrors: string[] = [];
    items.forEach((item, index) => {
      if (!item.fileId) {
        validationErrors.push(`Item ${index + 1}: fileId is required`);
      }
      if (!item.studentId) {
        validationErrors.push(`Item ${index + 1}: studentId is required`);
      }
    });

    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: "Validation errors",
        data: { errors: validationErrors },
      });
    }

    // 3. Транзакционное сохранение (все или ничего)
    try {
      const results: BatchConfirmItemResult[] = [];

      // Используем транзакцию для атомарности
      await executeTransaction(async (connection) => {
        console.log("[Batch Confirm] Starting database transaction");

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const { fileId, studentId, overrideData } = item;

          try {
            console.log(
              `[Batch Confirm] Processing certificate ${i + 1}/${items.length} (fileId: ${fileId})`,
            );

            // 3.1 Получение лога
            const log = await aiCertificateRepository.getLogById(fileId);
            if (!log) {
              throw new Error(`Log not found for fileId: ${fileId}`);
            }

            // 3.2 Проверка, не создан ли уже сертификат
            if (log.status === "success" && log.certificateId) {
              console.log(
                `[Batch Confirm] Certificate ${i + 1}/${items.length} already exists (ID: ${log.certificateId})`,
              );
              results.push({
                success: true,
                fileId,
                certificateId: log.certificateId,
              });
              continue;
            }

            // 3.3 Слияние данных: override > AI extracted
            const baseData = log.extractedData || {};
            const mergedData = { ...baseData, ...overrideData };

            // Обеспечиваем обязательные поля для ExtractedCertificateData
            const finalData: ExtractedCertificateData = {
              fullName: mergedData.fullName || "Unknown",
              certificateNumber: mergedData.certificateNumber || "UNKNOWN",
              issueDate: mergedData.issueDate || new Date().toISOString(),
              organization: mergedData.organization || "Unknown Organization",
              courseName: mergedData.courseName || "Unknown Course",
              confidence: mergedData.confidence || 1.0,
              expiryDate: mergedData.expiryDate,
              courseHours: mergedData.courseHours,
              position: mergedData.position,
              department: mergedData.department,
              pinfl: mergedData.pinfl,
              rawText: mergedData.rawText,
            };

            // 3.4 Получение URL файла
            // @ts-ignore
            const fileUuid = log.extractedData?._internal?.fileUuid;
            const pdfUrl = fileUuid ? storage.getPublicUrl(fileUuid) : null;

            // 3.5 Создание сертификата
            const cert = await createStandaloneCertificate({
              studentId: studentId,
              certificateNumber: finalData.certificateNumber,
              issueDate: new Date(finalData.issueDate),
              expiryDate: finalData.expiryDate
                ? new Date(finalData.expiryDate)
                : null,
              courseName: finalData.courseName,
              courseHours: finalData.courseHours
                ? Number(finalData.courseHours)
                : undefined,
              sourceType: "import",
              importSource: "ai_scan",
              pdfFileUrl: pdfUrl || undefined,
              issuedBy: context.userId,
              notes: `AI Batch Import (Log ID: ${fileId})`,
            });

            console.log(
              `[Batch Confirm] ✓ Certificate ${i + 1}/${items.length} created (ID: ${cert.id})`,
            );

            // 3.6 Прикрепление AI метаданных
            // @ts-ignore
            await aiCertificateRepository.updateCertificateWithAiData(cert.id, {
              extractedData: finalData,
              confidence: log.aiConfidence || 1.0,
              processingStatus: "completed",
              originalFileUrl: pdfUrl || undefined,
            });

            // 3.7 Обновление лога
            await aiCertificateRepository.updateLog(fileId, {
              certificateId: cert.id,
              matchedStudentId: studentId,
              matchMethod: "manual",
              matchConfidence: 1.0,
              extractedData: finalData,
              status: "success" as any,
            });

            // 3.8 Добавление результата
            results.push({
              success: true,
              fileId,
              certificateId: cert.id,
            });
          } catch (itemError: any) {
            console.error(
              `[Batch Confirm] ✗ Error processing certificate ${i + 1}/${items.length}:`,
              itemError,
            );

            // При ошибке в транзакции — откатываем всё
            throw new Error(
              `Failed to create certificate ${i + 1} (fileId: ${fileId}): ${itemError.message}`,
            );
          }
        }

        console.log(
          `[Batch Confirm] Transaction completed successfully: ${results.length} certificates created`,
        );
      });

      // 4. Логирование успешного batch-импорта
      console.log(
        `[Batch Confirm] Batch import completed: ${results.length} certificates imported by user ${context.userId}`,
      );

      // 5. Формирование финального результата
      const batchResult: BatchConfirmResult = {
        results,
        successCount: results.length,
        errorCount: 0,
        totalTime: 0, // TODO: подсчитать общее время
      };

      return batchResult;
    } catch (transactionError: any) {
      // Транзакция откатилась — все изменения отменены
      console.error(
        "[Batch Confirm] Transaction failed, all changes rolled back:",
        transactionError,
      );

      // Парсинг ошибки для понятного сообщения
      const errorMessage = transactionError.message || String(transactionError);
      let userMessage = "Ошибка при сохранении сертификатов";

      if (errorMessage.includes("not found")) {
        userMessage = "Один или несколько файлов не найдены";
      } else if (errorMessage.includes("already exists")) {
        userMessage = "Один или несколько сертификатов уже существуют";
      } else if (errorMessage.includes("student")) {
        userMessage = "Ошибка при работе со студентами";
      }

      throw createError({
        statusCode: 500,
        message: `${userMessage}. Все изменения отменены.`,
        data: {
          originalError:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
          rollback: true,
        },
      });
    }
  },
);
