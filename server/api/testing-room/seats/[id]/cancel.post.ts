/**
 * Отменить посадку, пока слушатель ещё не вошёл
 * POST /api/testing-room/seats/:id/cancel
 */
import { Permission, requirePermission } from "../../../../utils/permissions";
import { notifyTestingRoomAdmins } from "../../../../utils/testingRoomHub";
import { closeSeat, getSeatById } from "../../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const seat = await getSeatById(getRouterParam(event, "id")!);
  if (!seat) throw createError({ statusCode: 404, message: "Посадка не найдена" });
  if (seat.status !== "pending") {
    throw createError({ statusCode: 409, message: "Слушатель уже вошёл в тест — освободите компьютер" });
  }
  await closeSeat(seat.id, "cancelled");
  notifyTestingRoomAdmins();
  return { success: true };
});
