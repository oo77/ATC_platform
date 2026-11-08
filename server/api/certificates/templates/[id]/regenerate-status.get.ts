/**
 * GET /api/certificates/templates/[id]/regenerate-status?jobId=
 * Прогресс фоновой перерисовки (без jobId — последний прогон шаблона).
 */
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { getJob, getLatestJobForTemplate } from "../../../../services/templateRegenerationJobs";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.TEMPLATES_VIEW); // было CERTIFICATES_VIEW — оно есть и у слушателя
  const id = getRouterParam(event, "id")!;
  const jobId = getQuery(event).jobId as string | undefined;
  const job = jobId ? getJob(jobId) : getLatestJobForTemplate(id);
  if (!job || job.templateId !== id) return { success: true, data: null };
  return {
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      scope: job.scope,
      total: job.total,
      processed: job.processed,
      succeeded: job.succeeded,
      skipped: job.skipped,
      failed: job.failed,
      cancelRequested: job.cancelRequested,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      error: job.error ?? null,
    },
  };
});
