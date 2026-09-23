/**
 * GET /api/students/:id/photo
 * Фото слушателя как изображение (для <img> в карточках ИИ-ассистента и списках),
 * без передачи тяжёлого base64 внутри JSON.
 */

import { executeQuery } from "../../../utils/db";
import { UserRole } from "../../../types/auth";

export default defineEventHandler(async (event) => {
  const authUser = event.context.user;
  if (!authUser) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID слушателя не указан" });
  }

  const rows = await executeQuery<any[]>(
    "SELECT user_id, photo_base64 FROM students WHERE id = ? LIMIT 1",
    [id],
  );
  const student = rows[0];
  if (!student?.photo_base64) {
    throw createError({ statusCode: 404, message: "Фото не найдено" });
  }

  if (authUser.role === UserRole.STUDENT && student.user_id !== authUser.id) {
    throw createError({ statusCode: 403, message: "Нет доступа к фото этого слушателя" });
  }

  const raw = String(student.photo_base64);
  const match = raw.match(/^data:(image\/[\w.+-]+);base64,(.*)$/s);
  const mime = match?.[1] || "image/jpeg";
  const buffer = Buffer.from(match ? match[2]! : raw, "base64");

  setResponseHeader(event, "Content-Type", mime);
  setResponseHeader(event, "Cache-Control", "private, max-age=3600");
  return buffer;
});
