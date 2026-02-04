import { aiCertificateRepository } from "../../../repositories/aiCertificateRepository";
import { storage } from "../../../utils/storage";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import type {
  ProcessingLogStatus,
  BatchUploadResult,
  UploadFileResult,
} from "../../../types/aiCertificateImport";

/**
 * Batch Upload API
 * Endpoint: POST /api/ai-certificates/batch/upload
 *
 * Принимает несколько файлов одновременно (до 20 штук)
 * Сохраняет их во временное хранилище и создаёт логи обработки
 *
 * @returns BatchUploadResult с массивом успешных загрузок и ошибок
 */
export default defineEventHandler(async (event): Promise<BatchUploadResult> => {
  // 1. Авторизация и проверка прав
  const context = await requirePermission(event, Permission.CERTIFICATES_ISSUE);

  // 2. Чтение файлов из FormData
  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Файлы не загружены",
    });
  }

  // 3. Валидация количества файлов
  const MAX_FILES = 20;
  if (files.length > MAX_FILES) {
    throw createError({
      statusCode: 400,
      message: `Превышен лимит файлов. Максимум ${MAX_FILES} файлов за раз, получено ${files.length}`,
    });
  }

  // 4. Константы для валидации
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // 5. Обработка каждого файла через Promise.allSettled для graceful degradation
  const uploadPromises = files.map(async (file, index) => {
    try {
      // 5.1 Валидация типа файла
      if (!ALLOWED_TYPES.includes(file.type || "")) {
        throw new Error(
          `Неподдерживаемый формат файла "${file.filename}". Разрешены: PDF, JPG, PNG, WEBP`,
        );
      }

      // 5.2 Валидация размера файла
      if (file.data.length > MAX_FILE_SIZE) {
        throw new Error(
          `Файл "${file.filename}" слишком большой (${(file.data.length / 1024 / 1024).toFixed(2)}MB). Максимальный размер 10MB`,
        );
      }

      // 5.3 Сохранение файла во временное хранилище
      const savedFile = await storage.save(
        {
          filename: file.filename || `unknown_${index}`,
          data: file.data,
          mimeType: file.type || "application/octet-stream",
          size: file.data.length,
        },
        "certificate_generated",
        undefined,
        "/Certificates/Imports/Temp",
      );

      // 5.4 Создание лога обработки
      const log = await aiCertificateRepository.createLog({
        originalFilename: file.filename || `unknown_${index}`,
        fileSizeBytes: file.data.length,
        processingStartedAt: new Date(),
        aiModel: "pending",
        status: "pending" as ProcessingLogStatus,
        processedBy: context.userId,
        ipAddress: event.node.req.socket.remoteAddress || "unknown",
        // Сохраняем временные данные для следующего шага
        extractedData: {
          _internal: {
            tempFilePath: savedFile.fullPath,
            fileUuid: savedFile.uuid,
            mimeType: savedFile.mimeType,
          },
        } as any,
      });

      // 5.5 Логирование успешной загрузки
      console.log(
        `[Batch Upload] File ${index + 1}/${files.length} uploaded: ${file.filename} (ID: ${log.id})`,
      );

      // 5.6 Формирование результата загрузки
      const result: UploadFileResult = {
        success: true,
        fileId: log.id,
        filename: savedFile.filename,
        size: savedFile.sizeBytes,
      };

      return result;
    } catch (error: any) {
      // Обработка ошибки для конкретного файла
      console.error(
        `[Batch Upload] Error processing file ${index + 1}/${files.length}:`,
        error,
      );

      const result: UploadFileResult = {
        success: false,
        filename: file.filename || `unknown_${index}`,
        size: file.data.length,
        error: error.message || "Неизвестная ошибка при загрузке файла",
      };

      return result;
    }
  });

  // 6. Ожидание завершения всех загрузок
  const results = await Promise.allSettled(uploadPromises);

  // 7. Разделение на успешные и неудачные
  const uploadResults: UploadFileResult[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      uploadResults.push(result.value);
      if (!result.value.success) {
        errors.push(
          `Файл ${index + 1} (${result.value.filename}): ${result.value.error}`,
        );
      }
    } else {
      // Promise был отклонён (не должно происходить, так как мы обрабатываем ошибки внутри)
      errors.push(
        `Файл ${index + 1}: Критическая ошибка - ${result.reason?.message || "Unknown error"}`,
      );
      uploadResults.push({
        success: false,
        filename: files[index]?.filename || `unknown_${index}`,
        size: files[index]?.data.length || 0,
        error: result.reason?.message || "Критическая ошибка обработки",
      });
    }
  });

  // 8. Подсчёт статистики
  const successCount = uploadResults.filter((r) => r.success).length;
  const failedCount = uploadResults.filter((r) => !r.success).length;

  // 9. Логирование итогов batch-операции
  console.log(
    `[Batch Upload] Completed: ${successCount} success, ${failedCount} failed out of ${files.length} files`,
  );

  // 10. Формирование финального результата
  const batchResult: BatchUploadResult = {
    success: successCount > 0, // Успех если хотя бы один файл загружен
    totalFiles: files.length,
    successCount,
    failedCount,
    files: uploadResults,
    errors: errors.length > 0 ? errors : undefined,
  };

  return batchResult;
});
