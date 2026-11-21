/**
 * Показать номер компьютера крупно на его экране (проверка рассадки)
 * POST /api/testing-room/workstations/:id/identify
 */
import { Permission, requirePermission } from "../../../../utils/permissions";
import { sendToIp } from "../../../../utils/testingRoomHub";
import { getWorkstationById } from "../../../../repositories/testingRoomRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TESTS_ASSIGN);
  const workstation = await getWorkstationById(getRouterParam(event, "id")!);
  if (!workstation) throw createError({ statusCode: 404, message: "Компьютер не найден" });

  const sent = sendToIp(workstation.ipAddress, {
    type: "identify",
    number: workstation.number,
    name: workstation.name,
  });
  if (!sent) throw createError({ statusCode: 409, message: "Компьютер сейчас не подключён" });
  return { success: true };
});
