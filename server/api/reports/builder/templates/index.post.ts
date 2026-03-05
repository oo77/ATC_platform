import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";
import { randomUUID } from "crypto";
import { isValidFieldKey } from "../../../../utils/reports/fieldRegistry";

/**
 * POST /api/reports/builder/templates
 * Создание нового шаблона отчёта с его колонками (в транзакции)
 */
export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event);
    const body = await readBody(event);

    // Валидация
    if (!body.name?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Название обязательно",
      });
    }
    if (!Array.isArray(body.columns) || body.columns.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Добавьте хотя бы один столбец",
      });
    }

    // Проверяем все field_key по allowlist
    for (const col of body.columns) {
      if (!isValidFieldKey(col.field_key)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Недопустимое поле: ${col.field_key}`,
        });
      }
    }

    const db = useDatabase();
    const templateId = randomUUID();

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Создаём шаблон
      await conn.query(
        `INSERT INTO report_templates
          (id, name, description, data_sources, row_grouping, filters,
           sort_field, sort_direction, created_by, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          body.name.trim(),
          body.description?.trim() || null,
          JSON.stringify(body.data_sources || []),
          JSON.stringify(body.row_grouping || []),
          JSON.stringify(body.filters || {}),
          body.sort_field || null,
          body.sort_direction || "asc",
          user.id,
          body.is_public ? 1 : 0,
        ],
      );

      // Создаём колонки
      for (let i = 0; i < body.columns.length; i++) {
        const col = body.columns[i];
        await conn.query(
          `INSERT INTO report_template_columns
            (template_id, field_key, label, aggregation, order_index,
             width, align, format, show_in_total, total_aggregation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            templateId,
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

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    await logActivity(event, "CREATE", "SYSTEM", templateId, body.name, {
      columns_count: body.columns.length,
    });

    return {
      success: true,
      data: { id: templateId, name: body.name },
      message: "Шаблон успешно создан",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Create template error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при создании шаблона",
    });
  }
});
