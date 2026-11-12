import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { useDatabase } from "../../../utils/useDatabase";
import {
  buildReportQuery,
  mapReportRows,
  ReportConfigError,
  type ReportConfig,
} from "../../../utils/reports/queryBuilder";
import { logActivity } from "../../../utils/activityLogger";
import { Permission, requirePermission } from "../../../utils/permissions";

const MAX_PAGE_SIZE = 200;

/**
 * POST /api/reports/builder/preview
 * Выполняет запрос по конфигурации и возвращает страницу результата,
 * общее число строк и строку ИТОГО (посчитанную по всей выборке).
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  requireAuth(event);
  const body = (await readBody(event)) || {};

  const config: ReportConfig = {
    columns: body.columns || [],
    groupings: body.groupings || [],
    filters: body.filters || {},
    primary_entity: body.primary_entity || undefined,
    sort_field: body.sort_field || undefined,
    sort_direction: body.sort_direction === "desc" ? "desc" : "asc",
    row_limit: body.row_limit ?? null,
    limit: Math.min(Math.max(Number(body.limit) || 50, 1), MAX_PAGE_SIZE),
    offset: Math.max(Number(body.offset) || 0, 0),
  };

  let built;
  try {
    built = buildReportQuery(config);
  } catch (e: any) {
    if (e instanceof ReportConfigError) {
      throw createError({ statusCode: 400, statusMessage: e.message });
    }
    throw e;
  }

  const db = useDatabase();
  const startedAt = Date.now();

  try {
    const [[rawRows], [countRows], totalsRes] = await Promise.all([
      db.query<any[]>(built.sql, built.params),
      db.query<any[]>(built.countSql, built.countParams),
      built.totalsSql
        ? db.query<any[]>(built.totalsSql, built.totalsParams)
        : Promise.resolve(null),
    ]);

    const rows = mapReportRows(rawRows, built);
    const total = Number((countRows[0] as any)?.total ?? rows.length);

    let totalRow: Record<string, unknown> | null = null;
    if (totalsRes) {
      const [mapped] = mapReportRows([(totalsRes[0] as any[])[0] || {}], {
        aliasToLabel: built.aliasToLabel,
        numericLabels: Object.values(built.aliasToLabel),
      });
      // Оставляем только столбцы, реально участвующие в итоге
      const totalAliases = Object.keys((totalsRes[0] as any[])[0] || {});
      totalRow = Object.fromEntries(
        totalAliases.map((a) => [built.aliasToLabel[a], mapped?.[built.aliasToLabel[a]!] ?? null]),
      );
    }

    await logActivity(event, "VIEW", "SYSTEM", undefined, "Конструктор отчётов: предпросмотр", {
      columns_count: config.columns.length,
      groupings_count: config.groupings.length,
      rows_returned: rows.length,
    });

    return {
      success: true,
      data: {
        rows,
        total,
        column_labels: built.columnLabels,
        numeric_columns: built.numericLabels,
        has_more: config.offset! + rows.length < total,
        total_row: totalRow,
        warnings: built.warnings,
        duration_ms: Date.now() - startedAt,
      },
    };
  } catch (error: any) {
    console.error("[Reports] Preview error:", error?.message || error);
    if (error?.sql) console.error("SQL:", error.sql);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при формировании отчёта. Попробуйте упростить набор полей.",
    });
  }
});
