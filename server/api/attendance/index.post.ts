/**
 * POST /api/attendance
 * Отметить посещаемость (одиночная или массовая)
 * С проверкой системы допуска инструкторов
 */

import { upsertAttendance, bulkUpsertAttendance } from '../../repositories/attendanceRepository';
import { 
  checkMarkingAccess, 
  ensureMarkingStatus, 
  updateMarkingStatus,
  updateMarkedCount,
} from '../../repositories/attendanceMarkingRepository';
import { getInstructorByUserId } from '../../repositories/instructorRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.auth?.userId;
    const role = event.context.auth?.role;
    
    const scheduleEventId = body.scheduleEventId;
    
    if (!scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать scheduleEventId',
      });
    }

    console.log(`[Attendance] POST /api/attendance - User: ${userId}, Role: ${role}, Event: ${scheduleEventId}`);
    
    // ========================================
    // ПРОВЕРКА ДОСТУПА (система допуска)
    // ========================================
    
    // Получаем ID инструктора для проверки
    let instructorId: string | undefined;
    if (role === 'TEACHER') {
      const instructor = await getInstructorByUserId(userId!);
      instructorId = instructor?.id;
    }
    
    // Убеждаемся, что статус создан
    await ensureMarkingStatus(scheduleEventId);
    
    // Проверяем доступ
    const accessCheck = await checkMarkingAccess(scheduleEventId, userId!, role!, instructorId);
    
    // Если требуется одобрение — возвращаем специальный ответ вместо ошибки
    if (!accessCheck.allowed) {
      if (accessCheck.status === 'requires_approval' || accessCheck.requiresApproval) {
        // Можно создать запрос на одобрение
        return {
          success: false,
          requiresApproval: true,
          message: accessCheck.message || 'Срок отметки истёк. Требуется одобрение администратора',
          scheduleEventId,
          deadline: accessCheck.deadline,
          lateDeadline: accessCheck.lateDeadline,
        };
      }
      
      // Полный запрет — ошибка 403
      throw createError({
        statusCode: 403,
        message: accessCheck.message || 'Доступ к отметке посещаемости запрещён',
      });
    }
    
    // Определяем статус отметки
    let markingStatus: 'on_time' | 'late' | 'approved' = 'on_time';
    if (accessCheck.status === 'late') {
      markingStatus = 'late';
    } else if (accessCheck.existingRequestId) {
      markingStatus = 'approved';
    }
    
    // ========================================
    // МАССОВАЯ ОТМЕТКА
    // ========================================
    
    if (body.bulk && Array.isArray(body.attendances)) {
      const count = await bulkUpsertAttendance({
        scheduleEventId: body.scheduleEventId,
        maxHours: body.maxHours,
        markedBy: userId,
        attendances: body.attendances,
      });
      
      // Обновляем статус отметки
      await updateMarkingStatus(scheduleEventId, {
        status: markingStatus,
        markedBy: userId,
        markedCount: count,
        lateReason: markingStatus === 'late' ? body.lateReason : undefined,
      });
      
      // Обновляем счётчик отмеченных
      await updateMarkedCount(scheduleEventId);
      
      const logMessage = markingStatus === 'late' 
        ? `Массовая отметка посещаемости (с опозданием)`
        : `Массовая отметка посещаемости`;
      
      await logActivity(
        event,
        'UPDATE',
        'ATTENDANCE',
        body.scheduleEventId,
        logMessage,
        { 
          count, 
          scheduleEventId: body.scheduleEventId,
          markingStatus,
          lateReason: body.lateReason,
        }
      );
      
      return {
        success: true,
        message: `Отмечено ${count} записей`,
        count,
        markingStatus,
        isLate: markingStatus === 'late',
      };
    }
    
    // ========================================
    // ОДИНОЧНАЯ ОТМЕТКА
    // ========================================
    
    if (!body.studentId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать studentId',
      });
    }
    
    if (body.hoursAttended === undefined || body.maxHours === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать hoursAttended и maxHours',
      });
    }
    
    if (body.hoursAttended < 0 || body.hoursAttended > body.maxHours) {
      throw createError({
        statusCode: 400,
        message: 'hoursAttended должно быть от 0 до maxHours',
      });
    }
    
    const attendance = await upsertAttendance({
      studentId: body.studentId,
      scheduleEventId: body.scheduleEventId,
      hoursAttended: body.hoursAttended,
      maxHours: body.maxHours,
      notes: body.notes,
      markedBy: userId,
    });
    
    // Обновляем статус отметки (in_progress, пока не все отмечены)
    await updateMarkingStatus(scheduleEventId, {
      status: 'in_progress',
      markedBy: userId,
    });
    
    // Обновляем счётчик отмеченных
    await updateMarkedCount(scheduleEventId);
    
    await logActivity(
      event,
      'UPDATE',
      'ATTENDANCE',
      attendance.id,
      `Посещаемость: ${attendance.hoursAttended}/${attendance.maxHours} а-ч`,
      { 
        studentId: body.studentId, 
        scheduleEventId: body.scheduleEventId,
        hoursAttended: body.hoursAttended,
        maxHours: body.maxHours,
        markingStatus,
      }
    );
    
    return {
      success: true,
      attendance,
      markingStatus,
      isLate: markingStatus === 'late',
    };
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при сохранении посещаемости',
    });
  }
});
