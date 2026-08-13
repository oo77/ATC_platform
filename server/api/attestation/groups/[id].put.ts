import { updateAttestationGroup } from "../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import type { AttestationGroupStatus } from "../../../repositories/attestationGroupRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID не указан" };

    const body = await readBody<{
      name?: string;
      description?: string | null;
      status?: AttestationGroupStatus;
      location?: string | null;
      responsiblePerson?: string | null;
    }>(event);

    const group = await updateAttestationGroup(id, body);
    if (!group) return { success: false, message: "Группа не найдена" };

    return { success: true, group };
  } catch (error) {
    console.error("Ошибка обновления группы аттестации:", error);
    return { success: false, message: "Ошибка при обновлении группы аттестации" };
  }
});
