/**
 * API endpoint для получения активных банков для выбора
 * GET /api/test-bank/banks/select
 */

import { getActiveBanksForSelect } from '../../../repositories/questionBankRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.TEST_BANKS_VIEW, Permission.TEST_BANKS_MANAGE, Permission.TEST_TEMPLATES_VIEW]);

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
