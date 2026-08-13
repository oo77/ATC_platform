/**
 * Журнал аттестации — сводная таблица по всем группам/инструкторам
 * GET /api/attestation/journal
 */

import { getAttestationJournal } from "../../repositories/attestationResultRepository";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import type { AttestationDecision } from "../../repositories/attestationResultRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_VIEW);

  try {
    const query = getQuery(event);
    const items = await getAttestationJournal({
      groupId: (query.groupId as string) || undefined,
      decision: (query.decision as AttestationDecision) || undefined,
    });
    return { success: true, items };
  } catch (error) {
    console.error("Ошибка получения журнала аттестации:", error);
    return { success: false, message: "Ошибка при получении журнала", items: [] };
  }
});
