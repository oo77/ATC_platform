/**
 * POST /api/certificates/templates/[id]/regenerate-preview
 * Пробная перерисовка ОДНОГО сертификата в памяти (в БД и на диск ничего не пишется),
 * чтобы увидеть результат до массового запуска.
 * Body: { certificateId?: string, instructorId?: string | null }
 */
import { z } from "zod";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { getTemplateById } from "../../../../repositories/certificateTemplateRepository";
import { regenerateIssuedCertificatePdf, RegenerateError } from "../../../../services/certificateRegenerationService";
import { listRegenerableCertificateIds } from "../../../../services/templateStatsService";
import { computeTemplateRenderHash } from "../../../../utils/templateRenderHash";

const bodySchema = z.object({
  certificateId: z.string().uuid().optional(),
  instructorId: z.string().uuid().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID шаблона обязателен" });
  const body = bodySchema.safeParse((await readBody(event).catch(() => null)) || {});
  if (!body.success) throw createError({ statusCode: 400, message: "Некорректные параметры" });

  const template = await getTemplateById(id);
  if (!template) throw createError({ statusCode: 404, message: "Шаблон не найден" });
  if (!template.templateData) throw createError({ statusCode: 400, message: "Шаблон не настроен" });

  let certId = body.data.certificateId;
  if (!certId) {
    const ids = await listRegenerableCertificateIds(id, "all", computeTemplateRenderHash(template.templateData));
    certId = ids[ids.length - 1]; // самый свежий
  }
  if (!certId) throw createError({ statusCode: 400, message: "Нет сертификатов для пробной перерисовки" });

  try {
    const r = await regenerateIssuedCertificatePdf(certId, body.data.instructorId, {
      template,
      dryRun: true,
    });
    return {
      success: true,
      data: {
        certificateId: r.certificateId,
        certificateNumber: r.certificateNumber,
        studentName: r.studentName,
        pdfBase64: r.pdfBuffer!.toString("base64"),
      },
    };
  } catch (e: any) {
    if (e instanceof RegenerateError) throw createError({ statusCode: e.statusCode, message: e.message });
    console.error("[regenerate-preview]", e);
    throw createError({ statusCode: 500, message: e.message || "Ошибка пробной перерисовки" });
  }
});
