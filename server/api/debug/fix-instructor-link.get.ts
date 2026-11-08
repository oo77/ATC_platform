import { requireDevOnly } from "../../utils/permissions";
/**
 * Endpoint для исправления связи user_id (БЕЗ АВТОРИЗАЦИИ - только для отладки!)
 * GET /api/debug/fix-instructor-link
 */

import { executeQuery } from '../../utils/db';

export default defineEventHandler(async (event) => {
  // Отладочный эндпоинт: в production недоступен, в разработке — только администратору настроек
  await requireDevOnly(event);

    const userId = '2e825de8-31ee-4faa-b39f-078515721379';

    try {
        console.log('[Fix] Начинаем исправление связи для userId:', userId);

        // 1. Проверяем текущую БД
        const dbInfo = await executeQuery<any[]>('SELECT DATABASE() as current_db');
        const currentDb = dbInfo[0]?.current_db || 'unknown';
        console.log('[Fix] Текущая БД:', currentDb);

        // 2. Проверяем пользователя
        const users = await executeQuery<any[]>(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            console.log('[Fix] ❌ Пользователь не найден');
            return {
                success: false,
                database: currentDb,
                message: 'Пользователь не найден в БД'
            };
        }

        const user = users[0];
        console.log('[Fix] ✅ Найден пользователь:', user.name, user.email);

        // 3. Ищем инструктора по email или имени
        const instructors = await executeQuery<any[]>(
            'SELECT id, full_name, email, user_id FROM instructors WHERE email = ? OR full_name = ?',
            [user.email, user.name]
        );

        console.log('[Fix] Найдено инструкторов:', instructors.length);

        if (instructors.length === 0) {
            // Показываем всех инструкторов
            const allInstructors = await executeQuery<any[]>(
                'SELECT id, full_name, email, user_id FROM instructors LIMIT 10'
            );

            console.log('[Fix] Всего инструкторов в БД:', allInstructors.length);

            return {
                success: false,
                database: currentDb,
                message: `Инструктор не найден по email (${user.email}) или имени (${user.name})`,
                user: user,
                allInstructors: allInstructors.map(i => ({
                    id: i.id,
                    fullName: i.full_name,
                    email: i.email,
                    userId: i.user_id
                })),
                hint: 'Нужно создать инструктора через админку или обновить email/имя существующего'
            };
        }

        const instructor = instructors[0];
        console.log('[Fix] ✅ Найден инструктор:', instructor.full_name, 'ID:', instructor.id);
        console.log('[Fix] Текущий user_id инструктора:', instructor.user_id);

        if (instructor.user_id === userId) {
            console.log('[Fix] ℹ️  Связь уже установлена');
            return {
                success: true,
                database: currentDb,
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
            console.log('[Fix] ⚠️  Инструктор уже связан с другим пользователем');
            return {
                success: false,
                database: currentDb,
                message: `Инструктор уже связан с другим пользователем: ${instructor.user_id}`,
                instructor: {
                    id: instructor.id,
                    fullName: instructor.full_name,
                    currentUserId: instructor.user_id,
                    requestedUserId: userId
                }
            };
        }

        // 4. Устанавливаем связь
        console.log('[Fix] 🔗 Устанавливаем связь: instructor.id =', instructor.id, 'user_id =', userId);

        const result = await executeQuery(
            'UPDATE instructors SET user_id = ? WHERE id = ?',
            [userId, instructor.id]
        );

        console.log('[Fix] UPDATE result:', result);

        // 5. Проверяем результат
        const updated = await executeQuery<any[]>(
            'SELECT id, full_name, email, user_id FROM instructors WHERE id = ?',
            [instructor.id]
        );

        console.log('[Fix] ✅ Связь установлена! Новый user_id:', updated[0].user_id);

        return {
            success: true,
            database: currentDb,
            message: 'Связь успешно установлена!',
            before: {
                userId: instructor.user_id || null
            },
            after: {
                id: updated[0].id,
                fullName: updated[0].full_name,
                email: updated[0].email,
                userId: updated[0].user_id
            }
        };

    } catch (error: any) {
        console.error('[Fix] ❌ Ошибка:', error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
});
