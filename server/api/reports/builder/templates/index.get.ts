import { defineEventHandler, getQuery, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";

/**
 * GET /api/reports/builder/templates
 * Список шаблонов отчётов текущего пользователя + публичные
 */
export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event);
    const query = getQuery(event);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Number(query.limit) || 20);
    const offset = (page - 1) * limit;

    const db = useDatabase();

    const [templates] = await db.query<any[]>(
      `SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.data_sources,
        rt.is_public,
        rt.use_count,
        rt.last_used_at,
        rt.created_at,
        rt.updated_at,
        u.name AS created_by_name,
        (SELECT COUNT(*) FROM report_template_columns rtc WHERE rtc.template_id = rt.id) AS columns_count
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.created_by = ? OR rt.is_public = 1
      ORDER BY rt.updated_at DESC
      LIMIT ? OFFSET ?`,
      [user.id, limit, offset],
    );

    const [[{ total }]] = await db.query<any[]>(
      `SELECT COUNT(*) AS total FROM report_templates
       WHERE created_by = ? OR is_public = 1`,
      [user.id],
    );

    await logActivity(
      event,
      "VIEW",
      "SYSTEM",
      undefined,
      "Конструктор отчётов: список шаблонов",
      {
        count: templates.length,
      },
    );

    return {
      success: true,
      data: templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Templates list error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при получении шаблонов",
    });
  }
});
