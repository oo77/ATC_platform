/**
 * API endpoint для удаления вопроса
 * DELETE /api/test-bank/questions/:id
 */

import { deleteQuestion, getQuestionById } from '../../../repositories/questionRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID вопроса не указан',
            };
        }

        // Проверяем существование
        const question = await getQuestionById(id);
        if (!question) {
            return {
                success: false,
                message: 'Вопрос не найден',
            };
        }

        // Удаляем
        const deleted = await deleteQuestion(id);

        if (!deleted) {
            return {
                success: false,
                message: 'Ошибка при удалении вопроса',
            };
        }

        // Логируем действие
        await logActivity(
            event,
            'DELETE',
            'COURSE',
            id,
            `Вопрос: ${question.question_text.substring(0, 50)}...`,
            { bankId: question.bank_id, questionType: question.question_type }
        );

        return {
            success: true,
            message: 'Вопрос успешно удалён',
        };
    } catch (error) {
        console.error('Ошибка удаления вопроса:', error);

        return {
            success: false,
            message: 'Ошибка при удалении вопроса',
        };
    }
});
