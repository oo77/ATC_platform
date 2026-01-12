/**
 * Тестовый endpoint для проверки getInstructorByUserId
 * GET /api/test/check-instructor
 */

import { executeQuery } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const userId = '2e825de8-31ee-4faa-b39f-078515721379';

    try {
        console.log(`[Test] Проверяем инструктора для userId: ${userId}`);

        // Прямой запрос к БД (как в getInstructorByUserId)
        const [rows] = await executeQuery<any[]>(
            'SELECT id, full_name as fullName, user_id FROM instructors WHERE user_id = ? LIMIT 1',
            [userId]
        );

        console.log(`[Test] Результат запроса:`, rows);
        console.log(`[Test] Количество строк: ${rows.length}`);

        if (rows.length > 0) {
            console.log(`[Test] Найден инструктор:`, rows[0]);
        } else {
            console.log(`[Test] Инструктор НЕ найден`);

            // Проверяем, есть ли вообще инструкторы
            const [allInstructors] = await executeQuery<any[]>(
                'SELECT id, full_name, user_id FROM instructors LIMIT 5'
            );
            console.log(`[Test] Всего инструкторов в БД: ${allInstructors.length}`);
            console.log(`[Test] Примеры:`, allInstructors);
        }

        return {
            success: true,
            userId,
            found: rows.length > 0,
            instructor: rows[0] || null,
            message: rows.length > 0 ? 'Инструктор найден' : 'Инструктор НЕ найден'
        };

    } catch (error: any) {
        console.error('[Test] Ошибка:', error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
});
