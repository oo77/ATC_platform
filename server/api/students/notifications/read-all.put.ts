import { executeQuery } from '../../../utils/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    try {
        // Получаем student_id
        const studentRows = await executeQuery<RowDataPacket[]>(
            'SELECT id FROM students WHERE user_id = ? LIMIT 1',
            [user.id]
        );

        if (studentRows.length === 0) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Not a student',
            });
        }

        const studentId = studentRows[0].id;

        // Обновляем все непрочитанные уведомления
        const updateQuery = `
      UPDATE student_notifications
      SET is_read = TRUE
      WHERE student_id = ? AND is_read = FALSE
    `;

        try {
            await executeQuery<ResultSetHeader>(updateQuery, [studentId]);
            return { success: true };
        } catch (e) {
            // Таблица может не существовать
            console.warn('student_notifications table does not exist');
            return { success: false, message: 'Notifications not available' };
        }

    } catch (error: any) {
        if (error.statusCode) throw error;

        console.error('Failed to mark all notifications as read:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update notifications',
        });
    }
});
