/**
 * API endpoint для обновления студента
 * PUT /api/students/:id
 */

import { updateStudent, studentExistsByPinfl } from '../../repositories/studentRepository';
import { logActivity } from '../../utils/activityLogger';
import type { UpdateStudentInput } from '../../types/student';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID студента не указан',
      };
    }

    const body = await readBody<UpdateStudentInput>(event);

    // Валидация ПИНФЛ, если он передан
    if (body.pinfl !== undefined) {
      if (!body.pinfl.trim()) {
        return {
          success: false,
          message: 'ПИНФЛ не может быть пустым',
        };
      }

      if (!/^\d{14}$/.test(body.pinfl)) {
        return {
          success: false,
          message: 'ПИНФЛ должен содержать ровно 14 цифр',
        };
      }

      // Проверка уникальности ПИНФЛ (исключая текущего студента)
      const exists = await studentExistsByPinfl(body.pinfl, id);
      if (exists) {
        return {
          success: false,
          message: 'Студент с таким ПИНФЛ уже существует',
        };
      }
    }

    // Валидация других полей
    if (body.fullName !== undefined && !body.fullName.trim()) {
      return {
        success: false,
        message: 'Ф.И.О не может быть пустым',
      };
    }

    if (body.organization !== undefined && !body.organization.trim()) {
      return {
        success: false,
        message: 'Организация не может быть пустой',
      };
    }

    if (body.position !== undefined && !body.position.trim()) {
      return {
        success: false,
        message: 'Должность не может быть пустой',
      };
    }

    // Подготовка данных для обновления
    const updateData: Partial<UpdateStudentInput> = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName.trim();
    if (body.pinfl !== undefined) updateData.pinfl = body.pinfl.trim();
    if (body.organization !== undefined) updateData.organization = body.organization.trim();
    if (body.department !== undefined) updateData.department = body.department?.trim() || undefined;
    if (body.position !== undefined) updateData.position = body.position.trim();

    const student = await updateStudent(id, updateData);

    if (!student) {
      return {
        success: false,
        message: 'Студент не найден',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'STUDENT',
      student.id,
      student.fullName,
      { updatedFields: Object.keys(updateData) }
    );

    return {
      success: true,
      student,
    };
  } catch (error) {
    console.error('Ошибка обновления студента:', error);
    
    return {
      success: false,
      message: 'Ошибка при обновлении данных студента',
    };
  }
});
