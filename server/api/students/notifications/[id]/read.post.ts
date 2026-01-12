
import { getStudentByUserId } from '../../../../repositories/studentRepository';
import { markNotificationAsRead } from '../../../../services/studentNotificationService';

export default defineEventHandler(async (event) => {
    const userId = event.context.user?.id;
    const id = getRouterParam(event, 'id');

    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing ID' });
    }

    try {
        const student = await getStudentByUserId(userId);
        if (!student) {
            throw createError({ statusCode: 404, statusMessage: 'Student not found' });
        }

        await markNotificationAsRead(id, student.id);

        return { success: true };
    } catch (error: any) {
        console.error('[API MarkRead] Error:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Failed to mark as read',
        });
    }
});
