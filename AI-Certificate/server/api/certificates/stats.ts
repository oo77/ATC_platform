import db from '../../utils/db';
import type { CertificateStats } from '../../../types';

export default defineEventHandler(async (event): Promise<CertificateStats> => {
  try {
    // Получить общую статистику
    const [statsRows]: any = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE 
          WHEN status = 'active' 
          AND expiry_date IS NOT NULL 
          AND DATEDIFF(expiry_date, CURDATE()) BETWEEN 0 AND 30 
          THEN 1 ELSE 0 
        END) as expiring_soon
      FROM certificates
    `);

    // Получить статистику по типам
    const [byTypeRows]: any = await db.query(`
      SELECT certificate_type, COUNT(*) as count
      FROM certificates
      GROUP BY certificate_type
      ORDER BY count DESC
    `);

    // Получить статистику по отделам
    const [byDepartmentRows]: any = await db.query(`
      SELECT e.department, COUNT(c.id) as count
      FROM employees e
      LEFT JOIN certificates c ON e.id = c.employee_id
      WHERE e.department IS NOT NULL AND e.department != ''
      GROUP BY e.department
      ORDER BY count DESC
    `);

    const stats: CertificateStats = {
      total: statsRows[0].total || 0,
      active: statsRows[0].active || 0,
      expired: statsRows[0].expired || 0,
      expiringSoon: statsRows[0].expiring_soon || 0,
      byType: byTypeRows.reduce((acc: any, row: any) => {
        acc[row.certificate_type] = row.count;
        return acc;
      }, {}),
      byDepartment: byDepartmentRows.reduce((acc: any, row: any) => {
        acc[row.department] = row.count;
        return acc;
      }, {}),
    };

    return stats;
  } catch (error: any) {
    console.error('Ошибка в API stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка при получении статистики',
    });
  }
});
