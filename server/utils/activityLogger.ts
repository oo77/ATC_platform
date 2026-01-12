/**
 * Утилита для логирования действий пользователей
 */

import type { H3Event } from 'h3';
import { getHeader, getRequestIP } from 'h3';
import { createActivityLog } from '../repositories/activityLogRepository';
import type { ActionType, EntityType, CreateActivityLogInput } from '../types/activityLog';

/**
 * Логирование действия пользователя
 * 
 * @param event - H3Event объект запроса
 * @param actionType - тип действия (CREATE, UPDATE, DELETE и т.д.)
 * @param entityType - тип сущности (USER, STUDENT, CERTIFICATE и т.д.)
 * @param entityId - ID сущности (опционально)
 * @param entityName - название сущности для отображения (опционально)
 * @param details - дополнительные данные (опционально)
 */
export async function logActivity(
  event: H3Event,
  actionType: ActionType,
  entityType: EntityType,
  entityId?: string,
  entityName?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    // Получаем пользователя из контекста (устанавливается middleware авторизации)
    const user = event.context.user;
    
    if (!user?.id) {
      console.warn('[Activity Log] User not found in context, skipping log');
      return;
    }

    // Получаем IP адрес
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || null;
    
    // Получаем User Agent
    const userAgent = getHeader(event, 'user-agent') || null;

    const logData: CreateActivityLogInput = {
      userId: user.id,
      actionType,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    };

    await createActivityLog(logData);
    
    console.log(`[Activity Log] ${actionType} ${entityType} by user ${user.id}`);
  } catch (error) {
    // Логируем ошибку, но не прерываем основной запрос
    console.error('[Activity Log] Failed to create activity log:', error);
  }
}

/**
 * Логирование действия без H3Event (для фоновых задач)
 */
export async function logActivityDirect(
  userId: string,
  actionType: ActionType,
  entityType: EntityType,
  entityId?: string,
  entityName?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await createActivityLog({
      userId,
      actionType,
      entityType,
      entityId,
      entityName,
      details,
    });
    
    console.log(`[Activity Log] ${actionType} ${entityType} by user ${userId}`);
  } catch (error) {
    console.error('[Activity Log] Failed to create activity log:', error);
  }
}

/**
 * Хелпер для создания описания действия
 */
export function formatActivityDescription(
  actionType: ActionType,
  entityType: EntityType,
  entityName?: string
): string {
  const actionLabels: Record<ActionType, string> = {
    CREATE: 'Создал',
    UPDATE: 'Обновил',
    DELETE: 'Удалил',
    VIEW: 'Просмотрел',
    LOGIN: 'Вошёл в систему',
    LOGOUT: 'Вышел из системы',
    IMPORT: 'Импортировал',
    EXPORT: 'Экспортировал',
    APPROVE: 'Одобрил',
    REJECT: 'Отклонил',
    BLOCK: 'Заблокировал',
    UNBLOCK: 'Разблокировал',
    REVOKE: 'Отозвал',
    ISSUE: 'Выдал',
    RESET_PASSWORD: 'Сбросил пароль',
    ASSIGN: 'Назначил',
    UNASSIGN: 'Снял назначение',
  };

  const entityLabels: Record<EntityType, string> = {
    USER: 'пользователя',
    STUDENT: 'студента',
    CERTIFICATE: 'сертификат',
    CERTIFICATE_TEMPLATE: 'шаблон сертификата',
    ISSUED_CERTIFICATE: 'выданный сертификат',
    COURSE: 'курс',
    DISCIPLINE: 'дисциплину',
    INSTRUCTOR: 'инструктора',
    FILE: 'файл',
    FOLDER: 'папку',
    SCHEDULE: 'занятие',
    GROUP: 'группу',
    CLASSROOM: 'аудиторию',
    ORGANIZATION: 'организацию',
    REPRESENTATIVE: 'представителя',
    ATTENDANCE: 'посещаемость',
    GRADE: 'оценку',
    SYSTEM: 'системные настройки',
  };

  const action = actionLabels[actionType] || actionType;
  const entity = entityLabels[entityType] || entityType;
  
  if (entityName) {
    return `${action} ${entity} "${entityName}"`;
  }
  
  return `${action} ${entity}`;
}
