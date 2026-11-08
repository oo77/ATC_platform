import { defineEventHandler, getQuery, createError } from 'h3';
import { searchOrganizations, getAllOrganizations } from '../../repositories/organizationRepository';
import { Permission, requirePermission } from "../../utils/permissions";

/**
 * GET /api/organizations/search
 * Поиск организаций для автокомплита
 */
export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.ORGANIZATIONS_VIEW);

  try {
    const query = getQuery(event);
    const searchQuery = query.q as string;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10;

    let organizations;
    
    if (searchQuery && searchQuery.trim()) {
      organizations = await searchOrganizations(searchQuery.trim(), limit);
    } else {
      // Если запрос пустой, возвращаем первые N организаций
      const all = await getAllOrganizations();
      organizations = all.slice(0, limit);
    }

    return {
      success: true,
      data: organizations,
    };
  } catch (error) {
    console.error('Error searching organizations:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при поиске организаций',
    });
  }
});
