/**
 * Публичные дашборды: расчёт данных виджетов.
 *
 * Каждый тип виджета из каталога (shared/utils/publicDashboard.ts) имеет
 * здесь свой резолвер. Наружу отдаются только агрегаты и минимально
 * необходимые строки списков; ФИО по умолчанию маскируются.
 * Результаты кешируются в памяти на короткое время, чтобы десяток экранов
 * с одним дашбордом не нагружал БД.
 */

import { executeQuery } from "../utils/db";
import { getAcademicHourMinutes } from "../utils/academicHours";
import { eventKindLabel } from "../../shared/utils/scheduleLabels";
import { opsResolvers } from "./publicDashboardOps";
import {
  getWidgetDef,
  normalizeWidgetOptions,
  type DashboardSettings,
  type DashboardWidget,
  type WidgetData,
} from "../../shared/utils/publicDashboard";

const CACHE_TTL_MS = 20_000;
const cache = new Map<string, { at: number; data: WidgetData }>();

const MONTH_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

interface Ctx {
  options: Record<string, any>;
  maskNames: boolean;
}

type Resolver = (ctx: Ctx) => Promise<WidgetData>;

// ───────────────────────── helpers ─────────────────────────

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const int = (v: unknown, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(num(v))));

async function scalar(sql: string, params: any[] = []): Promise<number> {
  const rows = await executeQuery<any[]>(sql, params);
  const row = rows?.[0];
  if (!row) return 0;
  return num(Object.values(row)[0]);
}

/** «Иванов Иван Иванович» → «Иванов И. И.» */
export function maskName(full: string | null | undefined): string {
  if (!full) return "—";
  const parts = String(full).trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "—";
  return [parts[0], ...parts.slice(1, 3).map((p) => `${p.charAt(0).toUpperCase()}.`)].join(" ");
}

const kpi = (value: number, suffix?: string, hint?: string): WidgetData => ({ kind: "kpi", value, suffix, hint });

/** Последние N месяцев в формате YYYY-MM (включая текущий) */
function lastMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function monthLabel(ym: string, withYear: boolean): string {
  const [y, m] = ym.split("-");
  const label = MONTH_SHORT[Number(m) - 1] ?? ym;
  return withYear ? `${label} ${String(y).slice(2)}` : label;
}

async function monthlySeries(sql: string, months: number, name: string): Promise<WidgetData> {
  const keys = lastMonths(months);
  const rows = await executeQuery<any[]>(sql, [`${keys[0]}-01`]);
  const map = new Map(rows.map((r) => [String(r.month), num(r.count)]));
  const withYear = months > 12 || keys[0]!.slice(0, 4) !== keys[keys.length - 1]!.slice(0, 4);
  return {
    kind: "chart",
    chart: "series",
    labels: keys.map((k) => monthLabel(k, withYear)),
    series: [{ name, data: keys.map((k) => map.get(k) ?? 0) }],
  };
}

/** Топ-N с хвостом «Остальные» */
function topWithOthers(rows: { name: string; count: number }[], top: number, name: string, style: string): WidgetData {
  const sorted = rows.map((r) => ({ name: r.name || "Не указано", count: num(r.count) })).filter((r) => r.count > 0);
  const head = sorted.slice(0, top);
  const restSum = sorted.slice(top).reduce((s, r) => s + r.count, 0);
  if (restSum > 0) head.push({ name: "Остальные", count: restSum });
  return {
    kind: "chart",
    chart: style === "bar" ? "hbar" : "pie",
    labels: head.map((r) => r.name),
    series: [{ name, data: head.map((r) => r.count) }],
  };
}

function hbar(rows: { name: string; count: number }[], name: string, suffix?: string): WidgetData {
  return {
    kind: "chart",
    chart: "hbar",
    labels: rows.map((r) => r.name || "—"),
    series: [{ name, data: rows.map((r) => num(r.count)) }],
    suffix,
  };
}

