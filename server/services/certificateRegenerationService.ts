/**
 * Перегенерация PDF уже выданного сертификата по текущей версии его шаблона.
 *
 * Номер, дата выдачи, срок действия и статус не меняются — перерисовывается
 * только файл. Шаблон берётся из issued_certificates.template_id (тот, что был
 * выбран при выдаче), поэтому правки в шаблоне попадают в сертификат.
 * Данные слушателя, курса и группы берутся актуальные; средний балл и даты
 * теории/практики — из снимка, сохранённого при выдаче.
 */

import * as fs from "fs";
import * as path from "path";
import type { RowDataPacket } from "mysql2/promise";
import {
  getIssuedCertificateById,
  getTemplateById,
  checkStudentEligibility,
  updateCertificateFiles,
  updateCertificateVariablesData,
} from "../repositories/certificateTemplateRepository";
import { getGroupById } from "../repositories/groupRepository";
import { getStudentById } from "../repositories/studentRepository";
import {
  generateCertificatePdf,
  generateCertificatePdfBuffer,
  resolveVariable,
  type VariableContext,
} from "../utils/pdfGenerator";
import { executeQuery } from "../utils/db";
import type { CertificateTemplate, CertificateTemplateData } from "../types/certificate";
import {
  computeTemplateRenderHash,
  templateUsesInstructor,
} from "../utils/templateRenderHash";

const GENERATED_DIR = path.join(process.cwd(), "storage", "Certificates");

interface InstructorRow extends RowDataPacket {
  id: string;
  full_name: string;
  short_name_ru: string | null;
  short_name_uz: string | null;
}

export interface RegenerateResult {
  certificateId: string;
  certificateNumber: string;
  studentName: string;
  templateName: string;
  pdfUrl: string;
  /** Только для dryRun: сгенерированный PDF, на диск и в БД ничего не пишется */
  pdfBuffer?: Buffer;
}

export interface RegenerateOptions {
  /** Уже загруженный шаблон (массовая перегенерация: одна версия на весь прогон) */
  template?: CertificateTemplate;
  /** Не перерисовывать, если шаблону нужен инструктор, а его негде взять */
  requireInstructor?: boolean;
  /**
   * Явно заменить инструктора в снимке этим значением (включая null — убрать
   * инструктора), а не только подставлять fallbackInstructorId при его
   * отсутствии в снимке
   */
  overrideInstructorId?: string | null;
  /** Сгенерировать PDF в память, ничего не сохраняя */
  dryRun?: boolean;
  /** Папка, куда скопировать прежний PDF перед заменой */
  backupDir?: string;
}

export class RegenerateError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

/** Сертификат намеренно пропущен (не ошибка): данных для безопасной перерисовки нет */
export class RegenerateSkip extends RegenerateError {}

