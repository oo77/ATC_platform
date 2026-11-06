/**
 * GET /api/instructors/monthly-load-export?month=2026-10&conducted=1
 * Excel-отчёт о нагрузке инструкторов за месяц: лист по инструкторам и лист по группам.
 */

import {
  buildInstructorMonthlyLoadWorkbook,
  currentMonth,
  loadInstructorMonthlyLoad,
  monthTitle,
  parseMonth,
} from "../../services/instructorMonthlyLoadService";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.INSTRUCTORS_HOURS);

  const query = getQuery(event);
  const rawMonth = query.month;
  const month = rawMonth === undefined ? currentMonth() : parseMonth(rawMonth);
  if (!month) {
    throw createError({ statusCode: 400, message: "Месяц должен быть в формате ГГГГ-ММ" });
  }
  const onlyConducted = query.conducted === "1" || query.conducted === "true";

  try {
    const model = await loadInstructorMonthlyLoad(month, onlyConducted);
    const buffer = await buildInstructorMonthlyLoadWorkbook(model);

    const fileNameRu = `Нагрузка инструкторов ${monthTitle(month)}.xlsx`;
    const fileNameAscii = `Nagruzka_instruktorov_${month}.xlsx`;

    setHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${fileNameAscii}"; filename*=UTF-8''${encodeURIComponent(fileNameRu)}`,
    );
    setHeader(event, "Content-Length", buffer.byteLength);
    setHeader(event, "Cache-Control", "no-store");

    return send(event, buffer);
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Instructor Monthly Load Export] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка формирования отчёта",
    });
  }
});
