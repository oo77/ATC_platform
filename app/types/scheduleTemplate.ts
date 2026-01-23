/**
 * Типы для шаблонов расписания и массовых операций
 */

import type { ScheduleEventType, ScheduleEventColor } from "./schedule";

// ============ Элемент шаблона (одно занятие) ============

export interface ScheduleTemplateEvent {
  title: string;
  description?: string;
  disciplineId?: string;
  disciplineName?: string;
  instructorId?: string;
  instructorName?: string;
  classroomId?: string;
  classroomName?: string;
  eventType: ScheduleEventType;
  color: ScheduleEventColor;
  /** Смещение от начала дня в минутах (например, 540 = 9:00) */
  startOffset: number;
  /** Длительность занятия в минутах */
  durationMinutes: number;
  /** Количество академических часов */
  academicHours?: number;
  /** Порядковый индекс в последовательности */
  orderIndex: number;
}

// ============ Шаблон расписания ============

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  sourceGroupId?: string;
  sourceGroupCode?: string;
  eventsData: ScheduleTemplateEvent[];
  createdBy: string;
  createdByName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ Данные для создания шаблона ============

export interface CreateScheduleTemplateData {
  name: string;
  description?: string;
  sourceGroupId?: string;
  events: ScheduleTemplateEvent[];
}

// ============ Данные для применения шаблона ============

export interface ApplyScheduleTemplateData {
  templateId: string;
  targetGroupId: string;
  targetInstructorId?: string;
  targetDate: string; // YYYY-MM-DD
  /** Заменить инструктора во всех занятиях */
  overrideInstructorId?: string;
}

// ============ Массовое копирование занятий ============

export interface BulkCopyEventsData {
  eventIds: string[];
  targetDate: string; // YYYY-MM-DD
  /** Если true, сохраняет временные интервалы между занятиями */
  preserveSequence: boolean;
}

export interface BulkCopyEventsResult {
  success: boolean;
  copiedCount: number;
  errors: string[];
  createdEventIds: string[];
}

// ============ Массовое удаление занятий ============

export interface BulkDeleteEventsData {
  eventIds: string[];
}

export interface BulkDeleteEventsResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
}

// ============ Ответы API ============

export interface ScheduleTemplatesResponse {
  success: boolean;
  templates: ScheduleTemplate[];
}

export interface ScheduleTemplateResponse {
  success: boolean;
  template: ScheduleTemplate;
}

export interface ApplyTemplateResponse {
  success: boolean;
  createdCount: number;
  createdEventIds: string[];
}
