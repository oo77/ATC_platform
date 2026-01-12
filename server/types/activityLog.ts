/**
 * Типы для журнала действий пользователей
 */

// Типы действий
export type ActionType = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'IMPORT' 
  | 'EXPORT'
  | 'APPROVE'        // Одобрение (представителей, заявок)
  | 'REJECT'         // Отклонение
  | 'BLOCK'          // Блокировка
  | 'UNBLOCK'        // Разблокировка
  | 'REVOKE'         // Отзыв (сертификатов)
  | 'ISSUE'          // Выдача (сертификатов)
  | 'RESET_PASSWORD' // Сброс пароля
  | 'ASSIGN'         // Назначение (студента в группу, инструктора на дисциплину)
  | 'UNASSIGN';      // Снятие назначения

// Типы сущностей
export type EntityType = 
  | 'USER' 
  | 'STUDENT' 
  | 'CERTIFICATE' 
  | 'CERTIFICATE_TEMPLATE'
  | 'ISSUED_CERTIFICATE'
  | 'COURSE' 
  | 'DISCIPLINE' 
  | 'INSTRUCTOR' 
  | 'FILE' 
  | 'FOLDER' 
  | 'SCHEDULE'
  | 'GROUP'
  | 'CLASSROOM'
  | 'ORGANIZATION'
  | 'REPRESENTATIVE'
  | 'ATTENDANCE'
  | 'GRADE'
  | 'SYSTEM';

/**
 * Запись журнала действий
 */
export interface ActivityLog {
  id: number;
  userId: string;
  userName?: string;      // Имя пользователя (из JOIN с users)
  userEmail?: string;     // Email пользователя (из JOIN с users)
  actionType: ActionType;
  entityType: EntityType;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Данные для создания записи журнала
 */
export interface CreateActivityLogInput {
  userId: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Параметры пагинации для журнала
 */
export interface ActivityLogPaginationParams {
  page?: number;
  limit?: number;
  userId?: string;
  actionType?: ActionType;
  entityType?: EntityType;
  startDate?: Date | string;
  endDate?: Date | string;
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
