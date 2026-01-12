import { executeQuery } from '../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

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
            return [];
        }

        const studentId = studentRows[0].id;
        const query = getQuery(event);
        const limit = query.limit ? parseInt(query.limit as string) : 10;
        const unreadOnly = query.unread === 'true';

        // Получаем уведомления
        let notificationsQuery = `
      SELECT 
        id,
        type,
        title,
        message,
        action_url,
        action_text,
        is_read,
        created_at
      FROM student_notifications
      WHERE student_id = ?
    `;

        if (unreadOnly) {
            notificationsQuery += ' AND is_read = FALSE';
        }

        notificationsQuery += ' ORDER BY created_at DESC LIMIT ?';

        let notifications = [];
        try {
            notifications = await executeQuery<any[]>(notificationsQuery, [studentId, limit]);
        } catch (e) {
            // Таблица может не существовать - возвращаем пустой массив
            console.warn('student_notifications table does not exist');
        }

        return notifications;

    } catch (error: any) {
        console.error('Failed to get student notifications:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve notifications',
        });
    }
});
