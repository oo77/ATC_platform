/**
 * Типы для журнала действий пользователей (клиентская сторона)
 */

// Типы действий
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'IMPORT' | 'EXPORT';

// Типы сущностей
export type EntityType = 
  | 'USER' 
  | 'STUDENT' 
  | 'CERTIFICATE' 
  | 'COURSE' 
  | 'DISCIPLINE' 
  | 'INSTRUCTOR' 
  | 'FILE' 
  | 'FOLDER' 
  | 'SYSTEM';

/**
 * Запись журнала действий
 */
export interface ActivityLog {
  id: number;
  userId: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
}

/**
 * Результат пагинации журнала
 */
export interface PaginatedActivityLogs {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Человекочитаемые метки для типов действий
 */
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  CREATE: 'Создание',
  UPDATE: 'Изменение',
  DELETE: 'Удаление',
  LOGIN: 'Вход в систему',
  LOGOUT: 'Выход из системы',
  IMPORT: 'Импорт',
  EXPORT: 'Экспорт',
};

/**
 * Человекочитаемые метки для типов сущностей
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  USER: 'Пользователь',
  STUDENT: 'Студент',
  CERTIFICATE: 'Сертификат',
  COURSE: 'Курс',
  DISCIPLINE: 'Дисциплина',
  INSTRUCTOR: 'Инструктор',
  FILE: 'Файл',
  FOLDER: 'Папка',
  SYSTEM: 'Система',
};

/**
 * Цвета для типов действий (для UI)
 */
export const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'danger',
  LOGIN: 'info',
  LOGOUT: 'warning',
  IMPORT: 'success',
  EXPORT: 'info',
};
