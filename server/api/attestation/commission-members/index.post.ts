import { createCommissionMember } from "../../../repositories/commissionMemberRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const body = await readBody<{
      fullName?: string;
      position?: string;
      organization?: string;
    }>(event);

    if (!body.fullName?.trim()) {
      return { success: false, message: "Ф.И.О. обязательно" };
    }

    const member = await createCommissionMember({
      fullName: body.fullName.trim(),
      position: body.position?.trim() || null,
      organization: body.organization?.trim() || null,
    });

    return { success: true, member };
  } catch (error) {
    console.error("Ошибка создания члена комиссии:", error);
    return { success: false, message: "Ошибка при создании члена комиссии" };
  }
});
