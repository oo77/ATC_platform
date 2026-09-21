/**
 * Оформление занятий в календаре расписания (виды «Неделя», «День», «Месяц», «Список»).
 *
 * Принцип: ЗАЛИВКА карточки = цвет ГРУППЫ (так же, как ячейка «Группа» в Excel-форме),
 * а не ручной цвет занятия. Вид занятия (Т/П/Э) показывается меткой на карточке;
 * цвет самой метки — это выбранный в форме занятия «Цвет» (primary/success/warning/danger).
 *
 * Чистый модуль без зависимостей от Vue — используется в CalendarView.vue.
 */

import type { EventContentArg, EventInput } from "@fullcalendar/core";
import type { ScheduleEvent } from "../types/schedule";
import {
  deriveGroupColorTokens,
  readableTextOn,
  resolveGroupColor,
  type GroupColorTokens,
} from "../../shared/utils/groupColors";
import { eventKindLabel, eventKindShort } from "../../shared/utils/scheduleLabels";

/** Ручные цвета занятия (поле `color`) — теперь только цвет метки вида занятия */
export const EVENT_STATUS_COLORS: Record<string, string> = {
  primary: "#3C50E0",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Пересдача — занятие с ограниченным списком слушателей или ссылкой на оригинал */
export function isRetakeEvent(event: ScheduleEvent): boolean {
  return Boolean(
    (event.allowedStudentIds && event.allowedStudentIds.length > 0) ||
      event.originalEventId,
  );
}

/** Цвета группы занятия (сервер присылает `group.colorIndex`) */
export function getEventGroupTokens(event: ScheduleEvent): GroupColorTokens {
  return deriveGroupColorTokens(
    resolveGroupColor(event.groupId, event.group?.colorIndex),
  );
}

/** Преобразование занятия платформы в событие FullCalendar */
export function toCalendarEventInput(event: ScheduleEvent): EventInput {
  const tokens = getEventGroupTokens(event);
  const isRetake = isRetakeEvent(event);
  const isArchived = Boolean(event.group?.isArchived);

  // Заголовок для списка/месяца: с аудиторией и пометками
  let title = event.classroom?.name
    ? `${event.title} (${event.classroom.name})`
    : event.title;
  if (isRetake) title = `🔄 ${title}`;
  if (isArchived) title = `🔒 ${title}`;

  const classNames = ["ev-group", `ev-kind-${event.eventType || "other"}`];
  if (isRetake) classNames.push("event-retake");
  if (isArchived) classNames.push("ev-archived", "cursor-not-allowed");

  return {
    id: event.id,
    title,
    start: event.startTime,
    end: event.endTime,
    allDay: false,
    // Заливка и акцент — по цвету группы. В тёмной теме заливку подменяет CSS.
    backgroundColor: tokens.soft,
    borderColor: tokens.base,
    textColor: tokens.ink,
    editable: !isArchived,
    startEditable: !isArchived,
    durationEditable: !isArchived,
    classNames,
    extendedProps: {
      description: event.description || undefined,
      rawTitle: event.title,
      groupId: event.groupId || undefined,
      groupCode: event.group?.code,
      groupTokens: tokens,
      groupColor: tokens.base,
      isGroupArchived: isArchived,
      instructorId: event.instructorId || undefined,
      instructorName: event.instructor?.fullName,
      classroomId: event.classroomId || undefined,
      classroomName: event.classroom?.name,
      eventType: event.eventType,
      color: event.color,
      isRetake,
      allowedStudentIds: event.allowedStudentIds,
      originalEventId: event.originalEventId,
      academicHours: event.academicHours,
      durationMinutes: event.durationMinutes,
    },
  };
}

/** CSS-переменные карточки: подхватываются стилями .ev-group в CalendarView */
export function applyGroupCssVars(
  el: HTMLElement,
  tokens: GroupColorTokens | undefined,
): void {
  if (!tokens) return;
  el.style.setProperty("--gc", tokens.base);
  el.style.setProperty("--gc-soft", tokens.soft);
  el.style.setProperty("--gc-soft-dark", tokens.softDark);
  el.style.setProperty("--gc-ink", tokens.ink);
  el.style.setProperty("--gc-ink-dark", tokens.inkDark);
  el.style.setProperty("--gc-on", tokens.onBase);
}

const ICON_ROOM =
  '<svg class="ev-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17M14 12h.01"/></svg>';
const ICON_USER =
  '<svg class="ev-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>';

export interface TimeGridCardData {
  groupCode?: string;
  title: string;
  timeText?: string;
  classroom?: string;
  instructor?: string;
  eventType?: string;
  /** Ручной цвет занятия: primary | success | warning | danger */
  statusColor?: string;
  isRetake?: boolean;
  isArchived?: boolean;
}

/** HTML содержимого карточки занятия в видах «Неделя» / «День» */
export function buildTimeGridCardHtml(data: TimeGridCardData): string {
  const kindColor =
    EVENT_STATUS_COLORS[data.statusColor || "primary"] ??
    EVENT_STATUS_COLORS.primary!;
  const kindText = readableTextOn(kindColor);

  const badges: string[] = [];
  if (data.isRetake) {
    badges.push('<span class="ev-flag ev-flag-retake" title="Пересдача">↻</span>');
  }
  if (data.isArchived) {
    badges.push(
      '<span class="ev-flag" title="Группа в архиве">🔒</span>',
    );
  }
  badges.push(
    `<span class="ev-kind" title="${escapeHtml(
      eventKindLabel(data.eventType),
    )}" style="background:${kindColor};color:${kindText}">${escapeHtml(
      eventKindShort(data.eventType),
    )}</span>`,
  );

  const meta: string[] = [];
  if (data.classroom) {
    meta.push(
      `<div class="ev-meta" title="Аудитория">${ICON_ROOM}<span>${escapeHtml(
        data.classroom,
      )}</span></div>`,
    );
  }
  if (data.instructor) {
    meta.push(
      `<div class="ev-meta" title="Инструктор">${ICON_USER}<span>${escapeHtml(
        data.instructor,
      )}</span></div>`,
    );
  }

  return `<div class="ev-card">
    <div class="ev-head">
      <span class="ev-code">${escapeHtml(data.groupCode || "Без группы")}</span>
      <span class="ev-badges">${badges.join("")}</span>
    </div>
    <div class="ev-title">${escapeHtml(data.title)}</div>
    ${data.timeText ? `<div class="ev-time">${escapeHtml(data.timeText)}</div>` : ""}
    ${meta.join("")}
  </div>`;
}

// ============================================================================
// Карточка занятия и разметка сетки в видах «Неделя» / «День»
// ============================================================================

/**
 * `eventContent` для FullCalendar: в «Неделе» и «Дне» — собственная вёрстка карточки
 * (код группы, вид занятия, аудитория, инструктор), в остальных видах — стандартная (`true`).
 */
export function renderTimeGridEventContent(arg: EventContentArg) {
  if (!arg.view.type.startsWith("timeGrid")) return true;

  // «Зеркало» выделения при создании занятия — не наше событие, оставляем стандартный вид
  const p = arg.event.extendedProps;
  if (!p.groupTokens) return true;

  return {
    html: buildTimeGridCardHtml({
      groupCode: p.groupCode,
      title: p.rawTitle || arg.event.title,
      timeText: arg.timeText,
      classroom: p.classroomName,
      instructor: p.instructorName,
      eventType: p.eventType,
      statusColor: p.color,
      isRetake: p.isRetake,
      isArchived: p.isGroupArchived,
    }),
  };
}

export interface SlotPeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
}

