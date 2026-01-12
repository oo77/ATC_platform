/**
 * API endpoint для удаления учебной группы
 * DELETE /api/groups/[id]
 */

import { deleteGroup, getGroupById } from '../../repositories/groupRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    // Проверяем существование и сохраняем данные для логирования
    const group = await getGroupById(id);
    if (!group) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    const groupCode = group.code;

    // Удаляем группу (каскадно удалятся расписание и связи со слушателями)
    const deleted = await deleteGroup(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Не удалось удалить группу',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'GROUP',
      id,
      groupCode,
      { studentsCount: group.students?.length || 0 }
    );

    return {
      success: true,
      message: 'Группа успешно удалена',
    };
  } catch (error) {
    console.error('Ошибка удаления группы:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении группы',
    };
  }
});
