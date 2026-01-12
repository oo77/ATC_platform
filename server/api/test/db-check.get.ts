/**
 * Endpoint для проверки подключения к БД и данных
 * GET /api/test/db-check
 */

import { executeQuery } from '../../utils/db';

export default defineEventHandler(async (event) => {
    try {
        // 1. Проверяем подключение к БД
        const [dbInfo] = await executeQuery<any[]>('SELECT DATABASE() as current_db');

        // 2. Проверяем конкретного пользователя
        const userId = '2e825de8-31ee-4faa-b39f-078515721379';
        const [users] = await executeQuery<any[]>(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [userId]
        );

        // 3. Проверяем инструкторов
        const [instructors] = await executeQuery<any[]>(
            'SELECT id, full_name, email, user_id FROM instructors WHERE user_id = ?',
            [userId]
        );

        // 4. Все инструкторы
        const [allInstructors] = await executeQuery<any[]>(
            'SELECT id, full_name, email, user_id FROM instructors'
        );

        // 5. Переменные окружения
        const envInfo = {
            DATABASE_HOST: process.env.DATABASE_HOST,
            DATABASE_PORT: process.env.DATABASE_PORT,
            DATABASE_USER: process.env.DATABASE_USER,
            DATABASE_NAME: process.env.DATABASE_NAME,
        };

        console.log('[DB Check] Current database:', dbInfo[0]?.current_db);
        console.log('[DB Check] ENV:', envInfo);
        console.log('[DB Check] User found:', users.length > 0);
        console.log('[DB Check] Instructor found:', instructors.length > 0);
        console.log('[DB Check] Total instructors:', allInstructors.length);

        return {
            success: true,
            database: dbInfo[0]?.current_db,
            env: envInfo,
            user: users[0] || null,
            instructor: instructors[0] || null,
            allInstructors: allInstructors.map(i => ({
                id: i.id,
                fullName: i.full_name,
                email: i.email,
                userId: i.user_id
            })),
            totalInstructors: allInstructors.length
        };

    } catch (error: any) {
        console.error('[DB Check] Error:', error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
});
