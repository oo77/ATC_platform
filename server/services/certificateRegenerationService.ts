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
  resolveVariable,
  type VariableContext,
} from "../utils/pdfGenerator";
import { executeQuery } from "../utils/db";
import type { CertificateTemplateData } from "../types/certificate";

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
}

export class RegenerateError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

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

  const template = await getTemplateById(cert.templateId);
  if (!template) throw new RegenerateError("Шаблон сертификата удалён", 404);
  if (!template.templateData) {
    throw new RegenerateError(`Шаблон «${template.name}» не настроен`);
  }
  const templateData = template.templateData as CertificateTemplateData;

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
    snapshot.instructorId || fallbackInstructorId || null,
  );

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

  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  // Перезаписываем тот же файл, чтобы ссылка на PDF не менялась
  const pdfFilename = `${cert.certificateNumber.replace(/[\/\\:*?"<>|]/g, "_")}.pdf`;
  const pdfPath = path.join(GENERATED_DIR, pdfFilename);
  await generateCertificatePdf({ templateData, context, outputPath: pdfPath });
  const pdfUrl = `/storage/Certificates/${pdfFilename}`;
  await updateCertificateFiles(cert.id, pdfUrl, pdfUrl);

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
