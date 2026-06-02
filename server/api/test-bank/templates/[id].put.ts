/**
 * API endpoint для обновления шаблона теста
 * PUT /api/test-bank/templates/:id
 */

import { getTestTemplateById, updateTestTemplate, testTemplateCodeExists } from '../../../repositories/testTemplateRepository';
import type { UpdateTestTemplateDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody(event);

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        const existing = await getTestTemplateById(id);
        if (!existing) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        if (body.code && body.code !== existing.code) {
            const codeExists = await testTemplateCodeExists(body.code, id);
            if (codeExists) {
                return {
                    success: false,
                    message: 'Шаблон с таким кодом уже существует',
                };
            }
        }

        const updateData: UpdateTestTemplateDTO = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.code !== undefined) updateData.code = body.code;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.bank_id !== undefined) updateData.bank_id = body.bank_id;
        if (body.questions_mode !== undefined) updateData.questions_mode = body.questions_mode;
        if (body.questions_count !== undefined) updateData.questions_count = body.questions_count;
        if (body.time_limit_minutes !== undefined) updateData.time_limit_minutes = body.time_limit_minutes;
        if (body.passing_score !== undefined) updateData.passing_score = body.passing_score;
        if (body.max_attempts !== undefined) updateData.max_attempts = body.max_attempts;
        if (body.shuffle_questions !== undefined) updateData.shuffle_questions = body.shuffle_questions;
        if (body.shuffle_options !== undefined) updateData.shuffle_options = body.shuffle_options;
        if (body.questions_per_page !== undefined) updateData.questions_per_page = body.questions_per_page;
        if (body.show_results !== undefined) updateData.show_results = body.show_results;
        if (body.allow_back !== undefined) updateData.allow_back = body.allow_back;
        if (body.proctoring_enabled !== undefined) updateData.proctoring_enabled = body.proctoring_enabled;
        if (body.proctoring_settings !== undefined) updateData.proctoring_settings = body.proctoring_settings;
        if (body.allowed_languages !== undefined) updateData.allowed_languages = body.allowed_languages;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const updated = await updateTestTemplate(id, updateData);

        return {
            success: true,
            template: updated,
            message: 'Шаблон теста обновлён',
        };
    } catch (error) {
        console.error('Ошибка обновления шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении шаблона теста',
        };
    }
});