/**
 * API endpoint для получения детальной информации о группе
 * GET /api/groups/[id]
 */

import { getGroupById } from '../../repositories/groupRepository';

export default defineEventHandler(async (event) => {
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
