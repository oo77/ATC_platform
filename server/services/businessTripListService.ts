/**
 * «Xizmat safariga yuboriladigan tinglovchilar roʻyxati» — список слушателей группы,
 * направляемых в командировку, по образцу «Командировочные AB-APA-08PP.docx».
 *
 * Шаблон server/assets/templates/business-trip-template.docx (сделан из образца
 * скриптом scratch/make_business_trip_template.mjs) содержит метки:
 *  - {{GROUP}} — код группы, {{DATES}} — даты обучения («10-11.11.2026»);
 *  - две строки таблицы-образца с {{NAME}} / {{ORG}}: первая — с «xxx» во всех колонках
 *    документов, вторая — с «+» (подпись «Qabul qilindi» пустая).
 * Строка «xxx» ставится слушателям, которым командировка не оформляется: из Ташкента
 * (AP TASHKENT) и из АО «Uzbekistan Airports»; остальным — строка «+».
 * Номера строк — автонумерация Word из шаблона.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";

const TEMPLATE_PATH = path.join(process.cwd(), "server", "assets", "templates", "business-trip-template.docx");

export interface BusinessTripStudent {
  /** «Abbasov Jasurbek» — фамилия и имя */
  name: string;
  /** «TASHKENT», «BUKHARA», «UZBEKISTAN AIRPORTS» */
  org: string;
  /** true — командировка не оформляется («xxx») */
  local: boolean;
}

export interface BusinessTripModel {
  groupCode: string;
  /** «10-11.11.2026» */
  dates: string;
  students: BusinessTripStudent[];
}

interface GroupRow extends RowDataPacket {
  code: string;
  start_date: string;
  end_date: string;
}

interface StudentRow extends RowDataPacket {
  full_name: string;
  org_code: string | null;
  org_name: string | null;
  org_name_en: string | null;
  org_text: string | null;
}

const collapse = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** «ABBASOV JASURBEK RAVSHANBEK O‘G‘LI» → «Abbasov Jasurbek» */
export function surnameAndName(fullName: string): string {
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  return collapse(fullName).split(" ").slice(0, 2).map(cap).join(" ");
}

/**
 * Подпись организации: «AP BUKHARA» → «BUKHARA»; у остальных убираются правовые формы
 * и кавычки: «АО UZBEKISTAN AIRPORTS» → «UZBEKISTAN AIRPORTS».
 */
export function orgLabel(name: string): string {
  const s = collapse(name);
  if (/^AP\s+/i.test(s)) return s.replace(/^AP\s+/i, "").toUpperCase();
  return collapse(
    s
      .replace(/["«»“”„'`]/g, " ")
      .replace(/(^|\s)(АО|ООО|OOO|AO|AJ|MChJ|MCHJ|МЧЖ|LLC|JSC)(?=\s|$)/gi, " "),
  ).toUpperCase();
}

/** Ташкент (AP TASHKENT) и АО «Uzbekistan Airports» — без командировки */
export function isLocal(row: Pick<StudentRow, "org_code" | "org_name_en">, label: string): boolean {
  if (row.org_code === "ap_tashkent" || label === "TASHKENT") return true;
  if (/^UZBEKISTAN AIRPORTS JSC$/i.test(collapse(row.org_name_en))) return true;
  return label === "UZBEKISTAN AIRPORTS";
}

/** Даты обучения: «10-11.11.2026», «28.10-02.11.2026», «30.12.2026-02.01.2027», «10.11.2026» */
export function formatTripDates(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-");
  const [ey, em, ed] = end.split("-");
  if (start === end) return `${sd}.${sm}.${sy}`;
  if (sy !== ey) return `${sd}.${sm}.${sy}-${ed}.${em}.${ey}`;
  if (sm !== em) return `${sd}.${sm}-${ed}.${em}.${ey}`;
  return `${sd}-${ed}.${em}.${ey}`;
}

/** null — группа не найдена */
export async function loadBusinessTripModel(groupId: string): Promise<BusinessTripModel | null> {
  const groups = await executeQuery<GroupRow[]>(
    `SELECT TRIM(code) AS code,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
     FROM study_groups WHERE id = ? LIMIT 1`,
    [groupId],
  );
  const group = groups[0];
  if (!group) return null;

  const rows = await executeQuery<StudentRow[]>(
    `SELECT s.full_name, o.code AS org_code, o.name AS org_name, o.name_en AS org_name_en,
            s.organization AS org_text
     FROM study_group_students sgs
     JOIN students s ON s.id = sgs.student_id
     LEFT JOIN organizations o ON o.id = s.organization_id
     WHERE sgs.group_id = ?`,
    [groupId],
  );

  const students = rows
    .map((r) => {
      const org = orgLabel(r.org_name || r.org_text || "");
      return { name: surnameAndName(r.full_name), org, local: isLocal(r, org) };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  return { groupCode: group.code, dates: formatTripDates(group.start_date, group.end_date), students };
}

const escapeXml = (text: string) =>
  text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function templateError(problem: string): Error {
  return new Error(`Шаблон списка командированных (business-trip-template.docx): ${problem}`);
}

export async function renderBusinessTripDocx(model: BusinessTripModel): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");
  let xml = docFile.asText();

  const replaceOnce = (mark: string, value: string) => {
    if (!xml.includes(mark)) throw templateError(`нет метки ${mark}`);
    xml = xml.replace(mark, () => escapeXml(value));
  };
  replaceOnce("{{GROUP}}", `______${model.groupCode}____________`);
  replaceOnce("{{DATES}}", `________${model.dates}______________`);

  const rows = xml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? [];
  const samples = rows.filter((r) => r.includes("{{NAME}}"));
  const localRow = samples.find((r) => r.includes(">xxx<"));
  const tripRow = samples.find((r) => !r.includes(">xxx<"));
  if (!localRow || !tripRow || samples.length !== 2) throw templateError("нет строк-образцов {{NAME}}");

  const filled = model.students
    .map((s) =>
      (s.local ? localRow : tripRow)
        .replace("{{NAME}}", () => escapeXml(s.name))
        .replace("{{ORG}}", () => escapeXml(s.org)),
    )
    .join("");
  xml = xml.replace(localRow + tripRow, () => filled);
  if (xml.includes("{{NAME}}")) throw templateError("строки-образцы не заменены");

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
