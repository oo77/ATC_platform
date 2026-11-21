// Заполнение шаблона «Сведения об инструкторах» данными из платформы.
// node --env-file=.env scratch/instructors_docx_build.mjs <template.docx> <out.docx>
import mysql from "mysql2/promise";
import AdmZip from "adm-zip";
import sharp from "sharp";

const [TEMPLATE, OUT] = process.argv.slice(2);
const SKIP = new Set(["ATC", "ATC-2"]); // служебные записи, не люди
const PHOTO_W = 810000, PHOTO_H = 1080000; // 2,25 × 3,00 см в EMU

const c = await mysql.createConnection({
  host: process.env.DATABASE_HOST, port: +process.env.DATABASE_PORT, user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME,
});
const q = async (sql, p = []) => (await c.query(sql, p))[0];
const norm = (s) => (s || "").toUpperCase().replace(/[‘’ʻʼ'`]/g, "'").replace(/\s+/g, " ").trim();
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s || "");

const instructors = (await q(`SELECT id, full_name, work_experience, photo_base64 FROM instructors WHERE is_active = 1`))
  .filter((i) => !SKIP.has(i.full_name.trim().toUpperCase()));
const groupCount = new Map((await q(`SELECT se.instructor_id id, COUNT(DISTINCT se.group_id) n
  FROM schedule_events se JOIN study_groups g ON g.id = se.group_id
  WHERE TRIM(g.code) <> 'AB-TEST' AND se.original_event_id IS NULL
    AND (se.allowed_student_ids IS NULL OR JSON_LENGTH(se.allowed_student_ids) = 0)
  GROUP BY se.instructor_id`)).map((r) => [r.id, Number(r.n)]));
const students = await q(`SELECT s.full_name, s.position,
    COALESCE(NULLIF(o.name_ru,''), NULLIF(o.name_en,''), o.name, s.organization) org, o.code org_code
  FROM students s LEFT JOIN organizations o ON o.id = s.organization_id`);
await c.end();
const studentByName = new Map(students.map((s) => [norm(s.full_name), s]));

// ---------- место работы ----------
const years = (p) => (String(p || "").match(/\d{4}/g) || []).map(Number);
function currentJob(i) {
  let list = [];
  try { list = JSON.parse(i.work_experience || "[]"); } catch {}
  list = list.filter((w) => (w.employer || "").trim() || (w.position || "").trim());
  if (list.length) {
    const score = (w) => {
      const y = years(w.period);
      const now = /н\.?\s*[вв]\.?|н\/в|по наст|hozir/i.test(w.period || "");
      return [now ? 1 : 0, now ? Math.max(...y, 0) : Math.max(...y, 0), Math.min(...y, 9999)];
    };
    list.sort((a, b) => { const x = score(a), y = score(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]; });
    return { org: list[0].employer.trim().replace(/\s+/g, " "), pos: (list[0].position || "").trim().replace(/\s+/g, " "), src: "опыт работы" };
  }
  const s = studentByName.get(norm(i.full_name));
  if (s) {
    const org = s.org_code === "airports_training_center_mchj" ? "ООО «Airports Training Center»" : s.org || "";
    return { org, pos: isUuid(s.position) ? "" : (s.position || "").trim(), src: "карточка слушателя" };
  }
  return { org: "", pos: "", src: "нет данных" };
}

// ---------- ФИО ----------
const uzApos = (s) => s.replace(/([OoGg])['‘’ʻʼ`]/g, "$1‘").replace(/['ʻʼ`]/g, "’");
const cap = (w) => (/^(o‘g‘li|o‘gli|qizi|ugli|kizi)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
function splitName(full) {
  const parts = uzApos(full.trim()).split(/\s+/);
  return { surname: parts[0].toUpperCase(), rest: parts.slice(1).map(cap).join(" ") };
}

// ---------- фото: кадрирование 3:4 ----------
async function photo(b64) {
  if (!b64) return null;
  const m = String(b64).match(/^data:image\/[\w.+-]+;base64,(.*)$/s);
  const buf = Buffer.from(m ? m[1] : b64, "base64");
  const img = sharp(buf).rotate();
  const { width: w, height: h } = await img.metadata();
  let cw = w, ch = h, left = 0, top = 0;
  if (w / h > 3 / 4) { cw = Math.round((h * 3) / 4); left = Math.round((w - cw) / 2); }
  else { ch = Math.round((w * 4) / 3); top = Math.round((h - ch) * 0.2); } // лишнюю высоту режем в основном снизу
  const out = await sharp(buf).rotate().extract({ left, top, width: cw, height: ch })
    .resize({ width: Math.min(cw, 900) }).jpeg({ quality: 90 }).toBuffer();
  return { buf: out, src: `${w}×${h}` };
}

// ---------- сборка ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const run = (text, rPr = "", br = false) => `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ""}${br ? "<w:br/>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const drawing = (n, rid) => `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${PHOTO_W}" cy="${PHOTO_H}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${1000 + n}" name="Фото ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${1000 + n}" name="photo${n}.jpg"/><pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${PHOTO_W}" cy="${PHOTO_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

const zip = new AdmZip(TEMPLATE);
let doc = zip.readAsText("word/document.xml");
let rels = zip.readAsText("word/_rels/document.xml.rels");
let types = zip.readAsText("[Content_Types].xml");

const rowsXml = [...doc.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((m) => m[0]);
const tmpl = rowsXml[1].replace(/ w14:(paraId|textId)="[^"]*"/g, "");
// узкая колонка №: без внутренних отступов, чтобы «44.» не переносилось
const tmplFixed = tmpl.replace("<w:vAlign", "<w:tcMar><w:left w:w=\"0\" w:type=\"dxa\"/><w:right w:w=\"0\" w:type=\"dxa\"/></w:tcMar><w:vAlign");
const cellRe = /(<w:tc>[\s\S]*?<w:p[^>]*>(?:<w:pPr>[\s\S]*?<\/w:pPr>)?)([\s\S]*?)(<\/w:p><\/w:tc>)/g;

const people = instructors.map((i) => ({ i, name: splitName(i.full_name), job: currentJob(i), n: groupCount.get(i.id) || 0 }))
  .sort((a, b) => a.name.surname.localeCompare(b.name.surname, "en") || a.name.rest.localeCompare(b.name.rest, "en"));

const report = [];
const newRows = [];
for (const [k, p] of people.entries()) {
  const ph = await photo(p.i.photo_base64);
  let photoRun = "";
  if (ph) {
    const rid = `rIdPhoto${k + 1}`;
    zip.addFile(`word/media/photo${k + 1}.jpg`, ph.buf);
    rels = rels.replace("</Relationships>", `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo${k + 1}.jpg"/></Relationships>`);
    photoRun = drawing(k + 1, rid);
  }
  const contents = [
    run(`${k + 1}.`),
    run(p.name.surname, `<w:b/><w:color w:val="002060"/>`) + (p.name.rest ? run(p.name.rest, "", true) : ""),
    photoRun,
    p.job.org || p.job.pos ? run(p.job.org) + (p.job.pos ? run(p.job.pos, "", true) : "") : "",
    null, // направления подготовки — оставляем как в шаблоне
    run(String(p.n)),
  ];
  let idx = 0;
  newRows.push(tmplFixed.replace(cellRe, (all, open, body, close) => {
    const v = contents[idx++];
    return v === null ? all : open + v + close;
  }));
  report.push({ n: k + 1, fio: `${p.name.surname} ${p.name.rest}`, org: p.job.org, pos: p.job.pos, src: p.job.src, groups: p.n, photo: ph?.src ?? "НЕТ" });
}

// таблица: шапка + наши строки; страницу с ТЗ удаляем
const tblStart = doc.indexOf(rowsXml[1]);
const tblEnd = doc.indexOf("</w:tbl>");
doc = doc.slice(0, tblStart) + newRows.join("") + doc.slice(tblEnd);
const afterTbl = doc.indexOf("</w:tbl>") + "</w:tbl>".length;
const sect = doc.lastIndexOf("<w:sectPr");
doc = doc.slice(0, afterTbl) + `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>` + doc.slice(sect);

if (!types.includes('Extension="jpg"')) types = types.replace("<Default Extension=\"xml\"", '<Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="xml"');
zip.updateFile("word/document.xml", Buffer.from(doc, "utf8"));
zip.updateFile("word/_rels/document.xml.rels", Buffer.from(rels, "utf8"));
zip.updateFile("[Content_Types].xml", Buffer.from(types, "utf8"));
zip.writeZip(OUT);
console.log(JSON.stringify(report, null, 0).replace(/\},\{/g, "},\n{"));
