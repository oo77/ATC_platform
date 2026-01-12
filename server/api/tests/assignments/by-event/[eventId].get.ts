/**
 * API endpoint для получения назначения по schedule_event_id
 * GET /api/tests/assignments/by-event/:eventId
 */

import { getTestAssignmentByScheduleEventId } from '../../../../repositories/testAssignmentRepository';

export default defineEventHandler(async (event) => {
    try {
        const eventId = getRouterParam(event, 'eventId');

        if (!eventId) {
            return {
                success: false,
                message: 'ID занятия не указан',
            };
        }

        const assignment = await getTestAssignmentByScheduleEventId(eventId);

        return {
            success: true,
            assignment, // может быть null, если нет назначения
        };
    } catch (error) {
        console.error('Ошибка получения назначения:', error);

        return {
            success: false,
            message: 'Ошибка при получении назначения',
        };
    }
});
