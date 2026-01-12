/**
 * API endpoint для создания нового курса
 * POST /api/courses
 */

import { createCourse, courseCodeExists, type CreateCourseInput } from '../../repositories/courseRepository';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';

// Схема валидации для дисциплины
const disciplineSchema = z.object({
  name: z.string().min(1, 'Название дисциплины обязательно'),
  description: z.string().optional(),
  theoryHours: z.number().min(0, 'Часы теории не могут быть отрицательными'),
  practiceHours: z.number().min(0, 'Часы практики не могут быть отрицательными'),
  assessmentHours: z.number().min(0, 'Часы проверки знаний не могут быть отрицательными'),
  orderIndex: z.number().optional(),
  instructorIds: z.array(z.string()).min(1, 'Необходимо выбрать хотя бы одного инструктора').optional(),
}).refine(
  (data) => (data.theoryHours + data.practiceHours + data.assessmentHours) > 0,
  { message: 'Общее количество часов должно быть больше нуля', path: ['hours'] }
);

// Схема валидации для курса
const courseSchema = z.object({
  name: z.string().min(1, 'Название курса обязательно'),
  shortName: z.string().min(2).max(10, 'Короткое название должно быть от 2 до 10 символов'),
  code: z.string().min(1, 'Код курса обязателен'),
  description: z.string().optional(),
  certificateTemplateId: z.string().optional(),
  certificateValidityMonths: z.number().positive().int().nullable().optional(), // Срок действия сертификата в месяцах (null = бессрочный)
  isActive: z.boolean().optional(),
  disciplines: z.array(disciplineSchema).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Валидация
    const validationResult = courseSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        message: firstError?.message || 'Ошибка валидации данных',
        field: firstError?.path.join('.'),
        errors: validationResult.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    const data = validationResult.data;

    // Проверяем уникальность кода курса
    const codeExists = await courseCodeExists(data.code);
    if (codeExists) {
      return {
        success: false,
        message: 'Курс с таким кодом уже существует',
        field: 'code',
      };
    }

    // Создаём курс
    const course = await createCourse(data as CreateCourseInput);

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'COURSE',
      String(course.id),
      course.name,
      { code: course.code, shortName: course.shortName }
    );

    return {
      success: true,
      message: 'Курс успешно создан',
      course,
    };
  } catch (error) {
    console.error('Ошибка создания курса:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при создании курса',
    };
  }
});
