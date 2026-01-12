/**
 * Composable для работы с журналом действий
 */

import type { Ref } from 'vue';

export interface ActivityLogFilter {
  userId?: string;
  actionType?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ActivityLogItem {
  id: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ActivityLogsResponse {
  success: boolean;
  data: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useActivityLogs() {
  const { authFetch } = useAuthFetch();
  const toast = useNotification();

  const logs: Ref<ActivityLogItem[]> = ref([]);
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalPages = ref(0);

  /**
   * Получить журнал действий с фильтрацией и пагинацией
   */
  const fetchActivityLogs = async (filters: ActivityLogFilter = {}) => {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.actionType) params.append('actionType', filters.actionType);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', String(filters.page || currentPage.value));
      params.append('limit', String(filters.limit || pageSize.value));

      const response = await authFetch<ActivityLogsResponse>(
        `/api/activity-logs?${params.toString()}`
      );

      if (response.success) {
        logs.value = response.data;
        total.value = response.total;
        currentPage.value = response.page;
        pageSize.value = response.limit;
        totalPages.value = response.totalPages;
      } else {
        throw new Error('Не удалось загрузить журнал действий');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки журнала действий:', error);
      toast.error(error.message || 'Не удалось загрузить журнал действий');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Изменить страницу
   */
  const changePage = async (page: number, filters: ActivityLogFilter = {}) => {
    currentPage.value = page;
    await fetchActivityLogs({ ...filters, page });
  };

  /**
   * Изменить размер страницы
   */
  const changePageSize = async (size: number, filters: ActivityLogFilter = {}) => {
    pageSize.value = size;
    currentPage.value = 1; // Сбрасываем на первую страницу
    await fetchActivityLogs({ ...filters, limit: size, page: 1 });
  };

  /**
   * Форматировать дату и время
   */
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  /**
   * Получить русское название типа действия
   */
  const getActionTypeLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      CREATE: 'Создание',
      UPDATE: 'Обновление',
      DELETE: 'Удаление',
      VIEW: 'Просмотр',
      LOGIN: 'Вход',
      LOGOUT: 'Выход',
      IMPORT: 'Импорт',
      EXPORT: 'Экспорт',
      APPROVE: 'Одобрение',
      REJECT: 'Отклонение',
      BLOCK: 'Блокировка',
      UNBLOCK: 'Разблокировка',
      REVOKE: 'Отзыв',
      ISSUE: 'Выдача',
      RESET_PASSWORD: 'Сброс пароля',
      ASSIGN: 'Назначение',
      UNASSIGN: 'Снятие назначения',
    };
    return labels[actionType] || actionType;
  };

  /**
   * Получить русское название типа сущности
   */
  const getEntityTypeLabel = (entityType: string): string => {
    const labels: Record<string, string> = {
      USER: 'Пользователь',
      STUDENT: 'Студент',
      CERTIFICATE: 'Сертификат',
      CERTIFICATE_TEMPLATE: 'Шаблон сертификата',
      ISSUED_CERTIFICATE: 'Выданный сертификат',
      COURSE: 'Курс',
      DISCIPLINE: 'Дисциплина',
      INSTRUCTOR: 'Инструктор',
      FILE: 'Файл',
      FOLDER: 'Папка',
      SCHEDULE: 'Занятие',
      GROUP: 'Группа',
      CLASSROOM: 'Аудитория',
      ORGANIZATION: 'Организация',
      REPRESENTATIVE: 'Представитель',
      ATTENDANCE: 'Посещаемость',
      GRADE: 'Оценка',
      SYSTEM: 'Система',
    };
    return labels[entityType] || entityType;
  };

  /**
   * Получить цвет для типа действия
   */
  const getActionTypeColor = (actionType: string): string => {
    const colors: Record<string, string> = {
      CREATE: 'text-green-600 dark:text-green-400',
      UPDATE: 'text-blue-600 dark:text-blue-400',
      DELETE: 'text-red-600 dark:text-red-400',
      VIEW: 'text-gray-600 dark:text-gray-400',
      LOGIN: 'text-purple-600 dark:text-purple-400',
      LOGOUT: 'text-gray-600 dark:text-gray-400',
      IMPORT: 'text-indigo-600 dark:text-indigo-400',
      EXPORT: 'text-indigo-600 dark:text-indigo-400',
      APPROVE: 'text-green-600 dark:text-green-400',
      REJECT: 'text-red-600 dark:text-red-400',
      BLOCK: 'text-red-600 dark:text-red-400',
      UNBLOCK: 'text-green-600 dark:text-green-400',
      REVOKE: 'text-orange-600 dark:text-orange-400',
      ISSUE: 'text-green-600 dark:text-green-400',
      RESET_PASSWORD: 'text-yellow-600 dark:text-yellow-400',
      ASSIGN: 'text-blue-600 dark:text-blue-400',
      UNASSIGN: 'text-gray-600 dark:text-gray-400',
    };
    return colors[actionType] || 'text-gray-600 dark:text-gray-400';
  };

  return {
    logs,
    loading,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchActivityLogs,
    changePage,
    changePageSize,
    formatDateTime,
    getActionTypeLabel,
    getEntityTypeLabel,
    getActionTypeColor,
  };
}
