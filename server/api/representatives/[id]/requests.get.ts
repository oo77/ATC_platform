/**
 * GET /api/representatives/[id]/requests
 * Получить историю запросов представителя к Telegram-боту
 */

import { getBotRequestHistory, getBotRequestStats } from '../../../utils/botLogger';
import { getRepresentativeById } from '../../../repositories/representativeRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID представителя обязателен',
      });
    }

    // Проверяем существование представителя
    const representative = await getRepresentativeById(id);
    if (!representative) {
      throw createError({
        statusCode: 404,
        message: 'Представитель не найден',
      });
    }

    // Получаем параметры пагинации
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 50;
    const offset = parseInt(query.offset as string) || 0;

    // Получаем историю и статистику
    const [history, stats] = await Promise.all([
      getBotRequestHistory(id, limit, offset),
      getBotRequestStats(id),
    ]);

    return {
      success: true,
      data: {
        history,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.total,
        },
      },
    };
  } catch (error: any) {
    console.error('[API] Ошибка получения истории запросов:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка получения истории запросов',
    });
  }
});
