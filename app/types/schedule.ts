/**
 * Типы для расписания занятий
 */

import type { StudyGroup } from './group';

// ============ Аудитории ============

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ События расписания ============

export type ScheduleEventType = 'theory' | 'practice' | 'assessment' | 'other';
export type ScheduleEventColor = 'primary' | 'success' | 'warning' | 'danger';

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  groupId?: string;
  group?: StudyGroup;
  disciplineId?: string;
  discipline?: {
    id: string;
    name: string;
  };
  instructorId?: string;
  instructor?: {
    id: string;
    fullName: string;
  };
  classroomId?: string;
  classroom?: Classroom;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  color: ScheduleEventColor;
  eventType: ScheduleEventType;
  isRecurring: boolean;
  recurrenceRule?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Данные для создания/обновления ============

export interface CreateScheduleEventData {
  title: string;
  description?: string;
  groupId?: string;
  disciplineId?: string;
  instructorId?: string;
  classroomId?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  color?: ScheduleEventColor;
  eventType?: ScheduleEventType;
  isRecurring?: boolean;
  recurrenceRule?: string;
  notes?: string;
}

export interface UpdateScheduleEventData {
  title?: string;
  description?: string;
  groupId?: string | null;
  disciplineId?: string | null;
  instructorId?: string | null;
  classroomId?: string | null;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  color?: ScheduleEventColor;
  eventType?: ScheduleEventType;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  notes?: string | null;
}

// ============ Фильтры ============

export interface ScheduleFilters {
  startDate?: string;
  endDate?: string;
  groupId?: string;
  instructorId?: string;
  classroomId?: string;
  eventType?: ScheduleEventType;
}

// ============ Ответы API ============

export interface ScheduleEventsResponse {
  success: boolean;
  events: ScheduleEvent[];
}

export interface ScheduleEventResponse {
  success: boolean;
  event: ScheduleEvent;
}

export interface ClassroomsResponse {
  success: boolean;
  classrooms: Classroom[];
}

// ============ FullCalendar типы ============

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    description?: string;
    groupId?: string;
    groupCode?: string;
    instructorId?: string;
    instructorName?: string;
    classroomId?: string;
    classroomName?: string;
    eventType: ScheduleEventType;
    color: ScheduleEventColor;
  };
}

// Цветовая схема событий
export const EVENT_COLORS: Record<ScheduleEventColor, { bg: string; border: string; text: string }> = {
  primary: { bg: '#3C50E0', border: '#3C50E0', text: '#ffffff' },
  success: { bg: '#10B981', border: '#10B981', text: '#ffffff' },
  warning: { bg: '#F59E0B', border: '#F59E0B', text: '#ffffff' },
  danger: { bg: '#EF4444', border: '#EF4444', text: '#ffffff' },
};

// Типы событий
export const EVENT_TYPES: Record<ScheduleEventType, string> = {
  theory: 'Теория',
  practice: 'Практика',
  assessment: 'Проверка знаний',
  other: 'Другое',
};
