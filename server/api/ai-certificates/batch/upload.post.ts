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
  const uploadedFiles = files.filter((f) => f.name === "files");

  const uploadPromises = uploadedFiles.map(async (file, index) => {
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

      // Ищем превью картинку, отправленную браузером (для PDF)
      const previewField = files.find(f => f.name === `preview_${index}`);
      const base64Preview = previewField ? previewField.data.toString() : null;

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
            base64Data: base64Preview, // сохраняем картинку для Vision Model
          },
        } as any,
      });

      // 5.5 Логирование успешной загрузки
      console.log(
        `[Batch Upload] File ${index + 1}/${uploadedFiles.length} uploaded: ${file.filename} (ID: ${log.id})${base64Preview ? ' [with Image Preview]' : ''}`,
      );

      // 5.6 Формирование результата загрузки
      const result: UploadFileResult = {
        fileId: log.id,
        filename: savedFile.filename,
        fileSize: savedFile.sizeBytes,
        mimeType: savedFile.mimeType,
      };

      return { success: true, value: result };
    } catch (error: any) {
      // Обработка ошибки для конкретного файла
      console.error(
        `[Batch Upload] Error processing file ${index + 1}/${uploadedFiles.length}:`,
        error,
      );

      return { 
        success: false, 
        value: {
          filename: file.filename || `unknown_${index}`,
          error: error.message || "Неизвестная ошибка при загрузке файла",
        } 
      };
    }
  });

  // 6. Ожидание завершения всех загрузок
  const results = await Promise.allSettled(uploadPromises);

  // 7. Разделение на успешные и неудачные
  const uploadResults: UploadFileResult[] = [];
  const errors: Array<{filename: string, error: string}> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      if (result.value.success) {
        uploadResults.push(result.value.value as UploadFileResult);
      } else {
        errors.push(result.value.value as {filename: string, error: string});
      }
    } else {
      // Promise был отклонён
      errors.push({
        filename: uploadedFiles[index]?.filename || `unknown_${index}`,
        error: result.reason?.message || "Критическая ошибка обработки",
      });
    }
  });

  // 8. Подсчёт статистики
  const successCount = uploadResults.length;
  const errorCount = errors.length;

  // 9. Логирование итогов batch-операции
  console.log(
    `[Batch Upload] Completed: ${successCount} success, ${errorCount} failed out of ${uploadedFiles.length} files`,
  );

  // 10. Формирование финального результата
  const batchResult: BatchUploadResult = {
    files: uploadResults,
    successCount,
    errorCount,
    errors: errors.length > 0 ? errors : undefined,
  };

  return batchResult;
});
