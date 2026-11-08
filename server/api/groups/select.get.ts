/**
 * API endpoint для получения списка групп для выбора (select)
 * GET /api/groups/select?excludeGroupId=...
 */

import { getGroupsForSelect } from '../../repositories/groupRepository';
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.GROUPS_VIEW_ALL);

  try {
    const query = getQuery(event);
    const excludeGroupId = query.excludeGroupId as string | undefined;

    const groups = await getGroupsForSelect(excludeGroupId);

    return {
      success: true,
      groups,
    };
  } catch (error) {
    console.error('Ошибка получения списка групп:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка групп',
      groups: [],
    };
  }
});
