import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";
import { isValidFieldKey } from "../../../../utils/reports/fieldRegistry";

/**
 * PUT /api/reports/builder/templates/:id
 * Обновление шаблона — пересоздание колонок в транзакции
 */
export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event);
    const id = getRouterParam(event, "id");
    const body = await readBody(event);

    if (!id)
      throw createError({ statusCode: 400, statusMessage: "ID обязателен" });
    if (!body.name?.trim())
      throw createError({
        statusCode: 400,
        statusMessage: "Название обязательно",
      });

    if (Array.isArray(body.columns)) {
      for (const col of body.columns) {
        if (!isValidFieldKey(col.field_key)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Недопустимое поле: ${col.field_key}`,
          });
        }
      }
    }

    const db = useDatabase();

    // Проверяем права
    const [[template]] = await db.query<any[]>(
      `SELECT id FROM report_templates WHERE id = ? AND created_by = ?`,
      [id, user.id],
    );
    if (!template)
      throw createError({
        statusCode: 403,
        statusMessage: "Нет доступа к этому шаблону",
      });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE report_templates SET
          name = ?, description = ?, data_sources = ?, row_grouping = ?,
          filters = ?, sort_field = ?, sort_direction = ?, is_public = ?
         WHERE id = ?`,
        [
          body.name.trim(),
          body.description?.trim() || null,
          JSON.stringify(body.data_sources || []),
          JSON.stringify(body.row_grouping || []),
          JSON.stringify(body.filters || {}),
          body.sort_field || null,
          body.sort_direction || "asc",
          body.is_public ? 1 : 0,
          id,
        ],
      );

      if (Array.isArray(body.columns)) {
        await conn.query(
          `DELETE FROM report_template_columns WHERE template_id = ?`,
          [id],
        );

        for (let i = 0; i < body.columns.length; i++) {
          const col = body.columns[i];
          await conn.query(
            `INSERT INTO report_template_columns
              (template_id, field_key, label, aggregation, order_index,
               width, align, format, show_in_total, total_aggregation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              col.field_key,
              col.label,
              col.aggregation || "none",
              i,
              col.width || 150,
              col.align || "left",
              col.format || null,
              col.show_in_total ? 1 : 0,
              col.total_aggregation || "sum",
            ],
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    await logActivity(event, "UPDATE", "SYSTEM", id, body.name, {
      columns_count: body.columns?.length,
    });

    return { success: true, message: "Шаблон обновлён" };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Update template error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при обновлении шаблона",
    });
  }
});
