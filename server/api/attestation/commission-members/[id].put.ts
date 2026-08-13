import { updateCommissionMember } from "../../../repositories/commissionMemberRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID не указан" };

    const body = await readBody<{
      fullName?: string;
      position?: string | null;
      organization?: string | null;
      isActive?: boolean;
    }>(event);

    const member = await updateCommissionMember(id, {
      fullName: body.fullName?.trim(),
      position: body.position !== undefined ? body.position?.trim() || null : undefined,
      organization: body.organization !== undefined ? body.organization?.trim() || null : undefined,
      isActive: body.isActive,
    });

    if (!member) return { success: false, message: "Член комиссии не найден" };

    return { success: true, member };
  } catch (error) {
    console.error("Ошибка обновления члена комиссии:", error);
    return { success: false, message: "Ошибка при обновлении члена комиссии" };
  }
});
