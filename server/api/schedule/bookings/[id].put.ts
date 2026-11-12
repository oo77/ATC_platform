/**
 * PUT /api/schedule/bookings/:id
 * Изменить бронь (в том числе привязать группу, когда она станет известна).
 */

import { z } from "zod";
import { Permission, requirePermission } from "../../../utils/permissions";
import { logActivity } from "../../../utils/activityLogger";
import { withScheduleWriteLock } from "../../../utils/scheduleLock";
import {
  assertBookingAllowed,
  getBookingById,
  updateBooking,
  validateBookingInput,
} from "../../../repositories/roomBookingRepository";
import { bookingSchema } from "../../../utils/roomBookingSchema";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SCHEDULE_UPDATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "ID брони обязателен" });

  const existing = await getBookingById(id);
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Бронь не найдена" });

  let input;
  try {
    input = bookingSchema.parse(await readBody(event));
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Проверьте поля брони: аудитория, курс, даты и дни недели" });
    }
    throw e;
  }

  await validateBookingInput(input);

  const booking = await withScheduleWriteLock(async () => {
    await assertBookingAllowed(input, id);
    return updateBooking(id, input);
  });
  if (!booking) throw createError({ statusCode: 404, statusMessage: "Бронь не найдена" });

  await logActivity(
    event,
    "UPDATE",
    "SCHEDULE",
    booking.id,
    `Бронь аудитории ${booking.classroomName}: ${booking.courseName}`,
    { before: existing, after: booking },
  );

  return { success: true, booking };
});
