/**
 * API endpoint для создания учебной группы
 * POST /api/groups
 */

import { z } from 'zod';
import { 
  createGroup, 
  groupCodeExists, 
  courseExists,
  checkStudentConflicts 
} from '../../repositories/groupRepository';
import { logActivity } from '../../utils/activityLogger';

const createGroupSchema = z.object({
  code: z.string().min(1, 'Код группы обязателен').max(50, 'Код группы слишком длинный'),
  courseId: z.string().min(1, 'ID курса обязателен'),
  startDate: z.string().min(1, 'Дата начала обязательна'),
  endDate: z.string().min(1, 'Дата окончания обязательна'),
  classroom: z.string().max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  studentIds: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Валидация данных
    const validationResult = createGroupSchema.safeParse(body);
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

    // Проверяем, что дата окончания не раньше даты начала (допускается один день)
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (endDate < startDate) {
      return {
        success: false,
        message: 'Дата окончания не может быть раньше даты начала',
        errors: [{ field: 'endDate', message: 'Дата окончания не может быть раньше даты начала' }],
      };
    }

    // Проверяем уникальность кода группы
    if (await groupCodeExists(data.code)) {
      return {
        success: false,
        message: 'Группа с таким кодом уже существует',
        errors: [{ field: 'code', message: 'Группа с таким кодом уже существует' }],
      };
    }

    // Проверяем существование курса
    if (!await courseExists(data.courseId)) {
      return {
        success: false,
        message: 'Выбранная учебная программа не найдена',
        errors: [{ field: 'courseId', message: 'Учебная программа не найдена' }],
      };
    }

    // Проверяем конфликты слушателей, если они указаны
    if (data.studentIds && data.studentIds.length > 0) {
      const conflicts = await checkStudentConflicts(
        data.studentIds,
        data.startDate,
        data.endDate
      );

      if (conflicts.length > 0) {
        return {
          success: false,
          message: 'Некоторые слушатели уже находятся в группах с пересекающимися датами',
          conflicts,
        };
      }
    }

    // Создаём группу
    const group = await createGroup(data);

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'GROUP',
      group.id,
      group.code,
      { 
        courseId: group.courseId,
        studentsCount: data.studentIds?.length || 0 
      }
    );

    return {
      success: true,
      message: 'Группа успешно создана',
      group,
    };
  } catch (error) {
    console.error('Ошибка создания группы:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при создании группы',
    };
  }
});
