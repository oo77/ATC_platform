/**
 * Публичные дашборды: оперативные виджеты
 * (недельное расписание, статус аудиторий / инструкторов / групп, тревоги).
 *
 * Время «сейчас» и даты берутся из MySQL (NOW(), CURDATE()), а не из Node —
 * так статусы совпадают с остальным расписанием независимо от часового пояса процесса.
 */

import { executeQuery } from "../utils/db";
import { addDays, dayLabel, int, maskName, num } from "../utils/publicDashboardFormat";
import type { StatusTone, WidgetData } from "../../shared/utils/publicDashboard";

interface Ctx {
  options: Record<string, any>;
  maskNames: boolean;
}
type Resolver = (ctx: Ctx) => Promise<WidgetData>;
type StatusItem = Extract<WidgetData, { kind: "status" }>["items"][number];

// ───────────────────────── общие выборки ─────────────────────────

interface DayEvent {
  id: string;
  title: string;
  type: string;
  groupId: string | null;
  group: string;
  instructorId: string | null;
  instructor: string;
  roomId: string | null;
  room: string;
  /** минуты от полуночи */
  s: number;
  e: number;
  sLabel: string;
  eLabel: string;
}

/** Занятия на сегодня + текущее время (минуты от полуночи) по часам БД */
async function todayEvents(maskNames: boolean): Promise<{ now: number; events: DayEvent[] }> {
  const [nowRows, rows] = await Promise.all([
    executeQuery<any[]>("SELECT TIME_TO_SEC(CURTIME()) / 60 AS m"),
    executeQuery<any[]>(
      `SELECT se.id, se.title, COALESCE(se.event_type, 'other') AS type,
              se.group_id, sg.code AS group_code,
              se.instructor_id, i.full_name AS instructor,
              se.classroom_id, COALESCE(cr.name, NULLIF(sg.classroom, '')) AS room,
              TIME_TO_SEC(TIME(se.start_time)) / 60 AS s,
              CASE WHEN DATE(se.end_time) > DATE(se.start_time) THEN 1440
                   ELSE TIME_TO_SEC(TIME(se.end_time)) / 60 END AS e,
              DATE_FORMAT(se.start_time, '%H:%i') AS sl, DATE_FORMAT(se.end_time, '%H:%i') AS el
       FROM schedule_events se
       LEFT JOIN study_groups sg ON sg.id = se.group_id
       LEFT JOIN instructors i ON i.id = se.instructor_id
       LEFT JOIN classrooms cr ON cr.id = se.classroom_id
       WHERE se.start_time >= CURDATE() AND se.start_time < CURDATE() + INTERVAL 1 DAY
       ORDER BY se.start_time ASC`,
    ),
  ]);
  return {
    now: num(nowRows[0]?.m),
    events: rows.map((r) => ({
      id: r.id,
      title: r.title || "Занятие",
      type: r.type,
      groupId: r.group_id,
      group: r.group_code || "—",
      instructorId: r.instructor_id,
      instructor: r.instructor ? (maskNames ? maskName(r.instructor) : r.instructor) : "—",
      roomId: r.classroom_id,
      room: r.room || "Без аудитории",
      s: num(r.s),
      e: num(r.e),
      sLabel: r.sl,
      eLabel: r.el,
    })),
  };
}

/** Неотмеченные прошедшие занятия (нет ни одной записи посещаемости), сгруппированные по ключу */
async function unmarkedBy(column: "instructor_id" | "group_id", days: number): Promise<Map<string, number>> {
  const rows = await executeQuery<any[]>(
    `SELECT se.${column} AS k, COUNT(*) AS n
     FROM schedule_events se
     WHERE se.end_time < NOW() AND se.start_time >= NOW() - INTERVAL ? DAY
       AND se.${column} IS NOT NULL
       AND EXISTS (SELECT 1 FROM study_group_students x WHERE x.group_id = se.group_id)
       AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)
     GROUP BY se.${column}`,
    [days],
  );
  return new Map(rows.map((r) => [String(r.k), num(r.n)]));
}

const UNMARKED_WHERE = `
  se.end_time < NOW() AND se.start_time >= NOW() - INTERVAL ? DAY
  AND EXISTS (SELECT 1 FROM study_group_students x WHERE x.group_id = se.group_id)
  AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)`;

const TONE_ORDER: Record<StatusTone, number> = { danger: 0, info: 1, warning: 2, success: 3, muted: 4 };

