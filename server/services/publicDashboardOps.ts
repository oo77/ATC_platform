/**
 * Публичные дашборды: оперативные виджеты
 * (недельное расписание, статус аудиторий / инструкторов / групп, тревоги).
 *
 * Время «сейчас» и даты берутся из MySQL (NOW(), CURDATE()), а не из Node —
 * так статусы совпадают с остальным расписанием независимо от часового пояса процесса.
 */

import { executeQuery } from "../utils/db";
import { addDays, dayLabel, int, maskName, num } from "../utils/publicDashboardFormat";
import { getClassrooms } from "../repositories/scheduleRepository";
import { bookingDays, listBookings } from "../repositories/roomBookingRepository";
import type { BookingItem, StatusTone, WidgetData } from "../../shared/utils/publicDashboard";

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

// ───────────────────────── бронь аудиторий ─────────────────────────

type BookingData = Extract<WidgetData, { kind: "booking" }>;

const MAX_BOOKING_COLUMNS = 62;

/** 0 = понедельник */
const weekdayIndex = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return (new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() + 6) % 7;
};

const monthStart = (ymd: string, offset: number) => {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1 + offset, 1)).toISOString().slice(0, 10);
};

/** [0,1,2,4] → «Пн–Ср, Пт»; одиночные и пары перечисляются через запятую */
function weekdaysLabel(indexes: number[]): string {
  const names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const sorted = [...new Set(indexes)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j++;
    if (j - i >= 2) parts.push(`${names[sorted[i]!]}–${names[sorted[j]!]}`);
    else for (let k = i; k <= j; k++) parts.push(names[sorted[k]!]!);
    i = j + 1;
  }
  return parts.join(", ");
}

const shortRange = (from: string, to: string) => {
  const a = dayLabel(from);
  const b = dayLabel(to);
  const [ad, am = ""] = a.date.split(" ");
  const [bd, bm = ""] = b.date.split(" ");
  return am === bm ? `${ad}–${bd} ${bm}` : `${a.date} – ${b.date}`;
};

