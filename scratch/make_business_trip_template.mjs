// Одноразово: из образца «Командировочные AB-APA-08PP.docx» делает шаблон
// server/assets/templates/business-trip-template.docx с метками {{GROUP}}, {{DATES}}, {{NAME}}, {{ORG}}.
// node scratch/make_business_trip_template.mjs <образец.docx>
import fs from "node:fs";
import PizZip from "pizzip";

const SRC = process.argv[2];
const OUT = "server/assets/templates/business-trip-template.docx";
const zip = new PizZip(fs.readFileSync(SRC));
let xml = zip.file("word/document.xml").asText();

const PARA_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
const TEXT_RE = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;
const textOf = (s) => Array.from(s.matchAll(TEXT_RE), (m) => m[1]).join("");
const setText = (run, t) => run.replace(TEXT_RE, "").replace(/<\/w:r>$/, `<w:t xml:space="preserve">${t}</w:t></w:r>`);

// «Guruh: ______AB-APA-08PP____» / «Sana: ____10-11.11.2026____»: всё после «: » — одна метка
// в формате подчёркнутого рана значения
function placeholderAfterColon(label, mark) {
  let n = 0;
  xml = xml.replace(PARA_RE, (p) => {
    if (!textOf(p).startsWith(label)) return p;
    n++;
    const runs = p.match(RUN_RE);
    const colon = runs.findIndex((r) => textOf(r).includes(":"));
    const valueRun = runs.slice(colon + 1).find((r) => /<w:u w:val="single"\/>/.test(r)) ?? runs[colon + 1];
    let out = p;
    runs.slice(colon + 1).forEach((r, i) => { out = out.replace(r, i === 0 ? setText(valueRun, mark) : ""); });
    return out.replace(/<w:proofErr [^>]*\/>/g, "");
  });
  if (n !== 1) throw new Error(`«${label}»: найдено ${n}`);
}
placeholderAfterColon("Guruh", "{{GROUP}}");
placeholderAfterColon("Sana", "{{DATES}}");

// Таблица: две строки шапки + по одной строке-образцу «xxx» и «+»
const table = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)[0];
const rows = table.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g);
const sample = (row) => {
  const cells = row.match(/<w:tc>[\s\S]*?<\/w:tc>/g);
  let r = row;
  const fill = (cell, mark) => {
    const runs = cell.match(RUN_RE);
    let c = cell.replace(/<w:proofErr [^>]*\/>/g, "");
    runs.forEach((run, i) => { c = c.replace(run, i === 0 ? setText(run, mark) : ""); });
    r = r.replace(cell, c);
  };
  fill(cells[1], "{{NAME}}");
  fill(cells[2], "{{ORG}}");
  return r.replace(/ w14:(paraId|textId)="[^"]*"/g, "");
};
const xxxRow = sample(rows.find((r) => textOf(r).includes("xxx")));
const plusRow = sample(rows.find((r) => textOf(r).includes("+")));
const newTable = table.replace(rows.slice(2).join(""), xxxRow + plusRow);
if (newTable === table) throw new Error("строки данных не заменены");
xml = xml.replace(table, newTable);

zip.file("word/document.xml", xml);
fs.writeFileSync(OUT, zip.generate({ type: "nodebuffer", compression: "DEFLATE" }));
console.log("ok", OUT, fs.statSync(OUT).size, "bytes; marks:", (xml.match(/\{\{[A-Z]+\}\}/g) || []).join(","));
