import { defineEventHandler, createError } from 'h3';
import { getOrganizationById } from '../../../repositories/organizationRepository';
import { executeQuery } from '../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

interface StatsRow extends RowDataPacket {
    total_students: number;
    trained_last_month: number;
    trained_last_3_months: number;
    total_certificates: number;
}

interface CourseRow extends RowDataPacket {
    course_name: string;
    course_code: string | null;
    certificates_count: number;
    last_issue_date: Date;
}

interface RecentCertificateRow extends RowDataPacket {
    id: string;
    certificate_number: string;
    student_name: string;
    course_name: string;
    issue_date: Date;
}

/**
 * GET /api/organizations/:id/stats
 * Получение детальной статистики организации:
 * - Общее количество сотрудников
 * - Обученных за последний месяц
 * - Обученных за последние 3 месяца
 * - Последние обученные курсы
 * - Последние выданные сертификаты
 */
export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id;

        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'ID организации не указан',
            });
        }

        const organization = await getOrganizationById(id);

        if (!organization) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Организация не найдена',
            });
        }

        // Получаем общую статистику
        const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE organization_id = ?) as total_students,
        (SELECT COUNT(DISTINCT ic.student_id) 
         FROM issued_certificates ic
         JOIN students s ON ic.student_id = s.id
         WHERE s.organization_id = ? 
         AND ic.issue_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
         AND ic.status = 'issued') as trained_last_month,
        (SELECT COUNT(DISTINCT ic.student_id) 
         FROM issued_certificates ic
         JOIN students s ON ic.student_id = s.id
         WHERE s.organization_id = ? 
         AND ic.issue_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
         AND ic.status = 'issued') as trained_last_3_months,
        (SELECT COUNT(*) 
         FROM issued_certificates ic
         JOIN students s ON ic.student_id = s.id
         WHERE s.organization_id = ?) as total_certificates
    `;

        const statsResult = await executeQuery<StatsRow[]>(statsQuery, [id, id, id, id]);
        const stats = statsResult[0] || {
            total_students: 0,
            trained_last_month: 0,
            trained_last_3_months: 0,
            total_certificates: 0,
        };

        // Получаем популярные курсы (по количеству выданных сертификатов)
        const coursesQuery = `
      SELECT 
        COALESCE(c.name, ic.course_name, 'Неизвестный курс') as course_name,
        COALESCE(c.code, ic.course_code) as course_code,
        COUNT(*) as certificates_count,
        MAX(ic.issue_date) as last_issue_date
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups sg ON ic.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      WHERE s.organization_id = ?
        AND ic.status = 'issued'
      GROUP BY 
        COALESCE(c.id, ic.course_name),
        COALESCE(c.name, ic.course_name),
        COALESCE(c.code, ic.course_code)
      ORDER BY certificates_count DESC, last_issue_date DESC
      LIMIT 5
    `;

        const coursesResult = await executeQuery<CourseRow[]>(coursesQuery, [id]);
        const popularCourses = coursesResult.map(row => ({
            name: row.course_name,
            code: row.course_code,
            certificatesCount: row.certificates_count,
            lastIssueDate: row.last_issue_date,
        }));

        // Получаем последние выданные сертификаты
        const recentCertificatesQuery = `
      SELECT 
        ic.id,
        ic.certificate_number,
        s.full_name as student_name,
        COALESCE(c.name, ic.course_name, 'Неизвестный курс') as course_name,
        ic.issue_date
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups sg ON ic.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      WHERE s.organization_id = ?
        AND ic.status = 'issued'
      ORDER BY ic.issue_date DESC
      LIMIT 5
    `;

        const recentCertificatesResult = await executeQuery<RecentCertificateRow[]>(
            recentCertificatesQuery,
            [id]
        );
        const recentCertificates = recentCertificatesResult.map(row => ({
            id: row.id,
            certificateNumber: row.certificate_number,
            studentName: row.student_name,
            courseName: row.course_name,
            issueDate: row.issue_date,
        }));

        // Получаем статистику по месяцам (последние 6 месяцев)
        const monthlyStatsQuery = `
      SELECT 
        DATE_FORMAT(ic.issue_date, '%Y-%m') as month,
        COUNT(*) as certificates_count,
        COUNT(DISTINCT ic.student_id) as unique_students
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      WHERE s.organization_id = ?
        AND ic.status = 'issued'
        AND ic.issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(ic.issue_date, '%Y-%m')
      ORDER BY month DESC
    `;

        interface MonthlyRow extends RowDataPacket {
            month: string;
            certificates_count: number;
            unique_students: number;
        }

        const monthlyResult = await executeQuery<MonthlyRow[]>(monthlyStatsQuery, [id]);
        const monthlyStats = monthlyResult.map(row => ({
            month: row.month,
            certificatesCount: row.certificates_count,
            uniqueStudents: row.unique_students,
        }));

        return {
            success: true,
            data: {
                organization: {
                    id: organization.id,
                    name: organization.name,
                    code: organization.code,
                },
                stats: {
                    totalStudents: stats.total_students,
                    trainedLastMonth: stats.trained_last_month,
                    trainedLast3Months: stats.trained_last_3_months,
                    totalCertificates: stats.total_certificates,
                },
                popularCourses,
                recentCertificates,
                monthlyStats,
            },
        };
    } catch (error: any) {
        console.error('Error fetching organization stats:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Ошибка при получении статистики организации',
        });
    }
});
