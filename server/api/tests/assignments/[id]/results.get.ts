/**
 * API endpoint для получения результатов назначения
 * GET /api/tests/assignments/:id/results
 */

import { getTestAssignmentById } from '../../../../repositories/testAssignmentRepository';
import { getAssignmentResults } from '../../../../repositories/testSessionRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID назначения не указан',
            };
        }

        // Проверяем существование
        const assignment = await getTestAssignmentById(id);
        if (!assignment) {
            return {
                success: false,
                message: 'Назначение не найдено',
            };
        }

        // Получаем результаты
        const results = await getAssignmentResults(id);

        return {
            success: true,
            assignment,
            results,
        };
    } catch (error) {
        console.error('Ошибка получения результатов:', error);

        return {
            success: false,
            message: 'Ошибка при получении результатов',
        };
    }
});
