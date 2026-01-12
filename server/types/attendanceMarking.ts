/**
 * Типы для системы допуска отметок посещаемости инструкторами
 */

// ============ Статусы ============

/** Статус отметки посещаемости для занятия */
export type AttendanceMarkingStatus = 
  | 'pending'      // Не отмечено (занятие прошло)
  | 'in_progress'  // Идёт отметка (занятие идёт)
  | 'on_time'      // Отмечено вовремя (до 24ч)
  | 'late'         // Отмечено с опозданием (24-72ч)
  | 'overdue'      // Просрочено (более 72ч, не отмечено)
  | 'approved';    // Одобрено администратором (просроченная отметка)

/** Статус запроса на разрешение */
export type MarkingRequestStatus = 'pending' | 'approved' | 'rejected';

/** Результат проверки доступа к отметке */
export type MarkingAccessStatus = 'allowed' | 'late' | 'requires_approval' | 'denied';

// ============ Основные интерфейсы ============

/** Статус отметки занятия */
export interface AttendanceMarkingStatusRecord {
  id: string;
  scheduleEventId: string;
  status: AttendanceMarkingStatus;
  markedBy: string | null;
  markedAt: Date | null;
  deadline: Date;
  lateDeadline: Date;
  lateReason: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  studentsCount: number;
  markedCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  event?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    eventType: string;
    groupId: string | null;
    groupCode: string | null;
    instructorId: string | null;
    instructorName: string | null;
  };
  markedByUser?: {
    id: string;
    fullName: string;
  };
}

/** Запрос на разрешение просроченной отметки */
export interface AttendanceMarkingRequest {
  id: string;
  scheduleEventId: string;
  instructorId: string;
  reason: string;
  status: MarkingRequestStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  event?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    groupCode: string | null;
  };
  instructor?: {
    id: string;
    fullName: string;
  };
  reviewer?: {
    id: string;
    fullName: string;
  };
}

/** Настройка системы отметок */
export interface AttendanceSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  description: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}

/** Все настройки системы отметок (типизированные) */
export interface AttendanceSettings {
  ATTENDANCE_MARK_DEADLINE_HOURS: number;
  ATTENDANCE_EDIT_DEADLINE_HOURS: number;
  ATTENDANCE_LATE_MARK_ALLOWED: boolean;
  ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE: boolean;
  ATTENDANCE_REMINDER_HOURS_BEFORE: number;
  ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD: number;
  ATTENDANCE_AUTO_CREATE_STATUS: boolean;
}

// ============ Input/Output интерфейсы ============

/** Фильтры для получения статусов */
export interface MarkingStatusFilters {
  instructorId?: string;
  groupId?: string;
  status?: AttendanceMarkingStatus | AttendanceMarkingStatus[];
  dateFrom?: string;
  dateTo?: string;
  onlyOverdue?: boolean;
  onlyPending?: boolean;
}

/** Результат проверки доступа к отметке */
export interface MarkingAccessCheckResult {
  allowed: boolean;
  status: MarkingAccessStatus;
  deadline: Date;
  lateDeadline: Date;
  message?: string;
  requiresApproval?: boolean;
  existingRequestId?: string;
}

/** Запрос на отметку посещаемости */
export interface MarkAttendanceRequest {
  scheduleEventId: string;
  attendances: {
    studentId: string;
    hoursAttended: number;
    notes?: string;
  }[];
  maxHours: number;
  lateReason?: string;
  approvalRequestId?: string;
}

/** Результат отметки посещаемости */
export interface MarkAttendanceResult {
  success: boolean;
  status: 'on_time' | 'late' | 'requires_approval';
  message: string;
  markedCount?: number;
  deadline?: Date;
  requestId?: string;
}

/** Создание запроса на разрешение */
export interface CreateMarkingRequestInput {
  scheduleEventId: string;
  instructorId: string;
  reason: string;
}

/** Рассмотрение запроса на разрешение */
export interface ReviewMarkingRequestInput {
  approved: boolean;
  comment?: string;
}

// ============ Константы для UI ============

export const MARKING_STATUS_LABELS: Record<AttendanceMarkingStatus, string> = {
  pending: 'Не отмечено',
  in_progress: 'В процессе',
  on_time: 'Вовремя',
  late: 'С опозданием',
  overdue: 'Просрочено',
  approved: 'Одобрено',
};

export const MARKING_STATUS_COLORS: Record<AttendanceMarkingStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  on_time: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export const MARKING_STATUS_ICONS: Record<AttendanceMarkingStatus, string> = {
  pending: 'heroicons:clock',
  in_progress: 'heroicons:pencil-square',
  on_time: 'heroicons:check-circle',
  late: 'heroicons:exclamation-triangle',
  overdue: 'heroicons:x-circle',
  approved: 'heroicons:shield-check',
};

export const REQUEST_STATUS_LABELS: Record<MarkingRequestStatus, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export const REQUEST_STATUS_COLORS: Record<MarkingRequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// ============ Значения по умолчанию ============

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  ATTENDANCE_MARK_DEADLINE_HOURS: 24,
  ATTENDANCE_EDIT_DEADLINE_HOURS: 72,
  ATTENDANCE_LATE_MARK_ALLOWED: true,
  ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE: true,
  ATTENDANCE_REMINDER_HOURS_BEFORE: 2,
  ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD: 48,
  ATTENDANCE_AUTO_CREATE_STATUS: true,
};
