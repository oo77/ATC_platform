/**
 * API endpoint для скачивания отчета группы
 * GET /api/groups/[groupId]/reports/[fileId]
 *
 * Параметр fileId здесь используется как UUID файла для безопасности
 */

import {
  defineEventHandler,
  createError,
  getRouterParam,
  sendStream,
} from "h3";
import { executeQuery } from "../../../../utils/db";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // Права доступа (как в списке)
  if (user.role === "STUDENT") {
    throw createError({ statusCode: 403, message: "Нет доступа" });
  }

  const groupId = getRouterParam(event, "id");
  const fileUuid = getRouterParam(event, "fileId");

  console.log(
    "[GET /api/groups/[id]/reports/[fileId]] Запрос на скачивание файла"
  );
  console.log("  - groupId:", groupId);
  console.log("  - fileUuid:", fileUuid);
  console.log("  - URL:", event.node.req.url);

  if (!groupId || !fileUuid) {
    console.error(
      "[GET /api/groups/[id]/reports/[fileId]] Отсутствуют параметры"
    );
    throw createError({
      statusCode: 400,
      message: "Неверные параметры запроса",
    });
  }

  // Получаем информацию о файле
  console.log("[GET /api/groups/[id]/reports/[fileId]] Поиск файла в БД...");
  const files = await executeQuery<any[]>(
    `SELECT * FROM files 
     WHERE uuid = ? AND group_id = ? AND category = 'group_report' 
     LIMIT 1`,
    [fileUuid, groupId]
  );

  console.log(
    "[GET /api/groups/[id]/reports/[fileId]] Найдено файлов:",
    files.length
  );

  const file = files[0];

  if (!file) {
    console.error(
      "[GET /api/groups/[id]/reports/[fileId]] Файл не найден в БД"
    );
    throw createError({ statusCode: 404, message: "Файл не найден" });
  }

  console.log("[GET /api/groups/[id]/reports/[fileId]] Файл найден:", {
    id: file.id,
    filename: file.filename,
    storage_path: file.storage_path,
  });

  // Строим абсолютный путь
  const absolutePath = path.join(process.cwd(), "storage", file.storage_path);
  console.log(
    "[GET /api/groups/[id]/reports/[fileId]] Абсолютный путь:",
    absolutePath
  );

  if (!fs.existsSync(absolutePath)) {
    console.error(
      "[GET /api/groups/[id]/reports/[fileId]] Файл физически отсутствует"
    );
    throw createError({
      statusCode: 404,
      message: "Файл физически отсутствует на сервере",
    });
  }

  console.log("[GET /api/groups/[id]/reports/[fileId]] Отправка файла...");

  // Отправляем файл
  const stream = fs.createReadStream(absolutePath);

  event.node.res.setHeader("Content-Type", "application/pdf");
  event.node.res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(
      file.filename || "report.pdf"
    )}"`
  );

  return sendStream(event, stream);
});
