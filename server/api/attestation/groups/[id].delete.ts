import { deleteAttestationGroup } from "../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID не указан" };

    const deleted = await deleteAttestationGroup(id);
    if (!deleted) return { success: false, message: "Группа не найдена" };

    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления группы аттестации:", error);
    return { success: false, message: "Ошибка при удалении группы аттестации" };
  }
});
