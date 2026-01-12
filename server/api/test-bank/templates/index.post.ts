/**
 * API endpoint для создания шаблона теста
 * POST /api/test-bank/templates
 */

import { createTestTemplate, testTemplateCodeExists } from '../../../repositories/testTemplateRepository';
import { getQuestionBankById } from '../../../repositories/questionBankRepository';
import { getQuestionsCountByBankId } from '../../../repositories/questionRepository';
import type { CreateTestTemplateDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateTestTemplateDTO>(event);

        // Валидация
        if (!body.bank_id) {
            return {
                success: false,
                message: 'ID банка обязателен',
            };
        }

        if (!body.name?.trim()) {
            return {
                success: false,
                message: 'Название шаблона обязательно',
            };
        }

        if (!body.code?.trim()) {
            return {
                success: false,
                message: 'Код шаблона обязателен',
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

        // Проверяем уникальность кода
        const codeExists = await testTemplateCodeExists(body.code);
        if (codeExists) {
            return {
                success: false,
                message: `Шаблон с кодом "${body.code}" уже существует`,
            };
        }

        // Для режима random проверяем количество вопросов
        if (body.questions_mode === 'random') {
            if (!body.questions_count || body.questions_count < 1) {
                return {
                    success: false,
                    message: 'Укажите количество вопросов для режима "Случайные"',
                };
            }

            const availableQuestions = await getQuestionsCountByBankId(body.bank_id, true);
            if (body.questions_count > availableQuestions) {
                return {
                    success: false,
                    message: `В банке только ${availableQuestions} активных вопросов`,
                };
            }
        }

        // Получаем пользователя
        const userId = event.context.user?.id;

        // Создаём шаблон
        const template = await createTestTemplate({
            bank_id: body.bank_id,
            name: body.name.trim(),
            code: body.code.trim().toUpperCase(),
            description: body.description?.trim(),
            questions_mode: body.questions_mode || 'all',
            questions_count: body.questions_count,
            time_limit_minutes: body.time_limit_minutes,
            passing_score: body.passing_score || 60,
            max_attempts: body.max_attempts || 1,
            shuffle_questions: body.shuffle_questions !== false,
            shuffle_options: body.shuffle_options !== false,
            questions_per_page: body.questions_per_page || 1,
            show_results: body.show_results || 'immediately',
            allow_back: body.allow_back !== false,
            proctoring_enabled: body.proctoring_enabled || false,
            proctoring_settings: body.proctoring_settings,
            allowed_languages: body.allowed_languages,
            is_active: body.is_active !== false,
        }, userId);

        return {
            success: true,
            message: 'Шаблон теста успешно создан',
            template,
        };
    } catch (error) {
        console.error('Ошибка создания шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при создании шаблона теста',
        };
    }
});
