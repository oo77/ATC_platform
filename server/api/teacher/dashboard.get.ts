import { executeQuery } from '../../utils/db';
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
        // Получаем instructor_id по user_id
        const instructorRows = await executeQuery<RowDataPacket[]>(
            'SELECT id FROM instructors WHERE user_id = ? LIMIT 1',
            [user.id]
        );

        if (instructorRows.length === 0) {
            return {
                isTeacher: false,
                myGroups: 0,
                myStudents: 0,
                todayLessons: 0,
                monthlyHours: 0,
                todaySchedule: [],
                groups: [],
                weekSchedule: [],
                pendingAttendance: []
            };
        }

        const instructorId = instructorRows[0].id;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const weekEnd = new Date(todayStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Основная статистика
        const statsQuery = `
      SELECT 
        COUNT(DISTINCT se.group_id) as my_groups,
        COUNT(DISTINCT sgs.student_id) as my_students,
        COUNT(DISTINCT CASE 
          WHEN se.start_time >= ? AND se.start_time < ? 
          THEN se.id 
        END) as today_lessons,
        COALESCE(SUM(CASE 
          WHEN se.start_time >= ? AND se.end_time <= ?
          THEN TIMESTAMPDIFF(HOUR, se.start_time, se.end_time)
          ELSE 0
        END), 0) as monthly_hours
      FROM schedule_events se
      LEFT JOIN study_group_students sgs ON se.group_id = sgs.group_id
      WHERE se.instructor_id = ?
    `;

        const statsRows = await executeQuery<any[]>(statsQuery, [
            todayStart, todayEnd,
            monthStart, now,
            instructorId
        ]);

        const stats = statsRows[0] || {
            my_groups: 0,
            my_students: 0,
            today_lessons: 0,
            monthly_hours: 0
        };

        // 2. Занятия на сегодня
        const todayScheduleQuery = `
      SELECT 
        se.id,
        se.title,
        se.start_time,
        se.end_time,
        se.event_type,
        se.group_id,
        sg.code as group_code,
        se.discipline_id,
        cr.name as classroom_name,
        COUNT(DISTINCT sgs.student_id) as student_count
      FROM schedule_events se
      JOIN study_groups sg ON se.group_id = sg.id
      LEFT JOIN classrooms cr ON se.classroom_id = cr.id
      LEFT JOIN study_group_students sgs ON se.group_id = sgs.group_id
      WHERE se.instructor_id = ?
        AND se.start_time >= ?
        AND se.start_time < ?
      GROUP BY se.id, se.title, se.start_time, se.end_time, se.event_type, 
               se.group_id, se.discipline_id, sg.code, cr.name
      ORDER BY se.start_time ASC
    `;

        const todaySchedule = await executeQuery<any[]>(todayScheduleQuery, [
            instructorId,
            todayStart,
            todayEnd
        ]);

        // 3. Мои группы с посещаемостью
        const groupsQuery = `
      SELECT 
        sg.id,
        sg.code,
        c.name as course_name,
        COUNT(DISTINCT sgs.student_id) as student_count,
        COALESCE(
          ROUND(
            (SELECT COUNT(*) 
             FROM attendance a
             JOIN schedule_events se2 ON a.schedule_event_id = se2.id
             WHERE se2.group_id = sg.id 
               AND a.hours_attended > 0
            ) * 100.0 / NULLIF(
              (SELECT COUNT(*) 
               FROM attendance a2
               JOIN schedule_events se3 ON a2.schedule_event_id = se3.id
               WHERE se3.group_id = sg.id
              ), 0
            ), 0
          ), 0
        ) as attendance_rate
      FROM schedule_events se
      JOIN study_groups sg ON se.group_id = sg.id
      JOIN courses c ON sg.course_id = c.id
      LEFT JOIN study_group_students sgs ON sg.id = sgs.group_id
      WHERE se.instructor_id = ?
        AND sg.end_date >= ?
      GROUP BY sg.id, sg.code, c.name
      ORDER BY sg.start_date DESC
      LIMIT 5
    `;

        const groups = await executeQuery<any[]>(groupsQuery, [instructorId, now]);

        // 4. Расписание на неделю
        const weekScheduleQuery = `
      SELECT 
        se.id,
        se.title,
        se.start_time,
        se.end_time,
        se.event_type,
        sg.code as group_code,
        cr.name as classroom_name
      FROM schedule_events se
      JOIN study_groups sg ON se.group_id = sg.id
      LEFT JOIN classrooms cr ON se.classroom_id = cr.id
      WHERE se.instructor_id = ?
        AND se.start_time >= ?
        AND se.start_time < ?
      ORDER BY se.start_time ASC
      LIMIT 20
    `;

        const weekSchedule = await executeQuery<any[]>(weekScheduleQuery, [
            instructorId,
            todayStart,
            weekEnd
        ]);

        // 5. Незаполненная посещаемость (занятия прошли, но посещаемость не отмечена)
        const pendingAttendanceQuery = `
      SELECT 
        se.id,
        se.title,
        se.start_time as date,
        se.group_id,
        se.discipline_id,
        sg.code as group_code
      FROM schedule_events se
      JOIN study_groups sg ON se.group_id = sg.id
      WHERE se.instructor_id = ?
        AND se.end_time < ?
        AND se.end_time >= DATE_SUB(?, INTERVAL 7 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM attendance a 
          WHERE a.schedule_event_id = se.id
        )
      ORDER BY se.start_time DESC
      LIMIT 5
    `;

        const pendingAttendance = await executeQuery<any[]>(pendingAttendanceQuery, [
            instructorId,
            now,
            now
        ]);

        return {
            isTeacher: true,
            myGroups: stats.my_groups,
            myStudents: stats.my_students,
            todayLessons: stats.today_lessons,
            monthlyHours: stats.monthly_hours,
            todaySchedule,
            groups,
            weekSchedule,
            pendingAttendance
        };

    } catch (error: any) {
        console.error('Failed to get teacher dashboard stats:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve dashboard data',
        });
    }
});
