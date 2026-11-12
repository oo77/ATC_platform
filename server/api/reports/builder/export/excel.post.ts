import {
  defineEventHandler,
  readBody,
  createError,
  setResponseHeaders,
} from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import {
  buildExportQuery,
  mapReportRows,
  ReportConfigError,
  MAX_EXPORT_ROWS,
  type ReportConfig,
} from "../../../../utils/reports/queryBuilder";
import { logActivity } from "../../../../utils/activityLogger";
import ExcelJS from "exceljs";
import { Permission, requirePermission } from "../../../../utils/permissions";

const pad = (n: number) => String(n).padStart(2, "0");

/** Дата → «дд.мм.гггг» (или с временем, если оно не полночь) */
function formatDate(value: Date): string {
  const base = `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`;
  if (value.getHours() || value.getMinutes() || value.getSeconds()) {
    return `${base} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
  return base;
}

/** Имя файла без символов, запрещённых в Windows/HTTP-заголовке */
function safeFileName(name: unknown): string {
  const s = String(name || "report")
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .trim()
    .slice(0, 100);
  return s || "report";
}

/**
 * POST /api/reports/builder/export/excel
 * Генерирует .xlsx по конфигурации отчёта (до 100 000 строк).
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
  };

  let built;
  try {
    built = buildExportQuery(config);
  } catch (e: any) {
    if (e instanceof ReportConfigError) {
      throw createError({ statusCode: 400, statusMessage: e.message });
    }
    throw e;
  }

  try {
    const db = useDatabase();
    const [[rawRows], [countRows], totalsRes] = await Promise.all([
      db.query<any[]>(built.sql, built.params),
      db.query<any[]>(built.countSql, built.countParams),
      built.totalsSql
        ? db.query<any[]>(built.totalsSql, built.totalsParams)
        : Promise.resolve(null),
    ]);
    const rows = mapReportRows(rawRows, built);
    const total = Number((countRows[0] as any)?.total ?? rows.length);
    const labels = built.columnLabels;
    const numeric = new Set(built.numericLabels);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "АТЦ Платформа";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Отчёт", {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    sheet.addRow(labels);
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FF93C5FD" } } };
    });
    headerRow.height = 28;

    const matrix = rows.map((row) =>
      labels.map((label) => {
        const v = row[label];
        if (v instanceof Date) return formatDate(v);
        if (v === null || v === undefined) return "";
        return v as ExcelJS.CellValue;
      }),
    );
    for (const r of matrix) sheet.addRow(r);

    // Числовой формат для числовых столбцов.
    // Не «#,##0.##»: для целых Excel оставляет висячий разделитель («4 387,»).
    // Целые столбцы (количества) — без дробной части, остальные — 2 знака.
    labels.forEach((label, idx) => {
      if (!numeric.has(label)) return;
      const allInteger = rows.every((r) => {
        const v = r[label];
        return typeof v !== "number" || Number.isInteger(v);
      });
      const column = sheet.getColumn(idx + 1);
      column.numFmt = allInteger ? "#,##0" : "#,##0.00";
      column.alignment = { horizontal: "right" };
    });

    // Строка ИТОГО — по всей выборке
    if (totalsRes) {
      const t = ((totalsRes[0] as any[])[0] || {}) as Record<string, unknown>;
      const values = Object.keys(built.aliasToLabel).map((alias, idx) => {
        if (idx === 0 && !(alias in t)) return "ИТОГО";
        const v = t[alias];
        return v === null || v === undefined ? "" : Number(v);
      });
      const tr = sheet.addRow(values);
      tr.font = { bold: true };
      tr.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
        cell.border = { top: { style: "thin", color: { argb: "FF2563EB" } } };
      });
    }

    // Авто-ширина
    sheet.columns.forEach((col, index) => {
      const label = labels[index] || "";
      let maxLen = label.length;
      for (let i = 0; i < Math.min(matrix.length, 2000); i++) {
        maxLen = Math.max(maxLen, String(matrix[i]![index] ?? "").length);
      }
      col.width = Math.min(Math.max(maxLen + 2, 12), 50);
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    if (labels.length > 0 && rows.length > 0) {
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: labels.length } };
    }

    sheet.addRow([]);
    sheet.addRow([
      rows.length < total
        ? `Выгружено строк: ${rows.length} из ${total} (ограничение ${MAX_EXPORT_ROWS.toLocaleString("ru-RU")})`
        : `Всего строк: ${rows.length}`,
    ]);
    sheet.addRow([`Сформировано: ${formatDate(new Date())}`]);

    const buffer = await workbook.xlsx.writeBuffer();

    await logActivity(event, "EXPORT", "SYSTEM", undefined, "Конструктор отчётов: экспорт Excel", {
      rows_count: rows.length,
      columns_count: labels.length,
    });

    const base = safeFileName(body.name);
    const filename = `${base}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    setResponseHeaders(event, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": buffer.byteLength.toString(),
    });

    return buffer;
  } catch (error: any) {
    console.error("[Reports] Excel export error:", error?.message || error);
    throw createError({ statusCode: 500, statusMessage: "Ошибка при экспорте в Excel" });
  }
});
