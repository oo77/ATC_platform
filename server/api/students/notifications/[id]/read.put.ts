/**
 * API endpoint для отметки уведомления как прочитанного
 * PUT /api/students/notifications/[id]/read
 */

import { markNotificationAsRead } from '../../../../services/studentNotificationService';

export default defineEventHandler(async (event) => {
    const userId = event.context.user?.id;

    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    try {
        const notificationId = getRouterParam(event, 'id');

        if (!notificationId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Notification ID is required',
            });
        }

        await markNotificationAsRead(notificationId);

        return {
            success: true,
            message: 'Notification marked as read',
        };
    } catch (error: any) {
        console.error('[API /students/notifications/[id]/read] Error:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Failed to mark notification as read',
        });
    }
});
