/**
 * GET /api/instructors/monthly-load?month=2026-10&conducted=1
 * Нагрузка инструкторов за месяц: группы, дни, занятия и академические часы по каждому инструктору.
 * conducted=1 — только уже проведённые занятия.
 */

import {
  currentMonth,
  loadInstructorMonthlyLoad,
  parseMonth,
} from "../../services/instructorMonthlyLoadService";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";

export default defineEventHandler(async (event) => {
  // /api/instructors/* открыт и преподавателям — нагрузку коллег видят только админ и менеджер
  await requirePermission(event, Permission.INSTRUCTORS_HOURS);

  const query = getQuery(event);
  const rawMonth = query.month;
  const month = rawMonth === undefined ? currentMonth() : parseMonth(rawMonth);
  if (!month) {
    throw createError({ statusCode: 400, message: "Месяц должен быть в формате ГГГГ-ММ" });
  }
  const onlyConducted = query.conducted === "1" || query.conducted === "true";

  try {
    const data = await loadInstructorMonthlyLoad(month, onlyConducted);
    return { success: true, data };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Instructor Monthly Load] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при загрузке нагрузки инструкторов",
    });
  }
});
