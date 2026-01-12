/**
 * API endpoint для обновления курса
 * PUT /api/courses/:id
 */

import {
  updateCourse,
  courseCodeExists,
  getCourseById,
  addDisciplineToCourse,
  updateDiscipline,
  deleteDiscipline,
  type UpdateCourseInput,
  type CreateDisciplineInput,
} from '../../repositories/courseRepository';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';

const disciplineSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  theoryHours: z.number().min(0).default(0),
  practiceHours: z.number().min(0).default(0),
  assessmentHours: z.number().min(0).default(0),
  orderIndex: z.number().optional(),
  instructorIds: z.array(z.string()).optional(),
});

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  shortName: z.string().min(2).max(10).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  certificateTemplateId: z.string().nullable().optional(),
  certificateValidityMonths: z.number().positive().int().nullable().optional(), // Срок действия сертификата в месяцах (null = бессрочный)
  isActive: z.boolean().optional(),
  disciplines: z.array(disciplineSchema).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID курса не указан',
      };
    }

    const body = await readBody(event);

    // Валидация
    const validationResult = updateCourseSchema.safeParse(body);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors: validationResult.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    const data = validationResult.data;

    // Проверяем уникальность кода если он изменяется
    if (data.code) {
      const codeExists = await courseCodeExists(data.code, id);
      if (codeExists) {
        return {
          success: false,
          message: 'Курс с таким кодом уже существует',
          field: 'code',
        };
      }
    }

    // Извлекаем дисциплины из данных для отдельной обработки
    const { disciplines, ...courseData } = data;

    // Обновляем основную информацию курса
    const course = await updateCourse(id, courseData as UpdateCourseInput);

    if (!course) {
      return {
        success: false,
        message: 'Курс не найден',
      };
    }

    // Обрабатываем дисциплины если они переданы
    if (disciplines !== undefined) {
      // Получаем текущие дисциплины курса
      const currentCourse = await getCourseById(id, true);
      const currentDisciplineIds = new Set(currentCourse?.disciplines?.map(d => d.id) || []);
      const newDisciplineIds = new Set(disciplines.filter(d => d.id).map(d => d.id!));

      // Удаляем дисциплины, которых нет в новом списке
      for (const disciplineId of currentDisciplineIds) {
        if (!newDisciplineIds.has(disciplineId)) {
          await deleteDiscipline(disciplineId);
        }
      }

      // Обновляем существующие и создаём новые дисциплины
      for (let i = 0; i < disciplines.length; i++) {
        const discipline = disciplines[i];
        
        if (discipline.id && currentDisciplineIds.has(discipline.id)) {
          // Обновляем существующую дисциплину
          await updateDiscipline(discipline.id, {
            name: discipline.name,
            description: discipline.description,
            theoryHours: discipline.theoryHours,
            practiceHours: discipline.practiceHours,
            assessmentHours: discipline.assessmentHours,
            orderIndex: i,
            instructorIds: discipline.instructorIds,
          });
        } else {
          // Создаём новую дисциплину
          await addDisciplineToCourse(id, {
            name: discipline.name,
            description: discipline.description || undefined,
            theoryHours: discipline.theoryHours,
            practiceHours: discipline.practiceHours,
            assessmentHours: discipline.assessmentHours,
            orderIndex: i,
            instructorIds: discipline.instructorIds,
          });
        }
      }
    }

    // Возвращаем обновлённый курс
    const updatedCourse = await getCourseById(id, true);

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'COURSE',
      id,
      updatedCourse?.name,
      { updatedFields: Object.keys(courseData) }
    );

    return {
      success: true,
      message: 'Курс успешно обновлён',
      course: updatedCourse,
    };
  } catch (error) {
    console.error('Ошибка обновления курса:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при обновлении курса',
    };
  }
});
