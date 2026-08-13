import { scheduleAttestationGroup } from "../../../../repositories/attestationGroupRepository";
import { getTestTemplateById } from "../../../../repositories/testTemplateRepository";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) return { success: false, message: "ID группы не указан" };

    const body = await readBody<{
      testTemplateId?: string;
      examStart?: string;
      examEnd?: string;
      location?: string;
    }>(event);

    if (!body.testTemplateId || !body.examStart || !body.examEnd) {
      return { success: false, message: "Тест, дата начала и окончания обязательны" };
    }

    const template = await getTestTemplateById(body.testTemplateId);
    if (!template) return { success: false, message: "Шаблон теста не найден" };

    const examStart = new Date(body.examStart);
    const examEnd = new Date(body.examEnd);
    if (examEnd <= examStart) {
      return { success: false, message: "Дата окончания должна быть позже даты начала" };
    }

    const group = await scheduleAttestationGroup(groupId, {
      testTemplateId: body.testTemplateId,
      examStart,
      examEnd,
      location: body.location?.trim() || null,
    });

    if (!group) return { success: false, message: "Группа не найдена" };

    return { success: true, group };
  } catch (error) {
    console.error("Ошибка назначения расписания:", error);
    return { success: false, message: "Ошибка при назначении расписания" };
  }
});
