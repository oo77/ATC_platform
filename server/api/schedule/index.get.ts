/**
 * GET /api/schedule
 * Получение событий расписания
 * 
 * Фильтрация по ролям:
 * - ADMIN/MANAGER: все события
 * - TEACHER: только события своих групп
 * - STUDENT: только события своих групп
 */

import { getScheduleEvents } from '../../repositories/scheduleRepository';
import type { ScheduleEventType } from '../../repositories/scheduleRepository';
import { dateToLocalIso } from '../../utils/timeUtils';
import {
  getPermissionContext,
  roleHasPermission,
  getTeacherGroups,
  getStudentGroups,
} from '../../utils/permissions';
import { Permission } from '../../types/permissions';
import { UserRole } from '../../types/auth';
import { logActivity } from '../../utils/activityLogger';


export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Получаем контекст разрешений
    const context = await getPermissionContext(event);

    if (!context) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Требуется авторизация',
      });
    }

    // Проверяем разрешение на просмотр расписания
    const canViewAll = roleHasPermission(context.role, Permission.SCHEDULE_VIEW_ALL);
    const canViewOwn = roleHasPermission(context.role, Permission.SCHEDULE_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Недостаточно прав для просмотра расписания',
      });
    }

    const filters: {
      startDate?: string;
      endDate?: string;
      groupId?: string;
      instructorId?: string;
      classroomId?: string;
      eventType?: ScheduleEventType;
      groupIds?: string[];
      orInstructorId?: string;
    } = {
      startDate: query.startDate as string | undefined,
      endDate: query.endDate as string | undefined,
      groupId: query.groupId as string | undefined,
      instructorId: query.instructorId as string | undefined,
      classroomId: query.classroomId as string | undefined,
      eventType: query.eventType as ScheduleEventType | undefined,
    };

    // Фильтрация для TEACHER: события его групп или где он назначен инструктором
    if (context.role === UserRole.TEACHER && !canViewAll) {
      if (context.instructorId) {
        const teacherGroupIds = await getTeacherGroups(context.instructorId);
        filters.groupIds = teacherGroupIds;
        filters.orInstructorId = context.instructorId; // Также показывать события, где он назначен инструктором
        console.log(`[Schedule API] TEACHER ${context.userId} фильтрация по своим группам: ${teacherGroupIds.length} групп + события где назначен инструктором`);
      } else {
        console.warn(`[Schedule API] TEACHER ${context.userId} не имеет связанного instructorId`);
        return { success: true, events: [] };
      }
    }

    // Фильтрация для STUDENT: только свои группы
    if (context.role === UserRole.STUDENT && !canViewAll) {
      if (context.studentId) {
        const studentGroupIds = await getStudentGroups(context.studentId);
        filters.groupIds = studentGroupIds;
        console.log(`[Schedule API] STUDENT ${context.userId} фильтрация по своим группам: ${studentGroupIds.length} групп`);
      } else {
        console.warn(`[Schedule API] STUDENT ${context.userId} не имеет связанного studentId`);
        return { success: true, events: [] };
      }
    }

    console.log('[Schedule API] Фильтры запроса:', JSON.stringify(filters));

    const events = await getScheduleEvents(filters);

    console.log(`[Schedule API] Найдено событий: ${events.length}`);

    // Логируем первое событие для отладки
    if (events.length > 0) {
      console.log('[Schedule API] Пример события из БД:', JSON.stringify({
        id: events[0].id,
        title: events[0].title,
        eventType: events[0].eventType,
        color: events[0].color,
      }));
    }

    // Логируем действие
    await logActivity(
      event,
      'VIEW',
      'SCHEDULE',
      undefined,
      undefined,
      { message: `Просмотр расписания (${events.length} событий)` }
    );

    return {
      success: true,
      events: events.map((e) => ({
        ...e,
        // Используем dateToLocalIso для сохранения времени "как есть"
        startTime: dateToLocalIso(e.startTime),
        endTime: dateToLocalIso(e.endTime),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    // Пробрасываем HTTP ошибки
    if (error.statusCode) {
      throw error;
    }

    console.error('Error fetching schedule events:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении расписания',
    });
  }
});

