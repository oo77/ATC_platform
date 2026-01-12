/**
 * Типы для посещаемости и оценок
 */

import type { ScheduleEvent } from './schedule';
import type { Student } from './student';

// ============ Посещаемость ============

export interface Attendance {
  id: string;
  studentId: string;
  student?: Student;
  scheduleEventId: string;
  scheduleEvent?: ScheduleEvent;
  hoursAttended: number;  // Посещённые академические часы
  maxHours: number;       // Максимум часов занятия
  notes?: string;
  markedBy?: string;
  markedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceData {
  studentId: string;
  scheduleEventId: string;
  hoursAttended: number;
  maxHours: number;
  notes?: string;
}

export interface UpdateAttendanceData {
  hoursAttended?: number;
  notes?: string;
}

// Быстрая отметка посещаемости (для всех студентов одного занятия)
export interface BulkAttendanceData {
  scheduleEventId: string;
  maxHours: number;
  attendances: {
    studentId: string;
    hoursAttended: number;
    notes?: string;
  }[];
}

// ============ Оценки ============

export interface Grade {
  id: string;
  studentId: string;
  student?: Student;
  scheduleEventId: string;
  scheduleEvent?: ScheduleEvent;
  grade: number;          // 0-100
  notes?: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeData {
  studentId: string;
  scheduleEventId: string;
  grade: number;
  notes?: string;
}

export interface UpdateGradeData {
  grade?: number;
  notes?: string;
}

// Быстрое выставление оценок (для всех студентов одного занятия)
export interface BulkGradeData {
  scheduleEventId: string;
  grades: {
    studentId: string;
    grade: number;
    notes?: string;
  }[];
}

// ============ Итоговые оценки ============

export type FinalGradeStatus = 'in_progress' | 'passed' | 'failed' | 'not_allowed';

export interface FinalGrade {
  id: string;
  studentId: string;
  student?: Student;
  groupId: string;
  disciplineId: string;
  disciplineName?: string;
  finalGrade?: number;          // 0-100
  attendancePercent?: number;   // 0-100
  status: FinalGradeStatus;
  notes?: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinalGradeData {
  studentId: string;
  groupId: string;
  disciplineId: string;
  finalGrade?: number;
  status?: FinalGradeStatus;
  notes?: string;
}

export interface UpdateFinalGradeData {
  finalGrade?: number;
  status?: FinalGradeStatus;
  notes?: string;
}

// ============ Сводные данные для журнала ============

// Данные для одной ячейки журнала
export interface JournalCell {
  studentId: string;
  scheduleEventId: string;
  attendance?: {
    id: string;
    hoursAttended: number;
    maxHours: number;
    notes?: string;
  };
  grade?: {
    id: string;
    grade: number;
    notes?: string;
  };
}

// Строка журнала (студент)
export interface JournalRow {
  student: {
    id: string;
    fullName: string;
    organization?: string;
  };
  cells: JournalCell[];
  totalHoursAttended: number;
  totalMaxHours: number;
  attendancePercent: number;
  averageGrade?: number;
  assessmentCount: number;
  finalGrade?: FinalGrade;
}

// Столбец журнала (занятие)
export interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: 'theory' | 'practice' | 'assessment' | 'other';
    academicHours: number;  // Количество а-ч
  };
  hasGrade: boolean;  // true если eventType === 'assessment'
}

// Полные данные журнала
export interface JournalData {
  group: {
    id: string;
    code: string;
  };
  discipline: {
    id: string;
    name: string;
    theoryHours: number;
    practiceHours: number;
    assessmentHours: number;
    totalHours: number;
  };
  columns: JournalColumn[];
  rows: JournalRow[];
  summary: {
    totalStudents: number;
    totalEvents: number;
    averageAttendance: number;
    passedCount: number;
    failedCount: number;
    inProgressCount: number;
  };
}

// ============ Статусы для UI ============

export const FINAL_GRADE_STATUS_LABELS: Record<FinalGradeStatus, string> = {
  in_progress: 'В процессе',
  passed: 'Сдано',
  failed: 'Не сдано',
  not_allowed: 'Не допущен',
};

export const FINAL_GRADE_STATUS_COLORS: Record<FinalGradeStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_allowed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

// Минимальный порог посещаемости для допуска (%)
export const MIN_ATTENDANCE_PERCENT = 75;

// Минимальный балл для сдачи (из 100)
export const MIN_PASSING_GRADE = 60;
