import {
  setGroupCommission,
  getGroupCommission,
  getAttestationGroupById,
} from "../../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import type { CommissionRole } from "../../../../repositories/attestationGroupRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) return { success: false, message: "ID группы не указан" };

    const group = await getAttestationGroupById(groupId);
    if (!group) return { success: false, message: "Группа не найдена" };

    const body = await readBody<{
      members?: Array<{ commissionMemberId: string; role: CommissionRole }>;
    }>(event);

    if (!body.members?.length) {
      return { success: false, message: "Комиссия не может быть пустой" };
    }

    const chairmanCount = body.members.filter((m) => m.role === "chairman").length;
    if (chairmanCount !== 1) {
      return { success: false, message: "В комиссии должен быть ровно один председатель" };
    }

    await setGroupCommission(groupId, body.members);
    const commission = await getGroupCommission(groupId);

    return { success: true, commission };
  } catch (error) {
    console.error("Ошибка назначения комиссии:", error);
    return { success: false, message: "Ошибка при назначении комиссии" };
  }
});
