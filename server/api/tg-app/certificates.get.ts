/**
 * API endpoint для получения сертификатов организации
 * Используется в Telegram Mini App
 */

import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import type { FormattedCertificate } from '../../utils/telegramBot';

interface CertificateRow extends RowDataPacket {
    id: string;
    certificateNumber: string;
    issueDate: string | null;
    status: 'issued' | 'revoked';
    pdfFileUrl: string | null;
    studentId: string;
    studentName: string;
    courseName: string;
    groupCode: string;
}

interface AttendanceRow extends RowDataPacket {
    totalEvents: number;
    presentCount: number;
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

        const certificates = await executeQuery<CertificateRow[]>(
            `SELECT 
        cert.id,
        cert.certificate_number AS certificateNumber,
        cert.issue_date AS issueDate,
        cert.status,
        cert.pdf_file_url AS pdfFileUrl,
        s.id AS studentId,
        s.full_name AS studentName,
        c.name AS courseName,
        g.group_code AS groupCode
      FROM certificates cert
      INNER JOIN students s ON cert.student_id = s.id
      INNER JOIN groups g ON s.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      WHERE g.organization_id = ?
      ORDER BY cert.issue_date DESC`,
            [organizationId as string]
        );

        // Для каждого сертификата проверяем посещаемость
        const formattedCertificates: FormattedCertificate[] = [];

        for (const cert of certificates) {
            // Получаем статистику посещаемости
            const attendanceStats = await executeQuery<AttendanceRow[]>(
                `SELECT 
          COUNT(a.id) AS totalEvents,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS presentCount
        FROM attendance a
        INNER JOIN schedule_events se ON a.event_id = se.id
        WHERE a.student_id = ?
          AND se.group_id = (SELECT group_id FROM students WHERE id = ?)`,
                [cert.studentId, cert.studentId]
            );

            const totalEvents = Number(attendanceStats[0]?.totalEvents || 0);
            const presentCount = Number(attendanceStats[0]?.presentCount || 0);
            const attendancePercent = totalEvents > 0 ? (presentCount / totalEvents) * 100 : null;

            // Считаем, что студент прошёл обучение, если посещаемость >= 80%
            const hasPassed = attendancePercent !== null && attendancePercent >= 80;

            formattedCertificates.push({
                id: cert.id,
                studentName: cert.studentName,
                certificateNumber: cert.certificateNumber,
                courseName: cert.courseName,
                groupCode: cert.groupCode,
                issueDate: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('ru-RU') : '',
                status: cert.status,
                pdfFileUrl: cert.pdfFileUrl,
                hasPassed,
                attendancePercent,
            });
        }

        return {
            success: true,
            certificates: formattedCertificates,
        };

    } catch (error: any) {
        console.error('[TG-App] Ошибка получения сертификатов:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: 'Внутренняя ошибка сервера',
        });
    }
});
