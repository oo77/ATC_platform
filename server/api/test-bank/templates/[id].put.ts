/**
 * API endpoint для обновления шаблона теста
 * PUT /api/test-bank/templates/:id
 */

import { updateTestTemplate, testTemplateCodeExists } from '../../../repositories/testTemplateRepository';
import type { UpdateTestTemplateDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody<UpdateTestTemplateDTO>(event);

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        // Если меняется код, проверяем уникальность
        if (body.code) {
            const codeExists = await testTemplateCodeExists(body.code, id);
            if (codeExists) {
                return {
                    success: false,
                    message: `Шаблон с кодом "${body.code}" уже существует`,
                };
            }
        }

        // Обновляем
        const template = await updateTestTemplate(id, {
            name: body.name?.trim(),
            code: body.code?.trim().toUpperCase(),
            description: body.description?.trim(),
            questions_mode: body.questions_mode,
            questions_count: body.questions_count,
            time_limit_minutes: body.time_limit_minutes,
            passing_score: body.passing_score,
            max_attempts: body.max_attempts,
            shuffle_questions: body.shuffle_questions,
            shuffle_options: body.shuffle_options,
            questions_per_page: body.questions_per_page,
            show_results: body.show_results,
            allow_back: body.allow_back,
            proctoring_enabled: body.proctoring_enabled,
            proctoring_settings: body.proctoring_settings,
            allowed_languages: body.allowed_languages,
            is_active: body.is_active,
        });

        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        return {
            success: true,
            message: 'Шаблон теста успешно обновлён',
            template,
        };
    } catch (error) {
        console.error('Ошибка обновления шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении шаблона теста',
        };
    }
});
