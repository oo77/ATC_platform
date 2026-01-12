/**
 * API endpoint для получения категорий банков
 * GET /api/test-bank/banks/categories
 */

import { getQuestionBankCategories } from '../../../repositories/questionBankRepository';

export default defineEventHandler(async () => {
    try {
        const categories = await getQuestionBankCategories();

        return {
            success: true,
            categories,
        };
    } catch (error) {
        console.error('Ошибка получения категорий:', error);

        return {
            success: false,
            message: 'Ошибка при получении категорий',
            categories: [],
        };
    }
});
