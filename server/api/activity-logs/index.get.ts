/**
 * API endpoint для получения журнала действий
 * GET /api/activity-logs
 * 
 * Доступен только для ADMIN
 */

import { getActivityLogsPaginated } from '../../repositories/activityLogRepository';
import type { ActionType, EntityType } from '../../types/activityLog';

export default defineEventHandler(async (event) => {
  try {
    // Проверка авторизации
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    // Только ADMIN может просматривать журнал
    if (user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав для просмотра журнала действий',
      });
    }

    // Получение параметров запроса
    const query = getQuery(event);
    
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const userId = query.userId as string | undefined;
    const actionType = query.actionType as ActionType | undefined;
    const entityType = query.entityType as EntityType | undefined;
    const startDate = query.startDate as string | undefined;
    const endDate = query.endDate as string | undefined;

    const result = await getActivityLogsPaginated({
      page,
      limit,
      userId,
      actionType,
      entityType,
      startDate,
      endDate,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error('Ошибка получения журнала действий:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении журнала действий',
    });
  }
});
