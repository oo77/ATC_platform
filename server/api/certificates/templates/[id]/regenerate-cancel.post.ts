/**
 * POST /api/certificates/templates/[id]/regenerate-cancel
 * Body: { jobId } — остановить прогон после текущего сертификата.
 * Уже перерисованные PDF остаются (они корректны).
 */
import { z } from "zod";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { cancelJob, getJob } from "../../../../services/templateRegenerationJobs";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const id = getRouterParam(event, "id")!;
  const body = z.object({ jobId: z.string() }).safeParse(await readBody(event).catch(() => null));
  if (!body.success) throw createError({ statusCode: 400, message: "jobId обязателен" });
  const job = getJob(body.data.jobId);
  if (!job || job.templateId !== id) throw createError({ statusCode: 404, message: "Прогон не найден" });
  return { success: true, cancelled: cancelJob(job.id) };
});
