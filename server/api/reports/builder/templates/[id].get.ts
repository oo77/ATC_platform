import { defineEventHandler, getRouterParam, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";

/**
 * GET /api/reports/builder/templates/:id
 * Получить шаблон со всеми колонками
 */
export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event);
    const id = getRouterParam(event, "id");

    if (!id)
      throw createError({ statusCode: 400, statusMessage: "ID обязателен" });

    const db = useDatabase();

    const [[template]] = await db.query<any[]>(
      `SELECT rt.*, u.name AS created_by_name
       FROM report_templates rt
       LEFT JOIN users u ON u.id = rt.created_by
       WHERE rt.id = ? AND (rt.created_by = ? OR rt.is_public = 1)`,
      [id, user.id],
    );

    if (!template) {
      throw createError({ statusCode: 404, statusMessage: "Шаблон не найден" });
    }

    const [columns] = await db.query<any[]>(
      `SELECT * FROM report_template_columns
       WHERE template_id = ?
       ORDER BY order_index ASC`,
      [id],
    );

    // Обновляем статистику использования
    await db.query(
      `UPDATE report_templates SET last_used_at = NOW(3), use_count = use_count + 1 WHERE id = ?`,
      [id],
    );

    await logActivity(event, "VIEW", "SYSTEM", id, template.name, {});

    return {
      success: true,
      data: {
        ...template,
        data_sources: JSON.parse(template.data_sources || "[]"),
        row_grouping: JSON.parse(template.row_grouping || "[]"),
        filters: JSON.parse(template.filters || "{}"),
        columns,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Get template error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при получении шаблона",
    });
  }
});
