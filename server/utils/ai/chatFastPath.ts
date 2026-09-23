import type { ChatEngineResponse, UserContext, StudentCard, CertificateItem } from "./chatTypes";
import {
  runQuery,
  normalizeRow,
  findStudents,
  findCertificates,
  buildArtifactFromRows,
  summarizeArtifact,
  certificatesArtifact,
  plural,
  type CertificateFilter,
} from "./chatTools";

// ============================================================================
// Быстрый путь: типовые запросы распознаются без LLM и отвечают за десятки мс.
// Всё, что не распознано уверенно, уходит в ReAct-агента.
// ============================================================================

type FastResult = Omit<ChatEngineResponse, "meta">;

const GREETING = /^(salom|assalom|ассалом|салом|привет|здравствуй|здраствуй|добрый\s+(день|вечер|утро)|доброе\s+утро|hello|hi|hey|хай|qalesiz|qalaysiz)(?!\p{L})/iu;
const THANKS = /^(спасибо|благодарю|rahmat|рахмат|thanks|thank you|спс)(?!\p{L})/iu;

const STUDENT_WORD = "(?:слушател\\S*|студент\\S*|курсант\\S*|сотрудник\\S*|tinglovchi\\S*|o.?quvchi\\S*)";
const NAME_STOPWORDS = /(курс|организац|групп|сколько|статистик|истека|активн|файл|приказ|сертификат|отч[её]т|список|(^|\s)(все|всех|за|по|в|на|из|от|где|который|которые)(\s|$))/i;

function orgScope(ctx: UserContext, column: string): { sql: string; params: any[] } {
  if (ctx.canViewAll) return { sql: "", params: [] };
  return { sql: ` AND ${column} = ?`, params: [ctx.organizationId || "__none__"] };
}

