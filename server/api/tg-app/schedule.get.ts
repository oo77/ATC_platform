/**
 * API endpoint для получения расписания организации
 * Используется в Telegram Mini App
 */

import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import type { FormattedScheduleEvent } from '../../utils/telegramBot';

interface ScheduleRow extends RowDataPacket {
    date: string;
    startTime: string;
    endTime: string;
    eventType: string;
    disciplineName: string;
    instructorName: string;
    classroomName: string | null;
    groupName: string;
}

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const { organizationId } = query;

        if (!organizationId) {
            throw createError({
                statusCode: 400,
                message: 'organizationId обязателен',
            });
        }

        // Получаем события за последние 30 дней и на 60 дней вперёд
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 60);

        const events = await executeQuery<ScheduleRow[]>(
            `SELECT 
        se.date AS date,
        se.start_time AS startTime,
        se.end_time AS endTime,
        se.event_type AS eventType,
        d.name AS disciplineName,
        i.full_name AS instructorName,
        c.name AS classroomName,
        g.group_name AS groupName
      FROM schedule_events se
      INNER JOIN groups g ON se.group_id = g.id
      INNER JOIN courses co ON g.course_id = co.id
      INNER JOIN disciplines d ON se.discipline_id = d.id
      INNER JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN classrooms c ON se.classroom_id = c.id
      WHERE g.organization_id = ?
        AND se.date >= ?
        AND se.date <= ?
      ORDER BY se.date ASC, se.start_time ASC`,
            [
                organizationId as string,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            ]
        );

        const formattedSchedule: FormattedScheduleEvent[] = events.map(e => ({
            date: e.date,
            startTime: e.startTime.substring(0, 5),
            endTime: e.endTime.substring(0, 5),
            eventType: e.eventType,
            disciplineName: e.disciplineName,
            instructorName: e.instructorName,
            location: e.classroomName || undefined,
            groupName: e.groupName,
        }));

        return {
            success: true,
            schedule: formattedSchedule,
        };

    } catch (error: any) {
        console.error('[TG-App] Ошибка получения расписания:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Внутренняя ошибка сервера',
        });
    }
});
