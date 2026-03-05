import { defineEventHandler, getRouterParam, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";

/**
 * DELETE /api/reports/builder/templates/:id
 * Удаление шаблона (колонки удалятся каскадно по FK)
 */
export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event);
    const id = getRouterParam(event, "id");

    if (!id)
      throw createError({ statusCode: 400, statusMessage: "ID обязателен" });

    const db = useDatabase();

    const [[template]] = await db.query<any[]>(
      `SELECT id, name FROM report_templates WHERE id = ? AND created_by = ?`,
      [id, user.id],
    );

    if (!template) {
      throw createError({
        statusCode: 404,
        statusMessage: "Шаблон не найден или нет доступа",
      });
    }

    await db.query(`DELETE FROM report_templates WHERE id = ?`, [id]);

    await logActivity(event, "DELETE", "SYSTEM", id, template.name, {});

    return { success: true, message: "Шаблон удалён" };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Delete template error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при удалении шаблона",
    });
  }
});
