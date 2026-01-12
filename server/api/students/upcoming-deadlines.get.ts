/**
 * API endpoint для получения ближайших дедлайнов студента
 * GET /api/students/upcoming-deadlines
 */

import { getStudentByUserId } from '../../repositories/studentRepository';
import { getUpcomingDeadlines, type UpcomingDeadline } from '../../services/studentNotificationService';

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

        const allDeadlines = await getUpcomingDeadlines();

        // Фильтруем только дедлайны текущего студента
        const studentDeadlines = allDeadlines.filter((d: UpcomingDeadline) => d.student_id === student.id);

        return {
            success: true,
            deadlines: studentDeadlines,
        };
    } catch (error: any) {
        console.error('[API /students/upcoming-deadlines] Error:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Failed to fetch deadlines',
        });
    }
});
