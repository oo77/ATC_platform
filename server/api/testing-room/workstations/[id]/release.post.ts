/**
 * Освободить компьютер: снять посадку и вернуть компьютер к ожиданию
 * POST /api/testing-room/workstations/:id/release
 *
 * Пока слушатель сдаёт тест, освободить нельзя — иначе тест оборвётся.
 */
import { Permission, requirePermission } from "../../../../utils/permissions";
import { notifyTestingRoomAdmins, sendToIp } from "../../../../utils/testingRoomHub";
import {
  closeSeat,
  getActiveSeatForWorkstation,
  getSeatDetailsById,
  getWorkstationById,
} from "../../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const workstation = await getWorkstationById(getRouterParam(event, "id")!);
  if (!workstation) throw createError({ statusCode: 404, message: "Компьютер не найден" });

  const seat = await getActiveSeatForWorkstation(workstation.id);
  if (seat) {
    const details = await getSeatDetailsById(seat.id);
    if (seat.status === "claimed" && details?.sessionStatus === "in_progress") {
      throw createError({
        statusCode: 409,
        message: `${details.studentName} ещё сдаёт тест — дождитесь завершения`,
      });
    }
    await closeSeat(seat.id, seat.status === "pending" ? "cancelled" : "released");
  }

  sendToIp(workstation.ipAddress, { type: "release" });
  notifyTestingRoomAdmins();
  return { success: true };
});
