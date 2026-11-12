/**
 * Бронирование аудиторий под курсы (планирование).
 *
 * Бронь = аудитория + курс + период дат + дни недели (+ инструктор). Занимает
 * аудиторию целыми днями; группа и число слушателей на этапе планирования
 * неизвестны, группа привязывается позже (group_id).
 *
 * Правило для расписания: в забронированный день занятие в этой аудитории можно
 * поставить только группе того же курса (и той же группе, если бронь привязана
 * к группе). Любое другое занятие отклоняется, пока бронь не изменят.
 */

import { executeQuery } from "../utils/db";
import { addDays } from "../utils/publicDashboardFormat";
import { v4 as uuidv4 } from "uuid";
import { createError } from "h3";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface RoomBooking {
  id: string;
  classroomId: string;
  classroomName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructorId: string | null;
  instructorName: string | null;
  groupId: string | null;
  groupCode: string | null;
  /** YYYY-MM-DD */
  dateFrom: string;
  dateTo: string;
  /** ISO-дни недели: 1 = Пн … 7 = Вс */
  weekdays: number[];
  note: string | null;
  createdBy: string | null;
  createdByName: string | null;
  /** YYYY-MM-DD */
  createdDay: string;
}

export interface BookingInput {
  classroomId: string;
  courseId: string;
  instructorId?: string | null;
  groupId?: string | null;
  dateFrom: string;
  dateTo: string;
  weekdays: number[];
  note?: string | null;
}

export const MAX_BOOKING_DAYS = 366;

// ───────────────────────── даты (строки YYYY-MM-DD, без часовых поясов) ─────────────────────────

/** 1 = Пн … 7 = Вс */
export function isoWeekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const js = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return js === 0 ? 7 : js;
}

export function eachDay(from: string, to: string, limit = 800): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < limit; d = addDays(d, 1)) out.push(d);
  return out;
}

const fmtDay = (ymd: string) => `${ymd.slice(8, 10)}.${ymd.slice(5, 7)}`;
const fmtPeriod = (b: { dateFrom: string; dateTo: string }) =>
  b.dateFrom === b.dateTo ? fmtDay(b.dateFrom) : `${fmtDay(b.dateFrom)}–${fmtDay(b.dateTo)}`;

export function isActiveOn(b: { dateFrom: string; dateTo: string; weekdays: number[] }, ymd: string): boolean {
  return ymd >= b.dateFrom && ymd <= b.dateTo && b.weekdays.includes(isoWeekday(ymd));
}

/** Дни, в которые бронь действительно занимает аудиторию (опционально в окне [from, to]) */
export function bookingDays(
  b: { dateFrom: string; dateTo: string; weekdays: number[] },
  window?: { from: string; to: string },
): string[] {
  const from = window && window.from > b.dateFrom ? window.from : b.dateFrom;
  const to = window && window.to < b.dateTo ? window.to : b.dateTo;
  if (from > to) return [];
  return eachDay(from, to).filter((d) => b.weekdays.includes(isoWeekday(d)));
}

function parseWeekdays(s: string | null): number[] {
  return [...new Set(String(s ?? "").split(",").map((x) => Number(x.trim())).filter((n) => n >= 1 && n <= 7))].sort(
    (a, b) => a - b,
  );
}

// ───────────────────────── чтение ─────────────────────────

interface BookingRow extends RowDataPacket {
  id: string;
  classroom_id: string;
  classroom_name: string;
  course_id: string;
  course_name: string;
  course_code: string;
  instructor_id: string | null;
  instructor_name: string | null;
  group_id: string | null;
  group_code: string | null;
  date_from: string;
  date_to: string;
  weekdays: string;
  note: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_day: string;
}

