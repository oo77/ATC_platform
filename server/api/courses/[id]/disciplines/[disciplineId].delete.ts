/**
 * API эндпоинт для удаления дисциплины
 */

import { deleteDiscipline } from '../../../../repositories/courseRepository';
import { logActivity } from '../../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const disciplineId = getRouterParam(event, 'disciplineId');
    
    if (!disciplineId) {
      throw createError({
        statusCode: 400,
        message: 'ID дисциплины не указан',
      });
    }

    const success = await deleteDiscipline(disciplineId);

    if (!success) {
      throw createError({
        statusCode: 404,
        message: 'Дисциплина не найдена',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'DISCIPLINE',
      disciplineId
    );

    return {
      success: true,
      message: 'Дисциплина успешно удалена',
    };
  } catch (error: any) {
    console.error('Error deleting discipline:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Не удалось удалить дисциплину',
    });
  }
});
