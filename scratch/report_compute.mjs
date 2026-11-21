import mysql from 'mysql2/promise'; import fs from 'fs';
const INCLUDE_RETAKES = process.argv[2] === 'with-retakes';
const c = await mysql.createConnection({host:process.env.DATABASE_HOST,port:+process.env.DATABASE_PORT,user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD,database:process.env.DATABASE_NAME});
const [[ahm]] = await c.query("SELECT setting_value v FROM schedule_settings WHERE setting_key='academic_hour_minutes'");
const AHM = parseInt(ahm?.v ?? '45', 10);
const NONE = 'Аудитория не указана';
const [groups] = await c.query(`SELECT g.id, g.code, c.name course, DATE_FORMAT(g.start_date,'%Y-%m-%d') s, DATE_FORMAT(g.end_date,'%Y-%m-%d') e
  FROM study_groups g LEFT JOIN courses c ON c.id=g.course_id WHERE (YEAR(g.start_date)=2026 OR YEAR(g.end_date)=2026) AND g.code<>'AB-TEST'`);
const [events] = await c.query(`SELECT se.group_id, se.event_type t, COALESCE(cr.name, ?) room, se.academic_hours ah, se.duration_minutes dm,
  TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) mins,
  (se.original_event_id IS NOT NULL OR (se.allowed_student_ids IS NOT NULL AND JSON_LENGTH(se.allowed_student_ids)>0)) retake
  FROM schedule_events se LEFT JOIN classrooms cr ON cr.id=se.classroom_id WHERE se.group_id IS NOT NULL`, [NONE]);
const [studs] = await c.query(`SELECT sgs.group_id, s.id sid, COALESCE(o.name, s.organization, 'Организация не указана') org
  FROM study_group_students sgs JOIN students s ON s.id=sgs.student_id LEFT JOIN organizations o ON o.id=s.organization_id`);
await c.end();
const hrs = (e) => e.ah != null ? Number(e.ah) : Math.round((e.dm ?? e.mins) / AHM);
const byG = new Map(groups.map(g => [g.id, { ...g, all: {}, tp: {}, theory: {}, students: [] }]));
for (const e of events) {
  const g = byG.get(e.group_id); if (!g) continue;
  if (e.retake && !INCLUDE_RETAKES) continue;
  const h = hrs(e);
  g.all[e.room] = (g.all[e.room] || 0) + h;
  if (e.t === 'theory' || e.t === 'practice') g.tp[e.room] = (g.tp[e.room] || 0) + h;
  if (e.t === 'theory') g.theory[e.room] = (g.theory[e.room] || 0) + h;
}
for (const s of studs) byG.get(s.group_id)?.students.push(s);
const out = [];
for (const g of byG.values()) {
  const known = Object.entries(g.tp).filter(([r]) => r !== NONE);
  let main = NONE, share = null;
  if (known.length) {
    known.sort((a, b) => b[1] - a[1] || (g.theory[b[0]] || 0) - (g.theory[a[0]] || 0));
    main = known[0][0];
    const tot = known.reduce((s, [, h]) => s + h, 0);
    share = tot ? Math.round(main === NONE ? 100 : known[0][1] / tot * 100) : null;
  } else {
    // Нет теории/практики (только зачёт/экзамен) — основная аудитория по всем часам, как в прежнем отчёте
    const any = Object.entries(g.all).filter(([r]) => r !== NONE).sort((a, b) => b[1] - a[1]);
    if (any.length) { main = any[0][0]; const tot = any.reduce((s, [, h]) => s + h, 0); share = Math.round(any[0][1] / tot * 100); }
    else if (Object.keys(g.all).length) share = 100;
  }
  const total = Object.values(g.all).reduce((a, b) => a + b, 0);
  const dist = Object.entries(g.all).sort((a, b) => b[1] - a[1]).map(([r, h]) => `${r}: ${h} ч`).join('; ');
  out.push({ code: g.code, course: g.course, s: g.s, e: g.e, main, share, total: total || null, dist: dist || null, students: g.students.map(s => ({ sid: s.sid, org: s.org })) });
}
fs.writeFileSync(process.argv[3], JSON.stringify({ AHM, groups: out }, null, 1));
console.log('AHM', AHM, 'groups', out.length, 'enrolments', out.reduce((a, g) => a + g.students.length, 0));
