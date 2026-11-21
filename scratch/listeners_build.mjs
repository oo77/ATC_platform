// Реестр слушателей 2026: по строке на слушателя в группе.
// node --env-file=.env scratch/listeners_build.mjs <out.xlsx>
import mysql from "mysql2/promise";
import ExcelJS from "exceljs";
import { loadExamAttempts } from "./exam_attempts.mjs";

const OUT = process.argv[2];
const NONE = "Не указана";
const c = await mysql.createConnection({
  host: process.env.DATABASE_HOST, port: +process.env.DATABASE_PORT, user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME,
});
const q = async (sql, p = []) => (await c.query(sql, p))[0];
const [{ v: ahmRaw } = {}] = await q("SELECT setting_value v FROM schedule_settings WHERE setting_key='academic_hour_minutes'");
const AHM = parseInt(ahmRaw ?? "45", 10);

const groups = await q(`SELECT g.id, TRIM(g.code) code, g.start_date, g.end_date,
    COALESCE(NULLIF(c.name_uz,''), c.name) course, c.course_type
  FROM study_groups g LEFT JOIN courses c ON c.id = g.course_id
  WHERE TRIM(g.code) <> 'AB-TEST'`);
const events = await q(`SELECT se.group_id, se.event_type t, cr.name room, se.instructor_id,
    COALESCE(NULLIF(i.short_name_uz,''), i.full_name) instr,
    se.academic_hours ah, se.duration_minutes dm, TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) mins
  FROM schedule_events se
  LEFT JOIN classrooms cr ON cr.id = se.classroom_id
  LEFT JOIN instructors i ON i.id = se.instructor_id
  WHERE se.group_id IS NOT NULL
    AND se.original_event_id IS NULL
    AND (se.allowed_student_ids IS NULL OR JSON_LENGTH(se.allowed_student_ids) = 0)`); // пересдачи не учитываем
const students = await q(`SELECT sgs.group_id, s.id sid, s.full_name,
    COALESCE(o.name, s.organization) org, COALESCE(NULLIF(s.position_uz,''), s.position) pos,
    (SELECT COUNT(*) FROM issued_certificates ic WHERE ic.student_id = s.id AND ic.status = 'issued') certs,
    (SELECT ic.certificate_number FROM issued_certificates ic
      WHERE ic.student_id = s.id AND ic.group_id = sgs.group_id AND ic.status = 'issued'
      ORDER BY ic.issue_date DESC LIMIT 1) cert_no
  FROM study_group_students sgs JOIN students s ON s.id = sgs.student_id
  LEFT JOIN organizations o ON o.id = s.organization_id`);
const attempts = await loadExamAttempts(q);
await c.end();
const TODAY = new Date(new Date().toDateString());

const hours = (e) => (e.ah != null ? Number(e.ah) : Math.round((e.dm ?? e.mins) / AHM));
const top = (byKey, tieBy = {}) => {
  const list = Object.entries(byKey).sort((a, b) => b[1] - a[1] || (tieBy[b[0]] || 0) - (tieBy[a[0]] || 0) || a[0].localeCompare(b[0]));
  return list[0]?.[0] ?? null;
};
const info = new Map(groups.map((g) => [g.id, { ...g, rooms: {}, theoryRooms: {}, instr: {}, hasExam: false }]));
for (const e of events) {
  const g = info.get(e.group_id); if (!g) continue;
  const h = hours(e);
  if (e.t === "assessment") g.hasExam = true;
  if (e.room) {
    g.rooms[e.room] = (g.rooms[e.room] || 0) + h;
    if (e.t === "theory") g.theoryRooms[e.room] = (g.theoryRooms[e.room] || 0) + h;
  }
  // «ATC» — служебный инструктор экзаменов: берём его, только если других нет
  if (e.instr) g.instr[e.instr] = (g.instr[e.instr] || 0) + h * (e.instr.trim().toUpperCase() === "ATC" ? 0.001 : 1);
}
const dmy = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

// группы, где у кого-то есть результат экзамена; в остальных экзамены в платформу не внесены
const groupHasData = new Set(students.filter((s) => attempts(s.group_id, s.sid).tries > 0).map((s) => s.group_id));

