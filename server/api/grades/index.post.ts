/**
 * POST /api/grades
 * Выставить оценку (одиночная или массовая)
 */

import { upsertGrade, bulkUpsertGrades, getExistingGrade } from '../../repositories/attendanceRepository';
import { logActivity } from '../../utils/activityLogger';
import { Permission } from "../../utils/permissions";
import { assertGradeTargets, requireScheduleEventPermission } from "../../utils/resourceAccess";
import { recordChanges } from "../../utils/audit";
import { executeQuery } from "../../utils/db";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  const gradeBody = await readBody(event);
  const accessCtx = await requireScheduleEventPermission(event, gradeBody?.scheduleEventId, [Permission.GRADES_MANAGE]);
  {
    const ev = await executeQuery<any[]>("SELECT group_id FROM schedule_events WHERE id = ? LIMIT 1", [gradeBody.scheduleEventId]);
    await assertGradeTargets(accessCtx, {
      groupId: ev[0]?.group_id,
      scheduleEventId: gradeBody.scheduleEventId,
      studentIds: gradeBody?.bulk && Array.isArray(gradeBody.grades)
        ? gradeBody.grades.map((g: any) => g?.studentId)
        : [gradeBody?.studentId],
    });
  }

  try {
    const body = await readBody(event);
    const userId = event.context.user?.id; // было context.auth — его никто не заполнял, автор терялся

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

    // Журнал аудита: прежняя и новая оценка
    recordChanges(
      event,
      { grade: existingGrade?.grade ?? null, notes: existingGrade?.notes ?? null },
      { grade: body.grade, ...(body.notes !== undefined ? { notes: body.notes } : {}) },
    );

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
