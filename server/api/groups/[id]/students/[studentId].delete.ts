/**
 * API endpoint для удаления слушателя из группы
 * DELETE /api/groups/[id]/students/[studentId]
 */

import { removeStudentFromGroup, getGroupById } from '../../../../repositories/groupRepository';
import { logActivity } from '../../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'id');
    const studentId = getRouterParam(event, 'studentId');
    
    if (!groupId) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    if (!studentId) {
      return {
        success: false,
        message: 'ID слушателя не указан',
      };
    }

    // Проверяем существование группы
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    // Удаляем слушателя
    const removed = await removeStudentFromGroup(groupId, studentId);

    if (!removed) {
      return {
        success: false,
        message: 'Слушатель не найден в группе',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'GROUP',
      groupId,
      group.code,
      { 
        action: 'remove_student',
        studentId 
      }
    );

    return {
      success: true,
      message: 'Слушатель удалён из группы',
    };
  } catch (error) {
    console.error('Ошибка удаления слушателя:', error);
    
    return {
      success: false,
      message: 'Ошибка при удалении слушателя из группы',
    };
  }
});