const rows = [];
for (const s of students) {
  const g = info.get(s.group_id); if (!g) continue;
  const room = top(g.rooms, g.theoryRooms) ?? NONE;
  const start = dmy(g.start_date), end = dmy(g.end_date);
  // сертификат и попытки экзамена
  const a = attempts(s.group_id, s.sid);
  const got = !!s.cert_no;
  const running = g.end_date >= TODAY;
  let passedAt = "", usedTries = "";
  if (got) {
    passedAt = !a.hasExam ? "Imtihon siz" : a.tries ? Math.min(a.fails + 1, 3) : "Ma’lumot yo‘q";
  } else if (!a.hasExam) {
    // группы без экзамена (OTP): обучение закончено — сертификат готовится
    usedTries = running ? "O‘qish davom etmoqda" : "Sertifikat tayyorlanmoqda";
  } else if (a.passed) {
    usedTries = "Sertifikat tayyorlanmoqda";
  } else if (a.tries && running) {
    usedTries = Math.min(a.tries, 3);
  } else if (a.tries) {
    // не сдали и сертификат не получили (FYODOROVA, PIRNAZAROV, JUMAYEV) — по факту не сдавали, отчислены
    usedTries = "Chetlatilgan";
  } else if (running) {
    usedTries = "O‘qish davom etmoqda";
  } else if (groupHasData.has(s.group_id)) {
    // группа экзамен сдавала, а этот слушатель — нет
    usedTries = "Chetlatilgan";
  } else if (g.code.startsWith("AB-")) {
    // в группах AB- экзамен принимался устно и в платформу не вносился
    usedTries = "Og‘zaki imtihon muvaffaqiyatli topshirildi (sertifikat tayyorlanmoqda)";
  } else {
    usedTries = "Ma’lumot yo‘q";
  }
  rows.push({
    gotCert: got ? "Ha" : "Yo‘q", passedAt, usedTries, certNo: s.cert_no ?? "",
    fio: s.full_name, org: s.org ?? "",
    // в части карточек вместо должности записан пустой UUID — это «должность не указана»
    pos: /^0{8}-0{4}-/.test(s.pos ?? "") ? "" : s.pos ?? "", group: g.code, course: g.course ?? "",
    type: g.course_type ?? "", dates: start === end ? start : `${start} - ${end}`, start, end,
    exam: g.hasExam ? end : "Imtihon siz", room, base: room,
    instr: top(g.instr) ?? "", certs: Number(s.certs), _start: g.start_date,
  });
}
rows.sort((a, b) => a._start - b._start || a.group.localeCompare(b.group, "en") || a.fio.localeCompare(b.fio, "en"));

// ---------- Excel ----------
const wb = new ExcelJS.Workbook();
wb.creator = "ATC Platform";
const ws = wb.addWorksheet("Tinglovchilar", { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
const cols = [
  ["№", 6, "n"], ["F.I.Sh.", 40, "fio"], ["Tashkilotlar bo‘yicha tarkib", 28, "org"], ["Lavozim", 30, "pos"],
  ["Guruh", 14, "group"], ["Kurs", 60, "course"], ["O‘quv turi", 10, "type"], ["O‘qish sanalari", 24, "dates"],
  ["Boshlanish sanasi", 14, "start"], ["Tugash sanasi", 14, "end"],
  ["Imtihon sanasi", 14, "exam"], ["O‘quv xonasi", 20, "room"], ["Bazasida", 20, "base"],
  ["Instruktorning F.I.Sh.", 36, "instr"], ["Sertifikatlar soni", 12, "certs"],
  ["Sertifikat oldimi", 12, "gotCert"], ["Imtihonni nechanchi urinishda topshirdi", 18, "passedAt"],
  ["Foydalanilgan urinishlar (sertifikat olmaganlar)", 26, "usedTries"], ["Sertifikat raqami", 20, "certNo"],
];
const font = { name: "Arial", size: 10 };
const thin = { style: "thin", color: { argb: "FFBFBFBF" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };
cols.forEach(([h, w], i) => {
  const cell = ws.getCell(1, i + 1);
  cell.value = h;
  cell.font = { ...font, bold: true };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  cell.border = border;
  ws.getColumn(i + 1).width = w;
});
ws.getRow(1).height = 58;
rows.forEach((r, k) => {
  const row = ws.getRow(k + 2);
  cols.forEach(([, , key], i) => {
    const cell = row.getCell(i + 1);
    cell.value = key === "n" ? k + 1 : r[key];
    cell.font = font;
    cell.border = border;
    cell.alignment = { vertical: "top", wrapText: ["course", "pos", "org", "fio", "instr", "usedTries", "passedAt"].includes(key),
      horizontal: ["n", "type", "exam", "certs", "dates", "start", "end", "gotCert", "passedAt", "usedTries", "certNo"].includes(key) ? "center" : "left" };
  });
});
ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: cols.length } };
await wb.xlsx.writeFile(OUT);

const stat = (k) => Object.entries(rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({
  rows: rows.length, groups: new Set(rows.map((r) => r.group)).size, people: new Set(students.filter((s) => info.has(s.group_id)).map((s) => s.sid)).size,
  type: stat("type"), examless: [...new Set(rows.filter((r) => r.exam === "Imtihon siz").map((r) => r.group))],
  noRoom: [...new Set(rows.filter((r) => r.room === NONE).map((r) => r.group))],
  noInstr: [...new Set(rows.filter((r) => !r.instr).map((r) => r.group))],
  atcInstr: [...new Set(rows.filter((r) => r.instr.trim().toUpperCase() === "ATC").map((r) => r.group))],
  noPos: rows.filter((r) => !r.pos).length, uuidLeft: rows.filter((r) => /^0{8}/.test(r.pos)).length, noOrg: rows.filter((r) => !r.org).length,
  certs: stat("certs"), gotCert: stat("gotCert"), passedAt: stat("passedAt"), usedTries: stat("usedTries"),
}, null, 1));
