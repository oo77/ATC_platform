import { getCommissionMembers } from "../../../repositories/commissionMemberRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const query = getQuery(event);
    const includeInactive = query.includeInactive !== "false";
    const members = await getCommissionMembers(includeInactive);
    return { success: true, members };
  } catch (error) {
    console.error("Ошибка получения членов комиссии:", error);
    return { success: false, message: "Ошибка при получении списка комиссии" };
  }
});
