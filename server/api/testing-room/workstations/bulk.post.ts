/**
 * Добавить сразу несколько подключённых компьютеров с нумерацией по порядку IP
 * POST /api/testing-room/workstations/bulk  { ips: string[] }
 */
import { Permission, requirePermission } from "../../../utils/permissions";
import { compareIp, normalizeIp } from "../../../utils/testingRoomIp";
import { pushStationInfo } from "../../../utils/testingRoomHub";
import {
  createWorkstation,
  getNextWorkstationNumber,
  getWorkstationByIp,
} from "../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const body = await readBody<{ ips?: string[] }>(event);

  const ips = [...new Set((Array.isArray(body?.ips) ? body!.ips! : []).map(normalizeIp).filter(Boolean))]
    .filter((ip) => ip.length <= 64)
    .sort(compareIp);
  if (!ips.length) {
    throw createError({ statusCode: 400, message: "Нет IP-адресов для добавления" });
  }

  let number = await getNextWorkstationNumber();
  const created = [];
  for (const ip of ips) {
    if (await getWorkstationByIp(ip)) continue;
    const workstation = await createWorkstation({ number, name: `Компьютер ${number}`, ipAddress: ip });
    pushStationInfo(ip, workstation);
    created.push(workstation);
    number++;
  }
  return { success: true, created };
});
