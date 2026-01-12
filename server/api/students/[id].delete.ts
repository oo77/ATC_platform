/**
 * API endpoint для удаления студента
 * DELETE /api/students/:id
 */

import { deleteStudent, getStudentById } from '../../repositories/studentRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID студента не указан',
      };
    }

    // Получаем студента для логирования
    const student = await getStudentById(id);

    const deleted = await deleteStudent(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Студент не найден',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'STUDENT',
      id,
      student?.fullName,
      { pinfl: student?.pinfl }
    );

    return {
      success: true,
      message: 'Студент успешно удален',
    };
  } catch (error) {
    console.error('Ошибка удаления студента:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении студента',
    };
  }
});
