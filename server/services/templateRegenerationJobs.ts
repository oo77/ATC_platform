/**
 * Фоновая массовая перерисовка PDF выданных сертификатов шаблона.
 *
 * Принципы безопасности:
 *  - один активный прогон на весь сервер (pdf-lib грузит CPU, а параллельная
 *    запись одних и тех же файлов опасна);
 *  - шаблон читается один раз при старте — все PDF прогона одной версии;
 *  - прежний PDF копируется в storage/Certificates/_backup/<jobId>/;
 *  - сертификат без данных для безопасной перерисовки пропускается, а не портится;
 *  - состояние хранится в памяти: после рестарта сервера прогон прерывается,
 *    уже перерисованные файлы остаются корректными, прогон можно запустить заново.
 */

import * as path from "path";
import { getTemplateById } from "../repositories/certificateTemplateRepository";
import {
  regenerateIssuedCertificatePdf,
  RegenerateSkip,
} from "./certificateRegenerationService";
import { listRegenerableCertificateIds, type RegenerateScope } from "./templateStatsService";
import { computeTemplateRenderHash } from "../utils/templateRenderHash";
import { logActivityDirect } from "../utils/activityLogger";
import { executeQuery } from "../utils/db";

export interface JobIssue {
  certificateId: string;
  certificateNumber?: string;
  studentName?: string;
  reason: string;
}

export interface RegenerationJob {
  id: string;
  templateId: string;
  templateName: string;
  scope: RegenerateScope;
  status: "running" | "completed" | "cancelled" | "failed";
  total: number;
  processed: number;
  succeeded: number;
  skipped: JobIssue[];
  failed: JobIssue[];
  startedAt: Date;
  finishedAt: Date | null;
  startedBy: string | null;
  backupDir: string;
  cancelRequested: boolean;
  error?: string;
}

const jobs = new Map<string, RegenerationJob>();
const MAX_ISSUES_KEPT = 200;
const JOB_TTL_MS = 6 * 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, j] of jobs) {
    if (j.finishedAt && now - j.finishedAt.getTime() > JOB_TTL_MS) jobs.delete(id);
  }
}

export function getActiveJob(): RegenerationJob | null {
  for (const j of jobs.values()) if (j.status === "running") return j;
  return null;
}

export function getJob(id: string): RegenerationJob | null {
  return jobs.get(id) || null;
}

export function getLatestJobForTemplate(templateId: string): RegenerationJob | null {
  let latest: RegenerationJob | null = null;
  for (const j of jobs.values()) {
    if (j.templateId === templateId && (!latest || j.startedAt > latest.startedAt)) latest = j;
  }
  return latest;
}

export function cancelJob(id: string): boolean {
  const j = jobs.get(id);
  if (!j || j.status !== "running") return false;
  j.cancelRequested = true;
  return true;
}

export class JobStartError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export async function startRegenerationJob(params: {
  templateId: string;
  scope: RegenerateScope;
  fallbackInstructorId?: string | null;
  userId: string | null;
}): Promise<RegenerationJob> {
  cleanup();
  const active = getActiveJob();
  if (active) {
    throw new JobStartError(
      `Уже идёт перерисовка шаблона «${active.templateName}» (${active.processed}/${active.total}). Дождитесь завершения.`,
      409,
    );
  }

  const template = await getTemplateById(params.templateId);
  if (!template) throw new JobStartError("Шаблон не найден", 404);
  if (!template.templateData) throw new JobStartError("Шаблон не настроен в редакторе");

  const hash = computeTemplateRenderHash(template.templateData);
  const ids = await listRegenerableCertificateIds(template.id, params.scope, hash);
  if (ids.length === 0) throw new JobStartError("Нет сертификатов для перерисовки");

  const id = `regen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: RegenerationJob = {
    id,
    templateId: template.id,
    templateName: template.name,
    scope: params.scope,
    status: "running",
    total: ids.length,
    processed: 0,
    succeeded: 0,
    skipped: [],
    failed: [],
    startedAt: new Date(),
    finishedAt: null,
    startedBy: params.userId,
    backupDir: path.join(process.cwd(), "storage", "Certificates", "_backup", id),
    cancelRequested: false,
  };
  jobs.set(id, job);

  // Не ждём завершения — прогон идёт в фоне
  void run(job, template, ids, params.fallbackInstructorId ?? null);
  return job;
}

async function run(
  job: RegenerationJob,
  template: NonNullable<Awaited<ReturnType<typeof getTemplateById>>>,
  ids: string[],
  fallbackInstructorId: string | null,
) {
  try {
    for (const certId of ids) {
      if (job.cancelRequested) {
        job.status = "cancelled";
        break;
      }
      try {
        await regenerateIssuedCertificatePdf(certId, fallbackInstructorId, {
          template,
          requireInstructor: true,
          backupDir: job.backupDir,
        });
        job.succeeded++;
      } catch (e: any) {
        const issue: JobIssue = { certificateId: certId, reason: e?.message || "ошибка" };
        try {
          const [row] = await executeQuery<any[]>(
            `SELECT ic.certificate_number AS num, s.full_name AS name
             FROM issued_certificates ic LEFT JOIN students s ON ic.student_id = s.id WHERE ic.id = ? LIMIT 1`,
            [certId],
          );
          issue.certificateNumber = row?.num;
          issue.studentName = row?.name;
        } catch { /* не критично */ }
        const list = e instanceof RegenerateSkip ? job.skipped : job.failed;
        if (list.length < MAX_ISSUES_KEPT) list.push(issue);
      }
      job.processed++;
      // Отдаём event loop, чтобы сервер отвечал на другие запросы
      await new Promise((r) => setImmediate(r));
    }
    if (job.status === "running") job.status = "completed";
  } catch (e: any) {
    job.status = "failed";
    job.error = e?.message || "Неизвестная ошибка";
  } finally {
    job.finishedAt = new Date();
    try {
      if (job.startedBy) await logActivityDirect(
        job.startedBy,
        "UPDATE",
        "CERTIFICATE_TEMPLATE",
        job.templateId,
        `Массовая перерисовка сертификатов шаблона «${job.templateName}»`,
        {
          action: "bulk_regenerate_pdf",
          jobId: job.id,
          scope: job.scope,
          status: job.status,
          total: job.total,
          succeeded: job.succeeded,
          skipped: job.skipped.length,
          failed: job.failed.length,
          backupDir: job.backupDir,
        },
      );
    } catch {
      /* журнал не должен ломать прогон */
    }
  }
}
