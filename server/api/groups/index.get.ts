/**
 * API endpoint для получения списка учебных групп с пагинацией
 * GET /api/groups?page=1&limit=10&search=...
 * 
 * Фильтрация по ролям:
 * - ADMIN/MANAGER: все группы
 * - TEACHER: только группы, где пользователь назначен инструктором
 * - STUDENT: недоступен (нет разрешения)
 */

import { getGroups, getGroupsStats, type GroupFilters } from '../../repositories/groupRepository';
import {
  getPermissionContext,
  roleHasPermission,
  getTeacherGroups
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

    // Проверяем разрешение на просмотр групп
    const canViewAll = roleHasPermission(context.role, Permission.GROUPS_VIEW_ALL);
    const canViewOwn = roleHasPermission(context.role, Permission.GROUPS_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Недостаточно прав для просмотра групп',
      });
    }

    // Парсим фильтры
    const filters: GroupFilters = {};

    if (query.search) {
      filters.search = query.search as string;
    }

    if (query.courseId) {
      filters.courseId = query.courseId as string;
    }

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    }

    if (query.startDateFrom) {
      filters.startDateFrom = query.startDateFrom as string;
    }

    if (query.startDateTo) {
      filters.startDateTo = query.startDateTo as string;
    }

    // Фильтрация для TEACHER: только свои группы
    if (context.role === UserRole.TEACHER && !canViewAll) {
      if (context.instructorId) {
        const teacherGroupIds = await getTeacherGroups(context.instructorId);
        filters.groupIds = teacherGroupIds;

        console.log(`[API Groups] TEACHER ${context.userId} фильтрация по своим группам: ${teacherGroupIds.length} групп`);
      } else {
        // Если инструктор не связан — возвращаем пустой список
        console.warn(`[API Groups] TEACHER ${context.userId} не имеет связанного instructorId`);
        return {
          success: true,
          groups: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          stats: { total: 0, active: 0, completed: 0, totalStudents: 0 },
        };
      }
    }

    // Парсим параметры пагинации
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? Math.min(parseInt(query.limit as string, 10), 100) : 10;

    const result = await getGroups({ page, limit, filters });

    // Получаем статистику (для TEACHER — только по своим группам)
    const stats = context.role === UserRole.TEACHER && filters.groupIds
      ? await getGroupsStats(filters.groupIds)
      : await getGroupsStats();

    // Логируем действие
    await logActivity(
      event,
      'VIEW',
      'GROUP',
      undefined,
      undefined,
      { message: `Просмотр списка групп (${result.total} результатов)` }
    );

    return {
      success: true,
      groups: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats,
    };
  } catch (error: any) {
    // Пробрасываем HTTP ошибки
    if (error.statusCode) {
      throw error;
    }

    console.error('Ошибка получения списка групп:', error);

    return {
      success: false,
      message: 'Ошибка при получении списка групп',
      groups: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      stats: { total: 0, active: 0, completed: 0, totalStudents: 0 },
    };
  }
});

