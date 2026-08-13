import { getGroupResults } from "../../../../repositories/attestationResultRepository";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_VIEW);

  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) return { success: false, message: "ID группы не указан" };

    const results = await getGroupResults(groupId);
    return { success: true, results };
  } catch (error) {
    console.error("Ошибка получения результатов группы:", error);
    return { success: false, message: "Ошибка при получении результатов" };
  }
});
