/**
 * API endpoint для удаления курса
 * DELETE /api/courses/:id
 */

import { deleteCourse, getCourseById } from '../../repositories/courseRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID курса не указан',
      };
    }

    // Получаем курс для логирования
    const course = await getCourseById(id);

    const deleted = await deleteCourse(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Курс не найден',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'COURSE',
      id,
      course?.name,
      { code: course?.code }
    );

    return {
      success: true,
      message: 'Курс успешно удалён',
    };
  } catch (error) {
    console.error('Ошибка удаления курса:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении курса',
    };
  }
});
