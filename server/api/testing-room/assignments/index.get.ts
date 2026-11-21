/**
 * Назначенные тесты на дату (для проведения в классе)
 * GET /api/testing-room/assignments?date=YYYY-MM-DD
 */
import { Permission, canAccessGroup, requirePermission } from "../../../utils/permissions";
import { getAssignmentsForDate } from "../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.TESTS_ASSIGN);
  const date = String(getQuery(event).date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, message: "Укажите дату в формате ГГГГ-ММ-ДД" });
  }

  const all = await getAssignmentsForDate(date);
  const allowed = [];
  for (const a of all) {
    if (await canAccessGroup(ctx, a.groupId)) allowed.push(a);
  }
  return { success: true, assignments: allowed };
});
