/**
 * API endpoint для создания шаблона теста
 * POST /api/test-bank/templates
 */

import { createTestTemplate, testTemplateCodeExists } from '../../../repositories/testTemplateRepository';
import type { CreateTestTemplateDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        if (!body.name || !body.code || !body.bank_id) {
            return {
                success: false,
                message: 'Название, код и банк вопросов обязательны',
            };
        }

        const codeExists = await testTemplateCodeExists(body.code);
        if (codeExists) {
            return {
                success: false,
                message: 'Шаблон с таким кодом уже существует',
            };
        }

        const templateData: CreateTestTemplateDTO = {
            bank_id: body.bank_id,
            name: body.name,
            code: body.code,
            description: body.description,
            questions_mode: body.questions_mode || 'all',
            questions_count: body.questions_count || null,
            time_limit_minutes: body.time_limit_minutes || 0,
            passing_score: body.passing_score || 70,
            max_attempts: body.max_attempts || 3,
            shuffle_questions: body.shuffle_questions ?? false,
            shuffle_options: body.shuffle_options ?? false,
            questions_per_page: body.questions_per_page ?? 0,
            show_results: body.show_results || 'immediately',
            allow_back: body.allow_back ?? true,
            proctoring_enabled: body.proctoring_enabled ?? false,
            proctoring_settings: body.proctoring_settings,
            allowed_languages: body.allowed_languages || ['ru'],
            is_active: body.is_active ?? true,
        };

        const template = await createTestTemplate(templateData);

        return {
            success: true,
            template,
            message: 'Шаблон теста создан',
        };
    } catch (error) {
        console.error('Ошибка создания шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при создании шаблона теста',
        };
    }
});