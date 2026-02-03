import { aiCertificateRepository } from "../../repositories/aiCertificateRepository";
import { storage } from "../../utils/storage";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import type { ProcessingLogStatus } from "../../types/aiCertificateImport";

export default defineEventHandler(async (event) => {
  // 1. Авторизация и прав
  const context = await requirePermission(event, Permission.CERTIFICATES_ISSUE);

  // 2. Чтение файла
  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Файл не загружен",
    });
  }

  const file = files[0];

  // Проверка типа файла
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type || "")) {
    throw createError({
      statusCode: 400,
      message: "Неподдерживаемый формат файла. Разрешены: PDF, JPG, PNG",
    });
  }

  // Проверка размера (макс 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      message: "Файл слишком большой. Максимальный размер 10MB",
    });
  }

  try {
    // 3. Сохранение файла во временное хранилище
    // Используем категорию 'certificate_generated' и подпапку Imports/Temp
    const savedFile = await storage.save(
      {
        filename: file.filename || "unknown",
        data: file.data,
        mimeType: file.type || "application/octet-stream",
        size: file.data.length,
      },
      "certificate_generated",
      undefined,
      "/Certificates/Imports/Temp",
    );

    // 4. Создание лога обработки
    // Статус 'processing' или 'pending', используем 'pending' как ожидающий анализа
    const log = await aiCertificateRepository.createLog({
      originalFilename: file.filename || "unknown",
      fileSizeBytes: file.data.length,
      processingStartedAt: new Date(),
      aiModel: "pending",
      status: "pending" as ProcessingLogStatus,
      processedBy: context.userId,
      ipAddress: event.node.req.socket.remoteAddress || "unknown",
      // Временно сохраняем путь к файлу в extractedData
      // Это хак, но он позволяет передать путь в следующий шаг без изменения схемы БД
      extractedData: {
        _internal: {
          tempFilePath: savedFile.fullPath,
          fileUuid: savedFile.uuid,
          mimeType: savedFile.mimeType,
        },
      } as any,
    });

    return {
      success: true,
      fileId: log.id, // Возвращаем ID лога как токен для следующего шага
      filename: savedFile.filename,
      size: savedFile.sizeBytes,
    };
  } catch (error: any) {
    console.error("AI Upload error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка при загрузке файла",
    });
  }
});
