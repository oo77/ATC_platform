/**
 * API endpoint для удаления инструктора
 * DELETE /api/instructors/:id
 */

import { deleteInstructor, getInstructorById } from '../../repositories/instructorRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID инструктора не указан',
      };
    }

    // Получаем инструктора для логирования
    const instructor = await getInstructorById(id);

    const deleted = await deleteInstructor(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Инструктор не найден',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'INSTRUCTOR',
      id,
      instructor?.fullName
    );

    return {
      success: true,
      message: 'Инструктор успешно удалён',
    };
  } catch (error) {
    console.error('Ошибка удаления инструктора:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении инструктора',
    };
  }
});
