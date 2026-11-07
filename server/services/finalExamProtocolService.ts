/**
 * «Bayonnoma» — протокол заседания комиссии итогового экзамена (устный экзамен) учебной
 * группы, по образцу «Bayonnoma_AX-26-04_AB-APA-02PP.docx».
 *
 * Собирается из шаблона server/assets/templates/final-exam-protocol-template.docx правкой XML
 * «на месте» (pizzip), как и «Оценочные листы» (см. evaluationSheetsService.ts). Оформление
 * и постоянный текст — из шаблона; подставляются:
 *  - из базы: код группы, название программы (на узбекском, если оно задано), список
 *    слушателей в таблицу «Imtihon natijalari» и их число под таблицей;
 *  - из формы, которую пользователь заполняет перед скачиванием (FinalExamProtocolForm):
 *    дата и номер протокола, место, председательствующий, число членов комиссии, форма,
 *    время и место экзамена, велась ли видеозапись, приказ и состав комиссии.
 *
 * Места для значений ищутся по постоянным подписям шаблона («Raislik qiluvchi:»,
 * «komissiya raisi —», «Komissiya aʼzosi,» и т. д.); текст образца в них заменяется
 * с сохранением формата. Строка слушателя помечена в шаблоне жёлтым маркером.
 *
 * Страницы: первая — шапка, сведения об экзамене и состав комиссии; вторая начинается
 * с «Imtihon tasdiqlangan jadval…» и вмещает таблицу результатов на 20 слушателей вместе
 * со строкой «Roʻyxatga kiritilgan … nafar» под ней; дальше — решение и подписи комиссии
 * (см. «ВЁРСТКА СТРАНИЦ»).
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { MONTSERRAT_LINE, textWidth } from "../utils/montserratMetrics";
import { countWrappedLines, formatFullName } from "./evaluationSheetsService";
import type {
  FinalExamProtocolForm,
  FinalExamProtocolPerson,
} from "../../shared/utils/finalExamProtocol";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "final-exam-protocol-template.docx",
);

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface FinalExamProtocolModel {
  groupCode: string;
  /** Название программы группы (на узбекском, если оно задано в карточке программы) */
  courseName: string;
  /** ФИО слушателей полностью («Hamrayeva Sarvinoz Mansur qizi»), в алфавитном порядке */
  students: string[];
}

interface GroupRow extends RowDataPacket {
  code: string;
  course_name: string | null;
  course_name_uz: string | null;
}

interface StudentRow extends RowDataPacket {
  full_name: string | null;
}

const collapseSpaces = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

