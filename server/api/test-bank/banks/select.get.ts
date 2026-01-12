/**
 * API endpoint для получения активных банков для выбора
 * GET /api/test-bank/banks/select
 */

import { getActiveBanksForSelect } from '../../../repositories/questionBankRepository';

export default defineEventHandler(async () => {
    try {
        const banks = await getActiveBanksForSelect();

        return {
            success: true,
            banks,
        };
    } catch (error) {
        console.error('Ошибка получения банков для выбора:', error);

        return {
            success: false,
            message: 'Ошибка при получении банков',
            banks: [],
        };
    }
});
