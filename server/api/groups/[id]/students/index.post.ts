/**
 * API endpoint для добавления слушателей в группу
 * POST /api/groups/[id]/students
 */

import { z } from 'zod';
import { 
  getGroupById,
  addStudentsToGroup,
  checkStudentConflicts 
} from '../../../../repositories/groupRepository';
import { logActivity } from '../../../../utils/activityLogger';

const addStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Выберите хотя бы одного слушателя'),
});

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'id');
    
    if (!groupId) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    const body = await readBody(event);
    
    // Валидация данных
    const validationResult = addStudentsSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors,
      };
    }

    const { studentIds } = validationResult.data;

    // Получаем группу для проверки дат
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    // Проверяем конфликты дат
    const startDate = formatDateLocal(group.startDate);
    const endDate = formatDateLocal(group.endDate);

    const conflicts = await checkStudentConflicts(
      studentIds,
      startDate,
      endDate,
      groupId // исключаем текущую группу
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        message: 'Некоторые слушатели уже находятся в группах с пересекающимися датами',
        conflicts,
      };
    }

    // Добавляем слушателей
    const result = await addStudentsToGroup(groupId, studentIds);

    // Логируем действие
    if (result.added.length > 0) {
      await logActivity(
        event,
        'UPDATE',
        'GROUP',
        groupId,
        group.code,
        { 
          action: 'add_students',
          addedCount: result.added.length,
          studentIds: result.added 
        }
      );
    }

    return {
      success: true,
      message: `Добавлено слушателей: ${result.added.length}`,
      added: result.added,
      alreadyInGroup: result.alreadyInGroup,
    };
  } catch (error) {
    console.error('Ошибка добавления слушателей:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при добавлении слушателей',
    };
  }
});

// Форматирует дату в YYYY-MM-DD без сдвига временной зоны
function formatDateLocal(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