const periodDays = (o: Record<string, any>) => int(o.days, 1, 3650);
const limitOf = (o: Record<string, any>) => int(o.limit, 1, 50);
const topOf = (o: Record<string, any>) => int(o.top, 1, 30);

const ORG_NAME_SQL = "COALESCE(o.name, NULLIF(s.organization, ''), 'Не указано')";
const ORG_GROUP_SQL = "COALESCE(o.id, NULLIF(s.organization, ''), '-')";

const ACTIVE_GROUP_SQL = "sg.start_date <= CURDATE() AND sg.end_date >= CURDATE()";

const HOURS_SQL =
  "COALESCE(se.academic_hours, CEIL(COALESCE(se.duration_minutes, TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) / ?))";

// ───────────────────────── resolvers ─────────────────────────

const resolvers: Record<string, Resolver> = {
  // ── KPI ──
  kpi_students: async () => kpi(await scalar("SELECT COUNT(*) FROM students")),

  kpi_trained: async () =>
    kpi(await scalar("SELECT COUNT(DISTINCT student_id) FROM issued_certificates WHERE status = 'issued'")),

  kpi_students_on_courses: async () =>
    kpi(
      await scalar(`
        SELECT COUNT(DISTINCT sgs.student_id)
        FROM study_group_students sgs
        JOIN study_groups sg ON sg.id = sgs.group_id
        WHERE ${ACTIVE_GROUP_SQL}`),
    ),

  kpi_active_groups: async () => {
    const [active, upcoming] = await Promise.all([
      scalar(`SELECT COUNT(*) FROM study_groups sg WHERE ${ACTIVE_GROUP_SQL}`),
      scalar(
        "SELECT COUNT(*) FROM study_groups WHERE start_date > CURDATE() AND start_date <= CURDATE() + INTERVAL 14 DAY",
      ),
    ]);
    return kpi(active, undefined, upcoming > 0 ? `+${upcoming} стартуют в ближайшие 2 недели` : undefined);
  },

  kpi_instructors: async () => kpi(await scalar("SELECT COUNT(*) FROM instructors WHERE is_active = 1")),

  kpi_courses: async () => kpi(await scalar("SELECT COUNT(*) FROM courses WHERE is_active = 1")),

  kpi_organizations: async () => kpi(await scalar("SELECT COUNT(*) FROM organizations")),

  kpi_certificates_total: async () =>
    kpi(await scalar("SELECT COUNT(*) FROM issued_certificates WHERE status = 'issued'")),

  kpi_certificates_period: async ({ options }) => {
    const from: Record<string, string> = {
      today: "CURDATE()",
      week: "CURDATE() - INTERVAL 6 DAY",
      month: "DATE_FORMAT(CURDATE(), '%Y-%m-01')",
      year: "MAKEDATE(YEAR(CURDATE()), 1)",
    };
    const hint: Record<string, string> = {
      today: "сегодня",
      week: "за 7 дней",
      month: "в этом месяце",
      year: "в этом году",
    };
    const p = from[options.period] ? options.period : "month";
    const value = await scalar(
      `SELECT COUNT(*) FROM issued_certificates WHERE status = 'issued' AND issue_date >= ${from[p]}`,
    );
    return kpi(value, undefined, hint[p]);
  },

  kpi_lessons_today: async () => {
    const [total, done] = await Promise.all([
      scalar(
        "SELECT COUNT(*) FROM schedule_events WHERE start_time >= CURDATE() AND start_time < CURDATE() + INTERVAL 1 DAY",
      ),
      scalar(
        "SELECT COUNT(*) FROM schedule_events WHERE start_time >= CURDATE() AND start_time < CURDATE() + INTERVAL 1 DAY AND end_time < NOW()",
      ),
    ]);
    return kpi(total, undefined, total > 0 ? `проведено ${done} из ${total}` : undefined);
  },

  kpi_tests_period: async ({ options }) => {
    const days = periodDays(options);
    const value = await scalar(
      "SELECT COUNT(*) FROM test_sessions WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL ? DAY",
      [days],
    );
    return kpi(value, undefined, `за ${days} дн.`);
  },

  kpi_pass_rate: async ({ options }) => {
    const days = periodDays(options);
    const rows = await executeQuery<any[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS passed
       FROM test_sessions WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL ? DAY`,
      [days],
    );
    const total = num(rows[0]?.total);
    const passed = num(rows[0]?.passed);
    return kpi(total ? Math.round((passed * 100) / total) : 0, "%", `${passed} из ${total} за ${days} дн.`);
  },

  kpi_attendance_rate: async ({ options }) => {
    const days = periodDays(options);
    const rows = await executeQuery<any[]>(
      `SELECT SUM(a.hours_attended) AS att, SUM(a.max_hours) AS mx
       FROM attendance a
       JOIN schedule_events se ON se.id = a.schedule_event_id
       WHERE se.start_time >= NOW() - INTERVAL ? DAY AND se.start_time <= NOW()`,
      [days],
    );
    const mx = num(rows[0]?.mx);
    return kpi(mx ? Math.round((num(rows[0]?.att) * 100) / mx) : 0, "%", `за ${days} дн.`);
  },

  kpi_verifications: async () => {
    const [total, month] = await Promise.all([
      scalar("SELECT COUNT(*) FROM certificate_verification_logs WHERE result = 'found'"),
      scalar(
        "SELECT COUNT(*) FROM certificate_verification_logs WHERE result = 'found' AND created_at >= NOW() - INTERVAL 30 DAY",
      ),
    ]);
    return kpi(total, undefined, `${month} за 30 дн.`);
  },

  kpi_training_requests: async ({ options }) => {
    const labels: Record<string, string> = {
      pending: "ожидают рассмотрения",
      approved: "одобрены",
      in_progress: "в работе",
      completed: "завершены",
      all: "всего",
    };
    const st = labels[options.status] ? options.status : "pending";
    const value =
      st === "all"
        ? await scalar("SELECT COUNT(*) FROM training_requests")
        : await scalar("SELECT COUNT(*) FROM training_requests WHERE status = ?", [st]);
    return kpi(value, undefined, labels[st]);
  },

  kpi_hours_period: async ({ options }) => {
    const days = periodDays(options);
    const minutes = await getAcademicHourMinutes();
    const value = await scalar(
      `SELECT COALESCE(SUM(${HOURS_SQL}), 0)
       FROM schedule_events se
       WHERE se.end_time <= NOW() AND se.start_time >= NOW() - INTERVAL ? DAY`,
      [minutes, days],
    );
    return kpi(Math.round(value), " ч", `за ${days} дн.`);
  },

  // ── Графики ──
  chart_certificates_by_month: async ({ options }) =>
    monthlySeries(
      `SELECT DATE_FORMAT(issue_date, '%Y-%m') AS month, COUNT(*) AS count
       FROM issued_certificates
       WHERE status = 'issued' AND issue_date >= ?
       GROUP BY month`,
      int(options.months, 1, 36),
      "Сертификаты",
    ),

  chart_students_by_month: async ({ options }) =>
    monthlySeries(
      `SELECT DATE_FORMAT(enrolled_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM study_group_students
       WHERE enrolled_at >= ?
       GROUP BY month`,
      int(options.months, 1, 36),
      "Зачислено",
    ),

  chart_attendance_trend: async ({ options }) => {
    const weeks = int(options.weeks, 2, 52);
    const rows = await executeQuery<any[]>(
      `SELECT DATE_FORMAT(DATE_SUB(DATE(se.start_time), INTERVAL WEEKDAY(se.start_time) DAY), '%Y-%m-%d') AS wk,
              SUM(a.hours_attended) AS att, SUM(a.max_hours) AS mx
       FROM attendance a
       JOIN schedule_events se ON se.id = a.schedule_event_id
       WHERE se.start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) - INTERVAL ? WEEK
         AND se.start_time <= NOW()
       GROUP BY wk`,
      [weeks - 1],
    );
    // Недели без отметок посещаемости — пропуск (null), а не 0%, чтобы не рисовать ложный провал
    const map = new Map(rows.filter((r) => num(r.mx) > 0).map((r) => [String(r.wk), Math.round((num(r.att) * 100) / num(r.mx))]));
    const labels: string[] = [];
    const data: (number | null)[] = [];
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - i * 7);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      labels.push(`${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`);
      data.push(map.get(key) ?? null);
    }
    return { kind: "chart", chart: "series", labels, series: [{ name: "Посещаемость", data: data as number[] }], suffix: "%" };
  },

  chart_students_by_org: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT ${ORG_NAME_SQL} AS name, COUNT(s.id) AS count
       FROM students s LEFT JOIN organizations o ON o.id = s.organization_id
       GROUP BY ${ORG_GROUP_SQL}, name ORDER BY count DESC`,
    );
    return topWithOthers(rows, topOf(options), "Слушатели", options.chartStyle);
  },

  chart_trained_by_org: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT ${ORG_NAME_SQL} AS name, COUNT(DISTINCT s.id) AS count
       FROM students s
       JOIN issued_certificates ic ON ic.student_id = s.id AND ic.status = 'issued'
       LEFT JOIN organizations o ON o.id = s.organization_id
       GROUP BY ${ORG_GROUP_SQL}, name ORDER BY count DESC`,
    );
    return topWithOthers(rows, topOf(options), "Обучено", options.chartStyle);
  },

  chart_students_by_course: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT COALESCE(NULLIF(c.short_name, ''), c.name) AS name, COUNT(DISTINCT sgs.student_id) AS count
       FROM study_group_students sgs
       JOIN study_groups sg ON sg.id = sgs.group_id
       JOIN courses c ON c.id = sg.course_id
       WHERE ${ACTIVE_GROUP_SQL}
       GROUP BY c.id, name ORDER BY count DESC`,
    );
    return topWithOthers(rows, topOf(options), "Слушатели", options.chartStyle);
  },

  chart_top_courses: async ({ options }) => {
    const top = topOf(options);
    const metric = options.metric;
    let sql: string;
    let label: string;
    if (metric === "groups") {
      label = "Группы";
      sql = `SELECT c.name AS name, COUNT(sg.id) AS count
             FROM courses c JOIN study_groups sg ON sg.course_id = c.id
             GROUP BY c.id, c.name ORDER BY count DESC LIMIT ${top}`;
    } else if (metric === "certificates") {
      label = "Сертификаты";
      sql = `SELECT COALESCE(c.name, NULLIF(ic.course_name, ''), 'Без программы') AS name, COUNT(*) AS count
             FROM issued_certificates ic
             LEFT JOIN study_groups sg ON sg.id = ic.group_id
             LEFT JOIN courses c ON c.id = sg.course_id
             WHERE ic.status = 'issued'
             GROUP BY name ORDER BY count DESC LIMIT ${top}`;
    } else {
      label = "Слушатели";
      sql = `SELECT c.name AS name, COUNT(DISTINCT sgs.student_id) AS count
             FROM courses c
             JOIN study_groups sg ON sg.course_id = c.id
             JOIN study_group_students sgs ON sgs.group_id = sg.id
             GROUP BY c.id, c.name ORDER BY count DESC LIMIT ${top}`;
    }
    return hbar(await executeQuery<any[]>(sql), label);
  },

  chart_top_instructors: async ({ options, maskNames }) => {
    const minutes = await getAcademicHourMinutes();
    const rows = await executeQuery<any[]>(
      `SELECT i.full_name AS name, COALESCE(SUM(${HOURS_SQL}), 0) AS count
       FROM instructors i
       JOIN schedule_events se ON se.instructor_id = i.id
       WHERE se.end_time <= NOW() AND se.start_time >= NOW() - INTERVAL ? DAY
       GROUP BY i.id, i.full_name
       ORDER BY count DESC LIMIT ${topOf(options)}`,
      [minutes, periodDays(options)],
    );
    return hbar(
      rows.map((r) => ({ name: maskNames ? maskName(r.name) : r.name, count: Math.round(num(r.count)) })),
      "Часы",
      " ч",
    );
  },

  chart_test_results: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS ok,
              SUM(CASE WHEN passed = 1 THEN 0 ELSE 1 END) AS fail
       FROM test_sessions WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL ? DAY`,
      [periodDays(options)],
    );
    return {
      kind: "chart",
      chart: "pie",
      labels: ["Сдали", "Не сдали"],
      series: [{ name: "Тесты", data: [num(rows[0]?.ok), num(rows[0]?.fail)] }],
    };
  },

  chart_grades_distribution: async ({ options }) => {
    // В БД смешаны 5-балльная и 100-балльная шкалы оценок — группируем по проценту выполнения
    const rows = await executeQuery<any[]>(
      `SELECT
         SUM(CASE WHEN score_percent >= 90 THEN 1 ELSE 0 END) AS b90,
         SUM(CASE WHEN score_percent >= 75 AND score_percent < 90 THEN 1 ELSE 0 END) AS b75,
         SUM(CASE WHEN score_percent >= 60 AND score_percent < 75 THEN 1 ELSE 0 END) AS b60,
         SUM(CASE WHEN score_percent < 60 THEN 1 ELSE 0 END) AS b0
       FROM test_sessions
       WHERE status = 'completed' AND score_percent IS NOT NULL AND completed_at >= NOW() - INTERVAL ? DAY`,
      [periodDays(options)],
    );
    const r = rows[0] || {};
    return {
      kind: "chart",
      chart: "series",
      labels: ["90–100%", "75–89%", "60–74%", "менее 60%"],
      series: [{ name: "Тестов", data: [num(r.b90), num(r.b75), num(r.b60), num(r.b0)] }],
    };
  },

  chart_event_types: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT COALESCE(event_type, 'other') AS kind, COUNT(*) AS count
       FROM schedule_events
       WHERE start_time >= NOW() - INTERVAL ? DAY AND start_time <= NOW()
       GROUP BY kind ORDER BY count DESC`,
      [periodDays(options)],
    );
    return {
      kind: "chart",
      chart: "pie",
      labels: rows.map((r) => eventKindLabel(r.kind)),
      series: [{ name: "Занятия", data: rows.map((r) => num(r.count)) }],
    };
  },

  chart_training_requests_status: async () => {
    const labels: Record<string, string> = {
      pending: "Ожидают",
      approved: "Одобрены",
      in_progress: "В работе",
      completed: "Завершены",
      rejected: "Отклонены",
    };
    const rows = await executeQuery<any[]>(
      "SELECT status, COUNT(*) AS count FROM training_requests GROUP BY status ORDER BY count DESC",
    );
    return {
      kind: "chart",
      chart: "pie",
      labels: rows.map((r) => labels[r.status] ?? r.status),
      series: [{ name: "Заявки", data: rows.map((r) => num(r.count)) }],
    };
  },

  // ── Списки ──
  list_today_schedule: async ({ options, maskNames }) => {
    const rows = await executeQuery<any[]>(
      `SELECT DATE_FORMAT(se.start_time, '%H:%i') AS t_start, DATE_FORMAT(se.end_time, '%H:%i') AS t_end,
              se.title, se.event_type, sg.code AS group_code, i.full_name AS instructor,
              COALESCE(cr.name, sg.classroom) AS room,
              CASE WHEN se.end_time < NOW() THEN 'done' WHEN se.start_time <= NOW() THEN 'now' ELSE 'next' END AS state
       FROM schedule_events se
       LEFT JOIN study_groups sg ON sg.id = se.group_id
       LEFT JOIN instructors i ON i.id = se.instructor_id
       LEFT JOIN classrooms cr ON cr.id = se.classroom_id
       WHERE se.start_time >= CURDATE() AND se.start_time < CURDATE() + INTERVAL 1 DAY
         ${options.hidePast ? "AND se.end_time >= NOW()" : ""}
       ORDER BY se.start_time ASC
       LIMIT ${limitOf(options)}`,
    );
    return {
      kind: "list",
      columns: [
        { key: "time", label: "Время" },
        { key: "title", label: "Занятие" },
        { key: "group", label: "Группа" },
        { key: "instructor", label: "Инструктор" },
        { key: "room", label: "Аудитория" },
      ],
      rows: rows.map((r) => ({
        time: `${r.t_start}–${r.t_end}`,
        title: r.title,
        group: r.group_code ?? "—",
        instructor: maskNames ? maskName(r.instructor) : r.instructor ?? "—",
        room: r.room ?? "—",
        _state: r.state,
      })),
    };
  },

  list_active_groups: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT sg.code, COALESCE(NULLIF(c.short_name, ''), c.name) AS course,
              DATE_FORMAT(sg.end_date, '%d.%m.%Y') AS end_date,
              (SELECT COUNT(*) FROM study_group_students x WHERE x.group_id = sg.id) AS students,
              LEAST(100, GREATEST(0, ROUND(
                DATEDIFF(CURDATE(), sg.start_date) * 100 / NULLIF(DATEDIFF(sg.end_date, sg.start_date), 0)
              ))) AS progress
       FROM study_groups sg
       JOIN courses c ON c.id = sg.course_id
       WHERE ${ACTIVE_GROUP_SQL}
       ORDER BY sg.end_date ASC
       LIMIT ${limitOf(options)}`,
    );
    return {
      kind: "list",
      columns: [
        { key: "code", label: "Группа" },
        { key: "course", label: "Программа" },
        { key: "students", label: "Слушат.", align: "right" },
        { key: "progress", label: "Прогресс", progress: true },
        { key: "end_date", label: "До", align: "right" },
      ],
      rows: rows.map((r) => ({ ...r, students: num(r.students), progress: num(r.progress ?? 100) })),
    };
  },

  list_groups_ending: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT sg.code, COALESCE(NULLIF(c.short_name, ''), c.name) AS course,
              DATE_FORMAT(sg.end_date, '%d.%m') AS end_date,
              (SELECT COUNT(*) FROM study_group_students x WHERE x.group_id = sg.id) AS students
       FROM study_groups sg JOIN courses c ON c.id = sg.course_id
       WHERE sg.end_date >= CURDATE() AND sg.end_date <= CURDATE() + INTERVAL ? DAY
       ORDER BY sg.end_date ASC LIMIT ${limitOf(options)}`,
      [int(options.days, 1, 365)],
    );
    return {
      kind: "list",
      columns: [
        { key: "code", label: "Группа" },
        { key: "course", label: "Программа" },
        { key: "students", label: "Слуш.", align: "right" },
        { key: "end_date", label: "Дата", align: "right" },
      ],
      rows: rows.map((r) => ({ ...r, students: num(r.students) })),
    };
  },

  list_upcoming_groups: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT sg.code, COALESCE(NULLIF(c.short_name, ''), c.name) AS course,
              DATE_FORMAT(sg.start_date, '%d.%m') AS start_date,
              (SELECT COUNT(*) FROM study_group_students x WHERE x.group_id = sg.id) AS students
       FROM study_groups sg JOIN courses c ON c.id = sg.course_id
       WHERE sg.start_date > CURDATE() AND sg.start_date <= CURDATE() + INTERVAL ? DAY
       ORDER BY sg.start_date ASC LIMIT ${limitOf(options)}`,
      [int(options.days, 1, 365)],
    );
    return {
      kind: "list",
      columns: [
        { key: "code", label: "Группа" },
        { key: "course", label: "Программа" },
        { key: "students", label: "Слуш.", align: "right" },
        { key: "start_date", label: "Старт", align: "right" },
      ],
      rows: rows.map((r) => ({ ...r, students: num(r.students) })),
    };
  },

  list_recent_certificates: async ({ options, maskNames }) => {
    const rows = await executeQuery<any[]>(
      `SELECT s.full_name, COALESCE(NULLIF(ic.course_name, ''), NULLIF(c.short_name, ''), c.name) AS course_name,
              ${ORG_NAME_SQL} AS org,
              DATE_FORMAT(ic.issue_date, '%d.%m.%Y') AS issue_date
       FROM issued_certificates ic
       JOIN students s ON s.id = ic.student_id
       LEFT JOIN organizations o ON o.id = s.organization_id
       LEFT JOIN study_groups sg ON sg.id = ic.group_id
       LEFT JOIN courses c ON c.id = sg.course_id
       WHERE ic.status = 'issued'
       ORDER BY ic.issue_date DESC, ic.created_at DESC
       LIMIT ${limitOf(options)}`,
    );
    return {
      kind: "list",
      columns: [
        { key: "name", label: "Слушатель" },
        { key: "course", label: "Программа" },
        { key: "org", label: "Организация" },
        { key: "date", label: "Дата", align: "right" },
      ],
      rows: rows.map((r) => ({
        name: maskNames ? maskName(r.full_name) : r.full_name,
        course: r.course_name,
        org: r.org,
        date: r.issue_date,
      })),
    };
  },

  list_top_organizations: async ({ options }) => {
    const rows = await executeQuery<any[]>(
      `SELECT ${ORG_NAME_SQL} AS org, COUNT(DISTINCT s.id) AS count
       FROM issued_certificates ic
       JOIN students s ON s.id = ic.student_id
       LEFT JOIN organizations o ON o.id = s.organization_id
       WHERE ic.status = 'issued' AND ic.issue_date >= CURDATE() - INTERVAL ? DAY
       GROUP BY ${ORG_GROUP_SQL}, org ORDER BY count DESC LIMIT ${limitOf(options)}`,
      [periodDays(options)],
    );
    return {
      kind: "list",
      columns: [
        { key: "place", label: "#", align: "center" },
        { key: "org", label: "Организация" },
        { key: "count", label: "Обучено", align: "right" },
      ],
      rows: rows.map((r, i) => ({ place: i + 1, org: r.org, count: num(r.count) })),
    };
  },

  // ── Оперативные: расписание на неделю, статусы, тревоги ──
  ...opsResolvers,

  // ── Статичные (данные не нужны) ──
  clock: async () => ({ kind: "static" }),
  text: async () => ({ kind: "static" }),
};

/** Данные одного виджета (с кешем) */
export async function resolveWidgetData(widget: DashboardWidget, settings: DashboardSettings): Promise<WidgetData> {
  const def = getWidgetDef(widget.type);
  const resolver = resolvers[widget.type];
  if (!def || !resolver) return { kind: "error", message: "Неизвестный виджет" };

  const options = normalizeWidgetOptions(def, widget.options);
  if (def.kind === "clock" || def.kind === "text") return { kind: "static" };

  const key = `${widget.type}|${JSON.stringify(options)}|${settings.maskNames ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  try {
    const data = await resolver({ options, maskNames: settings.maskNames });
    cache.set(key, { at: Date.now(), data });
    if (cache.size > 500) {
      const cutoff = Date.now() - CACHE_TTL_MS;
      for (const [k, v] of cache) if (v.at < cutoff) cache.delete(k);
    }
    return data;
  } catch (e: any) {
    console.error(`[publicDashboard] widget ${widget.type} failed:`, e?.message || e);
    return { kind: "error", message: "Данные недоступны" };
  }
}

/** Данные для всех виджетов дашборда: { [widgetId]: WidgetData } */
export async function resolveDashboardData(
  widgets: DashboardWidget[],
  settings: DashboardSettings,
): Promise<Record<string, WidgetData>> {
  const entries = await Promise.all(
    widgets.map(async (w) => [w.id, await resolveWidgetData(w, settings)] as const),
  );
  return Object.fromEntries(entries);
}
