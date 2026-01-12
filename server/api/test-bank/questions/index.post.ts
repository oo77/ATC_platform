/**
 * API endpoint для создания вопроса
 * POST /api/test-bank/questions
 */

import { createQuestion, getNextOrderIndex } from '../../../repositories/questionRepository';
import { getQuestionBankById } from '../../../repositories/questionBankRepository';
import { logActivity } from '../../../utils/activityLogger';
import type { CreateQuestionDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateQuestionDTO>(event);

        // Валидация
        if (!body.bank_id) {
            return {
                success: false,
                message: 'ID банка обязателен',
            };
        }

        if (!body.question_text?.trim()) {
            return {
                success: false,
                message: 'Текст вопроса обязателен',
            };
        }

        if (!body.options) {
            return {
                success: false,
                message: 'Варианты ответов обязательны',
            };
        }

        // Проверяем существование банка
        const bank = await getQuestionBankById(body.bank_id);
        if (!bank) {
            return {
                success: false,
                message: 'Банк вопросов не найден',
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

        // Получаем следующий порядковый номер
        if (body.order_index === undefined) {
            body.order_index = await getNextOrderIndex(body.bank_id);
        }

        // Создаём вопрос
        const question = await createQuestion({
            bank_id: body.bank_id,
            question_type: body.question_type || 'single',
            question_text: body.question_text.trim(),
            question_media: body.question_media,
            options: body.options,
            points: body.points || 1,
            explanation: body.explanation?.trim(),
            difficulty: body.difficulty || 'medium',
            language: body.language,
            tags: body.tags,
            order_index: body.order_index,
            is_active: body.is_active !== false,
        });

        // Логируем действие
        await logActivity(
            event,
            'CREATE',
            'COURSE', // Используем COURSE для вопросов банка
            question.id,
            `Вопрос: ${question.question_text.substring(0, 50)}...`,
            { 
                bankId: question.bank_id, 
                questionType: question.question_type,
                difficulty: question.difficulty,
                points: question.points
            }
        );

        return {
            success: true,
            message: 'Вопрос успешно создан',
            question,
        };
    } catch (error) {
        console.error('Ошибка создания вопроса:', error);

        return {
            success: false,
            message: 'Ошибка при создании вопроса',
        };
    }
});