function summarize(items: StatusItem[], labels: Partial<Record<StatusTone, string>>) {
  const counts = new Map<StatusTone, number>();
  for (const it of items) counts.set(it.tone, (counts.get(it.tone) ?? 0) + 1);
  return (Object.keys(labels) as StatusTone[])
    .filter((t) => counts.get(t))
    .map((t) => ({ tone: t, label: labels[t]!, count: counts.get(t)! }));
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

const minutesLeft = (from: number, to: number) => {
  const m = Math.max(0, Math.round(to - from));
  return m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч ${m % 60 ? `${m % 60} мин` : ""}`.trim();
};

// ───────────────────────── резолверы ─────────────────────────

export const opsResolvers: Record<string, Resolver> = {
  // ── Недельное расписание ──
  week_schedule: async ({ options, maskNames }) => {
    const [t] = await executeQuery<any[]>(
      "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today, WEEKDAY(CURDATE()) AS wd",
    );
    const today: string = t.today;
    const range = options.range;
    const start = range === "week" ? addDays(today, -num(t.wd)) : today;
    const len = range === "next5" ? 5 : 7;
    const end = addDays(start, len);

    const rows = await executeQuery<any[]>(
      `SELECT DATE_FORMAT(se.start_time, '%Y-%m-%d') AS d,
              DATE_FORMAT(se.start_time, '%H:%i') AS sl, DATE_FORMAT(se.end_time, '%H:%i') AS el,
              se.title, COALESCE(se.event_type, 'other') AS type, sg.code AS group_code,
              COALESCE(cr.name, NULLIF(sg.classroom, '')) AS room, i.full_name AS instructor,
              CASE WHEN se.end_time < NOW() THEN 'done' WHEN se.start_time <= NOW() THEN 'now' ELSE 'next' END AS state
       FROM schedule_events se
       LEFT JOIN study_groups sg ON sg.id = se.group_id
       LEFT JOIN classrooms cr ON cr.id = se.classroom_id
       LEFT JOIN instructors i ON i.id = se.instructor_id
       WHERE se.start_time >= ? AND se.start_time < ?
       ORDER BY se.start_time ASC
       LIMIT 400`,
      [start, end],
    );

    const days = Array.from({ length: len }, (_, i) => {
      const key = addDays(start, i);
      const lbl = dayLabel(key);
      return { key, weekday: lbl.weekday, date: lbl.date, isToday: key === today, events: [] as any[] };
    });
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const r of rows) {
      byKey.get(r.d)?.events.push({
        start: r.sl,
        end: r.el,
        title: r.title || "Занятие",
        type: r.type,
        group: r.group_code || "—",
        room: r.room || "—",
        instructor: options.showInstructor === false ? "" : r.instructor ? (maskNames ? maskName(r.instructor) : r.instructor) : "—",
        state: r.state,
      });
    }
    return {
      kind: "week",
      days: options.hideEmptyDays ? days.filter((d) => d.events.length || d.isToday) : days,
    };
  },

  // ── Статус аудиторий ──
  status_rooms: async ({ options, maskNames }) => {
    const soon = int(options.soonMinutes, 1, 600);
    const [{ now, events }, rooms] = await Promise.all([
      todayEvents(maskNames),
      executeQuery<any[]>("SELECT id, name, capacity FROM classrooms WHERE is_active = 1 ORDER BY name"),
    ]);

    const items: (StatusItem & { _order: number })[] = [];
    for (const room of rooms) {
      const list = events.filter((e) => e.roomId === room.id);
      if (options.onlyUsedToday && !list.length) continue;
      const current = list.filter((e) => e.s <= now && now < e.e);
      const next = list.find((e) => e.s > now);
      const subtitle = room.capacity ? `${room.capacity} мест` : undefined;
      const badges: StatusItem["badges"] = [];
      if (current.length > 1) badges.push({ tone: "danger", text: "Накладка" });

      if (current.length) {
        const c = current[0]!;
        items.push({
          title: room.name,
          subtitle,
          tone: "danger",
          label: "Занята",
          lines: [`${c.group} · ${c.title}`, `до ${c.eLabel} (ещё ${minutesLeft(now, c.e)})`],
          badges,
          _order: 0,
        });
      } else if (next && next.s - now <= soon) {
        items.push({
          title: room.name,
          subtitle,
          tone: "warning",
          label: `Через ${minutesLeft(now, next.s)}`,
          lines: [`${next.sLabel} · ${next.group}`, next.instructor],
          badges,
          _order: 1,
        });
      } else if (next) {
        items.push({
          title: room.name,
          subtitle,
          tone: "success",
          label: "Свободна",
          lines: [`до ${next.sLabel}`, `далее: ${next.group}`],
          badges,
          _order: 2,
        });
      } else {
        items.push({
          title: room.name,
          subtitle,
          tone: list.length ? "success" : "muted",
          label: "Свободна",
          lines: [list.length ? "Занятия на сегодня окончены" : "Сегодня без занятий"],
          badges,
          _order: list.length ? 3 : 4,
        });
      }
    }

    // Занятия, у которых не указана аудитория, — отдельной карточкой
    const noRoomNow = events.filter((e) => !e.roomId && e.s <= now && now < e.e);
    if (noRoomNow.length) {
      items.push({
        title: "Без аудитории",
        tone: "danger",
        label: `${noRoomNow.length} ${plural(noRoomNow.length, "занятие", "занятия", "занятий")}`,
        lines: noRoomNow.slice(0, 2).map((e) => `${e.group} · до ${e.eLabel}`),
        _order: 0,
      });
    }

    items.sort((a, b) => a._order - b._order || a.title.localeCompare(b.title, "ru"));
    return {
      kind: "status",
      summary: summarize(items, { danger: "Заняты", warning: "Скоро занятие", success: "Свободны", muted: "Без занятий" }),
      items: items.map(({ _order, ...it }) => it),
      empty: "Нет активных аудиторий",
    };
  },

  // ── Статус инструкторов ──
  status_instructors: async ({ options, maskNames }) => {
    const [{ now, events }, unmarked, all] = await Promise.all([
      todayEvents(maskNames),
      unmarkedBy("instructor_id", int(options.unmarkedDays, 1, 365)),
      options.scope === "all"
        ? executeQuery<any[]>("SELECT id, full_name FROM instructors WHERE is_active = 1 ORDER BY full_name")
        : Promise.resolve([] as any[]),
    ]);

    const ids = new Map<string, string>();
    for (const e of events) if (e.instructorId) ids.set(e.instructorId, e.instructor);
    for (const r of all) if (!ids.has(r.id)) ids.set(r.id, maskNames ? maskName(r.full_name) : r.full_name);

    const items: StatusItem[] = [];
    for (const [id, name] of ids) {
      const list = events.filter((e) => e.instructorId === id);
      const current = list.find((e) => e.s <= now && now < e.e);
      const next = list.find((e) => e.s > now);
      const done = list.filter((e) => e.e <= now).length;
      const badges: StatusItem["badges"] = [];
      const um = unmarked.get(id) ?? 0;
      if (um) badges.push({ tone: "danger", text: `Не отмечено: ${um}` });
      if (list.filter((e) => e.s <= now && now < e.e).length > 1) badges.push({ tone: "danger", text: "Накладка" });

      if (current) {
        items.push({
          title: name,
          tone: "info",
          label: "На занятии",
          lines: [`${current.room} · ${current.group}`, `до ${current.eLabel}`],
          badges,
        });
      } else if (next) {
        items.push({
          title: name,
          tone: "warning",
          label: done ? "Перерыв" : `Начнёт в ${next.sLabel}`,
          lines: [`${done ? `след. ${next.sLabel} · ` : ""}${next.room}`, `${next.group} · ${list.length} ${plural(list.length, "занятие", "занятия", "занятий")} сегодня`],
          badges,
        });
      } else if (list.length) {
        items.push({
          title: name,
          tone: "success",
          label: "Завершил",
          lines: [`Провёл ${done} ${plural(done, "занятие", "занятия", "занятий")}`],
          badges,
        });
      } else {
        items.push({ title: name, tone: "muted", label: "Нет занятий", lines: ["Сегодня занятий нет"], badges });
      }
    }

    items.sort(
      (a, b) =>
        (b.badges?.length ? 1 : 0) - (a.badges?.length ? 1 : 0) ||
        TONE_ORDER[a.tone] - TONE_ORDER[b.tone] ||
        a.title.localeCompare(b.title, "ru"),
    );
    return {
      kind: "status",
      summary: summarize(items, { info: "На занятии", warning: "Ожидают / перерыв", success: "Завершили", muted: "Без занятий" }),
      items,
      empty: "Сегодня у инструкторов нет занятий",
    };
  },

  // ── Статус групп ──
  status_groups: async ({ options, maskNames }) => {
    const [{ now, events }, unmarked, groups] = await Promise.all([
      todayEvents(maskNames),
      unmarkedBy("group_id", int(options.unmarkedDays, 1, 365)),
      executeQuery<any[]>(
        `SELECT sg.id, sg.code, COALESCE(NULLIF(c.short_name, ''), c.name) AS course,
                DATEDIFF(sg.end_date, CURDATE()) AS days_left, DATEDIFF(CURDATE(), sg.start_date) AS days_in,
                (SELECT COUNT(*) FROM study_group_students x WHERE x.group_id = sg.id) AS students
         FROM study_groups sg JOIN courses c ON c.id = sg.course_id
         WHERE sg.start_date <= CURDATE() AND sg.end_date >= CURDATE()
         ORDER BY sg.code`,
      ),
    ]);

    const items: StatusItem[] = groups.map((g) => {
      const list = events.filter((e) => e.groupId === g.id);
      const current = list.find((e) => e.s <= now && now < e.e);
      const next = list.find((e) => e.s > now);
      const badges: StatusItem["badges"] = [];
      const um = unmarked.get(g.id) ?? 0;
      if (um) badges.push({ tone: "danger", text: `Не отмечено: ${um}` });
      if (num(g.days_left) === 0) badges.push({ tone: "warning", text: "Последний день" });
      else if (num(g.days_in) === 0) badges.push({ tone: "info", text: "Первый день" });
      const subtitle = `${g.course} · ${num(g.students)} слуш.`;

      if (current) {
        return {
          title: g.code,
          subtitle,
          tone: "info",
          label: "На занятии",
          lines: [`${current.room} · ${current.instructor}`, `${current.title} · до ${current.eLabel}`],
          badges,
        };
      }
      if (next) {
        const started = list.some((e) => e.e <= now);
        return {
          title: g.code,
          subtitle,
          tone: "warning",
          label: started ? "Перерыв" : `Начало в ${next.sLabel}`,
          lines: [`${started ? `след. ${next.sLabel} · ` : ""}${next.room}`, next.instructor],
          badges,
        };
      }
      if (list.length) {
        return {
          title: g.code,
          subtitle,
          tone: "success",
          label: "Занятия окончены",
          lines: [`Сегодня ${list.length} ${plural(list.length, "занятие", "занятия", "занятий")}`],
          badges,
        };
      }
      return { title: g.code, subtitle, tone: "muted", label: "Нет занятий", lines: ["Сегодня занятий нет"], badges };
    });

    items.sort(
      (a, b) =>
        (b.badges?.some((x) => x.tone === "danger") ? 1 : 0) - (a.badges?.some((x) => x.tone === "danger") ? 1 : 0) ||
        TONE_ORDER[a.tone] - TONE_ORDER[b.tone] ||
        a.title.localeCompare(b.title, "ru"),
    );
    return {
      kind: "status",
      summary: summarize(items, { info: "На занятии", warning: "Перерыв / ожидают", success: "Окончили", muted: "Без занятий" }),
      items,
      empty: "Нет активных групп",
    };
  },

  // ── Тревоги: что требует внимания ──
  alerts_operational: async ({ options }) => {
    const days = int(options.days, 1, 60);
    const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback);
    const one = async (sql: string, params: any[] = []) => {
      const rows = await executeQuery<any[]>(sql, params);
      return rows[0] || {};
    };

    const OVERLAP = (col: "classroom_id" | "instructor_id") => `
      SELECT COUNT(*) AS n,
             MIN(CONCAT(DATE_FORMAT(a.start_time, '%d.%m %H:%i'), ' · ', COALESCE(${col === "classroom_id" ? "cr.name" : "i.full_name"}, '—'))) AS sample
      FROM schedule_events a
      JOIN schedule_events b ON b.${col} = a.${col} AND a.id < b.id
           AND a.start_time < b.end_time AND b.start_time < a.end_time
      ${col === "classroom_id" ? "LEFT JOIN classrooms cr ON cr.id = a.classroom_id" : "LEFT JOIN instructors i ON i.id = a.instructor_id"}
      WHERE a.${col} IS NOT NULL AND a.end_time >= NOW() AND a.start_time < NOW() + INTERVAL ? DAY`;

    const [unmarked, roomConf, instConf, missing, noSchedule, startNoSchedule, noCerts, markReq, trainReq, tickets] =
      await Promise.all([
        safe(
          one(
            `SELECT COUNT(*) AS n, COUNT(DISTINCT se.group_id) AS g, COUNT(DISTINCT se.instructor_id) AS i
             FROM schedule_events se WHERE ${UNMARKED_WHERE}`,
            [7],
          ),
          {},
        ),
        safe(one(OVERLAP("classroom_id"), [days]), {}),
        safe(one(OVERLAP("instructor_id"), [days]), {}),
        safe(
          one(
            `SELECT SUM(classroom_id IS NULL) AS no_room, SUM(instructor_id IS NULL) AS no_inst
             FROM schedule_events WHERE end_time >= NOW() AND start_time < NOW() + INTERVAL ? DAY`,
            [days],
          ),
          {},
        ),
        safe(
          one(
            `SELECT COUNT(*) AS n, GROUP_CONCAT(sg.code ORDER BY sg.code SEPARATOR ', ') AS codes
             FROM study_groups sg
             WHERE sg.start_date <= CURDATE() AND sg.end_date > CURDATE()
               AND NOT EXISTS (SELECT 1 FROM schedule_events se WHERE se.group_id = sg.id
                               AND se.start_time >= NOW() AND se.start_time < NOW() + INTERVAL ? DAY)`,
            [days],
          ),
          {},
        ),
        safe(
          one(
            `SELECT COUNT(*) AS n, GROUP_CONCAT(sg.code ORDER BY sg.start_date SEPARATOR ', ') AS codes
             FROM study_groups sg
             WHERE sg.start_date > CURDATE() AND sg.start_date <= CURDATE() + INTERVAL ? DAY
               AND NOT EXISTS (SELECT 1 FROM schedule_events se WHERE se.group_id = sg.id)`,
            [days],
          ),
          {},
        ),
        safe(
          one(
            `SELECT COUNT(*) AS n, GROUP_CONCAT(sg.code ORDER BY sg.end_date DESC SEPARATOR ', ') AS codes
             FROM study_groups sg
             WHERE sg.end_date < CURDATE() AND sg.end_date >= CURDATE() - INTERVAL 30 DAY
               AND EXISTS (SELECT 1 FROM study_group_students x WHERE x.group_id = sg.id)
               AND NOT EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.group_id = sg.id AND ic.status = 'issued')`,
          ),
          {},
        ),
        safe(one("SELECT COUNT(*) AS n FROM attendance_marking_requests WHERE status = 'pending'"), {}),
        safe(one("SELECT COUNT(*) AS n FROM training_requests WHERE status = 'pending'"), {}),
        safe(one("SELECT COUNT(*) AS n FROM support_tickets WHERE status IN ('new', 'in_progress')"), {}),
      ]);

    const short = (codes: unknown, max = 4) => {
      const list = String(codes || "").split(", ").filter(Boolean);
      return list.length > max ? `${list.slice(0, max).join(", ")} и ещё ${list.length - max}` : list.join(", ");
    };

    type Item = Extract<WidgetData, { kind: "alerts" }>["items"][number];
    const items: Item[] = [];
    const push = (cond: number, item: Item) => cond > 0 && items.push(item);

    push(num((unmarked as any).n), {
      level: "critical",
      title: "Не отмечена посещаемость",
      detail: `за 7 дней · групп: ${num((unmarked as any).g)}, инструкторов: ${num((unmarked as any).i)}`,
      count: num((unmarked as any).n),
    });
    push(num((roomConf as any).n), {
      level: "critical",
      title: "Накладки аудиторий",
      detail: (roomConf as any).sample ? `например: ${(roomConf as any).sample}` : undefined,
      count: num((roomConf as any).n),
    });
    push(num((instConf as any).n), {
      level: "critical",
      title: "Накладки инструкторов",
      detail: (instConf as any).sample ? `например: ${(instConf as any).sample}` : undefined,
      count: num((instConf as any).n),
    });
    push(num((missing as any).no_room), {
      level: "warning",
      title: "Занятия без аудитории",
      detail: `в ближайшие ${days} дн.`,
      count: num((missing as any).no_room),
    });
    push(num((missing as any).no_inst), {
      level: "warning",
      title: "Занятия без инструктора",
      detail: `в ближайшие ${days} дн.`,
      count: num((missing as any).no_inst),
    });
    push(num((startNoSchedule as any).n), {
      level: "warning",
      title: "Скоро старт, нет расписания",
      detail: short((startNoSchedule as any).codes),
      count: num((startNoSchedule as any).n),
    });
    push(num((noSchedule as any).n), {
      level: "warning",
      title: "Активные группы без занятий",
      detail: `нет занятий на ${days} дн. · ${short((noSchedule as any).codes)}`,
      count: num((noSchedule as any).n),
    });
    push(num((noCerts as any).n), {
      level: "warning",
      title: "Завершены, сертификаты не выданы",
      detail: `за 30 дней · ${short((noCerts as any).codes)}`,
      count: num((noCerts as any).n),
    });
    push(num((markReq as any).n), {
      level: "info",
      title: "Запросы на отметку посещаемости",
      detail: "ожидают решения",
      count: num((markReq as any).n),
    });
    push(num((trainReq as any).n), {
      level: "info",
      title: "Заявки на обучение",
      detail: "ожидают рассмотрения",
      count: num((trainReq as any).n),
    });
    push(num((tickets as any).n), {
      level: "info",
      title: "Обращения в поддержку",
      detail: "новые и в работе",
      count: num((tickets as any).n),
    });

    return { kind: "alerts", items };
  },

  // ── Список неотмеченных занятий ──
  list_unmarked_attendance: async ({ options, maskNames }) => {
    const rows = await executeQuery<any[]>(
      `SELECT DATE_FORMAT(se.start_time, '%d.%m') AS d, DATE_FORMAT(se.start_time, '%H:%i') AS t,
              sg.code AS group_code, i.full_name AS instructor,
              TIMESTAMPDIFF(HOUR, se.end_time, NOW()) AS hours_ago
       FROM schedule_events se
       LEFT JOIN study_groups sg ON sg.id = se.group_id
       LEFT JOIN instructors i ON i.id = se.instructor_id
       WHERE ${UNMARKED_WHERE}
       ORDER BY se.start_time DESC
       LIMIT ${int(options.limit, 1, 50)}`,
      [int(options.days, 1, 365)],
    );
    return {
      kind: "list",
      columns: [
        { key: "when", label: "Занятие" },
        { key: "group", label: "Группа" },
        { key: "instructor", label: "Инструктор" },
        { key: "ago", label: "Прошло", align: "right" },
      ],
      rows: rows.map((r) => {
        const h = num(r.hours_ago);
        return {
          when: `${r.d} ${r.t}`,
          group: r.group_code ?? "—",
          instructor: r.instructor ? (maskNames ? maskName(r.instructor) : r.instructor) : "—",
          ago: h < 24 ? `${h} ч` : `${Math.floor(h / 24)} дн`,
        };
      }),
    };
  },

  // ── KPI ──
  kpi_rooms_busy: async () => {
    const [r] = await executeQuery<any[]>(
      `SELECT
         (SELECT COUNT(DISTINCT classroom_id) FROM schedule_events
          WHERE classroom_id IS NOT NULL AND start_time <= NOW() AND end_time > NOW()) AS busy,
         (SELECT COUNT(*) FROM classrooms WHERE is_active = 1) AS total`,
    );
    const busy = num(r?.busy);
    const total = num(r?.total);
    return { kind: "kpi", value: busy, suffix: ` / ${total}`, hint: `свободно ${Math.max(0, total - busy)}` };
  },

  kpi_lessons_now: async () => {
    const [r] = await executeQuery<any[]>(
      `SELECT
         SUM(start_time <= NOW() AND end_time > NOW()) AS now_n,
         SUM(start_time > NOW()) AS later_n
       FROM schedule_events
       WHERE start_time >= CURDATE() AND start_time < CURDATE() + INTERVAL 1 DAY`,
    );
    const later = num(r?.later_n);
    return { kind: "kpi", value: num(r?.now_n), hint: later ? `ещё ${later} сегодня` : "больше занятий сегодня нет" };
  },

  kpi_unmarked: async ({ options }) => {
    const days = int(options.days, 1, 365);
    const [r] = await executeQuery<any[]>(`SELECT COUNT(*) AS n FROM schedule_events se WHERE ${UNMARKED_WHERE}`, [days]);
    return { kind: "kpi", value: num(r?.n), hint: `за ${days} дн.` };
  },
};