/** Собирает данные протокола. null — группа не найдена. */
export async function loadFinalExamProtocolModel(
  groupId: string,
): Promise<FinalExamProtocolModel | null> {
  const groupRows = await executeQuery<GroupRow[]>(
    `SELECT g.code, c.name AS course_name, c.name_uz AS course_name_uz
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = groupRows[0];
  if (!group) return null;

  const studentRows = await executeQuery<StudentRow[]>(
    `SELECT s.full_name
     FROM study_group_students sgs
     JOIN students s ON s.id = sgs.student_id
     WHERE sgs.group_id = ?
     ORDER BY s.full_name`,
    [groupId],
  );

  return {
    groupCode: group.code,
    courseName: collapseSpaces(group.course_name_uz) || collapseSpaces(group.course_name),
    students: studentRows.map((s) => formatFullName(s.full_name ?? "")).filter(Boolean),
  };
}

const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** «2026-10-08» → день «8-oktabr» и год «2026-yil» (в документе они стоят в разном порядке) */
export function uzbekDate(ymd: string): { day: string; year: string } {
  const [year, month, day] = ymd.split("-").map(Number);
  return { day: `${day}-${UZ_MONTHS[(month ?? 1) - 1]}`, year: `${year}-yil` };
}

// ============================================================================
// ПРАВКА XML
// ============================================================================

export const TABLE_RE = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
export const ROW_RE = /<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g;
export const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;
export const PARA_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
export const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
export const TEXT_RE = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;
/** Верхнего уровня: таблица целиком или абзац вне таблицы */
const BLOCK_RE = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;

export function templateError(problem: string): Error {
  return new Error(
    `Шаблон протокола (final-exam-protocol-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );
}

export function escapeXml(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const unescapeXml = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

export const textOf = (xml: string) =>
  Array.from(xml.matchAll(TEXT_RE), (m) => unescapeXml(m[1]!)).join("");

/** Подпись без пробелов, знаков и регистра: «Komissiya aʼzosi,» → «komissiyaazosi» */
export const labelKey = (text: string) => text.replace(/[^a-z]/gi, "").toLowerCase();

/**
 * Заменяет в абзаце фрагмент текста, найденный регулярным выражением по тексту всего
 * абзаца (в шаблоне он разбит на раны). Замена получает формат рана, в котором фрагмент
 * начинается; остальные раны и их формат не меняются.
 */
export function replaceText(p: string, pattern: RegExp, replacement: string, where: string): string {
  const texts = Array.from(p.matchAll(TEXT_RE), (m) => unescapeXml(m[1]!));
  const match = pattern.exec(texts.join(""));
  if (!match) throw templateError(`в «${where}» не найден текст образца`);
  const start = match.index;
  const end = start + match[0].length;

  let offset = 0;
  let inserted = false;
  const newTexts = texts.map((text) => {
    const from = offset;
    offset += text.length;
    if (offset <= start || from >= end) return text;
    const kept = text.slice(0, Math.max(0, start - from)) + text.slice(end - from);
    if (inserted) return kept;
    inserted = true;
    return text.slice(0, Math.max(0, start - from)) + replacement + text.slice(end - from);
  });

  let i = 0;
  return p.replace(TEXT_RE, () => `<w:t xml:space="preserve">${escapeXml(newTexts[i++]!)}</w:t>`);
}

/** Заменяет весь текст абзаца (формат — первого рана) */
export const setText = (p: string, text: string, where: string) =>
  replaceText(p, /^[\s\S]+$/, text, where);

/**
 * Правит абзацы, текст которых подходит под test; таких абзацев должно быть ровно expected —
 * иначе шаблон изменился и подстановка попала бы не туда.
 */
export function editParagraphs(
  xml: string,
  where: string,
  test: (text: string) => boolean,
  edit: (p: string) => string,
  expected = 1,
): string {
  let found = 0;
  const result = xml.replace(PARA_RE, (p) => {
    if (!test(textOf(p))) return p;
    found += 1;
    return edit(p);
  });
  if (found !== expected) {
    throw templateError(`«${where}»: найдено абзацев — ${found}, ожидалось ${expected}`);
  }
  return result;
}

/** Заменяет ячейки строки (по порядку) результатом fn */
export function mapCells(row: string, fn: (cell: string, index: number) => string): string {
  let i = -1;
  return row.replace(CELL_RE, (cell) => fn(cell, ++i));
}

/** Заменяет абзацы фрагмента (по порядку) результатом fn */
export function mapParagraphs(xml: string, fn: (p: string, index: number) => string): string {
  let i = -1;
  return xml.replace(PARA_RE, (p) => fn(p, ++i));
}

// ============================================================================
// ПОДСТАНОВКА ЗНАЧЕНИЙ
// ============================================================================

/** Шапка: подпись председателя под «TASDIQLAYMAN», дата, номер протокола, место */
export function fillHead(xml: string, form: FinalExamProtocolForm): string {
  const { day, year } = uzbekDate(form.date);
  const placeDateRe = /\d{4}-yil \d{1,2}-\p{L}+$/u;

  let head = editParagraphs(
    xml,
    "подпись председателя под «TASDIQLAYMAN»",
    // после линии для подписи в шаблоне стоит неразрывный пробел
    (text) => /^_{5,}\s/.test(text),
    (p) => replaceText(p, /(?<=_\s).+$/, form.chairman.fullName, "подпись председателя"),
  );
  head = editParagraphs(
    head,
    "дата под «TASDIQLAYMAN»",
    (text) => /^\d{1,2}-\p{L}+ \d{4}-yil$/u.test(text),
    (p) => setText(p, `${day} ${year}`, "дата под «TASDIQLAYMAN»"),
  );
  head = editParagraphs(
    head,
    "BAYONNOMASI №",
    (text) => text.startsWith("BAYONNOMASI"),
    (p) => replaceText(p, /(?<=№ ).+$/, form.number, "номер протокола"),
  );
  // «Место<табуляция>2026-yil 8-oktabr»: место — всё, что перед датой в конце строки
  return editParagraphs(
    head,
    "место и дата под заголовком",
    (text) => placeDateRe.test(text),
    (p) =>
      replaceText(
        replaceText(
          p,
          /^.+?(?=\d{4}-yil \d{1,2}-\p{L}+$)/u,
          form.place,
          "место под заголовком",
        ),
        placeDateRe,
        `${year} ${day}`,
        "дата под заголовком",
      ),
  );
}

/** Таблица сведений: «Raislik qiluvchi:», «Ishtirok etdilar:», «Oʻquv kursi:», «Guruh:», «Imtihon …» */
export function fillInfoTable(
  table: string,
  model: FinalExamProtocolModel,
  form: FinalExamProtocolForm,
): string {
  const whole = (value: string, where: string) => (cell: string) =>
    mapParagraphs(cell, (p) => setText(p, value, where));

  const values: Record<string, (cell: string) => string> = {
    // «ФИО — должность, роль»: ФИО полужирным, как в образце
    raislikqiluvchi: (cell) =>
      mapParagraphs(cell, (p) =>
        replaceText(
          replaceText(p, /(?<= — ).+$/, form.presiding.position, "Raislik qiluvchi"),
          /^.+?(?= — )/,
          form.presiding.fullName,
          "Raislik qiluvchi",
        ),
      ),
    ishtiroketdilar: (cell) =>
      editParagraphs(
        editParagraphs(
          cell,
          "Ishtirok etdilar — группа",
          (text) => / guruhi /.test(text),
          (p) => replaceText(p, /\S+(?= guruhi )/, model.groupCode, "Ishtirok etdilar"),
        ),
        "Ishtirok etdilar — число членов комиссии",
        (text) => /\d\s*nafari/.test(text),
        (p) =>
          replaceText(
            replaceText(p, /\d+(?=\s*nafari)/, String(form.presentMembers), "Ishtirok etdilar"),
            /\d+(?=\s*nafar\s)/,
            String(form.approvedMembers),
            "Ishtirok etdilar",
          ),
      ),
    oquvkursi: whole(model.courseName, "Oʻquv kursi"),
    guruh: whole(model.groupCode, "Guruh"),
    imtihonshakli: whole(form.examForm, "Imtihon shakli"),
    imtihonvaqti: whole(form.examTime, "Imtihon vaqti"),
    imtihonjoyi: whole(form.examPlace, "Imtihon joyi"),
  };

  const filled = new Set<string>();
  const result = table.replace(ROW_RE, (row) => {
    const key = labelKey(textOf(row.match(CELL_RE)?.[0] ?? ""));
    const fill = values[key];
    if (!fill) return row;
    filled.add(key);
    return mapCells(row, (cell, i) => (i === 1 ? fill(cell) : cell));
  });
  if (filled.size !== Object.keys(values).length) {
    throw templateError(
      "в таблице сведений ожидались строки «Raislik qiluvchi:», «Ishtirok etdilar:», «Oʻquv kursi:», «Guruh:», «Imtihon shakli:», «Imtihon vaqti:», «Imtihon joyi:»",
    );
  }
  return result;
}

export const COMMISSION_ROLES = ["komissiyaraisi", "komissiyaraisiorinbosari", "komissiyaazosi"];

/** Состав комиссии сверху вниз: председатель, заместитель (если есть), члены комиссии */
export function commissionOf(
  form: FinalExamProtocolForm,
): { role: string; person: FinalExamProtocolPerson }[] {
  return [
    { role: COMMISSION_ROLES[0]!, person: form.chairman },
    ...(form.deputy ? [{ role: COMMISSION_ROLES[1]!, person: form.deputy }] : []),
    ...form.members.map((person) => ({ role: COMMISSION_ROLES[2]!, person })),
  ];
}

/**
 * Текст между таблицей сведений и таблицей результатов: «Imtihon tartibi», приказ и состав
 * комиссии — по строке «роль — ФИО, должность;» на каждого (последняя заканчивается точкой).
 */
export function fillOrderOfExam(
  xml: string,
  model: FinalExamProtocolModel,
  form: FinalExamProtocolForm,
): string {
  // Кавычки, скобки и слово «buyrugʻi» уже есть в шаблоне — если пользователь ввёл их сам,
  // они не должны задвоиться
  const courseTitle = form.courseTitle.replace(/^[«“"„]\s*|\s*[»”"]$/g, "");
  const commissionList = form.commissionList.replace(/^\(\s*|\s*\)$/g, "");
  const order = form.order.replace(/\s*buyrug['‘’ʻʼ`]?i$/i, "");

  let middle = editParagraphs(
    xml,
    "тема под «IMTIHON TARTIBI:»",
    (text) => /^«[^»]*» .* guruhi /.test(text),
    (p) =>
      form.examOrderText
        ? // пользователь вписал текст сам — он заменяет предложение целиком
          setText(p, form.examOrderText, "Imtihon tartibi")
        : replaceText(
            replaceText(p, /\S+(?= guruhi )/, model.groupCode, "Imtihon tartibi"),
            /^«[^»]*»/,
            `«${courseTitle}»`,
            "Imtihon tartibi",
          ),
  );
  middle = editParagraphs(
    middle,
    "перечень в скобках под «IMTIHON TARTIBI:»",
    (text) => /^\(.*\)$/.test(text),
    (p) => setText(p, `(${commissionList})`, "перечень в скобках"),
  );
  middle = editParagraphs(
    middle,
    "приказ о составе комиссии",
    (text) => /MChJning .* buyrug/.test(text),
    (p) => replaceText(p, /(?<=MChJning ).+(?= buyrug)/, order, "приказ о составе комиссии"),
  );

  // Строки состава в шаблоне идут подряд: председатель, заместитель, два члена комиссии
  const roleOf = (p: string) => labelKey(textOf(p).split(" — ")[0] ?? "");
  const lines = Array.from(middle.matchAll(PARA_RE)).filter(
    (m) => textOf(m[0]).includes(" — ") && COMMISSION_ROLES.includes(roleOf(m[0])),
  );
  const first = lines[0];
  const last = lines[lines.length - 1];
  const protoOf = (role: string) => lines.find((m) => roleOf(m[0]) === role)?.[0];
  if (
    !first ||
    !last ||
    lines.map((m) => m[0]).join("") !== middle.slice(first.index, last.index + last[0].length) ||
    commissionOf(form).some(({ role }) => !protoOf(role))
  ) {
    throw templateError(
      "ожидались идущие подряд строки «komissiya raisi —», «komissiya raisi oʻrinbosari —», «komissiya aʼzosi —»",
    );
  }

  const commission = commissionOf(form);
  const newLines = commission.map(({ role, person }, i) => {
    const end = i === commission.length - 1 ? "." : ";";
    // Сначала должность (от первой запятой до конца строки), потом ФИО перед ней
    const withPosition = replaceText(
      protoOf(role)!,
      /,.*$/,
      `, ${person.position}${end}`,
      "состав комиссии",
    );
    return replaceText(withPosition, /(?<= — )[^,]+/, person.fullName, "состав комиссии");
  });
  return (
    middle.slice(0, first.index) + newLines.join("") + middle.slice(last.index + last[0].length)
  );
}

/** Таблица подписей: строка «роль, должность — (imzo) — ФИО» на каждого участника комиссии */
export function fillSignersTable(table: string, form: FinalExamProtocolForm): string {
  const rows = table.match(ROW_RE) ?? [];
  const roleOf = (row: string) => labelKey(textOf(row.match(PARA_RE)?.[0] ?? ""));
  const protoOf = (role: string) => rows.find((row) => roleOf(row) === role);
  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];
  if (
    !firstRow ||
    !lastRow ||
    rows.some((row) => !COMMISSION_ROLES.includes(roleOf(row))) ||
    commissionOf(form).some(({ role }) => !protoOf(role))
  ) {
    throw templateError(
      "в таблице подписей ожидались строки «Komissiya raisi,», «Komissiya raisi oʻrinbosari,», «Komissiya aʼzosi,»",
    );
  }

  const newRows = commissionOf(form).map(({ role, person }) =>
    mapCells(protoOf(role)!, (cell, i) => {
      // первая ячейка: роль и под ней должность; третья: ФИО
      if (i === 0) {
        return mapParagraphs(cell, (p, n) =>
          n === 1 ? setText(p, person.position, "должность в таблице подписей") : p,
        );
      }
      return i === 2
        ? mapParagraphs(cell, (p) => setText(p, person.fullName, "ФИО в таблице подписей"))
        : cell;
    }),
  );
  const start = table.indexOf(firstRow);
  const end = table.lastIndexOf(lastRow) + lastRow.length;
  return table.slice(0, start) + newRows.join("") + table.slice(end);
}

// ============================================================================
// ВЁРСТКА СТРАНИЦ
// ============================================================================
//
// Протокол должен оставаться таким же, как образец: первая страница — до состава комиссии,
// вторая — таблица результатов со строкой «Roʻyxatga kiritilgan … nafar», дальше решение
// и подписи. Но тексты теперь разной длины, поэтому:
//  - вторая страница всегда начинается с абзаца «Imtihon tasdiqlangan jadval…» (разрыв
//    страницы перед ним) — тогда место под таблицу известно заранее;
//  - ФИО в таблице набираются тем плотнее и мельче, чем больше слушателей: до 15 — как
//    в образце, 20 — кеглем 10,5 pt без полей ячейки сверху и снизу (см. STUDENT_FITS);
//  - если первая страница со своим текстом не помещается, её основной кегль уменьшается
//    с 12 pt до нужного, но не мельче 10 pt (см. fitFirstPage).
//
// Геометрия снята с шаблона и сверена с вёрсткой Word; при правке шаблона (поля страницы,
// ширины колонок, интервалы) её нужно перепроверить.

/** Основной кегль шаблона — 12 pt (в полупунктах, как w:sz) */
const BODY_HALF_PT = 24;
/** Ширина текста на странице, pt: A4, поля 1701 и 850 twips */
const BODY_WIDTH_PT = (11906 - 1701 - 850) / 20;

// --- таблица результатов на второй странице ---

/** Ширина текста в колонке «F.I.Sh.» (2930 twips без полей ячейки по 80), с запасом в 1 pt */
const STUDENT_NAME_WIDTH_PT = (2930 - 2 * 80) / 20 - 1;
/**
 * Наименьшая высота текста в строке слушателя (trHeight 520 — Word считает её без полей
 * ячейки) и линия между строками, pt
 */
const STUDENT_ROW_MIN_PT = 26;
const STUDENT_ROW_BORDER_PT = 0.5;
/**
 * Высота, которая остаётся строкам слушателей на второй странице, pt: страница без полей
 * (749,75) минус текст над таблицей (111), шапка таблицы (37,5) и строка «Roʻyxatga
 * kiritilgan…» под ней (58,3) — и 4 pt запаса.
 */
const STUDENT_ROWS_BUDGET_PT = 539;
/**
 * Варианты набора ФИО: кегль (полупункты) и поля ячейки сверху и снизу (twips) —
 * от образца к самому плотному. Берётся первый, при котором все строки помещаются.
 */
const STUDENT_FITS: [halfPt: number, marginTwips: number][] = [
  [24, 40],
  [24, 20],
  [24, 0],
  [23, 0],
  [22, 0],
  [21, 0],
  [20, 0],
  [19, 0],
  [18, 0],
  [17, 0],
  [16, 0],
];

function fitStudentRows(students: string[]): [halfPt: number, marginTwips: number] {
  const heightOf = ([halfPt, marginTwips]: [number, number]) =>
    students.reduce((sum, name) => {
      const lines = countWrappedLines(name, halfPt / 2, STUDENT_NAME_WIDTH_PT);
      const text = lines * (halfPt / 2) * MONTSERRAT_LINE;
      return (
        sum +
        Math.max(STUDENT_ROW_MIN_PT, text) +
        (2 * marginTwips) / 20 +
        STUDENT_ROW_BORDER_PT
      );
    }, 0);
  return (
    STUDENT_FITS.find((fit) => heightOf(fit) <= STUDENT_ROWS_BUDGET_PT) ??
    STUDENT_FITS[STUDENT_FITS.length - 1]!
  );
}

const sizeTags = (halfPt: number) => `<w:sz w:val="${halfPt}"/><w:szCs w:val="${halfPt}"/>`;

/** Строка слушателя: ФИО вместо помеченного маркером образца, кегль и поля ячеек — по fit */
function fillStudentRow(
  rowXml: string,
  fullName: string,
  [halfPt, marginTwips]: [number, number],
): string {
  let filled = false;
  const row = rowXml
    .replace(RUN_RE, (run) => {
      if (!/<w:highlight\b/.test(run)) return run;
      if (filled) return ""; // остальные раны того же поля
      filled = true;
      return `<w:r><w:t xml:space="preserve">${escapeXml(fullName)}</w:t></w:r>`;
    })
    // Маркер может стоять и на знаке абзаца (pPr/rPr) — убираем и его
    .replace(/<w:highlight [^>]*\/>/g, "")
    .replace(/<w:rPr><\/w:rPr>/g, "")
    .replace(
      /(<w:tcMar><w:top w:w=")\d+("[^>]*\/><w:left [^>]*\/><w:bottom w:w=")\d+(")/g,
      `$1${marginTwips}$2${marginTwips}$3`,
    );
  if (!filled) throw templateError("в строке слушателя нет ФИО с жёлтым маркером");

  // Кегль — всей строке: ФИО, номеру (автосписок) и знакам абзацев, от которых зависит её высота
  return halfPt < BODY_HALF_PT ? withBodySize(row, halfPt) : row;
}

function fillResultsTable(table: string, students: string[]): string {
  // Строка слушателя — единственная строка таблицы с жёлтым маркером
  const markedRows = Array.from(table.matchAll(ROW_RE)).filter((m) =>
    /<w:highlight\b/.test(m[0]),
  );
  const studentRow = markedRows[0];
  if (!studentRow || markedRows.length !== 1) {
    throw templateError(
      `строк таблицы результатов с жёлтым маркером: ${markedRows.length}, ожидалась одна (строка слушателя)`,
    );
  }
  const fit = fitStudentRows(students);
  return (
    table.slice(0, studentRow.index) +
    students.map((name) => fillStudentRow(studentRow[0], name, fit)).join("") +
    table.slice(studentRow.index + studentRow[0].length)
  );
}

// --- первая страница ---

/** До конца первой страницы в образце остаётся ~36 pt; здесь — с запасом */
const FIRST_PAGE_SLACK_PT = 30;
/** Основной кегль первой страницы: 12 pt, при длинных текстах — меньше, но не мельче 10 pt */
const FIRST_PAGE_HALF_PTS = [24, 23, 22, 21, 20];

const attrOf = (xml: string, tag: string, name: string) =>
  Number(new RegExp(`<w:${tag} [^>]*w:${name}="(-?\\d+)"`).exec(xml)?.[1] ?? 0);

/** Число строк, на которые Word разобьёт абзац: слова могут состоять из кусков разного начертания */
function countParagraphLines(
  pieces: { text: string; sizePt: number; bold: boolean }[],
  firstWidthPt: number,
  widthPt: number,
): number {
  const words: { width: number; gap: number }[] = [];
  let gap = 0;
  let glue = false; // предыдущий кусок кончился посреди слова
  for (const piece of pieces) {
    for (const part of piece.text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        gap += textWidth(" ", piece.sizePt, piece.bold) * part.length;
        glue = false;
        continue;
      }
      // Word переносит строку по пробелам и после дефиса
      for (const chunk of part.split(/(?<=-)/)) {
        const width = textWidth(chunk, piece.sizePt, piece.bold);
        const lastWord = words[words.length - 1];
        if (glue && lastWord) lastWord.width += width;
        else words.push({ width, gap });
        gap = 0;
        glue = !chunk.endsWith("-");
      }
    }
  }

  let lines = 1;
  let x = 0;
  let room = firstWidthPt;
  for (const word of words) {
    if (x > 0 && x + word.gap + word.width > room) {
      lines += 1;
      x = 0;
      room = widthPt;
    }
    x += (x > 0 ? word.gap : 0) + word.width;
    while (x > room) {
      // слово шире строки рвётся посимвольно
      lines += 1;
      x -= room;
      room = widthPt;
    }
  }
  return lines;
}

/** Высота абзаца в колонке шириной widthPt, pt. bodyHalfPt — кегль текста без своего w:sz */
function paragraphHeight(p: string, widthPt: number, bodyHalfPt: number): number {
  const pPr = (/<w:pPr>[\s\S]*?<\/w:pPr>/.exec(p)?.[0] ?? "").replace(
    /<w:rPr>[\s\S]*?<\/w:rPr>/,
    "",
  );
  const sizeOf = (rPr: string) => (attrOf(rPr, "sz", "val") || bodyHalfPt) / 2;
  const pieces = Array.from(p.matchAll(RUN_RE), (run) => {
    const rPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run[0])?.[0] ?? "";
    return {
      text: textOf(run[0].replace(/<w:tab\/>/g, "<w:t> </w:t>")),
      sizePt: sizeOf(rPr),
      bold: /<w:b\/>/.test(rPr),
    };
  }).filter((piece) => piece.text);

  const indent = attrOf(pPr, "ind", "left") / 20 + attrOf(pPr, "ind", "right") / 20;
  const lines = countParagraphLines(
    pieces,
    widthPt - indent - attrOf(pPr, "ind", "firstLine") / 20,
    widthPt - indent,
  );
  const sizePt = Math.max(bodyHalfPt / 2, ...pieces.map((piece) => piece.sizePt));
  const lineHeight = sizePt * MONTSERRAT_LINE * ((attrOf(pPr, "spacing", "line") || 240) / 240);
  return (
    attrOf(pPr, "spacing", "before") / 20 +
    lines * lineHeight +
    attrOf(pPr, "spacing", "after") / 20
  );
}

/** Высота фрагмента документа (абзацы и таблицы верхнего уровня), pt */
function blocksHeight(xml: string, bodyHalfPt: number): number {
  const cellHeight = (cell: string) => {
    const tcMar = /<w:tcMar>[\s\S]*?<\/w:tcMar>/.exec(cell)?.[0] ?? "";
    const width =
      attrOf(cell, "tcW", "w") / 20 - attrOf(tcMar, "left", "w") / 20 - attrOf(tcMar, "right", "w") / 20;
    return (
      (cell.match(PARA_RE) ?? []).reduce(
        (sum, p) => sum + paragraphHeight(p, width, bodyHalfPt),
        0,
      ) +
      attrOf(tcMar, "top", "w") / 20 +
      attrOf(tcMar, "bottom", "w") / 20
    );
  };
  return (xml.match(BLOCK_RE) ?? []).reduce((sum, block) => {
    if (!block.startsWith("<w:tbl>")) {
      return sum + paragraphHeight(block, BODY_WIDTH_PT, bodyHalfPt);
    }
    return (
      sum +
      (block.match(ROW_RE) ?? []).reduce(
        (rows, row) => rows + Math.max(...(row.match(CELL_RE) ?? []).map(cellHeight)),
        0,
      )
    );
  }, 0);
}

/** Задаёт кегль всему тексту фрагмента, у которого нет своего w:sz (и знакам абзацев) */
function withBodySize(xml: string, halfPt: number): string {
  const size = sizeTags(halfPt);
  // По схеме OOXML sz идёт в rPr после начертания и перед highlight/u/lang
  const sized = (rPr: string) =>
    /<w:sz /.test(rPr)
      ? rPr
      : rPr.replace(/(?=<w:(?:highlight|u|lang)[ />])|(?=<\/w:rPr>)/, size);

  return xml
    .replace(PARA_RE, (p) => {
      const open = /^<w:p(?: [^>]*)?>/.exec(p)![0];
      const pPr = /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(p)?.[0];
      if (!pPr) return `${open}<w:pPr><w:rPr>${size}</w:rPr></w:pPr>${p.slice(open.length)}`;
      const markRPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(pPr)?.[0];
      return p.replace(
        pPr,
        markRPr
          ? pPr.replace(markRPr, sized(markRPr))
          : pPr.replace("</w:pPr>", `<w:rPr>${size}</w:rPr></w:pPr>`),
      );
    })
    .replace(RUN_RE, (run) => {
      const rPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0];
      return rPr
        ? run.replace(rPr, sized(rPr))
        : run.replace(/^<w:r(?: [^>]*)?>/, (open) => `${open}<w:rPr>${size}</w:rPr>`);
    });
}

