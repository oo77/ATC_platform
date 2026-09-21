/**
 * Подписи типов занятий для расписания.
 * Общий модуль: календарь (значок на карточке) и Excel-отчёт («Вид») используют одни и те же буквы.
 */

export type ScheduleEventKind = "theory" | "practice" | "assessment" | "other";

/** Краткое обозначение вида занятия, как в печатной форме расписания */
export const EVENT_KIND_SHORT: Record<ScheduleEventKind, string> = {
  theory: "Т",
  practice: "П",
  assessment: "Э",
  other: "Д",
};

/** Полное название вида занятия */
export const EVENT_KIND_LABEL: Record<ScheduleEventKind, string> = {
  theory: "Теория",
  practice: "Практика",
  assessment: "Проверка знаний",
  other: "Другое",
};

export function eventKindShort(kind: string | null | undefined): string {
  return EVENT_KIND_SHORT[(kind as ScheduleEventKind) || "other"] ?? "Д";
}

export function eventKindLabel(kind: string | null | undefined): string {
  return EVENT_KIND_LABEL[(kind as ScheduleEventKind) || "other"] ?? "Другое";
}
