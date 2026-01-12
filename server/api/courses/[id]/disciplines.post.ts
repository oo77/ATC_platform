/**
 * API эндпоинт для добавления дисциплины к курсу
 */

import { addDisciplineToCourse } from '../../../repositories/courseRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, 'id');
    
    if (!courseId) {
      throw createError({
        statusCode: 400,
        message: 'ID курса не указан',
      });
    }

    const body = await readBody(event);

    // Валидация данных
    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Название дисциплины обязательно',
      });
    }

    if (typeof body.theoryHours !== 'number' || body.theoryHours < 0) {
      throw createError({
        statusCode: 400,
        message: 'Часы теории должны быть неотрицательным числом',
      });
    }

    if (typeof body.practiceHours !== 'number' || body.practiceHours < 0) {
      throw createError({
        statusCode: 400,
        message: 'Часы практики должны быть неотрицательным числом',
      });
    }

    if (typeof body.assessmentHours !== 'number' || body.assessmentHours < 0) {
      throw createError({
        statusCode: 400,
        message: 'Часы проверки знаний должны быть неотрицательным числом',
      });
    }

    const totalHours = body.theoryHours + body.practiceHours + body.assessmentHours;
    if (totalHours === 0) {
      throw createError({
        statusCode: 400,
        message: 'Общее количество часов должно быть больше нуля',
      });
    }

    // Создаем дисциплину
    const discipline = await addDisciplineToCourse(courseId, {
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
        message: 'Курс не найден',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'DISCIPLINE',
      discipline.id,
      discipline.name,
      { courseId, totalHours }
    );

    return {
      success: true,
      discipline,
      message: 'Дисциплина успешно добавлена',
    };
  } catch (error: any) {
    console.error('Error adding discipline:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Не удалось добавить дисциплину',
    });
  }
});
