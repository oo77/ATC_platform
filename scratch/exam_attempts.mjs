// Попытки экзамена слушателя в группе (для реестра слушателей).
// Учитываются все события «assessment» группы, включая пересдачи (только где слушатель допущен).
// Попытка = завершённая сессия теста на событии; если тестов на событии нет — выставленная оценка.
// Сдано: тест — ts.passed; оценка — ≥60 по 100-балльной или ≥4 по 5-балльной, как в приложении.
// В части групп повторные попытки заведены не пересдачей, а отдельным «Экзаменом», поэтому
// номер сдавшей попытки = число несданных попыток + 1.
export async function loadExamAttempts(q) {
  const events = await q(`SELECT se.id, se.group_id, se.original_event_id orig, se.allowed_student_ids allowed
    FROM schedule_events se WHERE se.event_type='assessment' AND se.group_id IS NOT NULL`);
  const grades = await q(`SELECT g.student_id sid, g.schedule_event_id eid, g.grade FROM grades g
    JOIN schedule_events se ON se.id=g.schedule_event_id WHERE se.event_type='assessment'`);
  const sessions = await q(`SELECT ts.student_id sid, ta.schedule_event_id eid, ts.passed
    FROM test_sessions ts JOIN test_assignments ta ON ta.id=ts.assignment_id
    JOIN schedule_events se ON se.id=ta.schedule_event_id
    WHERE se.event_type='assessment' AND ts.status='completed' AND ts.is_preview=0`);

  const gradeBy = new Map(grades.map((g) => [`${g.sid}|${g.eid}`, Number(g.grade)]));
  const sessBy = new Map();
  for (const s of sessions) {
    const k = `${s.sid}|${s.eid}`;
    (sessBy.get(k) ?? sessBy.set(k, []).get(k)).push(!!s.passed);
  }
  const allowedOf = (a) => {
    try { const v = typeof a === "string" ? JSON.parse(a) : a; return Array.isArray(v) ? v : []; } catch { return []; }
  };
  const byGroup = new Map();
  for (const e of events) (byGroup.get(e.group_id) ?? byGroup.set(e.group_id, []).get(e.group_id)).push(e);
  const pass = (grade) => (grade <= 5 ? grade >= 4 : grade >= 60);

  /** { hasExam, tries, fails, passed } слушателя sid в группе gid */
  return function attempts(gid, sid) {
    const evs = byGroup.get(gid);
    if (!evs) return { hasExam: false, tries: 0, fails: 0, passed: false };
    let tries = 0, fails = 0, passed = false;
    for (const e of evs) {
      const allowed = allowedOf(e.allowed);
      if (allowed.length && !allowed.includes(sid)) continue;
      const results = sessBy.get(`${sid}|${e.id}`) ??
        (gradeBy.has(`${sid}|${e.id}`) ? [pass(gradeBy.get(`${sid}|${e.id}`))] : []);
      for (const ok of results) { tries++; if (ok) passed = true; else fails++; }
    }
    return { hasExam: true, tries, fails, passed };
  };
}
