/**
 * API endpoint для получения журнала действий пользователя
 * GET /api/activity-logs/user/:userId
 * 
 * Доступен только для ADMIN
 */

import { getActivityLogsByUserId, getUserActivityStats } from '../../../repositories/activityLogRepository';
import { Permission, roleHasPermission } from "../../../utils/permissions";

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

    // Проверка по праву, а не по названию роли
    if (!roleHasPermission(user, Permission.LOGS_VIEW)) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав для просмотра журнала действий',
      });
    }

    const userId = getRouterParam(event, 'userId');
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя не указан',
      });
    }

    // Получение параметров запроса
    const query = getQuery(event);
    
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const includeStats = query.stats === 'true';

    // Получаем логи пользователя
    const logs = await getActivityLogsByUserId(userId, page, limit);

    // Опционально получаем статистику
    let stats = null;
    if (includeStats) {
      stats = await getUserActivityStats(userId);
    }

    return {
      success: true,
      ...logs,
      stats,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error('Ошибка получения журнала действий пользователя:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении журнала действий',
    });
  }
});
