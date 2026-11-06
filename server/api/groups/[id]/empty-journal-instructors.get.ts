/**
 * GET /api/groups/:id/empty-journal-instructors
 * Инструкторы, которые ведут занятия группы по расписанию, — для выбора перед скачиванием
 * «Пустого журнала»: кого из них указать в строках «Instruktor F.I.Sh»
 * (см. GET /api/groups/:id/empty-journal, параметр instructorIds).
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import { loadEmptyJournalInstructors } from "../../../services/emptyJournalService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  try {
    const context = await getPermissionContext(event);
    if (!context) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Требуется авторизация",
      });
    }

    const canView =
      roleHasPermission(context.role, Permission.GROUPS_VIEW_ALL) ||
      roleHasPermission(context.role, Permission.GROUPS_VIEW_OWN);
    if (!canView) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Недостаточно прав для просмотра группы",
      });
    }

    const groupId = getRouterParam(event, "id");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "ID группы не указан",
      });
    }

    if (!(await canAccessGroup(context, groupId))) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Нет доступа к этой группе",
      });
    }

    return {
      success: true,
      instructors: await loadEmptyJournalInstructors(groupId),
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("[API] Ошибка загрузки инструкторов для пустого журнала:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка загрузки инструкторов группы",
    });
  }
});
