/**
 * API endpoint для получения списка групп для выбора (select)
 * GET /api/groups/select?excludeGroupId=...
 */

import { getGroupsForSelect } from '../../repositories/groupRepository';

export default defineEventHandler(async (event) => {
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
