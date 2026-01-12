/**
 * POST /api/grades
 * Выставить оценку (одиночная или массовая)
 */

import { upsertGrade, bulkUpsertGrades, getExistingGrade } from '../../repositories/attendanceRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.auth?.userId;

    // Массовое выставление
    if (body.bulk && Array.isArray(body.grades)) {
      const count = await bulkUpsertGrades({
        scheduleEventId: body.scheduleEventId,
        gradedBy: userId,
        grades: body.grades,
      });

      await logActivity(
        event,
        'UPDATE',
        'GRADE',
        body.scheduleEventId,
        `Массовое выставление оценок`,
        { count, scheduleEventId: body.scheduleEventId }
      );

      return {
        success: true,
        message: `Выставлено ${count} оценок`,
        count,
      };
    }

    // Одиночная оценка
    if (!body.studentId || !body.scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать studentId и scheduleEventId',
      });
    }

    if (body.grade === undefined || body.grade < 0 || body.grade > 100) {
      throw createError({
        statusCode: 400,
        message: 'Оценка должна быть от 0 до 100',
      });
    }

    // Проверяем, является ли это изменением автоматической оценки
    const existingGrade = await getExistingGrade(body.studentId, body.scheduleEventId);
    const isModifyingAutoGrade = existingGrade?.isFromTest && !existingGrade?.isModified;
    const wasAlreadyModified = existingGrade?.isFromTest && existingGrade?.isModified;

    // Если требуется подтверждение и оно не получено
    if (isModifyingAutoGrade && !body.confirmModify) {
      return {
        success: false,
        requireConfirmation: true,
        message: 'Эта оценка была автоматически выставлена из теста. Вы уверены, что хотите её изменить?',
        originalGrade: existingGrade.grade,
        newGrade: body.grade,
      };
    }

    const grade = await upsertGrade({
      studentId: body.studentId,
      scheduleEventId: body.scheduleEventId,
      grade: body.grade,
      notes: body.notes,
      gradedBy: userId,
    });

    await logActivity(
      event,
      'UPDATE',
      'GRADE',
      grade.id,
      isModifyingAutoGrade ? `Изменена автоматическая оценка: ${existingGrade?.grade} → ${grade.grade}` : `Оценка: ${grade.grade}`,
      {
        studentId: body.studentId,
        scheduleEventId: body.scheduleEventId,
        grade: body.grade,
        wasAutoGrade: isModifyingAutoGrade,
        originalGrade: isModifyingAutoGrade ? existingGrade?.grade : undefined,
      }
    );

    return {
      success: true,
      grade,
      wasModified: isModifyingAutoGrade || wasAlreadyModified,
      originalGrade: existingGrade?.originalGrade || (isModifyingAutoGrade ? existingGrade?.grade : null),
    };
  } catch (error: any) {
    console.error('Error saving grade:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при сохранении оценки',
    });
  }
});
