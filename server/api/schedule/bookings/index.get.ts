/**
 * GET /api/schedule/bookings
 * Брони аудиторий под курсы. По умолчанию — действующие и будущие.
 * Параметры: from, to (YYYY-MM-DD), classroomId, courseId, scope=all
 */

import { executeQuery } from "../../../utils/db";
import { Permission, requirePermission } from "../../../utils/permissions";
import { listBookings } from "../../../repositories/roomBookingRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SCHEDULE_VIEW_ALL);

  const query = getQuery(event);
  const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

  let from = isDate(query.from) ? query.from : undefined;
  const to = isDate(query.to) ? query.to : undefined;
  if (!from && query.scope !== "all") {
    const [row] = await executeQuery<any[]>("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
    from = row.today;
  }

  const bookings = await listBookings({
    from,
    to,
    classroomIds: typeof query.classroomId === "string" && query.classroomId ? [query.classroomId] : undefined,
    courseId: typeof query.courseId === "string" && query.courseId ? query.courseId : undefined,
  });

  return { success: true, bookings };
});