const SELECT_BOOKING = `
  SELECT rb.id, rb.classroom_id, cr.name AS classroom_name,
         rb.course_id, c.name AS course_name, c.code AS course_code,
         rb.instructor_id, i.full_name AS instructor_name,
         rb.group_id, sg.code AS group_code,
         DATE_FORMAT(rb.date_from, '%Y-%m-%d') AS date_from,
         DATE_FORMAT(rb.date_to, '%Y-%m-%d') AS date_to,
         rb.weekdays, rb.note, rb.created_by, u.name AS created_by_name,
         DATE_FORMAT(rb.created_at, '%Y-%m-%d') AS created_day
  FROM room_bookings rb
  JOIN classrooms cr ON cr.id = rb.classroom_id
  JOIN courses c ON c.id = rb.course_id
  LEFT JOIN instructors i ON i.id = rb.instructor_id
  LEFT JOIN study_groups sg ON sg.id = rb.group_id
  LEFT JOIN users u ON u.id = rb.created_by`;

function mapBooking(r: BookingRow): RoomBooking {
  return {
    id: r.id,
    classroomId: r.classroom_id,
    classroomName: r.classroom_name,
    courseId: r.course_id,
    courseName: r.course_name,
    courseCode: r.course_code,
    instructorId: r.instructor_id,
    instructorName: r.instructor_name,
    groupId: r.group_id,
    groupCode: r.group_code,
    dateFrom: r.date_from,
    dateTo: r.date_to,
    weekdays: parseWeekdays(r.weekdays),
    note: r.note,
    createdBy: r.created_by,
    createdByName: r.created_by_name,
    createdDay: r.created_day,
  };
}

