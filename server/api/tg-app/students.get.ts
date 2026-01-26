/**
 * API endpoint для получения списка слушателей организации
 * Используется в Telegram Mini App
 */

import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import type { FormattedStudent } from '../../utils/telegramBot';

interface StudentRow extends RowDataPacket {
    fullName: string;
    groupName: string;
    courseName: string;
    startDate: string | null;
    endDate: string | null;
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

        const students = await executeQuery<StudentRow[]>(
            `SELECT 
        s.full_name as fullName,
        g.group_name as groupName,
        c.name as courseName,
        g.start_date as startDate,
        g.end_date as endDate
      FROM students s
      INNER JOIN groups g ON s.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      WHERE g.organization_id = ? 
        AND g.is_archived = FALSE
      ORDER BY g.start_date DESC, s.full_name ASC`,
            [organizationId as string]
        );

        const formattedStudents: FormattedStudent[] = students.map(s => ({
            fullName: s.fullName,
            groupName: s.groupName,
            courseName: s.courseName,
            startDate: s.startDate ? new Date(s.startDate).toLocaleDateString('ru-RU') : '',
            endDate: s.endDate ? new Date(s.endDate).toLocaleDateString('ru-RU') : '',
        }));

        return {
            success: true,
            students: formattedStudents,
        };

    } catch (error: any) {
        console.error('[TG-App] Ошибка получения слушателей:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Внутренняя ошибка сервера',
        });
    }
});
