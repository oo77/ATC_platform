import {
  getAttestationGroupById,
  getGroupInstructors,
  getGroupCommission,
} from "../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_VIEW);

  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID не указан" };

    const group = await getAttestationGroupById(id);
    if (!group) return { success: false, message: "Группа не найдена" };

    const [instructors, commission] = await Promise.all([
      getGroupInstructors(id),
      getGroupCommission(id),
    ]);

    return { success: true, group, instructors, commission };
  } catch (error) {
    console.error("Ошибка получения группы аттестации:", error);
    return { success: false, message: "Ошибка при получении группы аттестации" };
  }
});