export async function listBookings(
  filters: { from?: string; to?: string; classroomIds?: string[]; courseId?: string } = {},
): Promise<RoomBooking[]> {
  const where: string[] = [];
  const params: any[] = [];
  if (filters.from) {
    where.push("rb.date_to >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("rb.date_from <= ?");
    params.push(filters.to);
  }
  if (filters.classroomIds?.length) {
    where.push(`rb.classroom_id IN (${filters.classroomIds.map(() => "?").join(",")})`);
    params.push(...filters.classroomIds);
  }
  if (filters.courseId) {
    where.push("rb.course_id = ?");
    params.push(filters.courseId);
  }
  const rows = await executeQuery<BookingRow[]>(
    `${SELECT_BOOKING} ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY rb.date_from ASC, cr.name ASC LIMIT 2000`,
    params,
  );
  return rows.map(mapBooking);
}

export async function getBookingById(id: string): Promise<RoomBooking | null> {
  const rows = await executeQuery<BookingRow[]>(`${SELECT_BOOKING} WHERE rb.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapBooking(rows[0]) : null;
}

// ───────────────────────── проверка и запись ─────────────────────────

const bad = (statusMessage: string) => createError({ statusCode: 400, statusMessage });

/** Формат, диапазон, существование связанных записей и согласованность группы с курсом */
export async function validateBookingInput(input: BookingInput): Promise<void> {
  const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
  if (!isDate(input.dateFrom) || !isDate(input.dateTo)) throw bad("Укажите даты брони в формате ГГГГ-ММ-ДД");
  if (input.dateTo < input.dateFrom) throw bad("Дата окончания не может быть раньше даты начала");
  if (eachDay(input.dateFrom, input.dateTo, MAX_BOOKING_DAYS + 2).length > MAX_BOOKING_DAYS) {
    throw bad(`Бронь не может быть длиннее ${MAX_BOOKING_DAYS} дней`);
  }
  if (!input.weekdays.length || input.weekdays.some((n) => !Number.isInteger(n) || n < 1 || n > 7)) {
    throw bad("Выберите хотя бы один день недели");
  }
  if (!bookingDays(input).length) throw bad("В выбранном периоде нет ни одного из выбранных дней недели");

  const [rooms, courses, instructors, groups] = await Promise.all([
    executeQuery<RowDataPacket[]>("SELECT id, is_active FROM classrooms WHERE id = ?", [input.classroomId]),
    executeQuery<RowDataPacket[]>("SELECT id FROM courses WHERE id = ?", [input.courseId]),
    input.instructorId
      ? executeQuery<RowDataPacket[]>("SELECT id FROM instructors WHERE id = ?", [input.instructorId])
      : Promise.resolve([] as RowDataPacket[]),
    input.groupId
      ? executeQuery<RowDataPacket[]>("SELECT id, course_id FROM study_groups WHERE id = ?", [input.groupId])
      : Promise.resolve([] as RowDataPacket[]),
  ]);
  if (!rooms[0]) throw bad("Аудитория не найдена");
  if (!rooms[0].is_active) throw bad("Аудитория отключена");
  if (!courses[0]) throw bad("Курс не найден");
  if (input.instructorId && !instructors[0]) throw bad("Инструктор не найден");
  if (input.groupId) {
    if (!groups[0]) throw bad("Группа не найдена");
    if (groups[0].course_id !== input.courseId) throw bad("Группа относится к другому курсу");
  }
}

/**
 * Бронь не должна пересекаться ни с другой бронью (та же аудитория или тот же
 * инструктор в те же дни), ни с уже стоящими в расписании занятиями другого курса.
 */
export async function assertBookingAllowed(input: BookingInput, excludeId?: string): Promise<void> {
  const messages: string[] = [];
  const days = bookingDays(input);
  const daySet = new Set(days);

  const overlaps = await listBookings({ from: input.dateFrom, to: input.dateTo });
  for (const other of overlaps) {
    if (other.id === excludeId) continue;
    const shared = bookingDays(other, { from: input.dateFrom, to: input.dateTo }).some((d) => daySet.has(d));
    if (!shared) continue;
    const who = other.createdByName ? `, бронь: ${other.createdByName}` : "";
    if (other.classroomId === input.classroomId) {
      messages.push(
        `Аудитория «${other.classroomName}» уже забронирована под курс «${other.courseName}» (${fmtPeriod(other)}${who})`,
      );
    }
    if (input.instructorId && other.instructorId === input.instructorId) {
      messages.push(
        `Инструктор «${other.instructorName}» уже занят в брони: аудитория «${other.classroomName}», курс «${other.courseName}» (${fmtPeriod(other)})`,
      );
    }
  }

  // Занятия в расписании, уже стоящие в этой аудитории в дни брони
  const events = await executeQuery<RowDataPacket[]>(
    `SELECT DATE_FORMAT(se.start_time, '%Y-%m-%d') AS d,
            DATE_FORMAT(se.start_time, '%H:%i') AS sl, DATE_FORMAT(se.end_time, '%H:%i') AS el,
            se.title, se.group_id, sg.code AS group_code, sg.course_id, c.name AS course_name, cr.name AS room
     FROM schedule_events se
     JOIN classrooms cr ON cr.id = se.classroom_id
     LEFT JOIN study_groups sg ON sg.id = se.group_id
     LEFT JOIN courses c ON c.id = sg.course_id
     WHERE se.classroom_id = ? AND se.original_event_id IS NULL
       AND se.start_time >= ? AND se.start_time < ?
     ORDER BY se.start_time ASC`,
    [input.classroomId, input.dateFrom, addDays(input.dateTo, 1)],
  );
  const foreign = events.filter(
    (e) =>
      daySet.has(e.d) &&
      !(e.course_id === input.courseId && (!input.groupId || e.group_id === input.groupId)),
  );
  for (const e of foreign.slice(0, 3)) {
    messages.push(
      `Аудитория «${e.room}» уже занята занятием ${fmtDay(e.d)} ${e.sl}–${e.el}: ${e.group_code || e.title}${e.course_name ? ` (${e.course_name})` : ""}`,
    );
  }
  if (foreign.length > 3) messages.push(`и ещё занятий: ${foreign.length - 3}`);

  if (messages.length) {
    throw createError({
      statusCode: 409,
      statusMessage: `Конфликт брони: ${[...new Set(messages)].slice(0, 5).join("; ")}`,
    });
  }
}

export async function createBooking(input: BookingInput, userId: string | null): Promise<RoomBooking> {
  const id = uuidv4();
  await executeQuery(
    `INSERT INTO room_bookings
       (id, classroom_id, course_id, instructor_id, group_id, date_from, date_to, weekdays, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.classroomId,
      input.courseId,
      input.instructorId || null,
      input.groupId || null,
      input.dateFrom,
      input.dateTo,
      [...new Set(input.weekdays)].sort((a, b) => a - b).join(","),
      input.note?.trim() || null,
      userId,
    ],
  );
  return (await getBookingById(id))!;
}

export async function updateBooking(id: string, input: BookingInput): Promise<RoomBooking | null> {
  const result = await executeQuery<ResultSetHeader>(
    `UPDATE room_bookings
     SET classroom_id = ?, course_id = ?, instructor_id = ?, group_id = ?,
         date_from = ?, date_to = ?, weekdays = ?, note = ?
     WHERE id = ?`,
    [
      input.classroomId,
      input.courseId,
      input.instructorId || null,
      input.groupId || null,
      input.dateFrom,
      input.dateTo,
      [...new Set(input.weekdays)].sort((a, b) => a - b).join(","),
      input.note?.trim() || null,
      id,
    ],
  );
  if (result.affectedRows === 0) return null;
  return getBookingById(id);
}

export async function deleteBooking(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>("DELETE FROM room_bookings WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

// ───────────────────────── брони блокируют расписание ─────────────────────────

export interface BookingBlockCandidate {
  label: string;
  classroomId?: string | null;
  groupId?: string | null;
  /** "YYYY-MM-DD HH:MM:SS" — ровно то, что будет записано в БД */
  start: string;
  end: string;
}

/**
 * Занятия, которые попадают на забронированный день своей аудитории под другой
 * курс (или другую группу, если бронь уже привязана к группе). Ничего не пишет в БД.
 */
export async function findBookingBlocks(
  candidates: BookingBlockCandidate[],
): Promise<{ label: string; message: string }[]> {
  const withRoom = candidates.filter((c) => c.classroomId);
  if (!withRoom.length) return [];

  const span = (c: BookingBlockCandidate) => {
    const first = c.start.slice(0, 10);
    let last = c.end.slice(0, 10);
    if (last > first && c.end.slice(11, 19) === "00:00:00") last = addDays(last, -1);
    return { first, last: last < first ? first : last };
  };
  const spans = withRoom.map(span);
  const from = spans.map((s) => s.first).sort()[0]!;
  const to = spans.map((s) => s.last).sort().at(-1)!;

  const bookings = await listBookings({
    from,
    to,
    classroomIds: [...new Set(withRoom.map((c) => c.classroomId!))],
  });
  if (!bookings.length) return [];

  const groupIds = [...new Set(withRoom.map((c) => c.groupId).filter((g): g is string => !!g))];
  const courseByGroup = new Map<string, string>();
  if (groupIds.length) {
    const rows = await executeQuery<RowDataPacket[]>(
      `SELECT id, course_id FROM study_groups WHERE id IN (${groupIds.map(() => "?").join(",")})`,
      groupIds,
    );
    for (const r of rows) courseByGroup.set(r.id, r.course_id);
  }

  const out: { label: string; message: string }[] = [];
  withRoom.forEach((c, i) => {
    const { first, last } = spans[i]!;
    const days = eachDay(first, last);
    const courseId = c.groupId ? courseByGroup.get(c.groupId) : undefined;
    for (const b of bookings) {
      if (b.classroomId !== c.classroomId) continue;
      const hit = days.find((d) => isActiveOn(b, d));
      if (!hit) continue;
      const allowed = Boolean(courseId) && b.courseId === courseId && (!b.groupId || b.groupId === c.groupId);
      if (allowed) continue;
      const extra = [
        b.instructorName ? `инструктор ${b.instructorName}` : "",
        b.createdByName ? `бронь: ${b.createdByName}` : "",
      ].filter(Boolean);
      out.push({
        label: c.label,
        message: `Аудитория «${b.classroomName}» забронирована под курс «${b.courseName}» (${fmtPeriod(b)}${extra.length ? `, ${extra.join(", ")}` : ""}). Сначала измените бронь`,
      });
    }
  });
  return out;
}

/** Есть ли у аудитории действующие или будущие брони */
export async function countUpcomingBookings(classroomId: string): Promise<number> {
  const rows = await executeQuery<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM room_bookings WHERE classroom_id = ? AND date_to >= CURDATE()",
    [classroomId],
  );
  return Number(rows[0]?.n ?? 0);
}
