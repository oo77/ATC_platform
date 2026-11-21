// Сборка обновлённого отчёта «Слушатели по аудиториям 2026» по образцу прежнего файла.
// node scratch/report_build.mjs <template.xlsx> <data.json> <out.xlsx>
import ExcelJS from "exceljs";
import fs from "fs";

const [, , TEMPLATE, DATA, OUT] = process.argv;
const NONE = "Аудитория не указана";
const { groups: rawGroups } = JSON.parse(fs.readFileSync(DATA, "utf8"));
const groups = rawGroups.map((g) => ({ ...g, code: g.code.trim() }));

// ---------- аудитории → города ----------
const CITY_BY_KEY = [
  [/^ATC\b|Tashkent|Toshkent/i, "Ташкент"],
  [/Andijon/i, "Андижан"], [/Buxoro/i, "Бухара"], [/Fargona/i, "Фергана"], [/Karshi|Qarshi/i, "Карши"],
  [/Namangan/i, "Наманган"], [/Navoiy/i, "Навои"], [/Nukus/i, "Нукус"], [/Qoqond/i, "Коканд"],
  [/Samarqand/i, "Самарканд"], [/Termiz/i, "Термез"], [/Urganch/i, "Ургенч"],
];
const cityOf = (room) => {
  if (room === NONE) return "Не указано";
  const hit = CITY_BY_KEY.find(([re]) => re.test(room));
  if (!hit) throw new Error(`Не знаю город аудитории «${room}» — добавьте в CITY_BY_KEY`);
  return hit[1];
};
// Порядок как в прежнем отчёте: Ташкент (ATC, перрон, аудитория AP, Humo), затем регионы по латинскому имени, «не указана» — последней
const TASHKENT_ORDER = ["ATC", "AP Tashkent (peron)", "AP Tashkent (auditoriya)", "Tashkent Humo"];
const roomRank = (r) => {
  if (r === NONE) return [3, r];
  if (cityOf(r) === "Ташкент") {
    const i = TASHKENT_ORDER.findIndex((p) => r === p || (p === "ATC" && r.startsWith("ATC")));
    return [1, `${String(i < 0 ? 9 : i).padStart(2, "0")}${r}`];
  }
  return [2, r];
};
const cmpRoom = (a, b) => {
  const [ra, ka] = roomRank(a); const [rb, kb] = roomRank(b);
  return ra - rb || ka.localeCompare(kb, "en");
};

const rooms = [...new Set(groups.map((g) => g.main))].sort(cmpRoom);
const cities = [...new Set(rooms.map(cityOf))];

// ---------- организации ----------
const orgs = new Map(); // org -> {byRoom:{}, people:Set}
for (const g of groups) for (const s of g.students) {
  const o = orgs.get(s.org) ?? { byRoom: {}, people: new Set(), total: 0 };
  o.byRoom[g.main] = (o.byRoom[g.main] || 0) + 1; o.people.add(s.sid); o.total++;
  orgs.set(s.org, o);
}
const orgList = [...orgs.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));

// ---------- стили из прежнего файла ----------
const tpl = new ExcelJS.Workbook();
await tpl.xlsx.readFile(TEMPLATE);
const T1 = tpl.getWorksheet("Организации × аудитории");
const T3 = tpl.getWorksheet("Группы");
const T4 = tpl.getWorksheet("Сводка по аудиториям");
const T5 = tpl.getWorksheet("Методика");
const S = (ws, a) => JSON.parse(JSON.stringify(ws.getCell(a).style));
const st = {
  title: S(T1, "A1"), sub: S(T1, "A2"),
  headBlue: S(T1, "A4"), headRoom: S(T1, "C4"),
  num: S(T1, "A6"), org: S(T1, "B6"), cell: S(T1, "C6"), rowTotal: S(T1, "X6"), uniq: S(T1, "Y6"),
  totLabel: S(T1, "B24"), totFirst: S(T1, "A24"), totCell: S(T1, "C24"), totBold: S(T1, "X24"),
  gHead: S(T3, "A1"), gCell: S(T3, "B10"), gWarn: S(T3, "H10"), gTotLabel: S(T3, "B149"), gTot: S(T3, "J149"),
  sHead: S(T4, "A1"), sCell: S(T4, "A2"), sTotLabel: S(T4, "A23"), sTot: S(T4, "D23"),
  method: S(T5, "A1"),
};
const widths = (ws) => ws.columns.map((c) => c.width);

