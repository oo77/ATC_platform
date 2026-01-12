/**
 * API endpoint для записи нарушения (антипрокторинг)
 * POST /api/tests/sessions/:id/violation
 */

import { getTestSessionById, addViolation, updateSessionStatus } from '../../../../repositories/testSessionRepository';
import { getTestAssignmentById } from '../../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../../repositories/testTemplateRepository';
import { TestSessionStatus, type ViolationRecord } from '../../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody<{
            type: ViolationRecord['type'];
            details?: string;
        }>(event);

        if (!id) {
            return {
                success: false,
                message: 'ID сессии не указан',
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

        // Записываем нарушение
        const violation: ViolationRecord = {
            type: body.type || 'other',
            timestamp: new Date().toISOString(),
            details: body.details,
        };

        await addViolation(id, violation);

        // Проверяем настройки прокторинга
        const assignment = await getTestAssignmentById(session.assignment_id);
        if (assignment) {
            const template = await getTestTemplateById(assignment.test_template_id);
            if (template?.proctoring_settings) {
                const settings = template.proctoring_settings;
                const currentViolations = (session.violations?.length || 0) + 1;

                // Если превышен лимит нарушений
                if (settings.maxViolations && currentViolations >= settings.maxViolations) {
                    if (settings.autoSubmitOnViolation) {
                        // Автоматически завершаем тест с нарушением
                        await updateSessionStatus(id, TestSessionStatus.VIOLATION);

                        return {
                            success: true,
                            message: 'Тест аннулирован из-за превышения лимита нарушений',
                            terminated: true,
                            violations_count: currentViolations,
                        };
                    }
                }
            }
        }

        return {
            success: true,
            message: 'Нарушение записано',
            violations_count: (session.violations?.length || 0) + 1,
        };
    } catch (error) {
        console.error('Ошибка записи нарушения:', error);

        return {
            success: false,
            message: 'Ошибка при записи нарушения',
        };
    }
});
