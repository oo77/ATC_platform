/**
 * Состояние класса тестирования для экрана администратора
 * GET /api/testing-room/state
 *
 * workstations — зарегистрированные компьютеры: онлайн ли, кто сейчас за ним
 * unregistered — подключённые IP, которые ещё не названы компьютерами
 */
import { Permission, requirePermission } from "../../utils/permissions";
import { getPresence } from "../../utils/testingRoomHub";
import { isPrivateIp } from "../../utils/testingRoomIp";
import { getActiveSeatsWithDetails, listWorkstations } from "../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);

  const [workstations, seats] = await Promise.all([listWorkstations(), getActiveSeatsWithDetails()]);
  const presence = getPresence();
  const presenceByIp = new Map(presence.map((d) => [d.ip, d]));
  const registeredIps = new Set(workstations.map((w) => w.ipAddress));

  return {
    success: true,
    serverTime: Date.now(),
    presence,
    workstations: workstations.map((w) => ({
      ...w,
      device: presenceByIp.get(w.ipAddress) || null,
      seat: seats.find((s) => s.workstationId === w.id) || null,
    })),
    unregistered: presence
      .filter((d) => !registeredIps.has(d.ip))
      .map((d) => ({ ...d, isLocal: isPrivateIp(d.ip) })),
  };
});
