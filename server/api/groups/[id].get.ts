/**
 * API endpoint для получения детальной информации о группе
 * GET /api/groups/[id]
 */

import { getGroupById } from '../../repositories/groupRepository';
import { Permission, roleHasPermission } from "../../utils/permissions";
import { requireGroupPermission } from "../../utils/resourceAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  const accessCtx = await requireGroupPermission(event, getRouterParam(event, "id"), [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN, Permission.SCHEDULE_VIEW_OWN]);
  // Слушатель (без прав на группы) видит состав группы без персональных данных одногруппников
  const hidePersonalData =
    !roleHasPermission(accessCtx, Permission.GROUPS_VIEW_ALL) &&
    !roleHasPermission(accessCtx, Permission.GROUPS_VIEW_OWN);

  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      return {
        success: false,
        message: 'ID группы не указан',
      };
    }

    const group = await getGroupById(id);

    if (!group) {
      return {
        success: false,
        message: 'Группа не найдена',
      };
    }

    if (hidePersonalData && Array.isArray(group.students)) {
      group.students = group.students.map((link: any) => ({
        ...link,
        student: link.student ? { ...link.student, pinfl: "" } : link.student,
      }));
    }

    return {
      success: true,
      group,
    };
  } catch (error) {
    console.error('Ошибка получения группы:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении информации о группе',
    };
  }
});
