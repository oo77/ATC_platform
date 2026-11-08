/**
 * GET /api/test-bank/questions/:id/translations
 * Связанные переводы вопроса + кандидаты для связывания (тот же банк, другие языки)
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
  const rows: any[] = await executeQuery(
    "SELECT id, bank_id, language, translation_group_id FROM questions WHERE id = ?",
    [id],
  );
  const q = rows[0];
  if (!q) return { success: false, message: "Вопрос не найден" };

  const linked: any[] = q.translation_group_id
    ? await executeQuery(
        `SELECT id, language, question_text FROM questions
         WHERE translation_group_id = ? AND id <> ? ORDER BY language`,
        [q.translation_group_id, id],
      )
    : [];

  const linkedLangs = new Set([q.language, ...linked.map((l) => l.language)]);

  // Кандидаты: тот же банк, язык ещё не представлен в группе, вопрос не связан с другой группой
  const candidates: any[] = (
    await executeQuery(
      `SELECT id, language, question_text, translation_group_id, order_index
       FROM questions
       WHERE bank_id = ? AND language <> ?
         AND (translation_group_id IS NULL)
       ORDER BY language, order_index, created_at`,
      [q.bank_id, q.language],
    )
  ).filter((c: any) => !linkedLangs.has(c.language));

  return { success: true, language: q.language, linked, candidates };
});
