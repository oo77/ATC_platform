/**
 * API endpoint для получения списка вопросов
 * GET /api/test-bank/questions?bank_id=...&page=1&limit=20
 */

import { getQuestions } from '../../../repositories/questionRepository';
import type { QuestionFilters } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);

        // Фильтры
        const filters: QuestionFilters = {
            bank_id: query.bank_id as string | undefined,
            question_type: query.question_type as any,
            difficulty: query.difficulty as any,
            language: query.language as any,
            languages: query.languages ? (query.languages as string).split(',') as any : undefined,
            is_active: query.is_active !== undefined ? query.is_active === 'true' : undefined,
            search: query.search as string | undefined,
        };

        // Пагинация
        const pagination = {
            page: query.page ? parseInt(query.page as string, 10) : 1,
            limit: Math.min(query.limit ? parseInt(query.limit as string, 10) : 20, 100),
        };

        const result = await getQuestions(filters, pagination);

        return {
            success: true,
            questions: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    } catch (error) {
        console.error('Ошибка получения вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при получении списка вопросов',
            questions: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
        };
    }
});
