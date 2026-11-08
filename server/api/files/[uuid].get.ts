/**
 * API endpoint для получения файла
 * GET /api/files/[uuid]
 */

import { getFileByUuid } from "../../repositories/fileRepository";
import { storage } from "../../utils/storage";
import { Permission, requireAuthContext, roleHasPermission } from "../../utils/permissions";
import { isSafeInlineMime, requireFolderUnlocked } from "../../utils/folderAccess";

export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, "uuid");

    if (!uuid) {
      throw createError({
        statusCode: 400,
        message: "UUID файла не указан",
      });
    }

    console.log(`[files API] Requesting file with uuid: ${uuid}`);

    // Получение метаданных файла из БД
    const fileRecord = await getFileByUuid(uuid);
    
    console.log(`[files API] fileRecord from DB:`, fileRecord);

    if (!fileRecord) {
      throw createError({
        statusCode: 404,
        message: "Файл не найден",
      });
    }

    const user = event.context.user;

    if (!fileRecord.isPublic && !user) {
      throw createError({
        statusCode: 401,
        message: "Требуется авторизация",
      });
    }

    // P0-ACCESS: файл видит загрузивший/владелец или пользователь с правом просмотра файлов;
    // плюс пароль папки по всей цепочке (раньше не проверялся на сервере вовсе)
    if (!fileRecord.isPublic) {
      const accessCtx = await requireAuthContext(event);
      const isOwner =
        String(fileRecord.uploadedBy) === accessCtx.userId ||
        (fileRecord.userId !== null && String(fileRecord.userId) === accessCtx.userId);
      if (!isOwner && !roleHasPermission(accessCtx, Permission.FILES_VIEW)) {
        throw createError({ statusCode: 403, message: "Доступ запрещён" });
      }
      await requireFolderUnlocked(event, accessCtx, fileRecord.folderId);
    }

    // Проверка уровня доступа
    if (!fileRecord.isPublic) {
      switch (fileRecord.accessLevel) {
        case "owner":
          if (
            !user ||
            (user.id !== fileRecord.uploadedBy && user.id !== fileRecord.userId)
          ) {
            throw createError({
              statusCode: 403,
              message: "Доступ запрещён",
            });
          }
          break;
        case "admin":
          if (!user || !roleHasPermission(user, Permission.FILES_MANAGE)) {
            throw createError({
              statusCode: 403,
              message: "Доступ запрещён",
            });
          }
          break;
        case "authenticated":
          // Проверка уже выполнена выше
          break;
        case "public":
          // Публичный доступ
          break;
      }
    }

    // Получение файла из storage
    const fileData = await storage.get(fileRecord.fullPath);

    // Установка headers.
    // MIME-тип пришёл от загрузившего и ему нельзя доверять: HTML/SVG/XML, открытые
    // inline, выполнились бы в контексте сайта (хранимый XSS с кражей токена).
    // Безопасные типы показываем в браузере, остальные — только скачиванием в песочнице.
    const inline = isSafeInlineMime(fileRecord.mimeType);
    setHeader(event, "Content-Type", inline ? fileRecord.mimeType : "application/octet-stream");
    setHeader(event, "Content-Length", fileRecord.sizeBytes);
    setHeader(event, "X-Content-Type-Options", "nosniff");
    if (!inline) {
      setHeader(event, "Content-Security-Policy", "sandbox");
    }
    setHeader(
      event,
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(fileRecord.filename)}`
    );

    // Кэширование для публичных файлов
    if (fileRecord.isPublic) {
      setHeader(event, "Cache-Control", "public, max-age=31536000"); // 1 год
    }

    return fileData;
  } catch (error: any) {
    // Если это уже createError, пробрасываем его
    if (error.statusCode) {
      throw error;
    }

    console.error("Ошибка получения файла:", error);

    throw createError({
      statusCode: 500,
      message: "Ошибка при получении файла",
    });
  }
});
