/**
 * API endpoint для управления вопросами шаблона (режим manual)
 * PUT /api/test-bank/templates/:id/questions
 */

import {
    getTestTemplateById,
    setTemplateQuestions
} from '../../../../repositories/testTemplateRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody<{
            questions: Array<{ questionId: string; pointsOverride?: number }>;
        }>(event);

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        // Проверяем существование шаблона
        const template = await getTestTemplateById(id);
        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Проверяем режим
        if (template.questions_mode !== 'manual') {
            return {
                success: false,
                message: 'Управление вопросами доступно только для режима "manual"',
            };
        }

        // Устанавливаем вопросы
        await setTemplateQuestions(id, body.questions || []);

        return {
            success: true,
            message: 'Вопросы шаблона обновлены',
            questionsCount: body.questions?.length || 0,
        };
    } catch (error) {
        console.error('Ошибка обновления вопросов шаблона:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении вопросов шаблона',
        };
    }
});
