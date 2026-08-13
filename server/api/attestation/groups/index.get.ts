import { getAttestationGroups } from "../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import type { AttestationGroupStatus } from "../../../repositories/attestationGroupRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_VIEW);

  try {
    const query = getQuery(event);
    const groups = await getAttestationGroups({
      status: (query.status as AttestationGroupStatus) || undefined,
      search: (query.search as string) || undefined,
    });
    return { success: true, groups };
  } catch (error) {
    console.error("Ошибка получения групп аттестации:", error);
    return { success: false, message: "Ошибка при получении групп аттестации" };
  }
});
