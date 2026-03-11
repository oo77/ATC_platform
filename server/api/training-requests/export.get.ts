/**
 * GET /api/training-requests/export
 * Экспорт заявок в Excel с учётом активных фильтров
 */
import ExcelJS from "exceljs";
import {
  getTrainingRequestsPaginated,
  type TrainingRequestFilters,
} from "../../repositories/trainingRequestRepository";
import { createActivityLog } from "../../repositories/activityLogRepository";

const STATUS_LABELS: Record<string, string> = {
  pending:     "На рассмотрении",
  approved:    "Одобрена",
  rejected:    "Отклонена",
  in_progress: "В процессе",
  completed:   "Завершена",
};

const CONTRACT_LABELS: Record<string, string> = {
  not_signed: "Не подписан",
  signed:     "Подписан",
};

const PAYMENT_LABELS: Record<string, string> = {
  not_paid: "Не оплачено",
  paid:     "Оплачено",
};

const MONTHS_RU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

function formatMonthLabel(m: string): string {
  if (!m) return "";
  const parts = m.split("-");
  const y = parts[0];
  const mo = parts[1];
  if (!y || !mo) return m;
  const idx = parseInt(mo) - 1;
  return `${MONTHS_RU[idx] || mo} ${y}`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const userId = event.context.user?.id || "system";

    // ─── Те же фильтры что у index.get.ts ───
    const filters: TrainingRequestFilters = {
      page:             1,
      limit:            10_000, // все строки для экспорта
      status:           (query.status as any) || undefined,
      organizationId:   (query.organizationId as string) || undefined,
      representativeId: (query.representativeId as string) || undefined,
      courseId:         (query.courseId as string) || undefined,
      month:            (query.month as string) || undefined,
      year:             (query.year as string) || undefined,
    };

    console.log("[API] GET /api/training-requests/export", filters);

    const result = await getTrainingRequestsPaginated(filters);
    const rows = result.data;

    // ─── Создание книги ───
    const workbook  = new ExcelJS.Workbook();
    workbook.creator = "ATC Platform";
    workbook.created  = new Date();

    // ─── Лист 1: Сводная таблица заявок ───
    const wsMain = workbook.addWorksheet("Заявки", {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
      views: [{ state: "frozen", ySplit: 2 }],
    });

    // Мета-строка с информацией об экспорте
    wsMain.addRow([
      "Отчёт: Заявки на обучение",
      "",
      `Дата: ${formatDate(new Date())}`,
      "",
      `Всего записей: ${result.total}`,
      filters.status         ? `Статус: ${STATUS_LABELS[filters.status] || filters.status}` : "",
      filters.month          ? `Месяц: ${formatMonthLabel(filters.month)}` : "",
    ]);

    // Стиль заголовка мета-строки
    const metaRow = wsMain.getRow(1);
    metaRow.font   = { bold: true, size: 11, color: { argb: "FF1A56DB" } };
    metaRow.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    metaRow.height = 24;
    wsMain.mergeCells("A1:B1");

    // ─── Заголовки столбцов (строка 2) ───
    const headers = [
      "№",
      "Организация",
      "Представитель",
      "Дата подачи",
      "Статус заявки",
      "Договор",
      "Оплата",
      "Кол-во позиций",
      "Кол-во слушателей",
      "Курсы (перечень)",
      "Период обучения",
      "Комментарий",
    ];
    wsMain.addRow(headers);

    const headerRow = wsMain.getRow(2);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A56DB" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFBFDBFE" } },
        right:  { style: "thin", color: { argb: "FFBFDBFE" } },
      };
    });
    headerRow.height = 28;

    // ─── Данные ───
    rows.forEach((req, idx) => {
      const courses    = req.items?.map((i) => i.courseName).join(", ") || "—";
      const months     = [...new Set(req.items?.map((i) => formatMonthLabel(i.trainingMonth)))].join(", ");
      const isEven     = idx % 2 === 0;

      const dataRow = wsMain.addRow([
        idx + 1,
        req.organizationName   || "—",
        req.representativeName || "—",
        formatDate(req.createdAt),
        STATUS_LABELS[req.status]             || req.status,
        CONTRACT_LABELS[req.contractStatus]    || req.contractStatus,
        PAYMENT_LABELS[req.paymentStatus]      || req.paymentStatus,
        req.totalItemsCount,
        req.totalStudentsCount,
        courses,
        months,
        req.adminComment || "",
      ]);

      // Alternating row colors
      const bgColor = isEven ? "FFF0F7FF" : "FFFFFFFF";
      dataRow.eachCell((cell) => {
        cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.alignment = { vertical: "middle", wrapText: false };
        cell.font      = { size: 10 };
        cell.border    = { bottom: { style: "hair", color: { argb: "FFE5E7EB" } } };
      });

      // Центрируем числовые и коротке колонки
      [1, 4, 5, 6, 7, 8, 9].forEach((col) => {
        dataRow.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
      });

      // Цвет статуса
      const statusCell = dataRow.getCell(5);
      const statusColors: Record<string, string> = {
        pending:     "FFFEF9C3",
        approved:    "FFD1FAE5",
        rejected:    "FFFEE2E2",
        in_progress: "FFDBEAFE",
        completed:   "FFF3F4F6",
      };
      if (statusColors[req.status]) {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusColors[req.status] } };
        statusCell.font = { bold: true, size: 10 };
      }

      // Цвет договора/оплаты
      const contractCell = dataRow.getCell(6);
      contractCell.font  = { size: 10, color: { argb: req.contractStatus === "signed" ? "FF059669" : "FF9CA3AF" } };
      const paymentCell  = dataRow.getCell(7);
      paymentCell.font   = { size: 10, color: { argb: req.paymentStatus === "paid" ? "FF059669" : "FF9CA3AF" } };

      dataRow.height = 22;
    });

    // ─── Ширина столбцов ───
    wsMain.columns = [
      { width: 5 },   // №
      { width: 32 },  // Организация
      { width: 26 },  // Представитель
      { width: 14 },  // Дата
      { width: 18 },  // Статус
      { width: 15 },  // Договор
      { width: 14 },  // Оплата
      { width: 10 },  // Позиций
      { width: 12 },  // Слушателей
      { width: 50 },  // Курсы
      { width: 22 },  // Период
      { width: 30 },  // Комментарий
    ];

    // ─── Лист 2: Позиции заявок (детальный) ───
    const wsItems = workbook.addWorksheet("Позиции", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    wsItems.addRow([
      "№", "Организация", "Представитель", "Дата заявки",
      "Статус", "Курс", "Месяц обучения", "Кол-во слушателей", "Группа", "Режим ввода",
    ]);

    const itemHeaderRow = wsItems.getRow(1);
    itemHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A56DB" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    itemHeaderRow.height = 26;

    let itemRowNum = 0;
    rows.forEach((req) => {
      (req.items || []).forEach((item) => {
        itemRowNum++;
        const isEven = itemRowNum % 2 === 0;
        const row = wsItems.addRow([
          itemRowNum,
          req.organizationName,
          req.representativeName,
          formatDate(req.createdAt),
          STATUS_LABELS[req.status] || req.status,
          item.courseName,
          formatMonthLabel(item.trainingMonth),
          item.studentsCount,
          item.groupLabel || "—",
          (!item.studentIds || item.studentIds.length === 0) ? "По количеству" : "Пофамильно",
        ]);
        const bgColor = isEven ? "FFF0F7FF" : "FFFFFFFF";
        row.eachCell((cell) => {
          cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          cell.font   = { size: 10 };
          cell.border = { bottom: { style: "hair", color: { argb: "FFE5E7EB" } } };
        });
        row.height = 20;
      });
    });

    wsItems.columns = [
      { width: 5 }, { width: 32 }, { width: 26 }, { width: 14 },
      { width: 18 }, { width: 50 }, { width: 18 }, { width: 14 }, { width: 20 }, { width: 16 },
    ];

    // ─── Запись в буфер + ответ ───
    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

    const ts    = new Date().toISOString().slice(0, 10);
    const fname = `training-requests-${ts}.xlsx`;

    setHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    setHeader(event, "Content-Disposition", `attachment; filename="${fname}"`);
    setHeader(event, "Content-Length", buffer.byteLength);
    setHeader(event, "Cache-Control", "no-store");

    await createActivityLog({
      userId,
      actionType: "EXPORT",
      entityType: "TRAINING_REQUEST",
      details: { filters, totalRows: result.total, filename: fname },
    });

    return send(event, buffer);
  } catch (error: any) {
    console.error("[API] Ошибка экспорта заявок:", error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Ошибка генерации отчёта" });
  }
});
