/**
 * GET /api/schedule/export
 * Excel-отчёт «Расписание занятий и экзаменов на неделю» (форма для утверждения).
 *
 * Query:
 *  - date              — любая дата недели (YYYY-MM-DD); неделя считается с понедельника. По умолчанию — сегодня.
 *  - approverPosition  — должность утверждающего (необязательно)
 *  - approverName      — ФИО утверждающего (необязательно)
 *
 * Доступ: только роли с правом просмотра всего расписания (SCHEDULE_VIEW_ALL).
 */

import {
  getScheduleEvents,
  getSchedulePeriods,
  getGroupStudentCounts,
  getGroupIdsWithEventsBefore,
  getClassrooms,
} from "../../repositories/scheduleRepository";
import { buildScheduleWorkbook } from "../../utils/scheduleExcel";
import {
  getPermissionContext,
  roleHasPermission,
} from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { logActivity } from "../../utils/activityLogger";

const DEFAULT_ORG_NAME = "ООО «Airports Training Center»";
const DEFAULT_APPROVER_POSITION = `Директор ${DEFAULT_ORG_NAME}`;
const DEFAULT_APPROVER_NAME = "Мусаев О.М.";

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Разбирает YYYY-MM-DD в локальную дату (без сдвига часового пояса) */
function parseYmd(value: string | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Строка из query: обрезаем пробелы и длину, пустое → значение по умолчанию */
function cleanText(value: unknown, fallback: string, maxLength = 200): string {
  if (typeof value !== "string") return fallback;
  const text = value.replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLength);
  return text || fallback;
}

export default defineEventHandler(async (event) => {
  try {
    const context = await getPermissionContext(event);
    if (!context) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Требуется авторизация",
      });
    }

    if (!roleHasPermission(context.role, Permission.SCHEDULE_VIEW_ALL)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Недостаточно прав для выгрузки расписания",
      });
    }

    const query = getQuery(event);

    // ---- Неделя: понедельник — воскресенье ----------------------------------
    const anyDay = parseYmd(query.date as string | undefined) ?? new Date();
    const dayOfWeek = (anyDay.getDay() + 6) % 7; // 0 = понедельник
    const weekStart = new Date(
      anyDay.getFullYear(),
      anyDay.getMonth(),
      anyDay.getDate() - dayOfWeek,
    );
    const weekEnd = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + 6,
    );
    const weekStartYmd = toYmd(weekStart);
    const weekEndYmd = toYmd(weekEnd);

    // ---- Данные -------------------------------------------------------------
    const [events, periods] = await Promise.all([
      getScheduleEvents({ startDate: weekStartYmd, endDate: weekEndYmd }),
      getSchedulePeriods(true),
    ]);

    const groupIds = [
      ...new Set(events.map((e) => e.groupId).filter((id): id is string => !!id)),
    ];
    const [studentCounts, continuingGroupIds, classrooms] = await Promise.all([
      getGroupStudentCounts(groupIds),
      getGroupIdsWithEventsBefore(groupIds, weekStartYmd),
      // Справочник аудиторий нужен только для «пустой» недели
      events.length === 0 ? getClassrooms(true) : Promise.resolve([]),
    ]);

    // ---- Книга --------------------------------------------------------------
    const workbook = buildScheduleWorkbook({
      weekStart,
      periods: periods.map((p) => ({
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
      events,
      studentCounts,
      continuingGroupIds,
      fallbackLocations: classrooms.map((c) => c.name),
      orgName: DEFAULT_ORG_NAME,
      approverPosition: cleanText(
        query.approverPosition,
        DEFAULT_APPROVER_POSITION,
      ),
      approverName: cleanText(query.approverName, DEFAULT_APPROVER_NAME, 100),
    });

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

    // Имя файла: кириллица — через filename*, для старых клиентов — ASCII-вариант
    const fileNameRu = `Расписание_занятий_и_экзаменов_${weekStartYmd}_${weekEndYmd}.xlsx`;
    const fileNameAscii = `schedule_${weekStartYmd}_${weekEndYmd}.xlsx`;

    setHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${fileNameAscii}"; filename*=UTF-8''${encodeURIComponent(fileNameRu)}`,
    );
    setHeader(event, "Content-Length", buffer.byteLength);
    setHeader(event, "Cache-Control", "no-store");

    await logActivity(event, "EXPORT", "SCHEDULE", undefined, undefined, {
      message: `Выгрузка расписания в Excel (${weekStartYmd} — ${weekEndYmd}, занятий: ${events.length})`,
      weekStart: weekStartYmd,
      weekEnd: weekEndYmd,
      events: events.length,
    });

    return send(event, buffer);
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("[API] Ошибка выгрузки расписания в Excel:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования Excel-файла расписания",
    });
  }
});
