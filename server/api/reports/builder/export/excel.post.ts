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
  type ReportConfig,
} from "../../../../utils/reports/queryBuilder";
import { logActivity } from "../../../../utils/activityLogger";
import ExcelJS from "exceljs";

/**
 * POST /api/reports/builder/export/excel
 * Генерирует и отдаёт .xlsx файл на основе конфигурации отчёта.
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
    };

    if (config.columns.length === 0 && config.groupings.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Выберите хотя бы одно поле или группировку",
      });
    }

    const { sql, params, columnLabels, error } = buildExportQuery(config);

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error });
    }

    const db = useDatabase();
    const [rows] = await db.query<any[]>(sql, params);

    // Формируем Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "АТЦ Платформа";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Отчёт", {
      pageSetup: { orientation: "landscape", fitToPage: true },
    });

    // Заголовки
    sheet.addRow(columnLabels);

    // Стиль заголовков
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF93C5FD" } },
      };
    });
    headerRow.height = 28;

    // Данные
    for (const row of rows) {
      sheet.addRow(Object.values(row));
    }

    // Авто-ширина столбцов
    sheet.columns.forEach((col, index) => {
      const label = columnLabels[index] || "";
      const maxLen = Math.max(
        label.length,
        ...rows.map((r) => String(Object.values(r)[index] ?? "").length),
      );
      col.width = Math.min(Math.max(maxLen + 2, 12), 50);
    });

    // Закрепление первой строки
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Итоговая информация внизу
    const totalRow = sheet.addRow([]);
    sheet.addRow([`Всего строк: ${rows.length}`]);

    // Сериализуем в буфер
    const buffer = await workbook.xlsx.writeBuffer();

    // Логирование
    await logActivity(
      event,
      "EXPORT",
      "SYSTEM",
      undefined,
      "Конструктор отчётов: экспорт Excel",
      {
        rows_count: rows.length,
        columns_count: columnLabels.length,
      },
    );

    // Отправляем файл
    const filename = `report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    setResponseHeaders(event, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.byteLength.toString(),
    });

    return buffer;
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Excel export error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при экспорте в Excel",
    });
  }
});
