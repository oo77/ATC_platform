/**
 * API endpoint для создания назначения теста
 * POST /api/tests/assignments
 */

import { createTestAssignment, testAssignmentExistsForEventAndTemplate } from '../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../repositories/testTemplateRepository';
import type { CreateTestAssignmentDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateTestAssignmentDTO>(event);

        console.log('[API tests/assignments] Получен запрос:', JSON.stringify(body, null, 2));

        // Валидация
        if (!body.schedule_event_id) {
            console.log('[API tests/assignments] Ошибка: ID занятия не указан');
            return {
                success: false,
                message: 'ID занятия обязателен',
            };
        }

        if (!body.test_template_id) {
            console.log('[API tests/assignments] Ошибка: ID шаблона теста не указан');
            return {
                success: false,
                message: 'ID шаблона теста обязателен',
            };
        }

        if (!body.group_id) {
            console.log('[API tests/assignments] Ошибка: ID группы не указан');
            return {
                success: false,
                message: 'ID группы обязателен',
            };
        }

        // Проверяем, не назначен ли уже ЭТОТ КОНКРЕТНЫЙ тест на это занятие
        // (разрешаем несколько разных тестов на одно занятие)
        console.log('[API tests/assignments] Проверка существующего назначения...');
        const exists = await testAssignmentExistsForEventAndTemplate(body.schedule_event_id, body.test_template_id);
        if (exists) {
            console.log('[API tests/assignments] Ошибка: Тест уже назначен на это занятие');
            return {
                success: false,
                message: 'Этот тест уже назначен на данное занятие',
            };
        }

        // Проверяем существование шаблона
        console.log('[API tests/assignments] Проверка шаблона теста:', body.test_template_id);
        const template = await getTestTemplateById(body.test_template_id);
        if (!template) {
            console.log('[API tests/assignments] Ошибка: Шаблон теста не найден');
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }
        console.log('[API tests/assignments] Шаблон найден:', template.name);

        // Получаем пользователя
        const userId = event.context.user?.id;
        console.log('[API tests/assignments] User ID:', userId);

        // Создаём назначение
        console.log('[API tests/assignments] Создание назначения...');
        const assignment = await createTestAssignment({
            schedule_event_id: body.schedule_event_id,
            test_template_id: body.test_template_id,
            group_id: body.group_id,
            time_limit_override: body.time_limit_override,
            passing_score_override: body.passing_score_override,
            start_date: body.start_date,
            end_date: body.end_date,
        }, userId);

        console.log('[API tests/assignments] Назначение создано:', assignment.id);

        return {
            success: true,
            message: 'Тест успешно назначен на занятие',
            assignment,
        };
    } catch (error: any) {
        console.error('[API tests/assignments] Критическая ошибка:', error);
        console.error('[API tests/assignments] Stack:', error.stack);

        return {
            success: false,
            message: 'Ошибка при назначении теста',
            error: error.message || String(error),
        };
    }
});
