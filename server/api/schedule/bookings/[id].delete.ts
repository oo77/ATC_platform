/**
 * DELETE /api/schedule/bookings/:id
 * Снять бронь аудитории.
 */

import { Permission, requirePermission } from "../../../utils/permissions";
import { logActivity } from "../../../utils/activityLogger";
import { deleteBooking, getBookingById } from "../../../repositories/roomBookingRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SCHEDULE_UPDATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "ID брони обязателен" });

  const existing = await getBookingById(id);
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Бронь не найдена" });

  await deleteBooking(id);

  await logActivity(
    event,
    "DELETE",
    "SCHEDULE",
    id,
    `Бронь аудитории ${existing.classroomName}: ${existing.courseName}`,
    { booking: existing },
  );

  return { success: true };
});
