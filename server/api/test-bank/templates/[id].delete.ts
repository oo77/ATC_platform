/**
 * API endpoint для удаления шаблона теста
 * DELETE /api/test-bank/templates/:id
 */

import { deleteTestTemplate, getTestTemplateById } from '../../../repositories/testTemplateRepository';
import { getDisciplinesByTestTemplateId } from '../../../repositories/disciplineTestRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        // Проверяем существование
        const template = await getTestTemplateById(id);
        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Проверяем, привязан ли к дисциплинам
        const disciplines = await getDisciplinesByTestTemplateId(id);
        if (disciplines.length > 0) {
            const disciplineNames = disciplines.map(d => d.discipline_name).join(', ');
            return {
                success: false,
                message: `Невозможно удалить: шаблон привязан к дисциплинам: ${disciplineNames}`,
            };
        }

        // Удаляем
        const deleted = await deleteTestTemplate(id);

        if (!deleted) {
            return {
                success: false,
                message: 'Ошибка при удалении шаблона теста',
            };
        }

        return {
            success: true,
            message: 'Шаблон теста успешно удалён',
        };
    } catch (error) {
        console.error('Ошибка удаления шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при удалении шаблона теста',
        };
    }
});
