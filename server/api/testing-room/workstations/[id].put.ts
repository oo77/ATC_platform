/**
 * Изменить компьютер (номер, название, IP, активность)
 * PUT /api/testing-room/workstations/:id
 */
import { Permission, requirePermission } from "../../../utils/permissions";
import { normalizeIp } from "../../../utils/testingRoomIp";
import { pushStationInfo } from "../../../utils/testingRoomHub";
import {
  getWorkstationById,
  getWorkstationByIp,
  updateWorkstation,
} from "../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const id = getRouterParam(event, "id")!;
  const existing = await getWorkstationById(id);
  if (!existing) throw createError({ statusCode: 404, message: "Компьютер не найден" });

  const body = await readBody<{ number?: number; name?: string; ipAddress?: string; isActive?: boolean }>(event);
  const patch: Parameters<typeof updateWorkstation>[1] = {};

  if (body?.number !== undefined) {
    if (!Number.isInteger(body.number) || body.number < 1) {
      throw createError({ statusCode: 400, message: "Номер компьютера — целое число от 1" });
    }
    patch.number = body.number;
  }
  if (body?.name !== undefined) {
    const name = String(body.name).trim().slice(0, 100);
    if (!name) throw createError({ statusCode: 400, message: "Укажите название компьютера" });
    patch.name = name;
  }
  if (body?.ipAddress !== undefined) {
    const ip = normalizeIp(body.ipAddress);
    if (!ip || ip.length > 64) throw createError({ statusCode: 400, message: "Некорректный IP-адрес" });
    const other = await getWorkstationByIp(ip);
    if (other && other.id !== id) {
      throw createError({ statusCode: 409, message: `IP ${ip} уже закреплён за «${other.name}»` });
    }
    patch.ipAddress = ip;
  }
  if (body?.isActive !== undefined) patch.isActive = !!body.isActive;

  const workstation = await updateWorkstation(id, patch);
  if (patch.ipAddress && patch.ipAddress !== existing.ipAddress) {
    pushStationInfo(existing.ipAddress, null);
  }
  pushStationInfo(workstation!.ipAddress, workstation);
  return { success: true, workstation };
});
