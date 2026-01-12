/**
 * API endpoint для удаления назначения
 * DELETE /api/tests/assignments/:id
 */

import { deleteTestAssignment, getTestAssignmentById } from '../../../repositories/testAssignmentRepository';

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

        // Проверяем, не начато ли прохождение
        if (assignment.sessions_count > 0) {
            return {
                success: false,
                message: `Невозможно удалить: ${assignment.sessions_count} студентов уже начали тест`,
            };
        }

        // Удаляем
        const deleted = await deleteTestAssignment(id);

        if (!deleted) {
            return {
                success: false,
                message: 'Ошибка при удалении назначения',
            };
        }

        return {
            success: true,
            message: 'Назначение теста удалено',
        };
    } catch (error) {
        console.error('Ошибка удаления назначения:', error);

        return {
            success: false,
            message: 'Ошибка при удалении назначения',
        };
    }
});
