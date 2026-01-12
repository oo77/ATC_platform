/**
 * Composable для работы с системой допуска отметок посещаемости
 */

import type {
  AttendanceMarkingStatusRecord,
  AttendanceMarkingRequest,
  MarkingAccessCheckResult,
  AttendanceSettings,
  MarkingStatistics,
} from '~/types/attendanceMarking';

export function useAttendanceMarking() {
  const { authFetch } = useAuthFetch();
  const { success: showSuccess, error: showError, warning: showWarning } = useNotification();

  // Состояние
  const loading = ref(false);
  const accessCheck = ref<MarkingAccessCheckResult | null>(null);
  const markingStatus = ref<AttendanceMarkingStatusRecord | null>(null);
  const settings = ref<AttendanceSettings | null>(null);

  /**
   * Проверить доступ к отметке для занятия
   */
  async function checkAccess(eventId: string): Promise<MarkingAccessCheckResult | null> {
    loading.value = true;
    try {
      const response = await authFetch<{
        success: boolean;
        access: MarkingAccessCheckResult;
        markingStatus: AttendanceMarkingStatusRecord;
      }>(`/api/attendance/marking/check/${eventId}`);

      if (response.success) {
        accessCheck.value = response.access;
        markingStatus.value = response.markingStatus;
        return response.access;
      }
      return null;
    } catch (error: any) {
      console.error('Error checking access:', error);
      showError(error.data?.message || 'Ошибка проверки доступа');
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Отметить посещаемость с проверкой доступа
   */
  async function markAttendance(data: {
    scheduleEventId: string;
    attendances: { studentId: string; hoursAttended: number; notes?: string }[];
    maxHours: number;
    lateReason?: string;
  }): Promise<{ success: boolean; isLate: boolean; requiresApproval: boolean }> {
    // Сначала проверяем доступ
    const access = await checkAccess(data.scheduleEventId);
    
    if (!access) {
      return { success: false, isLate: false, requiresApproval: false };
    }

    if (!access.allowed) {
      if (access.requiresApproval) {
        return { success: false, isLate: false, requiresApproval: true };
      }
      showError(access.message || 'Доступ к отметке запрещён');
      return { success: false, isLate: false, requiresApproval: false };
    }

    // Если опоздание - показываем предупреждение
    if (access.status === 'late' && !data.lateReason) {
      showWarning('Срок отметки истёк. Отметка будет сохранена с пометкой "Опоздание"');
    }

    loading.value = true;
    try {
      const response = await authFetch<{
        success: boolean;
        count?: number;
        markingStatus: string;
        isLate: boolean;
      }>('/api/attendance', {
        method: 'POST',
        body: {
          bulk: true,
          scheduleEventId: data.scheduleEventId,
          attendances: data.attendances,
          maxHours: data.maxHours,
          lateReason: data.lateReason,
        },
      });

      if (response.success) {
        if (response.isLate) {
          showWarning(`Отмечено ${response.count} записей (с опозданием)`);
        } else {
          showSuccess(`Отмечено ${response.count} записей`);
        }
        return { success: true, isLate: response.isLate, requiresApproval: false };
      }

      return { success: false, isLate: false, requiresApproval: false };
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      
      // Проверяем, требуется ли одобрение
      if (error.data?.statusCode === 403 && error.data?.message?.includes('одобрение')) {
        return { success: false, isLate: false, requiresApproval: true };
      }
      
      showError(error.data?.message || 'Ошибка при сохранении посещаемости');
      return { success: false, isLate: false, requiresApproval: false };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Создать запрос на разрешение просроченной отметки
   */
  async function requestApproval(data: {
    scheduleEventId: string;
    reason: string;
  }): Promise<AttendanceMarkingRequest | null> {
    loading.value = true;
    try {
      const response = await authFetch<{
        success: boolean;
        request: AttendanceMarkingRequest;
        message: string;
      }>('/api/attendance/marking/requests', {
        method: 'POST',
        body: data,
      });

      if (response.success) {
        showSuccess(response.message);
        return response.request;
      }
      return null;
    } catch (error: any) {
      console.error('Error requesting approval:', error);
      showError(error.data?.message || 'Ошибка при отправке запроса');
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Получить настройки системы отметок
   */
  async function loadSettings(): Promise<AttendanceSettings | null> {
    try {
      const response = await authFetch<{
        success: boolean;
        settings: AttendanceSettings;
      }>('/api/attendance/marking/settings');

      if (response.success) {
        settings.value = response.settings;
        return response.settings;
      }
      return null;
    } catch (error: any) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  /**
   * Получить статистику для текущего пользователя
   */
  async function getStatistics(): Promise<MarkingStatistics | null> {
    try {
      const response = await authFetch<{
        success: boolean;
        statistics: MarkingStatistics;
      }>('/api/attendance/marking/pending');

      if (response.success) {
        return response.statistics;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      return null;
    }
  }

  /**
   * Вычислить статус доступа на основе времени
   */
  function calculateAccessStatus(event: {
    startTime: string;
    endTime: string;
  }): 'not_started' | 'in_progress' | 'can_mark' | 'late' | 'overdue' {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    if (now < start) {
      return 'not_started';
    }
    
    if (now >= start && now <= end) {
      return 'in_progress';
    }
    
    // После окончания
    const deadlineHours = settings.value?.ATTENDANCE_MARK_DEADLINE_HOURS || 24;
    const lateDeadlineHours = settings.value?.ATTENDANCE_EDIT_DEADLINE_HOURS || 72;
    
    const deadline = new Date(end.getTime() + deadlineHours * 60 * 60 * 1000);
    const lateDeadline = new Date(end.getTime() + lateDeadlineHours * 60 * 60 * 1000);
    
    if (now <= deadline) {
      return 'can_mark';
    }
    
    if (now <= lateDeadline) {
      return 'late';
    }
    
    return 'overdue';
  }

  return {
    // State
    loading,
    accessCheck,
    markingStatus,
    settings,
    
    // Methods
    checkAccess,
    markAttendance,
    requestApproval,
    loadSettings,
    getStatistics,
    calculateAccessStatus,
  };
}
