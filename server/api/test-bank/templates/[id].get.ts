/**
 * API endpoint для получения шаблона теста по ID
 * GET /api/test-bank/templates/:id
 */

import { getTestTemplateById } from '../../../repositories/testTemplateRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        const template = await getTestTemplateById(id);

        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        return {
            success: true,
            template,
        };
    } catch (error) {
        console.error('Ошибка получения шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при получении шаблона теста',
        };
    }
});