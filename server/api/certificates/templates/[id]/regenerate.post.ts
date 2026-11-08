/**
 * POST /api/certificates/templates/[id]/regenerate
 * Запустить фоновую перерисовку PDF выданных по шаблону сертификатов.
 * Body: { scope: 'outdated' | 'all', instructorId?: string | null, confirm: true }
 */
import { z } from "zod";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { startRegenerationJob, JobStartError } from "../../../../services/templateRegenerationJobs";

const bodySchema = z.object({
  scope: z.enum(["outdated", "all"]).default("outdated"),
  instructorId: z.string().uuid().nullable().optional(),
  confirm: z.literal(true),
});

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID шаблона обязателен" });
  const body = bodySchema.safeParse(await readBody(event).catch(() => null));
  if (!body.success) throw createError({ statusCode: 400, message: "Требуется явное подтверждение (confirm: true)" });

  try {
    const job = await startRegenerationJob({
      templateId: id,
      scope: body.data.scope,
      fallbackInstructorId: body.data.instructorId ?? null,
      userId: ctx.userId,
    });
    return { success: true, data: { jobId: job.id, total: job.total } };
  } catch (e: any) {
    if (e instanceof JobStartError) throw createError({ statusCode: e.statusCode, message: e.message });
    console.error("[templates/regenerate]", e);
    throw createError({ statusCode: 500, message: e.message || "Не удалось запустить перерисовку" });
  }
});
