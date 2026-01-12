/**
 * API endpoint для получения активных шаблонов для выбора
 * GET /api/test-bank/templates/select?bank_id=...
 */

import { getActiveTemplatesForSelect } from '../../../repositories/testTemplateRepository';

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const bankId = query.bank_id as string | undefined;

        const templates = await getActiveTemplatesForSelect(bankId);

        return {
            success: true,
            templates,
        };
    } catch (error) {
        console.error('Ошибка получения шаблонов для выбора:', error);

        return {
            success: false,
            message: 'Ошибка при получении шаблонов',
            templates: [],
        };
    }
});
