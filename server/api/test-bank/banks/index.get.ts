/**
 * API endpoint для получения списка банков вопросов
 * GET /api/test-bank/banks?page=1&limit=20&search=...&category=...&is_active=true
 */

import { getQuestionBanks } from '../../../repositories/questionBankRepository';
import type { QuestionBankFilters } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);

        // Фильтры
        const filters: QuestionBankFilters = {
            search: query.search as string | undefined,
            category: query.category as string | undefined,
            is_active: query.is_active !== undefined ? query.is_active === 'true' : undefined,
        };

        // Пагинация
        const pagination = {
            page: query.page ? parseInt(query.page as string, 10) : 1,
            limit: Math.min(query.limit ? parseInt(query.limit as string, 10) : 20, 100),
        };

        const result = await getQuestionBanks(filters, pagination);

        return {
            success: true,
            banks: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error('Ошибка получения банков вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при получении списка банков вопросов',
            banks: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
        };
    }
});
