/**
 * API endpoint для получения категорий банков
 * GET /api/test-bank/banks/categories
 */

import { getQuestionBankCategories } from '../../../repositories/questionBankRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.TEST_BANKS_VIEW, Permission.TEST_BANKS_MANAGE]);

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