/**
 * Первая страница: если с подставленными текстами она выше, чем в образце, больше чем на
 * свободное место образца, её основной кегль уменьшается. Высоты считаются одним и тем же
 * способом для образца и для результата, так что его погрешность на сравнении не сказывается.
 */
export function fitFirstPage(templateXml: string, filledXml: string): string {
  const roomPt = blocksHeight(templateXml, BODY_HALF_PT) + FIRST_PAGE_SLACK_PT;
  const halfPt =
    FIRST_PAGE_HALF_PTS.find((size) => blocksHeight(filledXml, size) <= roomPt) ??
    FIRST_PAGE_HALF_PTS[FIRST_PAGE_HALF_PTS.length - 1]!;
  return halfPt < BODY_HALF_PT ? withBodySize(filledXml, halfPt) : filledXml;
}

// ============================================================================
// СБОРКА ДОКУМЕНТА
// ============================================================================

/** Абзац, с которого начинается вторая страница */
const isSecondPageStart = (text: string) => text.startsWith("Imtihon tasdiqlangan");

/**
 * Начало второй страницы: «…Tinglovchilarning shaxsi … aniqlandi; imtihon jarayoni videoyozuvga
 * olindi.» — слова о видеозаписи остаются, только если она велась
 */
export function fillSecondPageStart(xml: string, form: FinalExamProtocolForm): string {
  if (form.videoRecorded) return xml;
  return editParagraphs(xml, "Imtihon tasdiqlangan jadval…", isSecondPageStart, (p) =>
    replaceText(
      p,
      /;\s*imtihon jarayoni videoyozuvga olindi/,
      "",
      "imtihon jarayoni videoyozuvga olindi",
    ),
  );
}

