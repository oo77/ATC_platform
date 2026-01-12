/**
 * Endpoint для исправления связи user_id
 * POST /api/test/fix-instructor-link
 */

import { executeQuery } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const userId = '2e825de8-31ee-4faa-b39f-078515721379';

    try {
        console.log('[Fix] Начинаем исправление связи для userId:', userId);

        // 1. Проверяем пользователя
        const [users] = await executeQuery<any[]>(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return {
                success: false,
                message: 'Пользователь не найден в БД'
            };
        }

        const user = users[0];
        console.log('[Fix] Найден пользователь:', user.name, user.email);

        // 2. Ищем инструктора по email или имени
        const [instructors] = await executeQuery<any[]>(
            'SELECT id, full_name, email, user_id FROM instructors WHERE email = ? OR full_name = ?',
            [user.email, user.name]
        );

        if (instructors.length === 0) {
            return {
                success: false,
                message: `Инструктор не найден по email (${user.email}) или имени (${user.name})`,
                hint: 'Нужно создать инструктора через админку'
            };
        }

        const instructor = instructors[0];
        console.log('[Fix] Найден инструктор:', instructor.full_name, 'ID:', instructor.id);

        if (instructor.user_id === userId) {
            return {
                success: true,
                message: 'Связь уже установлена',
                instructor: {
                    id: instructor.id,
                    fullName: instructor.full_name,
                    email: instructor.email,
                    userId: instructor.user_id
                }
            };
        }

        if (instructor.user_id && instructor.user_id !== userId) {
            return {
                success: false,
                message: `Инструктор уже связан с другим пользователем: ${instructor.user_id}`,
                instructor: {
                    id: instructor.id,
                    fullName: instructor.full_name,
                    currentUserId: instructor.user_id
                }
            };
        }

        // 3. Устанавливаем связь
        console.log('[Fix] Устанавливаем связь: instructor.id =', instructor.id, 'user_id =', userId);

        await executeQuery(
            'UPDATE instructors SET user_id = ? WHERE id = ?',
            [userId, instructor.id]
        );

        console.log('[Fix] ✅ Связь установлена!');

        // 4. Проверяем результат
        const [updated] = await executeQuery<any[]>(
            'SELECT id, full_name, email, user_id FROM instructors WHERE id = ?',
            [instructor.id]
        );

        return {
            success: true,
            message: 'Связь успешно установлена!',
            before: {
                userId: instructor.user_id
            },
            after: {
                id: updated[0].id,
                fullName: updated[0].full_name,
                email: updated[0].email,
                userId: updated[0].user_id
            }
        };

    } catch (error: any) {
        console.error('[Fix] Ошибка:', error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
});