function cleanName(raw: string): string {
  return raw
    .replace(/[«»"“”?!.,:;]+$/g, "")
    .replace(/^[«»"“”:\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeName(s: string): boolean {
  if (!s || s.length < 3 || s.length > 80) return false;
  if (NAME_STOPWORDS.test(s)) return false;
  const words = s.split(/\s+/);
  if (words.length > 5) return false;
  return /^[\p{L}ʻʼ'’‘`.\-\s]+$/u.test(s);
}

// ----------------------------------------------------------------------------

export async function tryFastPath(message: string, ctx: UserContext): Promise<FastResult | null> {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (!text || text.length > 300) return null;

  // 1. Приветствие / благодарность
  if (text.length <= 40 && GREETING.test(lower)) {
    return plain(
      `Здравствуйте${ctx.name ? ", **" + ctx.name + "**" : ""}! 👋 Я ИИ-ассистент ATC с прямым доступом к базе данных.\n\n` +
        "Могу, например:\n" +
        "- **найти слушателя** — «Найди слушателя Каримов Анвар»\n" +
        "- **показать сертификаты** — «Сертификаты слушателя Юсупов» или «Сертификаты по курсу Авиационная безопасность»\n" +
        "- **построить статистику** — «Статистика слушателей по организациям»\n" +
        "- **показать группы** — «Активные группы сейчас»",
    );
  }
  if (text.length <= 40 && THANKS.test(lower)) {
    return plain("Пожалуйста! Если нужно что-то ещё — спрашивайте 🙂");
  }

  // 2. ПИНФЛ (14 цифр) — сразу карточка слушателя
  const pinfl = text.match(/\b(\d{14})\b/);
  if (pinfl && !/сертификат/i.test(lower)) {
    const found = await findStudents(pinfl[1]!, ctx);
    if (found.length) return studentsAnswer(pinfl[1]!, found);
  }

  // 3. Сертификаты
  if (/сертификат|sertifikat|certificate/i.test(lower)) {
    const filter = parseCertificateFilter(text);
    if (filter) return certificatesAnswer(filter, await findCertificates(filter, ctx));
  }

  // 4. Статистика слушателей по организациям
  if (
    /(слушател|студент|tinglovchi|o.?quvchi|курсант|сотрудник)/i.test(lower) &&
    /(организац|tashkilot|компани|предприят)/i.test(lower) &&
    !/сертификат/i.test(lower)
  ) {
    return orgStats(ctx);
  }

  // 5. Активные группы
  if (
    /групп|guruh/i.test(lower) &&
    /(активн|текущ|идущ|идут|в процессе|сейчас|faol|на этой неделе|на неделе|сегодня)/i.test(lower)
  ) {
    return activeGroups(ctx, /недел/i.test(lower));
  }

  // 6. Сколько слушателей завершили обучение
  if (/(сколько|количеств|число)/i.test(lower) && /(заверш|окончил|прошл|обучил|выпуст)/i.test(lower)) {
    return completedStats(ctx);
  }

  // 7. Поиск слушателя (последним — чтобы «покажи статистику…» не принять за ФИО)
  // Ничего не нашли — отдаём агенту: он может переформулировать запрос
  const studentQuery = parseStudentQuery(text);
  if (studentQuery) {
    const found = await findStudents(studentQuery, ctx);
    if (found.length) return studentsAnswer(studentQuery, found);
  }

  return null;
}

// ----------------------------------------------------------------------------
// Разбор запросов
// ----------------------------------------------------------------------------

function parseStudentQuery(text: string): string | null {
  const re = new RegExp(
    `^(?:пожалуйста\\s+)?(?:найди|найти|покажи|показать|поиск|ищи|открой|кто\\s+так\\S*|информаци\\S*\\s+(?:о|об|по)|данные\\s+(?:о|по)|карточк\\S*|профиль|topib\\s+ber)\\s+(?:мне\\s+)?(?:${STUDENT_WORD}\\s+)?(.+)$`,
    "i",
  );
  const m = text.match(re);
  if (m) {
    const name = cleanName(m[1]!);
    // «покажи статистику…» и т.п. не являются ФИО
    if (looksLikeName(name) && (new RegExp(STUDENT_WORD, "i").test(text) || name.split(" ").length >= 2)) return name;
  }
  const m2 = text.match(new RegExp(`^${STUDENT_WORD}\\s+(.+)$`, "i"));
  if (m2) {
    const name = cleanName(m2[1]!);
    if (looksLikeName(name)) return name;
  }
  return null;
}

function parseCertificateFilter(text: string): CertificateFilter | null {
  const lower = text.toLowerCase();
  const filter: CertificateFilter = {};

  // Истекающие сертификаты
  if (/(истека|истечет|истекут|заканчива|expir)/i.test(lower)) {
    const days = lower.match(/(\d+)\s*(дн|день|дня|day)/);
    const months = lower.match(/(\d+)\s*(мес|month)/);
    filter.expiringWithinDays = days ? Number(days[1]) : months ? Number(months[1]) * 30 : 30;
    filter.status = "issued";
    return filter;
  }

  // Номер сертификата: содержит цифры, например ATC-2025-0012 или №123/24
  const num = text.match(/(?:№|номер(?:ом)?|number)\s*([A-Za-zА-Яа-я0-9][\w\-\/.]{2,})/i)
    || text.match(/\b([A-Za-zА-Яа-я]{1,8}[-\/]\d[\w\-\/]{2,})\b/);
  if (num && /\d/.test(num[1]!)) {
    filter.number = num[1]!;
    return filter;
  }

  const course = text.match(/(?:по\s+курсу|курса|по\s+программе|по\s+направлению)\s+(.+)$/i);
  if (course) {
    filter.course = cleanName(course[1]!);
    return filter.course ? filter : null;
  }

  const org = text.match(/(?:организаци[ии]|по\s+организации|компании|сотрудников)\s+(.+)$/i);
  if (org) {
    filter.organization = cleanName(org[1]!);
    return filter.organization ? filter : null;
  }

  const student = text.match(new RegExp(`сертификат\\S*\\s+(?:${STUDENT_WORD}\\s+|у\\s+|для\\s+|на\\s+)?(.+)$`, "i"));
  if (student) {
    const name = cleanName(student[1]!);
    if (looksLikeName(name)) {
      filter.student = name;
      return filter;
    }
  }
  const student2 = text.match(new RegExp(`${STUDENT_WORD}\\s+(.+?)\\s*$`, "i"));
  if (student2) {
    const name = cleanName(student2[1]!.replace(/сертификат\S*/i, ""));
    if (looksLikeName(name)) {
      filter.student = name;
      return filter;
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// Ответы
// ----------------------------------------------------------------------------

function plain(reply: string): FastResult {
  return { reply, steps: [], artifact: null, sqlExecuted: null };
}

function step(action: string, thought: string, input: any, output: any) {
  return { step: 1, thought, action, input, output };
}

function studentsAnswer(query: string, students: StudentCard[]): FastResult {
  const steps = [step("find_students", `Поиск слушателя «${query}» по индексу ФИО`, { query }, { found: students.length })];
  if (!students.length) {
    return {
      reply: `Слушатель **«${query}»** не найден.\n\n- Проверьте написание ФИО (можно латиницей или кириллицей)\n- Попробуйте указать только фамилию или ПИНФЛ`,
      steps,
      artifact: null,
      sqlExecuted: null,
      students: [],
    };
  }
  const exact = students.filter((s) => s.confidence >= 95);
  const head = students.length === 1 || exact.length === 1
    ? `Найден слушатель **${(exact[0] || students[0])!.fullName}**.`
    : `Найдено **${students.length}** ${plural(students.length, "совпадение", "совпадения", "совпадений")} по запросу «${query}».`;
  const s0 = (exact[0] || students[0])!;
  const details = students.length === 1 || exact.length === 1
    ? `\n\n- **Организация:** ${s0.organization || "—"}\n- **Должность:** ${s0.position || "—"}\n- **Групп обучения:** ${s0.groupsCount}\n- **Сертификатов:** ${s0.certificatesCount}`
    : "";
  const certs = students.flatMap((s) => s.certificates);
  return {
    reply: head + details,
    steps,
    artifact: {
      title: `Слушатели: ${query}`,
      description: "Результаты поиска слушателей",
      columns: [
        { key: "fullName", label: "ФИО", type: "text" },
        { key: "pinfl", label: "ПИНФЛ", type: "text" },
        { key: "organization", label: "Организация", type: "text" },
        { key: "position", label: "Должность", type: "text" },
        { key: "groupsCount", label: "Групп", type: "number" },
        { key: "certificatesCount", label: "Сертификатов", type: "number" },
        { key: "confidence", label: "Совпадение, %", type: "number" },
      ],
      rows: students.map(({ certificates, groups, ...rest }) => rest),
      students,
      certificates: certs.length ? certs : undefined,
    },
    students,
    certificates: certs.length ? certs : null,
    sqlExecuted: null,
  };
}

function certificatesAnswer(filter: CertificateFilter, certs: CertificateItem[]): FastResult {
  const what = filter.student
    ? `слушателя «${filter.student}»`
    : filter.number
      ? `с номером «${filter.number}»`
      : filter.course
        ? `по курсу «${filter.course}»`
        : filter.organization
          ? `организации «${filter.organization}»`
          : filter.expiringWithinDays
            ? `с истекающим сроком (≤ ${filter.expiringWithinDays} дн.)`
            : "";
  const steps = [step("find_certificates", `Поиск сертификатов ${what}`, filter, { found: certs.length })];
  if (!certs.length) {
    return { reply: `Сертификаты ${what} **не найдены**.`, steps, artifact: null, certificates: [], sqlExecuted: null };
  }
  const students = new Set(certs.map((c) => c.studentId)).size;
  const revoked = certs.filter((c) => c.status === "revoked").length;
  const courses = new Map<string, number>();
  for (const c of certs) courses.set(c.courseName, (courses.get(c.courseName) || 0) + 1);
  const topCourses = [...courses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  let reply = `Найдено **${certs.length}** ${plural(certs.length, "сертификат", "сертификата", "сертификатов")} ${what}` +
    (students > 1 ? ` у **${students}** слушателей` : "") + ".";
  if (revoked) reply += ` Из них отозвано: **${revoked}**.`;
  if (topCourses.length > 1) {
    reply += "\n\n**По курсам:**\n" + topCourses.map(([n, c]) => `- ${n} — ${c}`).join("\n");
  }
  reply += "\n\nPDF можно скачать по кнопке у каждого сертификата" + (certs.length > 1 ? " или одним ZIP-архивом." : ".");

  return {
    reply,
    steps,
    artifact: certificatesArtifact(certs, `Сертификаты ${what}`),
    certificates: certs,
    sqlExecuted: null,
  };
}

async function sqlAnswer(
  title: string,
  sql: string,
  params: any[],
  thought: string,
  spec: Parameters<typeof buildArtifactFromRows>[1] = {},
  intro = "",
): Promise<FastResult> {
  const rows = (await runQuery<any>(sql, params, { cache: true })).map(normalizeRow);
  const artifact = buildArtifactFromRows(rows, { title, ...spec });
  return {
    reply: (intro ? intro + "\n\n" : "") + summarizeArtifact(artifact),
    steps: [step("execute_sql", thought, { sql: sql.replace(/\s+/g, " ").trim() }, { rowCount: rows.length })],
    artifact: rows.length ? artifact : null,
    sqlExecuted: sql.replace(/\s+/g, " ").trim(),
  };
}

function orgStats(ctx: UserContext): Promise<FastResult> {
  const scope = orgScope(ctx, "s.organization_id");
  return sqlAnswer(
    "Статистика слушателей по организациям",
    `SELECT COALESCE(o.name, x.org_text, 'Без организации') AS organization_name,
            x.students_count, x.with_certificates
     FROM (
       SELECT s.organization_id, MAX(s.organization) AS org_text, COUNT(*) AS students_count,
              SUM(EXISTS(SELECT 1 FROM issued_certificates ic WHERE ic.student_id = s.id AND ic.status = 'issued')) AS with_certificates
       FROM students s WHERE 1=1${scope.sql}
       GROUP BY s.organization_id
     ) x
     LEFT JOIN organizations o ON o.id = x.organization_id
     ORDER BY x.students_count DESC`,
    scope.params,
    "Группирую слушателей по организациям",
    {
      columns: { organization_name: "Организация", students_count: "Слушателей", with_certificates: "С сертификатом" },
      chart: { type: "hbar", x: "organization_name", y: ["students_count", "with_certificates"], title: "Слушатели по организациям" },
    },
    "Распределение слушателей по организациям:",
  );
}

function activeGroups(ctx: UserContext, thisWeek: boolean): Promise<FastResult> {
  const scope = ctx.canViewAll
    ? { sql: "", params: [] as any[] }
    : {
        sql: " AND EXISTS (SELECT 1 FROM study_group_students z JOIN students zs ON zs.id = z.student_id WHERE z.group_id = g.id AND zs.organization_id = ?)",
        params: [ctx.organizationId || "__none__"],
      };
  const period = thisWeek
    ? "g.start_date <= DATE_ADD(CURDATE(), INTERVAL 6 - WEEKDAY(CURDATE()) DAY) AND g.end_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)"
    : "g.start_date <= CURDATE() AND g.end_date >= CURDATE()";
  return sqlAnswer(
    thisWeek ? "Группы, занимающиеся на этой неделе" : "Активные группы",
    `SELECT g.code AS group_code, c.name AS course_name, g.start_date, g.end_date,
            (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = g.id) AS students_count,
            g.classroom
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE COALESCE(g.is_archived, 0) = 0 AND ${period}${scope.sql}
     ORDER BY g.end_date ASC`,
    scope.params,
    "Выбираю группы, у которых период обучения включает текущую дату",
    { columns: { classroom: "Аудитория" }, chart: { type: "bar", x: "group_code", y: "students_count", title: "Слушателей в группах" } },
  ).then((r) => {
    if (!r.artifact) r.reply = thisWeek ? "На этой неделе занятий в группах **нет**." : "Сейчас **нет активных групп**.";
    else r.reply = `Сейчас обучается **${r.artifact.rows.length}** ${plural(r.artifact.rows.length, "группа", "группы", "групп")}.\n\n` + r.reply;
    return r;
  });
}

function completedStats(ctx: UserContext): Promise<FastResult> {
  const scope = orgScope(ctx, "s.organization_id");
  return sqlAnswer(
    "Завершили обучение (выданы сертификаты) по курсам",
    `SELECT COALESCE(ic.course_name, c.name, '—') AS course_name,
            COUNT(DISTINCT ic.student_id) AS students_count,
            COUNT(*) AS certificates_count
     FROM issued_certificates ic
     JOIN students s ON s.id = ic.student_id
     LEFT JOIN study_groups g ON g.id = ic.group_id
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE ic.status = 'issued'${scope.sql}
     GROUP BY course_name
     ORDER BY students_count DESC`,
    scope.params,
    "Считаю слушателей с выданными сертификатами по курсам",
    { chart: { type: "hbar", x: "course_name", y: "students_count", title: "Завершили обучение по курсам" } },
    "Завершившими курс считаются слушатели с действующим выданным сертификатом.",
  );
}