/** Делит текст между таблицами сведений и результатов на конец первой страницы и начало второй */
export function splitAtSecondPage(xml: string): [firstPage: string, secondPage: string] {
  const start = Array.from(xml.matchAll(PARA_RE)).find((m) => isSecondPageStart(textOf(m[0])));
  if (!start) throw templateError("не найден абзац «Imtihon tasdiqlangan jadval…»");
  return [xml.slice(0, start.index), xml.slice(start.index)];
}

export async function renderFinalExamProtocolDocx(
  model: FinalExamProtocolModel,
  form: FinalExamProtocolForm,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");

  // Служебные метки Word (проверка орфографии, идентификаторы абзацев) — не нужны,
  // а идентификаторы после размножения строк стали бы неуникальными
  const xml = docFile
    .asText()
    .replace(/<w:proofErr [^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "")
    .replace(/ w14:(?:paraId|textId)="[^"]*"/g, "")
    .replace(/ w:rsid[A-Za-z]*="[^"]*"/g, "");

  // Три таблицы: сведения об экзамене, результаты, подписи комиссии
  const tables = Array.from(xml.matchAll(TABLE_RE));
  const bodyStart = xml.indexOf("<w:body>") + "<w:body>".length;
  const [info, results, signers] = tables;
  if (!info || !results || !signers || tables.length !== 3 || bodyStart < "<w:body>".length) {
    throw templateError("ожидались три таблицы: сведения об экзамене, результаты и подписи");
  }
  const endOf = (table: RegExpMatchArray) => table.index! + table[0].length;
  const head = xml.slice(bodyStart, info.index);
  const [orderOfExam, secondPage] = splitAtSecondPage(xml.slice(endOf(info), results.index));

  const firstPage = fitFirstPage(
    head + info[0] + orderOfExam,
    fillHead(head, form) +
      fillInfoTable(info[0], model, form) +
      fillOrderOfExam(orderOfExam, model, form),
  );

  const afterResults = editParagraphs(
    xml.slice(endOf(results), signers.index),
    "Roʻyxatga kiritilgan … nafar",
    (text) => /kiritilgan \d+ nafar/.test(text),
    (p) =>
      replaceText(
        p,
        /(?<=kiritilgan )\d+/,
        String(model.students.length),
        "Roʻyxatga kiritilgan … nafar",
      ),
  );

  zip.file(
    "word/document.xml",
    xml.slice(0, bodyStart) +
      firstPage +
      // По схеме OOXML pageBreakBefore идёт в pPr после pStyle/keepNext/keepLines
      fillSecondPageStart(secondPage, form).replace(
        /(<w:pPr>(?:<w:pStyle [^>]*\/>)?(?:<w:keepNext\/>)?(?:<w:keepLines\/>)?)/,
        "$1<w:pageBreakBefore/>",
      ) +
      fillResultsTable(results[0], model.students) +
      afterResults +
      fillSignersTable(signers[0], form) +
      xml.slice(endOf(signers)),
  );
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