const wb = new ExcelJS.Workbook();
wb.creator = "ATC Platform";
const colL = (n) => { let s = ""; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const put = (ws, addr, value, style) => { const c = ws.getCell(addr); c.value = value; if (style) c.style = JSON.parse(JSON.stringify(style)); return c; };
const DATE = new Date().toLocaleDateString("ru-RU");

// ================= Лист 1: организации × аудитории =================
function matrixSheet(name, title, subtitle, columns /* [{group, label, values(org)->num}] */, firstRow, formulaFor) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", xSplit: 2, ySplit: 5, topLeftCell: "C6", zoomScale: 100 }] });
  put(ws, "A1", title, st.title); ws.getRow(1).height = 18;
  put(ws, "A2", subtitle, st.sub);
  const nCols = columns.length, cTotal = 3 + nCols, cUniq = cTotal + 1;
  for (const [a, v] of [["A4", "№"], ["B4", "Организация (откуда слушатели)"]]) { put(ws, a, v, st.headBlue); put(ws, a.replace("4", "5"), v, st.headBlue); }
  ws.mergeCells("A4:A5"); ws.mergeCells("B4:B5");
  columns.forEach((col, i) => { put(ws, `${colL(3 + i)}4`, col.group, st.headRoom); put(ws, `${colL(3 + i)}5`, col.label, st.headRoom); });
  // объединяем одинаковые соседние заголовки верхнего ряда
  for (let i = 0; i < nCols;) {
    let j = i; while (j + 1 < nCols && columns[j + 1].group === columns[i].group) j++;
    if (j > i) ws.mergeCells(`${colL(3 + i)}4:${colL(3 + j)}4`);
    i = j + 1;
  }
  for (const [c, v] of [[cTotal, "Итого слушателей"], [cUniq, "из них уникальных человек"]]) {
    put(ws, `${colL(c)}4`, v, st.headBlue); put(ws, `${colL(c)}5`, v, st.headBlue); ws.mergeCells(`${colL(c)}4:${colL(c)}5`);
  }
  ws.getRow(5).height = 45;
  const last = firstRow + orgList.length - 1;
  orgList.forEach(([org, o], k) => {
    const r = firstRow + k;
    put(ws, `A${r}`, k + 1, st.num); put(ws, `B${r}`, org, st.org);
    let rowSum = 0;
    columns.forEach((col, i) => {
      const v = col.values(org, o, r);
      const cell = put(ws, `${colL(3 + i)}${r}`, null, st.cell);
      if (v && typeof v === "object") cell.value = v; // формула
      else if (v) cell.value = v;
      rowSum += typeof v === "object" ? v.result || 0 : v || 0;
    });
    put(ws, `${colL(cTotal)}${r}`, { formula: `SUM(C${r}:${colL(cTotal - 1)}${r})`, result: rowSum }, st.rowTotal);
    put(ws, `${colL(cUniq)}${r}`, o.people.size, st.uniq);
  });
  const t = last + 1;
  put(ws, `A${t}`, null, st.totFirst); put(ws, `B${t}`, "ИТОГО", st.totLabel);
  for (let c = 3; c <= cUniq; c++) {
    const L = colL(c);
    let res = 0; for (let r = firstRow; r <= last; r++) { const v = ws.getCell(`${L}${r}`).value; res += typeof v === "object" && v ? v.result || 0 : v || 0; }
    put(ws, `${L}${t}`, { formula: `SUM(${L}${firstRow}:${L}${last})`, result: res }, c >= cTotal ? st.totBold : st.totCell);
  }
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 5 : i === 1 ? 42 : 12; });
  return ws;
}

const ROW1 = 6;
const roomCols = rooms.map((room) => ({ group: cityOf(room), label: room, values: (org, o) => o.byRoom[room] || 0 }));
const ws1 = matrixSheet(
  "Организации × аудитории",
  "Слушатели по организациям и аудиториям обучения (2026)",
  "Каждая группа отнесена к одной аудитории — той, где прошла бóльшая часть её занятий (ак. часы теории и практики).",
  roomCols, ROW1,
);

// ================= Лист 2: организации × города (формулы от листа 1) =================
const S1 = "'Организации × аудитории'";
const cityCols = cities.map((city) => {
  const idx = rooms.map((r, i) => (cityOf(r) === city ? i : -1)).filter((i) => i >= 0);
  return {
    group: "Город обучения", label: city,
    values: (org, o, r) => {
      const res = idx.reduce((s, i) => s + (o.byRoom[rooms[i]] || 0), 0);
      return { formula: idx.map((i) => `${S1}!${colL(3 + i)}${r}`).join("+"), result: res };
    },
  };
});
const tashkentRooms = rooms.filter((r) => cityOf(r) === "Ташкент");
const multi = cities.filter((c) => c !== "Ташкент" && rooms.filter((r) => cityOf(r) === c).length > 1)
  .map((c) => rooms.filter((r) => cityOf(r) === c).join(" + ") + ` = ${c}`);
matrixSheet(
  "Организации × города",
  "Слушатели по организациям и городам обучения (2026)",
  `Те же данные, аудитории объединены по городам (${tashkentRooms.join(", ")} = Ташкент${multi.length ? "; " + multi.join("; ") : ""}).`,
  cityCols, ROW1,
);

