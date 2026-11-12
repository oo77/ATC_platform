/**
 * POST /api/schedule/bookings
 * Забронировать аудиторию под курс (целыми днями).
 */

import { z } from "zod";
import { Permission, requirePermission } from "../../../utils/permissions";
import { logActivity } from "../../../utils/activityLogger";
import { withScheduleWriteLock } from "../../../utils/scheduleLock";
import {
  assertBookingAllowed,
  createBooking,
  validateBookingInput,
} from "../../../repositories/roomBookingRepository";
import { bookingSchema } from "../../../utils/roomBookingSchema";

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.SCHEDULE_CREATE);

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
    await assertBookingAllowed(input);
    return createBooking(input, ctx.userId);
  });

  await logActivity(
    event,
    "CREATE",
    "SCHEDULE",
    booking.id,
    `Бронь аудитории ${booking.classroomName}: ${booking.courseName}`,
    { booking },
  );

  return { success: true, booking };
});
