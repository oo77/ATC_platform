import { defineEventHandler, getQuery, createError } from 'h3';
import { getOrganizationsPaginated } from '../../repositories/organizationRepository';

/**
 * GET /api/tg-app/organizations
 * Получение списка организаций для формы регистрации в TG App
 * Публичный доступ (в рамках /api/tg-app)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const limit = query.limit ? parseInt(query.limit as string, 10) : 1000;
        const search = query.search as string | undefined;

        const result = await getOrganizationsPaginated({
            page: 1,
            limit: limit,
            filters: {
                isActive: true,
                search: search
            }
        });

        return {
            success: true,
            data: result.data.map(org => ({
                id: org.id,
                name: org.name
            }))
        };
    } catch (error) {
        console.error('[TG-App] Error fetching organizations:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при получении списка организаций',
        });
    }
});
