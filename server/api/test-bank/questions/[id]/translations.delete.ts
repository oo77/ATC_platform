/**
 * DELETE /api/test-bank/questions/:id/translations
 * Отвязать вопрос от группы переводов
 */
import { executeQuery } from "../../../../utils/db";
import { Permission, roleHasPermission } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) throw createError({ statusCode: 401, message: "Необходима авторизация" });
  if (!roleHasPermission(user, Permission.TEST_BANKS_MANAGE)) {
    throw createError({ statusCode: 403, message: "Недостаточно прав" });
  }

  const id = getRouterParam(event, "id");
  const rows: any[] = await executeQuery("SELECT translation_group_id FROM questions WHERE id = ?", [id]);
  const gid = rows[0]?.translation_group_id;
  if (!gid) return { success: true };

  await executeQuery("UPDATE questions SET translation_group_id = NULL WHERE id = ?", [id]);
  // Если в группе остался один вопрос — группа не нужна
  const left: any[] = await executeQuery("SELECT id FROM questions WHERE translation_group_id = ?", [gid]);
  if (left.length === 1) {
    await executeQuery("UPDATE questions SET translation_group_id = NULL WHERE id = ?", [left[0].id]);
  }
  return { success: true };
});
