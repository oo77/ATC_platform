import { defineEventHandler, createError } from 'h3';
import { getOrganizationsStats } from '../../repositories/organizationRepository';
import { Permission, requirePermission } from "../../utils/permissions";

/**
 * GET /api/organizations/stats
 * Получение статистики по организациям
 */
export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.ORGANIZATIONS_VIEW);

  try {
    const stats = await getOrganizationsStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error fetching organizations stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении статистики организаций',
    });
  }
});
