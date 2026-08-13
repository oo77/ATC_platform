import { setCertificateTemplate, getAttestationGroupById } from "../../../../repositories/attestationGroupRepository";
import { getTemplateById } from "../../../../repositories/certificateTemplateRepository";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) return { success: false, message: "ID группы не указан" };

    const group = await getAttestationGroupById(groupId);
    if (!group) return { success: false, message: "Группа не найдена" };

    const body = await readBody<{ certificateTemplateId?: string | null }>(event);

    if (body.certificateTemplateId) {
      const template = await getTemplateById(body.certificateTemplateId);
      if (!template) return { success: false, message: "Шаблон сертификата не найден" };
    }

    const updated = await setCertificateTemplate(groupId, body.certificateTemplateId || null);
    return { success: true, group: updated };
  } catch (error) {
    console.error("Ошибка назначения шаблона сертификата:", error);
    return { success: false, message: "Ошибка при назначении шаблона сертификата" };
  }
});
