import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { useDatabase } from "../../../utils/useDatabase";
import {
  buildReportQuery,
  buildCountQuery,
  type ReportConfig,
} from "../../../utils/reports/queryBuilder";
import { logActivity } from "../../../utils/activityLogger";

/**
 * POST /api/reports/builder/preview
 * Выполняет запрос на основе конфигурации и возвращает предпросмотр (max 100 строк).
 */
export default defineEventHandler(async (event) => {
  try {
    const user = requireAuth(event);
    const body = await readBody(event);

    const config: ReportConfig = {
      columns: body.columns || [],
      groupings: body.groupings || [],
      filters: body.filters || {},
      primary_entity: body.primary_entity || undefined,
      sort_field: body.sort_field,
      sort_direction: body.sort_direction || "asc",
      limit: Math.min(Number(body.limit) || 100, 100),
      offset: Number(body.offset) || 0,
    };

    // Базовая валидация
    if (config.columns.length === 0 && config.groupings.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Выберите хотя бы одно поле или группировку",
      });
    }

    // Строим запрос
    const { sql, params, columnLabels, error } = buildReportQuery(config);

    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: error,
      });
    }

    const db = useDatabase();

    // Основной запрос данных
    const [rows] = await db.query<any[]>(sql, params);

    // Запрос общего количества строк (без LIMIT)
    // Используем buildCountQuery который корректно удаляет LIMIT из субзапроса
    let total = rows.length;
    try {
      const countResult = buildCountQuery(config);
      if (!countResult.error) {
        const [countRows] = await db.query<any[]>(
          countResult.sql,
          countResult.params,
        );
        total = (countRows[0] as any)?.total ?? rows.length;
      }
    } catch {
      // Fallback: если count не работает, используем длину результата
    }

    // ── Вычисление TOTAL строки ────────────────────────────────────────
    // Для колонок с show_in_total=true вычисляем агрегат по всем строкам результата текущей страницы.
    // Это намеренное решение — итоги по текущей выборке, без дополнительного full-scan запроса.
    const totalColumns = config.columns.filter((c) => c.show_in_total);
    const totalRow: Record<string, any> = {};

    if (totalColumns.length > 0 && rows.length > 0) {
      for (const col of totalColumns) {
        const label = col.label;
        const agg = col.total_aggregation || "sum";
        const values = (rows as any[])
          .map((r) => {
            const v = r[label];
            return v !== null && v !== undefined ? Number(v) : null;
          })
          .filter((v) => v !== null) as number[];

        if (values.length === 0) {
          totalRow[label] = null;
          continue;
        }

        switch (agg) {
          case "sum":
            totalRow[label] = values.reduce((a, b) => a + b, 0);
            break;
          case "avg":
            totalRow[label] =
              Math.round(
                (values.reduce((a, b) => a + b, 0) / values.length) * 100,
              ) / 100;
            break;
          case "min":
            totalRow[label] = Math.min(...values);
            break;
          case "max":
            totalRow[label] = Math.max(...values);
            break;
          case "count":
            totalRow[label] = values.length;
            break;
          default:
            totalRow[label] = values.reduce((a, b) => a + b, 0);
        }
      }
    }

    // Логирование
    await logActivity(
      event,
      "VIEW",
      "SYSTEM",
      undefined,
      "Конструктор отчётов: предпросмотр",
      {
        columns_count: config.columns.length,
        groupings_count: config.groupings.length,
        rows_returned: rows.length,
      },
    );

    return {
      success: true,
      data: {
        rows,
        total,
        column_labels: columnLabels,
        has_more: config.offset! + rows.length < total,
        total_row: Object.keys(totalRow).length > 0 ? totalRow : null,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Preview error:", error.message || error);
    if (error.sql) {
      console.error("SQL:", error.sql);
      console.error("Params:", error.params);
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Ошибка при формировании отчёта: ${error.message || "неизвестная ошибка"}`,
    });
  }
});
