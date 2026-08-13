import { deleteCommissionMember } from "../../../repositories/commissionMemberRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID не указан" };

    const deleted = await deleteCommissionMember(id);
    if (!deleted) return { success: false, message: "Член комиссии не найден" };

    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления члена комиссии:", error);
    return { success: false, message: "Ошибка при удалении члена комиссии" };
  }
});