/** Время «HH:MM» → минуты от начала суток */
function timeToMinutes(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * CSS-классы ячейки сетки времени: пары чередуются лёгким фоном, перемены и обед
 * выделены, время вне сетки пар слегка притемнено. Границы — из настроек расписания.
 */
export function getSlotLaneClasses(
  date: Date,
  periods: SlotPeriod[],
  settings: Record<string, string>,
): string[] {
  if (periods.length === 0) return [];

  const minutes = date.getHours() * 60 + date.getMinutes();
  const first = periods[0]!;
  const last = periods[periods.length - 1]!;
  if (
    minutes < timeToMinutes(first.startTime, 540) ||
    minutes >= timeToMinutes(last.endTime, 1100)
  ) {
    return ["slot-off"];
  }

  const lunchStart = timeToMinutes(settings.lunch_break_start, 800);
  const lunchEnd = timeToMinutes(settings.lunch_break_end, 840);
  if (minutes >= lunchStart && minutes < lunchEnd) return ["slot-lunch"];

  const period = periods.find(
    (p) =>
      minutes >= timeToMinutes(p.startTime, 0) &&
      minutes < timeToMinutes(p.endTime, 0),
  );
  if (!period) return ["slot-break"];

  // Пара = два академических часа подряд; чётные пары слегка подкрашиваем
  return Math.ceil(period.periodNumber / 2) % 2 === 0
    ? ["slot-pair-even"]
    : ["slot-pair-odd"];
}
