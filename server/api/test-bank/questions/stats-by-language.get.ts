/**
 * API endpoint для получения статистики вопросов по языкам
 * GET /api/test-bank/questions/stats-by-language?bank_id=...
 */

import { getFullLanguageStats } from '../../../repositories/questionRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.TEST_BANKS_VIEW, Permission.TEST_BANKS_MANAGE]);

    try {
        const query = getQuery(event);
        const bankId = query.bank_id as string;

        if (!bankId) {
            return {
                success: false,
                message: 'ID банка обязателен',
                stats: [],
            };
        }

        const stats = await getFullLanguageStats(bankId, true);

        return {
            success: true,
            stats,
        };
    } catch (error) {
        console.error('Ошибка получения статистики по языкам:', error);

        return {
            success: false,
            message: 'Ошибка при получении статистики',
            stats: [],
        };
    }
});
