/**
 * API endpoint для получения банка вопросов по ID
 * GET /api/test-bank/banks/:id
 */

import { getQuestionBankById } from '../../../repositories/questionBankRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID банка не указан',
            };
        }

        const bank = await getQuestionBankById(id);

        if (!bank) {
            return {
                success: false,
                message: 'Банк вопросов не найден',
            };
        }

        return {
            success: true,
            bank,
        };
    } catch (error) {
        console.error('Ошибка получения банка вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при получении банка вопросов',
        };
    }
});
