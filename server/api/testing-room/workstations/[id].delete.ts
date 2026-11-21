/**
 * Удалить компьютер из класса
 * DELETE /api/testing-room/workstations/:id
 */
import { Permission, requirePermission } from "../../../utils/permissions";
import { notifyTestingRoomAdmins, pushStationInfo } from "../../../utils/testingRoomHub";
import {
  deleteWorkstation,
  getActiveSeatForWorkstation,
  getWorkstationById,
} from "../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const id = getRouterParam(event, "id")!;
  const workstation = await getWorkstationById(id);
  if (!workstation) throw createError({ statusCode: 404, message: "Компьютер не найден" });

  const seat = await getActiveSeatForWorkstation(id);
  if (seat?.status === "claimed") {
    throw createError({ statusCode: 409, message: "За компьютером сейчас сдают тест — сначала освободите его" });
  }

  await deleteWorkstation(id);
  pushStationInfo(workstation.ipAddress, null);
  notifyTestingRoomAdmins();
  return { success: true };
});
