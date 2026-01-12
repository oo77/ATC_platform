/**
 * API эндпоинт для обновления дисциплины
 */

import { updateDiscipline } from '../../../../repositories/courseRepository';
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

    const body = await readBody(event);

    // Валидация данных
    if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
      throw createError({
        statusCode: 400,
        message: 'Название дисциплины должно быть непустой строкой',
      });
    }

    if (body.theoryHours !== undefined && (typeof body.theoryHours !== 'number' || body.theoryHours < 0)) {
      throw createError({
        statusCode: 400,
        message: 'Часы теории должны быть неотрицательным числом',
      });
    }

    if (body.practiceHours !== undefined && (typeof body.practiceHours !== 'number' || body.practiceHours < 0)) {
      throw createError({
        statusCode: 400,
        message: 'Часы практики должны быть неотрицательным числом',
      });
    }

    if (body.assessmentHours !== undefined && (typeof body.assessmentHours !== 'number' || body.assessmentHours < 0)) {
      throw createError({
        statusCode: 400,
        message: 'Часы проверки знаний должны быть неотрицательным числом',
      });
    }

    // Обновляем дисциплину
    const discipline = await updateDiscipline(disciplineId, {
      name: body.name,
      description: body.description,
      theoryHours: body.theoryHours,
      practiceHours: body.practiceHours,
      assessmentHours: body.assessmentHours,
      orderIndex: body.orderIndex,
      instructorIds: body.instructorIds,
    });

    if (!discipline) {
      throw createError({
        statusCode: 404,
        message: 'Дисциплина не найдена',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'DISCIPLINE',
      disciplineId,
      discipline.name,
      { updatedFields: Object.keys(body).filter(key => body[key] !== undefined) }
    );

    return {
      success: true,
      discipline,
      message: 'Дисциплина успешно обновлена',
    };
  } catch (error: any) {
    console.error('Error updating discipline:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Не удалось обновить дисциплину',
    });
  }
});
