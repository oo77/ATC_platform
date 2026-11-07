/**
 * POST /api/test-bank/questions/:id/translations  { target_id }
 * Связать вопрос с переводом (вопрос того же банка на другом языке)
 */
import { executeQuery } from "../../../../utils/db";
import { randomUUID } from "node:crypto";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) throw createError({ statusCode: 401, message: "Необходима авторизация" });
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({ statusCode: 403, message: "Недостаточно прав" });
  }

  const id = getRouterParam(event, "id");
  const body = await readBody<{ target_id?: string }>(event);
  if (!id || !body?.target_id) return { success: false, message: "Не указан вопрос для связывания" };
  if (id === body.target_id) return { success: false, message: "Нельзя связать вопрос с самим собой" };

  const rows: any[] = await executeQuery(
    "SELECT id, bank_id, language, translation_group_id FROM questions WHERE id IN (?, ?)",
    [id, body.target_id],
  );
  const a = rows.find((r) => r.id === id);
  const b = rows.find((r) => r.id === body.target_id);
  if (!a || !b) return { success: false, message: "Вопрос не найден" };
  if (a.bank_id !== b.bank_id) return { success: false, message: "Вопросы должны быть из одного банка" };
  if (a.language === b.language) return { success: false, message: "Нужен вопрос на другом языке" };

  // Группа не должна содержать два вопроса одного языка
  const members = async (q: any): Promise<any[]> =>
    q.translation_group_id
      ? await executeQuery("SELECT id, language FROM questions WHERE translation_group_id = ?", [q.translation_group_id])
      : [{ id: q.id, language: q.language }];
  const ma = await members(a);
  const mb = await members(b);
  const langsA = new Set(ma.map((m) => m.language));
  if (mb.some((m) => langsA.has(m.language))) {
    return { success: false, message: "В группе уже есть вопрос на этом языке" };
  }

  const gid = a.translation_group_id || b.translation_group_id || randomUUID();
  const ids = [...ma, ...mb].map((m) => m.id);
  await executeQuery(
    `UPDATE questions SET translation_group_id = ? WHERE id IN (${ids.map(() => "?").join(", ")})`,
    [gid, ...ids],
  );
  return { success: true };
});
