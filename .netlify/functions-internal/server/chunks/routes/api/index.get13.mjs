import { d as defineEventHandler, g as getQuery, c as createError, U as UserRole } from '../../nitro/nitro.mjs';
import { i as getScheduleEvents, h as dateToLocalIso } from '../../_/scheduleRepository.mjs';
import { c as getPermissionContext, d as roleHasPermission, P as Permission, e as getTeacherGroups, h as getStudentGroups } from '../../_/permissions.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';
import '../../_/activityLogRepository.mjs';

const index_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const context = await getPermissionContext(event);
    if (!context) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const canViewAll = roleHasPermission(context.role, Permission.SCHEDULE_VIEW_ALL);
    const canViewOwn = roleHasPermission(context.role, Permission.SCHEDULE_VIEW_OWN);
    if (!canViewAll && !canViewOwn) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F"
      });
    }
    const filters = {
      startDate: query.startDate,
      endDate: query.endDate,
      groupId: query.groupId,
      instructorId: query.instructorId,
      classroomId: query.classroomId,
      eventType: query.eventType
    };
    if (context.role === UserRole.TEACHER && !canViewAll) {
      if (context.instructorId) {
        const teacherGroupIds = await getTeacherGroups(context.instructorId);
        filters.groupIds = teacherGroupIds;
        filters.orInstructorId = context.instructorId;
        console.log(`[Schedule API] TEACHER ${context.userId} \u0444\u0438\u043B\u044C\u0442\u0440\u0430\u0446\u0438\u044F \u043F\u043E \u0441\u0432\u043E\u0438\u043C \u0433\u0440\u0443\u043F\u043F\u0430\u043C: ${teacherGroupIds.length} \u0433\u0440\u0443\u043F\u043F + \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u0433\u0434\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u043C`);
      } else {
        console.warn(`[Schedule API] TEACHER ${context.userId} \u043D\u0435 \u0438\u043C\u0435\u0435\u0442 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0433\u043E instructorId`);
        return { success: true, events: [] };
      }
    }
    if (context.role === UserRole.STUDENT && !canViewAll) {
      if (context.studentId) {
        const studentGroupIds = await getStudentGroups(context.studentId);
        filters.groupIds = studentGroupIds;
        console.log(`[Schedule API] STUDENT ${context.userId} \u0444\u0438\u043B\u044C\u0442\u0440\u0430\u0446\u0438\u044F \u043F\u043E \u0441\u0432\u043E\u0438\u043C \u0433\u0440\u0443\u043F\u043F\u0430\u043C: ${studentGroupIds.length} \u0433\u0440\u0443\u043F\u043F`);
      } else {
        console.warn(`[Schedule API] STUDENT ${context.userId} \u043D\u0435 \u0438\u043C\u0435\u0435\u0442 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0433\u043E studentId`);
        return { success: true, events: [] };
      }
    }
    console.log("[Schedule API] \u0424\u0438\u043B\u044C\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u0430:", JSON.stringify(filters));
    const events = await getScheduleEvents(filters);
    console.log(`[Schedule API] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u043E\u0431\u044B\u0442\u0438\u0439: ${events.length}`);
    if (events.length > 0) {
      console.log("[Schedule API] \u041F\u0440\u0438\u043C\u0435\u0440 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u0438\u0437 \u0411\u0414:", JSON.stringify({
        id: events[0].id,
        title: events[0].title,
        eventType: events[0].eventType,
        color: events[0].color
      }));
    }
    await logActivity(
      event,
      "VIEW",
      "SCHEDULE",
      void 0,
      void 0,
      { message: `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F (${events.length} \u0441\u043E\u0431\u044B\u0442\u0438\u0439)` }
    );
    return {
      success: true,
      events: events.map((e) => ({
        ...e,
        // Используем dateToLocalIso для сохранения времени "как есть"
        startTime: dateToLocalIso(e.startTime),
        endTime: dateToLocalIso(e.endTime),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
      }))
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error fetching schedule events:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get13.mjs.map