// ================= Лист 3: группы =================
const ws3 = wb.addWorksheet("Группы", { views: [{ state: "frozen", xSplit: 2, ySplit: 1, topLeftCell: "C2", zoomScale: 85 }] });
const H3 = ["№", "Группа", "Курс", "Начало", "Окончание", "Основная аудитория", "Город", "Доля осн. аудитории, %", "Всего ак. часов", "Слушателей", "Распределение часов по аудиториям"];
H3.forEach((h, i) => put(ws3, `${colL(i + 1)}1`, h, st.gHead));
const gs = [...groups].sort((a, b) => cmpRoom(a.main, b.main) || a.code.localeCompare(b.code, "en"));
gs.forEach((g, k) => {
  const r = k + 2;
  const vals = [k + 1, g.code, g.course, g.s, g.e, g.main, cityOf(g.main), g.share, g.total, g.students.length, g.dist];
  vals.forEach((v, i) => put(ws3, `${colL(i + 1)}${r}`, v ?? null, st.gCell));
  if (g.share != null && g.share < 70) ws3.getCell(`H${r}`).style = JSON.parse(JSON.stringify(st.gWarn));
});
const g3t = gs.length + 2;
put(ws3, `B${g3t}`, "ИТОГО", st.gTotLabel);
put(ws3, `J${g3t}`, { formula: `SUM(J2:J${g3t - 1})`, result: gs.reduce((s, g) => s + g.students.length, 0) }, st.gTot);
widths(T3).forEach((w, i) => { ws3.getColumn(i + 1).width = w; });

// ================= Лист 4: сводка по аудиториям (формулы от листа «Группы») =================
const ws4 = wb.addWorksheet("Сводка по аудиториям");
["Аудитория", "Город", "Групп", "Слушателей"].forEach((h, i) => put(ws4, `${colL(i + 1)}1`, h, st.sHead));
rooms.forEach((room, k) => {
  const r = k + 2; const mine = gs.filter((g) => g.main === room);
  put(ws4, `A${r}`, room, st.sCell); put(ws4, `B${r}`, cityOf(room), st.sCell);
  put(ws4, `C${r}`, { formula: `COUNTIF(Группы!$F$2:$F$${g3t - 1},A${r})`, result: mine.length }, st.sCell);
  put(ws4, `D${r}`, { formula: `SUMIF(Группы!$F$2:$F$${g3t - 1},A${r},Группы!$J$2:$J$${g3t - 1})`, result: mine.reduce((s, g) => s + g.students.length, 0) }, st.sCell);
});
const s4t = rooms.length + 2;
put(ws4, `A${s4t}`, "ИТОГО", st.sTotLabel);
put(ws4, `C${s4t}`, { formula: `SUM(C2:C${s4t - 1})`, result: gs.length }, st.sTot);
put(ws4, `D${s4t}`, { formula: `SUM(D2:D${s4t - 1})`, result: gs.reduce((s, g) => s + g.students.length, 0) }, st.sTot);
widths(T4).forEach((w, i) => { ws4.getColumn(i + 1).width = w; });

// ================= Лист 5: методика =================
const noRoom = gs.filter((g) => g.main === NONE && g.students.length > 0).map((g) => g.code);
const noRoomEmpty = gs.filter((g) => g.main === NONE && g.students.length === 0).map((g) => g.code);
const lowShare = gs.filter((g) => g.share != null && g.share < 70);
const lowCities = new Set(lowShare.map((g) => cityOf(g.main)));
const ws5 = wb.addWorksheet("Методика");
const lines = [
  `Источник: рабочая база данных ATC (таблицы study_groups, schedule_events, classrooms, study_group_students, students, organizations). Данные на ${DATE}.`,
  "1. Для каждой группы суммированы академические часы занятий по каждой аудитории.",
  "2. Основная аудитория группы = аудитория с наибольшим числом часов теории и практики (зачёты/тесты не учитываются — они часто проходят в компьютерном классе ATC 317). При равенстве часов выбрана аудитория, где шла теория. Если у группы есть только зачёты/экзамены, основная аудитория определяется по всем часам.",
  "3. Все слушатели группы относятся к её основной аудитории. Организация слушателя — из карточки слушателя.",
  "4. «Итого слушателей» — число обучений (человек × группа). Если человек прошёл 2 курса, он посчитан 2 раза; столбец «уникальных человек» показывает число разных людей.",
  `5. Группы, у которых доля основной аудитории < 70%, подсвечены на листе «Группы» (${lowShare.length}: ${lowShare.map((g) => g.code).join(", ")}).` +
    (lowCities.size === 1 && lowCities.has("Ташкент") ? " Все такие случаи — в пределах Ташкента, на разбивку по городам не влияют." : ""),
  `6. «Аудитория не указана» — группы, у занятий которых в расписании не выбрана аудитория` +
    (noRoom.length ? ` (со слушателями: ${noRoom.join(", ")}` : " (групп со слушателями нет") +
    (noRoomEmpty.length ? `; без слушателей: ${noRoomEmpty.join(", ")})` : ")") + ".",
  "7. Исключена тестовая группа AB-TEST; группы без слушателей в итог не влияют.",
];
lines.forEach((t, i) => put(ws5, `A${i + 1}`, t, st.method));
ws5.getColumn(1).width = widths(T5)[0] || 130;

await wb.xlsx.writeFile(OUT);
console.log(JSON.stringify({ rooms, cities, orgs: orgList.length, groups: gs.length,
  enrol: gs.reduce((s, g) => s + g.students.length, 0), noRoom, noRoomEmpty, low: lowShare.map((g) => `${g.code}:${g.share}`) }, null, 1));
