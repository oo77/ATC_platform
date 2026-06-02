/**
 * API endpoint для удаления шаблона теста
 * DELETE /api/test-bank/templates/:id
 */

import { getTestTemplateById, deleteTestTemplate } from '../../../repositories/testTemplateRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        const existing = await getTestTemplateById(id);
        if (!existing) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        await deleteTestTemplate(id);

        return {
            success: true,
            message: 'Шаблон теста удалён',
        };
    } catch (error) {
        console.error('Ошибка удаления шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при удалении шаблона теста',
        };
    }
});