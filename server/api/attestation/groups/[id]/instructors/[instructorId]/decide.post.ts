import { decideForInstructor } from "../../../../../../repositories/attestationResultRepository";
import { requirePermission } from "../../../../../../utils/permissions";
import { Permission } from "../../../../../../types/permissions";
import type { AttestationDecision } from "../../../../../../repositories/attestationResultRepository";

export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    const instructorId = getRouterParam(event, "instructorId");
    if (!groupId || !instructorId) return { success: false, message: "Не указаны параметры" };

    const body = await readBody<{ decision?: AttestationDecision; notes?: string }>(event);
    if (!body.decision || !["passed", "failed"].includes(body.decision)) {
      return { success: false, message: "Укажите решение комиссии (passed/failed)" };
    }

    const result = await decideForInstructor(groupId, instructorId, {
      decision: body.decision,
      decidedBy: context.userId,
      notes: body.notes?.trim() || null,
    });

    return { success: true, result };
  } catch (error) {
    console.error("Ошибка принятия решения комиссии:", error);
    return { success: false, message: "Ошибка при сохранении решения" };
  }
});
