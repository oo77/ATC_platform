/**
 * API endpoint для обновления вопроса
 * PUT /api/test-bank/questions/:id
 */

import { updateQuestion } from '../../../repositories/questionRepository';
import { logActivity } from '../../../utils/activityLogger';
import type { UpdateQuestionDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody<UpdateQuestionDTO>(event);

        if (!id) {
            return {
                success: false,
                message: 'ID вопроса не указан',
            };
        }

        // Проверяем наличие правильного ответа для single choice
        if (body.question_type === 'single' && body.options) {
            const options = (body.options as any).options || [];
            const hasCorrect = options.some((o: any) => o.correct === true);
            if (!hasCorrect) {
                return {
                    success: false,
                    message: 'Необходимо указать правильный ответ',
                };
            }
        }

        // Обновляем
        const question = await updateQuestion(id, {
            question_type: body.question_type,
            question_text: body.question_text?.trim(),
            question_media: body.question_media,
            options: body.options,
            points: body.points,
            explanation: body.explanation?.trim(),
            difficulty: body.difficulty,
            language: body.language,
            tags: body.tags,
            order_index: body.order_index,
            is_active: body.is_active,
        });

        if (!question) {
            return {
                success: false,
                message: 'Вопрос не найден',
            };
        }

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'COURSE',
            id,
            `Вопрос: ${question.question_text?.substring(0, 50) || 'обновлён'}...`,
            { 
                updatedFields: Object.keys(body).filter(k => body[k] !== undefined),
                questionType: question.question_type
            }
        );

        return {
            success: true,
            message: 'Вопрос успешно обновлён',
            question,
        };
    } catch (error) {
        console.error('Ошибка обновления вопроса:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении вопроса',
        };
    }
});
