/**
 * API endpoint для сохранения ответа
 * POST /api/tests/sessions/:id/answer
 */

import {
    getTestSessionById,
    saveAnswer,
    updateCurrentQuestionIndex
} from '../../../../repositories/testSessionRepository';
import { getQuestionById } from '../../../../repositories/questionRepository';
import type { AnswerData } from '../../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody<{
            question_id: string;
            answer_data: AnswerData;
            time_spent_seconds?: number;
            question_index?: number;
        }>(event);

        if (!id) {
            return {
                success: false,
                message: 'ID сессии не указан',
            };
        }

        if (!body.question_id) {
            return {
                success: false,
                message: 'ID вопроса обязателен',
            };
        }

        if (!body.answer_data) {
            return {
                success: false,
                message: 'Ответ обязателен',
            };
        }

        // Получаем сессию
        const session = await getTestSessionById(id);
        if (!session) {
            return {
                success: false,
                message: 'Сессия не найдена',
            };
        }

        // Проверяем статус
        if (session.status !== 'in_progress') {
            return {
                success: false,
                message: 'Тест уже завершён',
            };
        }

        // Получаем вопрос для валидации
        const question = await getQuestionById(body.question_id);
        if (!question) {
            return {
                success: false,
                message: 'Вопрос не найден',
            };
        }

        // Сохраняем ответ
        const answer = await saveAnswer({
            session_id: id,
            question_id: body.question_id,
            answer_data: body.answer_data,
            time_spent_seconds: body.time_spent_seconds,
        }, question);

        // Обновляем текущий индекс вопроса если указан
        if (body.question_index !== undefined) {
            await updateCurrentQuestionIndex(id, body.question_index);
        }

        return {
            success: true,
            message: 'Ответ сохранён',
            answer: {
                question_id: answer.question_id,
                is_correct: answer.is_correct, // Можно скрыть до конца теста
                points_earned: answer.points_earned,
            },
        };
    } catch (error) {
        console.error('Ошибка сохранения ответа:', error);

        return {
            success: false,
            message: 'Ошибка при сохранении ответа',
        };
    }
});
