/**
 * GET /api/certificates/templates/[id]/stats
 * Статистика выданных по шаблону сертификатов и состояние «актуальности» PDF.
 */
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { getTemplateById } from "../../../../repositories/certificateTemplateRepository";
import { getTemplateStats } from "../../../../services/templateStatsService";
import { computeTemplateRenderHash, templateUsesInstructor } from "../../../../utils/templateRenderHash";
import { getActiveJob, getLatestJobForTemplate } from "../../../../services/templateRegenerationJobs";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TEMPLATES_VIEW); // было CERTIFICATES_VIEW — оно есть и у слушателя
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID шаблона обязателен" });

  const template = await getTemplateById(id);
  if (!template) throw createError({ statusCode: 404, message: "Шаблон не найден" });

  const hash = template.templateData ? computeTemplateRenderHash(template.templateData) : null;
  const data = await getTemplateStats(id, hash);
  const active = getActiveJob();
  const latest = getLatestJobForTemplate(id);

  return {
    success: true,
    data: {
      ...data,
      template: {
        configured: !!template.templateData,
        usesInstructor: template.templateData ? templateUsesInstructor(template.templateData) : false,
      },
      // Идёт ли прогон (глобально — одновременно допустим только один)
      activeJobId: active?.id ?? null,
      activeJobTemplate: active ? { id: active.templateId, name: active.templateName } : null,
      latestJobId: latest?.id ?? null,
    },
  };
});
