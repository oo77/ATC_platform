/**
 * POST /api/final-grades
 * Выставить итоговую оценку
 */

import { upsertFinalGrade } from '../../repositories/attendanceRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.auth?.userId;
    
    if (!body.studentId || !body.groupId || !body.disciplineId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать studentId, groupId и disciplineId',
      });
    }
    
    if (body.finalGrade !== undefined && (body.finalGrade < 0 || body.finalGrade > 100)) {
      throw createError({
        statusCode: 400,
        message: 'Итоговая оценка должна быть от 0 до 100',
      });
    }
    
    const validStatuses = ['in_progress', 'passed', 'failed', 'not_allowed'];
    if (body.status && !validStatuses.includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: `Статус должен быть одним из: ${validStatuses.join(', ')}`,
      });
    }
    
    const finalGrade = await upsertFinalGrade({
      studentId: body.studentId,
      groupId: body.groupId,
      disciplineId: body.disciplineId,
      finalGrade: body.finalGrade,
      status: body.status,
      notes: body.notes,
      gradedBy: userId,
    });
    
    await logActivity(
      event,
      'UPDATE',
      'GRADE',
      finalGrade.id,
      `Итоговая оценка: ${finalGrade.finalGrade || 'не выставлена'}`,
      { 
        studentId: body.studentId, 
        groupId: body.groupId,
        disciplineId: body.disciplineId,
        finalGrade: body.finalGrade,
        status: body.status,
      }
    );
    
    return {
      success: true,
      finalGrade,
    };
  } catch (error: any) {
    console.error('Error saving final grade:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при сохранении итоговой оценки',
    });
  }
});
