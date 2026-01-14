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

  const groupId = getRouterParam(event, "id"); // Обратите внимание: router params могут быть [id] или [groupId] в зависимости от структуры папок
  // Nuxt/Nitro вложенность: server/api/groups/[id]/reports/[fileId].get.ts
  // Здесь первый парам [id] (группа), второй [fileId] (файл)

  // В nitro 2.x параметры доступны по именам сегментов.
  // Если структура server/api/groups/[id]/reports/[fileId].get.ts
  // То event.context.params будет { id: '...', fileId: '...' }

  const idParam = getRouterParam(event, "id");
  const fileUuid = getRouterParam(event, "fileId");

  if (!idParam || !fileUuid) {
    throw createError({
      statusCode: 400,
      message: "Неверные параметры запроса",
    });
  }

  // Получаем информацию о файле
  const files = await executeQuery<any[]>(
    `SELECT * FROM files 
     WHERE uuid = ? AND group_id = ? AND category = 'group_report' 
     LIMIT 1`,
    [fileUuid, idParam]
  );

  const file = files[0];

  if (!file) {
    throw createError({ statusCode: 404, message: "Файл не найден" });
  }

  // Полный путь
  // file.full_path предположительно содержит относительный путь внутри storage, или абсолютный?
  // В create мы писали relative path в оба поля (storage_path и full_path)

  // Строим абсолютный путь
  const absolutePath = path.join(process.cwd(), "storage", file.storage_path);

  if (!fs.existsSync(absolutePath)) {
    throw createError({
      statusCode: 404,
      message: "Файл физически отсутствует на сервере",
    });
  }

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