/** "DD.MM.YYYY" из снимка → "YYYY-MM-DD" для контекста */
function snapshotDateToInput(value: string | undefined): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function loadInstructor(instructorId: string | null | undefined) {
  if (!instructorId) return null;
  const rows = await executeQuery<InstructorRow[]>(
    `SELECT id, full_name, short_name_ru, short_name_uz FROM instructors WHERE id = ? LIMIT 1`,
    [instructorId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    shortNameRu: row.short_name_ru,
    shortNameUz: row.short_name_uz,
    position: null,
  };
}

/**
 * @param fallbackInstructorId инструктор для сертификатов, выданных до того,
 *   как его стали сохранять в снимке
 */
export async function regenerateIssuedCertificatePdf(
  certificateId: string,
  fallbackInstructorId?: string | null,
  opts: RegenerateOptions = {},
): Promise<RegenerateResult> {
  const cert = await getIssuedCertificateById(certificateId);
  if (!cert) throw new RegenerateError("Сертификат не найден", 404);
  if (cert.status !== "issued") {
    throw new RegenerateError("Перегенерировать можно только выданный сертификат");
  }
  if (cert.sourceType !== "group_journal" || !cert.groupId || !cert.studentId) {
    throw new RegenerateError(
      "Перегенерация доступна только для сертификатов, выданных из журнала группы",
    );
  }
  if (!cert.templateId) {
    throw new RegenerateError("У сертификата не сохранён шаблон");
  }

  const template = opts.template ?? (await getTemplateById(cert.templateId));
  if (!template) throw new RegenerateError("Шаблон сертификата удалён", 404);
  if (!template.templateData) {
    throw new RegenerateError(`Шаблон «${template.name}» не настроен`);
  }
  const templateData = template.templateData as CertificateTemplateData;
  if (opts.template && template.id !== cert.templateId) {
    throw new RegenerateError("Сертификат выдан по другому шаблону");
  }

  const [group, student] = await Promise.all([
    getGroupById(cert.groupId),
    getStudentById(cert.studentId),
  ]);
  if (!group) throw new RegenerateError("Группа не найдена", 404);
  if (!student) throw new RegenerateError("Слушатель не найден", 404);

  const snapshot: Record<string, string> = { ...(cert.variablesData || {}) };

  // Средний балл — из снимка; у старых сертификатов без снимка считаем заново
  let averageScore: number | null;
  if (snapshot.averageScore !== undefined) {
    const parsed = Number(snapshot.averageScore);
    averageScore =
      snapshot.averageScore !== "" && Number.isFinite(parsed) ? parsed : null;
  } else {
    averageScore = (await checkStudentEligibility(student.id, group.id))
      .averageGrade;
  }

  const instructor = await loadInstructor(
    opts.overrideInstructorId !== undefined
      ? opts.overrideInstructorId
      : snapshot.instructorId || fallbackInstructorId || null,
  );
  // Если инструктора нет, перерисовка стёрла бы его с сертификата
  if (opts.requireInstructor && !instructor && templateUsesInstructor(templateData)) {
    throw new RegenerateSkip(
      "В снимке сертификата нет инструктора — перерисовка стёрла бы его подпись",
    );
  }

  const context: VariableContext = {
    student: {
      id: student.id,
      fullName: student.fullName,
      organization: student.organization,
      organizationUz: student.organizationUz,
      organizationEn: student.organizationEn,
      organizationRu: student.organizationRu,
      position: student.position,
      department: student.department || null,
      pinfl: student.pinfl,
      averageScore,
    },
    course: {
      id: group.course?.id || "",
      name: group.course?.name || "",
      shortName: group.course?.shortName || "",
      code: group.course?.code || "",
      totalHours: group.course?.totalHours || 0,
    },
    group: {
      id: group.id,
      code: group.code,
      startDate: group.startDate,
      endDate: group.endDate,
      classroom: group.classroom,
    },
    certificate: {
      number: cert.certificateNumber,
      issueDate: new Date(cert.issueDate),
      verificationUrl: `${process.env.APP_URL || "https://atc.uz"}/verify/${cert.certificateNumber}`,
      theoryDate: snapshotDateToInput(snapshot.theoryDate),
      practiceDate: snapshotDateToInput(snapshot.practiceDate),
    },
    instructor,
  };

  const pdfFilename = `${cert.certificateNumber.replace(/[\/\\:*?"<>|]/g, "_")}.pdf`;
  const pdfUrl = `/storage/Certificates/${pdfFilename}`;

  if (opts.dryRun) {
    const pdfBuffer = await generateCertificatePdfBuffer(templateData, context);
    return {
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      studentName: student.fullName,
      templateName: template.name,
      pdfUrl,
      pdfBuffer,
    };
  }

  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  // Перезаписываем тот же файл, чтобы ссылка на PDF не менялась. Сначала
  // пишем во временный файл и подменяем атомарно: сбой посреди генерации
  // не оставит битый PDF вместо рабочего
  const pdfPath = path.join(GENERATED_DIR, pdfFilename);
  const tmpPath = `${pdfPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await generateCertificatePdf({ templateData, context, outputPath: tmpPath });
    if (opts.backupDir && fs.existsSync(pdfPath)) {
      fs.mkdirSync(opts.backupDir, { recursive: true });
      fs.copyFileSync(pdfPath, path.join(opts.backupDir, pdfFilename));
    }
    fs.renameSync(tmpPath, pdfPath);
  } finally {
    if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
  }
  await updateCertificateFiles(
    cert.id,
    pdfUrl,
    pdfUrl,
    computeTemplateRenderHash(templateData),
  );

  // Дополняем снимок, чтобы следующая перегенерация дала тот же результат
  await updateCertificateVariablesData(cert.id, {
    ...snapshot,
    studentName: student.fullName,
    courseName: group.course?.name || "",
    certificateNumber: cert.certificateNumber,
    averageScore: resolveVariable("student.averageScore", context),
    issueDateEn: resolveVariable("certificate.issueDateEn", context),
    theoryDate: resolveVariable("certificate.theoryDate", context),
    practiceDate: resolveVariable("certificate.practiceDate", context),
    instructorId: instructor?.id || "",
  });

  return {
    certificateId: cert.id,
    certificateNumber: cert.certificateNumber,
    studentName: student.fullName,
    templateName: template.name,
    pdfUrl,
  };
}
