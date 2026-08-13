import { removeInstructorFromGroup } from "../../../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../../../utils/permissions";
import { Permission } from "../../../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    const instructorId = getRouterParam(event, "instructorId");
    if (!groupId || !instructorId) {
      return { success: false, message: "Не указаны параметры" };
    }

    const removed = await removeInstructorFromGroup(groupId, instructorId);
    if (!removed) return { success: false, message: "Инструктор не найден в группе" };

    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления инструктора из группы:", error);
    return { success: false, message: "Ошибка при удалении инструктора" };
  }
});