interface BookingEvent {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  sFull: string;
  eFull: string;
  title: string;
  type: string;
  retake: boolean;
  hours: number | null;
  groupId: string | null;
  group: string;
  course: string;
  instructor: string;
  bookedBy: string;
  bookedAtDate: string;
  now: boolean;
  clash: boolean;
}

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

  // ── Бронь аудиторий: кто, когда и для какого курса ──
  rooms_booking: async ({ options, maskNames }): Promise<BookingData> => {
    const [t] = await executeQuery<any[]>("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
    const today: string = t.today;
    const step: "week" | "day" = options.step === "day" ? "day" : "week";

    // Диапазон дат [rangeStart, rangeEnd)
    const period = String(options.period || "6w");
    let rangeStart: string;
    let rangeEnd: string;
    if (period === "month" || period === "nextMonth") {
      const off = period === "month" ? 0 : 1;
      rangeStart = monthStart(today, off);
      rangeEnd = monthStart(today, off + 1);
    } else {
      const weeks = int(period.replace("w", ""), 1, 12);
      rangeStart = options.startFrom === "today" ? today : addDays(today, -weekdayIndex(today));
      rangeEnd = addDays(rangeStart, weeks * 7);
    }

    // Колонки
    const columns: BookingData["columns"] = [];
    if (step === "week") {
      for (let k = addDays(rangeStart, -weekdayIndex(rangeStart)); k < rangeEnd; k = addDays(k, 7)) {
        const last = addDays(k, 6);
        columns.push({ key: k, label: shortRange(k, last), sub: "", isCurrent: today >= k && today <= last });
      }
    } else {
      for (let k = rangeStart, n = 0; k < rangeEnd && n < MAX_BOOKING_COLUMNS; k = addDays(k, 1), n++) {
        const l = dayLabel(k);
        columns.push({ key: k, label: l.weekday, sub: l.date, isCurrent: k === today });
      }
    }
    const columnKeys = new Set(columns.map((c) => c.key));
    const columnOf = (ymd: string) => (step === "week" ? addDays(ymd, -weekdayIndex(ymd)) : ymd);

    // Аудитории
    const picked: string[] = Array.isArray(options.classrooms) ? options.classrooms.map(String) : [];
    const allRooms = await getClassrooms(true);
    const rooms = picked.length ? allRooms.filter((r) => picked.includes(r.id)) : allRooms;
    if (!rooms.length) {
      return { kind: "booking", columns, rooms: [], clashCount: 0, empty: "Нет активных аудиторий" };
    }

    // ── Источник «Брони под курсы»: планирование без группы и времени ──
    if (options.source !== "events") {
      const lastDay = addDays(rangeEnd, -1);
      const list = await listBookings({ from: rangeStart, to: lastDay, classroomIds: rooms.map((r) => r.id) });
      const person = (name: string | null) => (name ? (maskNames ? maskName(name) : name) : "");
      const colEnd = (key: string) => (step === "week" ? addDays(key, 6) : key);

      const planned: BookingData["rooms"] = rooms.map((room) => {
        const cells: Record<string, BookingItem[]> = {};
        for (const b of list) {
          if (b.classroomId !== room.id) continue;
          for (const col of columns) {
            const days = bookingDays(b, {
              from: col.key < rangeStart ? rangeStart : col.key,
              to: colEnd(col.key) > lastDay ? lastDay : colEnd(col.key),
            });
            if (!days.length) continue;
            (cells[col.key] ??= []).push({
              course: options.showCourse !== false ? b.courseName : "",
              group: options.showGroup !== false ? (b.groupCode ?? "") : "",
              days: step === "week" ? weekdaysLabel(days.map(weekdayIndex)) : "",
              time: "",
              hours: null,
              count: days.length,
              instructors: options.showInstructor !== false ? person(b.instructorName) : "",
              bookedBy: options.showBookedBy !== false ? person(b.createdByName) : "",
              bookedAt: options.showBookedAt === true && b.createdDay ? dayLabel(b.createdDay).date : "",
              type: "theory",
              retake: false,
              clash: false,
              now: days.includes(today),
            });
          }
        }
        return {
          id: room.id,
          name: room.name,
          subtitle: room.capacity ? `${room.capacity} мест` : undefined,
          cells,
        };
      });
      return {
        kind: "booking",
        columns,
        rooms: options.hideEmptyRooms ? planned.filter((r) => Object.keys(r.cells).length) : planned,
        clashCount: 0,
        empty: options.hideEmptyRooms ? "В этот период нет броней" : "Нет активных аудиторий",
      };
    }

    // Занятия за период в выбранных аудиториях
    const params: any[] = [rangeStart, rangeEnd, ...rooms.map((r) => r.id)];
    let typeSql = "";
    if (["theory", "practice", "assessment"].includes(options.eventType)) {
      typeSql = "AND se.event_type = ?";
      params.push(options.eventType);
    }
    const rows = await executeQuery<any[]>(
      `SELECT se.id, se.title, COALESCE(se.event_type, 'other') AS type,
              se.original_event_id IS NOT NULL AS retake,
              se.classroom_id, se.academic_hours,
              DATE_FORMAT(se.start_time, '%Y-%m-%d') AS d,
              DATE_FORMAT(se.start_time, '%H:%i') AS sl, DATE_FORMAT(se.end_time, '%H:%i') AS el,
              DATE_FORMAT(se.start_time, '%Y-%m-%d %H:%i:%s') AS s_full,
              DATE_FORMAT(se.end_time, '%Y-%m-%d %H:%i:%s') AS e_full,
              (se.start_time <= NOW() AND se.end_time > NOW()) AS is_now,
              se.group_id, sg.code AS group_code, c.name AS course_name,
              i.full_name AS instructor, u.name AS booked_by,
              DATE_FORMAT(se.created_at, '%Y-%m-%d') AS created_day
       FROM schedule_events se
       LEFT JOIN study_groups sg ON sg.id = se.group_id
       LEFT JOIN courses c ON c.id = sg.course_id
       LEFT JOIN instructors i ON i.id = se.instructor_id
       LEFT JOIN users u ON u.id = se.created_by
       WHERE se.start_time >= ? AND se.start_time < ?
         AND se.classroom_id IN (${rooms.map(() => "?").join(",")})
         ${typeSql}
       ORDER BY se.start_time ASC
       LIMIT 5000`,
      params,
    );

    const events: BookingEvent[] = rows.map((r) => ({
      id: r.id,
      roomId: r.classroom_id,
      date: r.d,
      start: r.sl,
      end: r.el,
      sFull: r.s_full,
      eFull: r.e_full,
      title: r.title || "Занятие",
      type: r.type,
      retake: Boolean(num(r.retake)),
      hours: r.academic_hours == null ? null : num(r.academic_hours),
      groupId: r.group_id,
      group: r.group_code || "",
      course: r.course_name || "",
      instructor: r.instructor ? (maskNames ? maskName(r.instructor) : r.instructor) : "",
      bookedBy: r.booked_by ? (maskNames ? maskName(r.booked_by) : r.booked_by) : "",
      bookedAtDate: r.created_day || "",
      now: Boolean(num(r.is_now)),
      clash: false,
    }));

    // Накладки: занятия в одной аудитории, пересекающиеся по времени.
    // Пересдачи не считаем — им разрешено занимать занятые аудитории.
    let clashCount = 0;
    if (options.highlightClashes !== false) {
      const byRoom = new Map<string, BookingEvent[]>();
      for (const e of events) {
        if (e.retake) continue;
        const list = byRoom.get(e.roomId) ?? [];
        list.push(e);
        byRoom.set(e.roomId, list);
      }
      for (const list of byRoom.values()) {
        let latest: BookingEvent | null = null;
        for (const e of list) {
          if (latest && e.sFull < latest.eFull) {
            e.clash = true;
            latest.clash = true;
            clashCount++;
          }
          if (!latest || e.eFull > latest.eFull) latest = e;
        }
      }
    }

    const merge = options.mergeBookings !== false;
    const show = {
      course: options.showCourse !== false,
      group: options.showGroup !== false,
      instructor: options.showInstructor !== false,
      bookedBy: options.showBookedBy !== false,
      bookedAt: options.showBookedAt === true,
      hours: options.showHours !== false,
    };

    const buildItem = (list: BookingEvent[]): BookingItem => {
      const first = list[0]!;
      const times = [...new Set(list.map((e) => `${e.start}–${e.end}`))];
      const time =
        times.length <= 2
          ? times.join(", ")
          : `${list.map((e) => e.start).sort()[0]}–${list.map((e) => e.end).sort().at(-1)}`;
      const hourValues = list.map((e) => e.hours).filter((h): h is number => h != null);
      const typeCount = new Map<string, number>();
      for (const e of list) typeCount.set(e.type, (typeCount.get(e.type) ?? 0) + 1);
      const type = [...typeCount.entries()].sort((a, b) => b[1] - a[1])[0]![0];
      const instructors = [...new Set(list.map((e) => e.instructor).filter(Boolean))];
      const authors = [...new Set(list.map((e) => e.bookedBy).filter(Boolean))];
      const bookedDay = list.map((e) => e.bookedAtDate).filter(Boolean).sort()[0];

      return {
        course: show.course ? first.course : "",
        group: show.group || !first.group ? first.group || first.title : "",
        days: step === "week" ? weekdaysLabel(list.map((e) => weekdayIndex(e.date))) : "",
        time,
        hours: show.hours && hourValues.length ? hourValues.reduce((a, b) => a + b, 0) : null,
        count: list.length,
        instructors: show.instructor ? instructors.join(", ") : "",
        bookedBy: show.bookedBy ? authors.join(", ") : "",
        bookedAt: show.bookedAt && bookedDay ? dayLabel(bookedDay).date : "",
        type,
        retake: first.retake,
        clash: list.some((e) => e.clash),
        now: list.some((e) => e.now),
      };
    };

    const result: BookingData["rooms"] = rooms.map((room) => {
      const roomEvents = events.filter((e) => e.roomId === room.id && columnKeys.has(columnOf(e.date)));
      const cells: Record<string, BookingItem[]> = {};

      const byColumn = new Map<string, BookingEvent[]>();
      for (const e of roomEvents) {
        const key = columnOf(e.date);
        const list = byColumn.get(key) ?? [];
        list.push(e);
        byColumn.set(key, list);
      }
      for (const [key, list] of byColumn) {
        if (!merge) {
          cells[key] = list.map((e) => buildItem([e]));
          continue;
        }
        const groups = new Map<string, BookingEvent[]>();
        for (const e of list) {
          const gk = `${e.groupId ?? `t:${e.title}`}|${e.retake ? 1 : 0}`;
          const arr = groups.get(gk) ?? [];
          arr.push(e);
          groups.set(gk, arr);
        }
        cells[key] = [...groups.values()].map(buildItem);
      }

      return {
        id: room.id,
        name: room.name,
        subtitle: room.capacity ? `${room.capacity} мест` : undefined,
        cells,
      };
    });

    const visible = options.hideEmptyRooms ? result.filter((r) => Object.keys(r.cells).length) : result;
    return {
      kind: "booking",
      columns,
      rooms: visible,
      clashCount,
      empty: options.hideEmptyRooms ? "В этот период нет броней" : "Нет активных аудиторий",
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
