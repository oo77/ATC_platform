import { d as defineEventHandler, g as getQuery, c as createError, U as UserRole } from '../../nitro/nitro.mjs';
import { f as getGroups, h as getGroupsStats } from '../../_/groupRepository.mjs';
import { c as getPermissionContext, d as roleHasPermission, P as Permission, e as getTeacherGroups } from '../../_/permissions.mjs';
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
    const canViewAll = roleHasPermission(context.role, Permission.GROUPS_VIEW_ALL);
    const canViewOwn = roleHasPermission(context.role, Permission.GROUPS_VIEW_OWN);
    if (!canViewAll && !canViewOwn) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0433\u0440\u0443\u043F\u043F"
      });
    }
    const filters = {};
    if (query.search) {
      filters.search = query.search;
    }
    if (query.courseId) {
      filters.courseId = query.courseId;
    }
    if (query.isActive !== void 0) {
      filters.isActive = query.isActive === "true";
    }
    if (query.startDateFrom) {
      filters.startDateFrom = query.startDateFrom;
    }
    if (query.startDateTo) {
      filters.startDateTo = query.startDateTo;
    }
    if (context.role === UserRole.TEACHER && !canViewAll) {
      if (context.instructorId) {
        const teacherGroupIds = await getTeacherGroups(context.instructorId);
        filters.groupIds = teacherGroupIds;
        console.log(`[API Groups] TEACHER ${context.userId} \u0444\u0438\u043B\u044C\u0442\u0440\u0430\u0446\u0438\u044F \u043F\u043E \u0441\u0432\u043E\u0438\u043C \u0433\u0440\u0443\u043F\u043F\u0430\u043C: ${teacherGroupIds.length} \u0433\u0440\u0443\u043F\u043F`);
      } else {
        console.warn(`[API Groups] TEACHER ${context.userId} \u043D\u0435 \u0438\u043C\u0435\u0435\u0442 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u043E\u0433\u043E instructorId`);
        return {
          success: true,
          groups: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          stats: { total: 0, active: 0, completed: 0, totalStudents: 0 }
        };
      }
    }
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? Math.min(parseInt(query.limit, 10), 100) : 10;
    const result = await getGroups({ page, limit, filters });
    const stats = context.role === UserRole.TEACHER && filters.groupIds ? await getGroupsStats(filters.groupIds) : await getGroupsStats();
    await logActivity(
      event,
      "VIEW",
      "GROUP",
      void 0,
      void 0,
      { message: `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u043F\u0438\u0441\u043A\u0430 \u0433\u0440\u0443\u043F\u043F (${result.total} \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432)` }
    );
    return {
      success: true,
      groups: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0433\u0440\u0443\u043F\u043F:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0433\u0440\u0443\u043F\u043F",
      groups: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      stats: { total: 0, active: 0, completed: 0, totalStudents: 0 }
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get8.mjs.map
