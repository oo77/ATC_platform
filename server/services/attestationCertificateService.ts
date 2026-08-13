/**
 * Автоматическая выдача сертификата инструктору по итогам аттестации.
 * Переиспользует существующую систему сертификатов (шаблоны, нумерация,
 * PDF-генератор, верификация) — просто заполняет VariableContext данными
 * аттестации вместо данных студента.
 */

import path from "path";
import {
  getTemplateById,
  generateCertificateNumber,
  createAttestationCertificate,
  updateCertificateFiles,
  getAttestationCertificate,
} from "../repositories/certificateTemplateRepository";
import { generateCertificatePdf } from "../utils/pdfGenerator";
import type { VariableContext } from "../utils/pdfGenerator";
import {
  getAttestationGroupById,
  getGroupCommission,
} from "../repositories/attestationGroupRepository";
import { getResultByGroupAndInstructor } from "../repositories/attestationResultRepository";
import { getInstructorById } from "../repositories/instructorRepository";

const GENERATED_DIR = path.join(process.cwd(), "storage", "Certificates");

/**
 * Если у группы назначен шаблон сертификата — выдаёт сертификат
 * инструктору. Вызывающий код должен перехватывать ошибки: провал выдачи
 * сертификата не должен блокировать решение комиссии.
 */
export async function issueAttestationCertificateIfConfigured(
  groupId: string,
  instructorId: string,
  issuedBy: string
): Promise<{ issued: boolean; reason?: string }> {
  const group = await getAttestationGroupById(groupId);
  if (!group?.certificateTemplateId) {
    return { issued: false, reason: "Группе не назначен шаблон сертификата" };
  }

  const existing = await getAttestationCertificate(groupId, instructorId);
  if (existing) {
    return { issued: false, reason: "Сертификат уже выдан" };
  }

  const template = await getTemplateById(group.certificateTemplateId);
  if (!template || !template.templateData) {
    return { issued: false, reason: "Шаблон сертификата не найден" };
  }

  const instructor = await getInstructorById(instructorId);
  if (!instructor) return { issued: false, reason: "Инструктор не найден" };

  const [result, commission] = await Promise.all([
    getResultByGroupAndInstructor(groupId, instructorId),
    getGroupCommission(groupId),
  ]);

  const chairman = commission.find((c) => c.role === "chairman") || null;
  const issueDate = new Date();

  const certificateNumber = await generateCertificateNumber(template.id, group.code);

  const context: VariableContext = {
    student: {
      id: instructor.id,
      fullName: instructor.fullName,
      organization: "",
      position: instructor.specialty || "",
      pinfl: "",
    },
    course: {
      id: group.id,
      name: group.name,
      shortName: group.name,
      code: group.code,
      totalHours: 0,
    },
    group: {
      id: group.id,
      code: group.code,
      startDate: group.examStart || issueDate,
      endDate: group.examEnd || issueDate,
      classroom: group.location,
    },
    certificate: {
      number: certificateNumber,
      issueDate,
      verificationUrl: `${process.env.APP_URL || "https://atc.uz"}/verify/${certificateNumber}`,
    },
    instructor: {
      id: instructor.id,
      fullName: instructor.fullName,
      position: instructor.specialty || null,
    },
    attestation: {
      examScore: result?.scorePercent ?? null,
      examDate: result?.decidedAt || issueDate,
      groupName: group.name,
      chairmanName: chairman?.fullName || null,
      chairmanPosition: [chairman?.position, chairman?.organization].filter(Boolean).join(", ") || null,
    },
  };

  const pdfFilename = `${certificateNumber.replace(/[\/\\:*?"<>|]/g, "_")}.pdf`;
  const pdfPath = path.join(GENERATED_DIR, pdfFilename);

  await generateCertificatePdf({
    templateData: template.templateData,
    context,
    outputPath: pdfPath,
  });

  const certificate = await createAttestationCertificate({
    attestationGroupId: groupId,
    instructorId,
    templateId: template.id,
    certificateNumber,
    issueDate,
    variablesData: {
      instructorName: instructor.fullName,
      groupName: group.name,
      examScore: result?.scorePercent != null ? String(result.scorePercent) : "",
    },
    issuedBy,
  });

  await updateCertificateFiles(certificate.id, `/storage/Certificates/${pdfFilename}`, `/storage/Certificates/${pdfFilename}`);

  return { issued: true };
}
