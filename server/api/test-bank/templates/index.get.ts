/**
 * API endpoint для получения списка шаблонов тестов
 * GET /api/test-bank/templates?bank_id=...&page=1&limit=20
 */

import { getTestTemplates } from '../../../repositories/testTemplateRepository';
import type { TestTemplateFilters } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);

        // Фильтры
        const filters: TestTemplateFilters = {
            bank_id: query.bank_id as string | undefined,
            is_active: query.is_active !== undefined ? query.is_active === 'true' : undefined,
            search: query.search as string | undefined,
        };

        // Пагинация
        const pagination = {
            page: query.page ? parseInt(query.page as string, 10) : 1,
            limit: Math.min(query.limit ? parseInt(query.limit as string, 10) : 20, 100),
        };

        const result = await getTestTemplates(filters, pagination);

        return {
            success: true,
            templates: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error('Ошибка получения шаблонов тестов:', error);

        return {
            success: false,
            message: 'Ошибка при получении списка шаблонов',
            templates: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
        };
    }
});
