/**
 * Генерация DOCX-документов аттестации: "Оценочный лист" (на инструктора)
 * и "Протокол проведения экзамена" (на группу), на основе шаблонов
 * server/assets/templates/attestation-*.docx (docxtemplater + pizzip).
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

import { storage } from "../utils/storage";
import { createFile } from "../repositories/fileRepository";
import {
  getAttestationGroupById,
  getGroupCommission,
  updateAttestationGroup,
} from "../repositories/attestationGroupRepository";
import { getInstructorById } from "../repositories/instructorRepository";
import {
  getGroupResults,
  ensureResultRow,
  setEvaluationSheetFile,
} from "../repositories/attestationResultRepository";
import { generateProtocolPdfBuffer } from "./attestationProtocolPdfService";

const TEMPLATES_DIR = path.join(process.cwd(), "server", "assets", "templates");

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function dateParts(date: Date | string | null | undefined) {
  const d = date ? new Date(date) : new Date();
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTHS_RU[d.getMonth()],
    year: String(d.getFullYear()),
  };
}

function decisionText(decision: string): string {
  if (decision === "passed") return "успешно сдавший сертификационный экзамен";
  if (decision === "failed") return "не сдавший сертификационный экзамен";
  return "результат ожидает решения комиссии";
}

async function renderTemplate(templateFile: string, data: Record<string, any>): Promise<Buffer> {
  const templatePath = path.join(TEMPLATES_DIR, templateFile);
  const content = await fs.readFile(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
}

function commissionByRole(commission: Awaited<ReturnType<typeof getGroupCommission>>) {
  const chairman = commission.find((c) => c.role === "chairman") || null;
  const secretary = commission.find((c) => c.role === "secretary") || null;
  const members = commission.filter((c) => c.role === "member");
  return { chairman, secretary, members };
}

function positionLabel(entry: { position: string | null; organization: string | null }) {
  return [entry.position, entry.organization].filter(Boolean).join(", ");
}

/**
 * Генерирует "Оценочный лист" для одного инструктора и сохраняет его в files
 */
export async function generateEvaluationSheet(groupId: string, instructorId: string, uploadedBy: string) {
  const result = await ensureResultRow(groupId, instructorId);

  const [group, instructor, commission] = await Promise.all([
    getAttestationGroupById(result.groupId),
    getInstructorById(result.instructorId),
    getGroupCommission(result.groupId),
  ]);

  if (!group) throw new Error("Группа аттестации не найдена");
  if (!instructor) throw new Error("Инструктор не найден");

  const { chairman, secretary, members } = commissionByRole(commission);
  const decided = dateParts(result.decidedAt);

  const buffer = await renderTemplate("attestation-evaluation-sheet.docx", {
    full_name: instructor.fullName,
    position: instructor.specialty || "инструктор-преподаватель",
    discipline_name: group.name,
    score_percent: result.scorePercent !== null ? result.scorePercent.toFixed(0) : "-",
    chairman_name: chairman?.fullName || "",
    decision_date: `${decided.day}.${(new Date(result.decidedAt || Date.now()).getMonth() + 1).toString().padStart(2, "0")}.${decided.year}`,
    commission_members: members.map((m, i) => ({ order: i + 1, full_name: m.fullName })),
    secretary_name: secretary?.fullName || "",
    decision_text: decisionText(result.decision),
    decision_day: decided.day,
    decision_month: decided.month,
    decision_year: decided.year,
  });

  const fileName = `Ocenochniy_list_${instructor.fullName.replace(/\s+/g, "_")}.docx`;
  const saved = await storage.save(
    {
      filename: fileName,
      data: buffer,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: buffer.length,
    },
    "attestation_document",
    result.groupId,
    undefined,
    { docType: "evaluation_sheet", groupId: result.groupId, instructorId: result.instructorId }
  );

  const fileRecord = await createFile({
    uuid: saved.uuid,
    filename: saved.filename,
    storedName: saved.storedName,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
    extension: saved.extension,
    storagePath: saved.storagePath,
    fullPath: saved.fullPath,
    category: "attestation_document",
    metadata: { docType: "evaluation_sheet", groupId: result.groupId, instructorId: result.instructorId },
    uploadedBy,
  });

  await setEvaluationSheetFile(result.id, fileRecord.id);

  return fileRecord;
}

/**
 * Генерирует "Ведомость проведения экзамена" (протокол) для группы в PDF
 * и сохраняет его в files
 */
export async function generateProtocol(groupId: string, uploadedBy: string) {
  const group = await getAttestationGroupById(groupId);
  if (!group) throw new Error("Группа аттестации не найдена");

  const [commission, results] = await Promise.all([
    getGroupCommission(groupId),
    getGroupResults(groupId),
  ]);

  const buffer = await generateProtocolPdfBuffer({ group, commission, results });

  const fileName = `Vedomost_${group.code}.pdf`;
  const saved = await storage.save(
    {
      filename: fileName,
      data: buffer,
      mimeType: "application/pdf",
      size: buffer.length,
    },
    "attestation_document",
    groupId,
    undefined,
    { docType: "protocol", groupId }
  );

  const fileRecord = await createFile({
    uuid: saved.uuid,
    filename: saved.filename,
    storedName: saved.storedName,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
    extension: saved.extension,
    storagePath: saved.storagePath,
    fullPath: saved.fullPath,
    category: "attestation_document",
    metadata: { docType: "protocol", groupId },
    uploadedBy,
  });

  await updateAttestationGroup(groupId, { protocolFileId: fileRecord.id });

  return fileRecord;
}
