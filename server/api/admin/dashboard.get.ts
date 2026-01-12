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
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Основная статистика
        const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM students WHERE created_at >= ?) as students_last_week,
        (SELECT COUNT(*) FROM instructors) as total_instructors,
        (SELECT COUNT(*) FROM study_groups WHERE end_date >= ?) as active_groups,
        (SELECT COUNT(*) FROM issued_certificates 
         WHERE DATE(issue_date) >= ? AND DATE(issue_date) < ?) as certificates_this_month,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE(?)) as today_registrations
    `;

        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const statsRows = await executeQuery<any[]>(statsQuery, [
            weekAgo,
            now,
            monthStart,
            monthEnd,
            now
        ]);

        const stats = statsRows[0] || {
            total_students: 0,
            students_last_week: 0,
            total_instructors: 0,
            active_groups: 0,
            certificates_this_month: 0,
            total_users: 0,
            today_registrations: 0
        };

        // Вычисляем тренд студентов
        const studentsTrend = stats.total_students > 0
            ? Math.round((stats.students_last_week / stats.total_students) * 100)
            : 0;

        // 2. Активные сессии (примерная оценка - пользователи с активностью за последний час)
        const activeSessionsQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(?, INTERVAL 1 HOUR)
    `;

        let activeSessions = 0;
        try {
            const sessionRows = await executeQuery<any[]>(activeSessionsQuery, [now]);
            activeSessions = sessionRows[0]?.count || 0;
        } catch (e) {
            // Таблица activity_logs может не существовать
        }

        // 3. Логи за сегодня
        const todayLogsQuery = `
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE DATE(created_at) = DATE(?)
    `;

        let todayLogs = 0;
        try {
            const logsRows = await executeQuery<any[]>(todayLogsQuery, [now]);
            todayLogs = logsRows[0]?.count || 0;
        } catch (e) {
            // Таблица activity_logs может не существовать
        }

        // 4. Системные алерты
        const systemAlerts = [];

        // Проверка на ожидающих представителей
        try {
            const pendingRepsQuery = `
        SELECT COUNT(*) as count
        FROM representatives
        WHERE status = 'pending'
      `;
            const repsRows = await executeQuery<any[]>(pendingRepsQuery);
            if (repsRows[0]?.count > 0) {
                systemAlerts.push({
                    type: 'warning',
                    message: `${repsRows[0].count} представителей ожидают подтверждения`,
                    action: 'Перейти к представителям'
                });
            }
        } catch (e) { }

        // Проверка на открытые тикеты поддержки
        try {
            const openTicketsQuery = `
        SELECT COUNT(*) as count
        FROM support_tickets
        WHERE status IN ('new', 'in_progress')
      `;
            const ticketsRows = await executeQuery<any[]>(openTicketsQuery);
            if (ticketsRows[0]?.count > 0) {
                systemAlerts.push({
                    type: 'warning',
                    message: `${ticketsRows[0].count} тикетов поддержки требуют внимания`,
                    action: 'Открыть поддержку'
                });
            }
        } catch (e) { }

        // 5. Последние действия
        const recentActivitiesQuery = `
      SELECT 
        al.id,
        al.action,
        al.created_at,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `;

        let recentActivities = [];
        try {
            recentActivities = await executeQuery<any[]>(recentActivitiesQuery);
        } catch (e) {
            // Таблица activity_logs может не существовать
        }

        // 6. Активность за неделю (логины по дням)
        const weeklyActivityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as logins
      FROM activity_logs
      WHERE created_at >= ?
        AND action LIKE '%вход%'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

        let weeklyActivity = [];
        try {
            weeklyActivity = await executeQuery<any[]>(weeklyActivityQuery, [weekAgo]);

            // Заполняем пропущенные дни нулями
            const filledActivity = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const existing = weeklyActivity.find(d => {
                    const dStr = new Date(d.date).toISOString().split('T')[0];
                    return dStr === dateStr;
                });

                filledActivity.push({
                    date: dateStr,
                    logins: existing?.logins || 0
                });
            }
            weeklyActivity = filledActivity;
        } catch (e) {
            // Таблица activity_logs может не существовать - создаём пустой массив
            weeklyActivity = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                weeklyActivity.push({
                    date: date.toISOString().split('T')[0],
                    logins: 0
                });
            }
        }

        // 7. Распределение студентов по организациям (для круговой диаграммы)
        let studentsByOrganization: { name: string; count: number }[] = [];
        try {
            const orgQuery = `
                SELECT 
                    COALESCE(o.short_name, o.name, s.organization, 'Не указано') as name,
                    COUNT(s.id) as count
                FROM students s
                LEFT JOIN organizations o ON s.organization_id = o.id
                GROUP BY COALESCE(o.id, s.organization)
                ORDER BY count DESC
                LIMIT 10
            `;
            studentsByOrganization = await executeQuery<any[]>(orgQuery);
        } catch (e) {
            console.error('Failed to get students by organization:', e);
        }

        // 8. Сертификаты по месяцам (за последние 12 месяцев)
        let certificatesByMonth: { month: string; count: number }[] = [];
        try {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);

            const certMonthQuery = `
                SELECT 
                    DATE_FORMAT(issue_date, '%Y-%m') as month,
                    COUNT(*) as count
                FROM issued_certificates
                WHERE issue_date >= ?
                GROUP BY DATE_FORMAT(issue_date, '%Y-%m')
                ORDER BY month ASC
            `;
            const rawCertData = await executeQuery<any[]>(certMonthQuery, [yearAgo]);

            // Заполняем все 12 месяцев
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
                const existing = rawCertData.find(d => d.month === monthStr);
                certificatesByMonth.push({
                    month: monthStr,
                    count: existing?.count || 0
                });
            }
        } catch (e) {
            console.error('Failed to get certificates by month:', e);
            // Создаём пустой массив за 12 месяцев
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                certificatesByMonth.push({
                    month: date.toISOString().slice(0, 7),
                    count: 0
                });
            }
        }

        // 9. Топ инструкторов по проведённым часам
        let topInstructors: { id: string; name: string; hours: number; lessonsCount: number }[] = [];
        try {
            const instructorsQuery = `
                SELECT 
                    i.id,
                    i.full_name as name,
                    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 60), 0) as hours,
                    COUNT(se.id) as lessons_count
                FROM instructors i
                LEFT JOIN schedule_events se ON se.instructor_id = i.id 
                    AND se.start_time < NOW()
                WHERE i.is_active = 1
                GROUP BY i.id, i.full_name
                ORDER BY hours DESC
                LIMIT 10
            `;
            const rawInstructors = await executeQuery<any[]>(instructorsQuery);
            topInstructors = rawInstructors.map(row => ({
                id: row.id,
                name: row.name,
                hours: Math.round(row.hours * 10) / 10,
                lessonsCount: row.lessons_count
            }));
        } catch (e) {
            console.error('Failed to get top instructors:', e);
        }

        // 10. Топ курсов по количеству групп
        let topCoursesByGroups: { id: string; name: string; code: string; groupsCount: number }[] = [];
        try {
            const coursesByGroupsQuery = `
                SELECT 
                    c.id,
                    c.name,
                    c.code,
                    COUNT(sg.id) as groups_count
                FROM courses c
                LEFT JOIN study_groups sg ON sg.course_id = c.id
                WHERE c.is_active = 1
                GROUP BY c.id, c.name, c.code
                ORDER BY groups_count DESC
                LIMIT 10
            `;
            topCoursesByGroups = await executeQuery<any[]>(coursesByGroupsQuery);
        } catch (e) {
            console.error('Failed to get top courses by groups:', e);
        }

        // 11. Топ курсов по количеству слушателей
        let topCoursesByStudents: { id: string; name: string; code: string; studentsCount: number }[] = [];
        try {
            const coursesByStudentsQuery = `
                SELECT 
                    c.id,
                    c.name,
                    c.code,
                    COUNT(DISTINCT sgs.student_id) as students_count
                FROM courses c
                LEFT JOIN study_groups sg ON sg.course_id = c.id
                LEFT JOIN study_group_students sgs ON sgs.group_id = sg.id
                WHERE c.is_active = 1
                GROUP BY c.id, c.name, c.code
                ORDER BY students_count DESC
                LIMIT 10
            `;
            topCoursesByStudents = await executeQuery<any[]>(coursesByStudentsQuery);
        } catch (e) {
            console.error('Failed to get top courses by students:', e);
        }

        return {
            isAdmin: true,
            totalStudents: stats.total_students,
            studentsTrend,
            totalInstructors: stats.total_instructors,
            activeGroups: stats.active_groups,
            certificatesThisMonth: stats.certificates_this_month,
            totalUsers: stats.total_users,
            todayRegistrations: stats.today_registrations,
            activeSessions,
            todayLogs,
            systemAlerts,
            recentActivities,
            weeklyActivity,
            // Новые данные для чартов
            studentsByOrganization,
            certificatesByMonth,
            topInstructors,
            topCoursesByGroups,
            topCoursesByStudents
        };

    } catch (error: any) {
        console.error('Failed to get admin dashboard stats:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve dashboard data',
        });
    }
});
