/**
 * API endpoint для получения тестов студента
 * GET /api/tests/my
 */

import { getStudentAssignments } from '../../repositories/testAssignmentRepository';
import { getStudentByUserId } from '../../repositories/studentRepository';

export default defineEventHandler(async (event) => {
    try {
        // Получаем пользователя из контекста
        const userId = event.context.user?.id;

        console.log('[API /tests/my] User ID:', userId);

        if (!userId) {
            console.log('[API /tests/my] ❌ Пользователь не авторизован');
            return {
                success: false,
                message: 'Не авторизован',
                assignments: [],
            };
        }

        // Получаем студента по user_id
        const student = await getStudentByUserId(userId);

        console.log('[API /tests/my] Student:', student ? { id: student.id, fullName: student.fullName } : null);

        if (!student) {
            console.log('[API /tests/my] ❌ Студент не найден для user_id:', userId);
            return {
                success: false,
                message: 'Студент не найден',
                assignments: [],
            };
        }

        const query = getQuery(event);

        // Получаем назначения для студента
        const assignments = await getStudentAssignments(student.id, {
            upcoming: query.upcoming === 'true',
        });

        console.log('[API /tests/my] ✅ Найдено назначений:', assignments.length);
        if (assignments.length > 0) {
            console.log('[API /tests/my] Первое назначение:', {
                id: assignments[0].id,
                template_name: assignments[0].template_name,
                group_name: assignments[0].group_name,
                status: assignments[0].status,
            });
        }

        return {
            success: true,
            assignments,
        };
    } catch (error) {
        console.error('[API /tests/my] ❌ Ошибка получения тестов студента:', error);

        return {
            success: false,
            message: 'Ошибка при получении тестов',
            assignments: [],
        };
    }
});
