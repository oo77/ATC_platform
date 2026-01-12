/**
 * API endpoint для обновления учебной группы
 * PUT /api/groups/[id]
 */

import { z } from 'zod';
import { 
  updateGroup, 
  getGroupById,
  groupCodeExists, 
  courseExists,
  checkStudentConflicts 
} from '../../repositories/groupRepository';
import { logActivity } from '../../utils/activityLogger';

const updateGroupSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  courseId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classroom: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    const body = await readBody(event);
    
    // Валидация данных
    const validationResult = updateGroupSchema.safeParse(body);
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

    const data = validationResult.data;

    // Получаем текущую группу
    const existingGroup = await getGroupById(id);
    if (!existingGroup) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    // Проверяем даты, если они обновляются (допускается одинаковые даты для однодневных групп)
    const newStartDate = data.startDate || existingGroup.startDate.toString().split('T')[0];
    const newEndDate = data.endDate || existingGroup.endDate.toString().split('T')[0];
    
    if (new Date(newEndDate) < new Date(newStartDate)) {
      return {
        success: false,
        message: 'Дата окончания не может быть раньше даты начала',
        errors: [{ field: 'endDate', message: 'Дата окончания не может быть раньше даты начала' }],
      };
    }

    // Проверяем уникальность кода, если он меняется
    if (data.code && data.code !== existingGroup.code) {
      if (await groupCodeExists(data.code, id)) {
        return {
          success: false,
          message: 'Группа с таким кодом уже существует',
          errors: [{ field: 'code', message: 'Группа с таким кодом уже существует' }],
        };
      }
    }

    // Проверяем существование курса, если он меняется
    if (data.courseId && data.courseId !== existingGroup.courseId) {
      if (!await courseExists(data.courseId)) {
        return {
          success: false,
          message: 'Выбранная учебная программа не найдена',
          errors: [{ field: 'courseId', message: 'Учебная программа не найдена' }],
        };
      }
    }

    // Если меняются даты и есть слушатели, проверяем конфликты
    if ((data.startDate || data.endDate) && existingGroup.students && existingGroup.students.length > 0) {
      const studentIds = existingGroup.students.map(s => s.studentId);
      const conflicts = await checkStudentConflicts(
        studentIds,
        newStartDate,
        newEndDate,
        id // исключаем текущую группу
      );

      if (conflicts.length > 0) {
        return {
          success: false,
          message: 'Изменение дат создаст конфликты для некоторых слушателей',
          conflicts,
        };
      }
    }

    // Обновляем группу
    const group = await updateGroup(id, data);

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'GROUP',
      id,
      group.code,
      { 
        updatedFields: Object.keys(data),
        courseId: group.courseId 
      }
    );

    return {
      success: true,
      message: 'Группа успешно обновлена',
      group,
    };
  } catch (error) {
    console.error('Ошибка обновления группы:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при обновлении группы',
    };
  }
});
