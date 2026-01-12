/**
 * API endpoint для получения шаблона теста по ID
 * GET /api/test-bank/templates/:id
 */

import { getTestTemplateById, getTemplateQuestions } from '../../../repositories/testTemplateRepository';
import { getQuestionsByIds } from '../../../repositories/questionRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const query = getQuery(event);

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

        // Если запрошены вопросы шаблона (для режима manual)
        let questions = undefined;
        if (query.include_questions === 'true' && template.questions_mode === 'manual') {
            const templateQuestions = await getTemplateQuestions(id);
            const questionIds = templateQuestions.map(tq => tq.question_id);

            if (questionIds.length > 0) {
                const questionsList = await getQuestionsByIds(questionIds);
                // Сортируем по порядку из templateQuestions
                questions = templateQuestions.map(tq => {
                    const q = questionsList.find(q => q.id === tq.question_id);
                    return {
                        ...q,
                        order_index: tq.order_index,
                        points_override: tq.points_override,
                    };
                }).filter(q => q);
            }
        }

        return {
            success: true,
            template,
            questions,
        };
    } catch (error) {
        console.error('Ошибка получения шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при получении шаблона теста',
        };
    }
});
