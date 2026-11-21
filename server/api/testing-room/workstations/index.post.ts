/**
 * Добавить компьютер класса тестирования
 * POST /api/testing-room/workstations  { ipAddress, number?, name? }
 */
import { Permission, requirePermission } from "../../../utils/permissions";
import { normalizeIp } from "../../../utils/testingRoomIp";
import { pushStationInfo } from "../../../utils/testingRoomHub";
import {
  createWorkstation,
  getNextWorkstationNumber,
  getWorkstationByIp,
} from "../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const body = await readBody<{ ipAddress?: string; number?: number; name?: string }>(event);

  const ipAddress = normalizeIp(body?.ipAddress);
  if (!ipAddress || ipAddress.length > 64) {
    throw createError({ statusCode: 400, message: "Укажите IP-адрес компьютера" });
  }
  if (await getWorkstationByIp(ipAddress)) {
    throw createError({ statusCode: 409, message: `IP ${ipAddress} уже закреплён за другим компьютером` });
  }

  const number = Number.isInteger(body?.number) && body!.number! > 0 ? body!.number! : await getNextWorkstationNumber();
  const name = (body?.name || "").trim().slice(0, 100) || `Компьютер ${number}`;

  const workstation = await createWorkstation({ number, name, ipAddress });
  pushStationInfo(ipAddress, workstation);
  return { success: true, workstation };
});
