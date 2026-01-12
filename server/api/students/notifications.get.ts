/**
 * API endpoint для получения уведомлений студента
 * GET /api/students/notifications
 */

import { getStudentByUserId } from '../../repositories/studentRepository';
import { getStudentNotifications } from '../../services/studentNotificationService';

export default defineEventHandler(async (event) => {
    const userId = event.context.user?.id;

    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    try {
        const student = await getStudentByUserId(userId);

        if (!student) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Student not found',
            });
        }

        const query = getQuery(event);
        const unreadOnly = query.unread === 'true';

        const notifications = await getStudentNotifications(student.id, unreadOnly);

        return {
            success: true,
            notifications,
        };
    } catch (error: any) {
        console.error('[API /students/notifications] Error:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Failed to fetch notifications',
        });
    }
});
