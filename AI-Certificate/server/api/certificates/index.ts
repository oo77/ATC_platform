import db, { toCamelCase } from '../../utils/db';
import type { Certificate } from '../../../types';

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    // GET - получить все сертификаты с фильтрами
    if (method === 'GET') {
      const query = getQuery(event);
      let sql = 'SELECT * FROM certificates WHERE 1=1';
      const params: any[] = [];

      // Применить фильтры
      if (query.employeeId) {
        sql += ' AND employee_id = ?';
        params.push(Number(query.employeeId));
      }

      if (query.status) {
        sql += ' AND status = ?';
        params.push(query.status);
      }

      if (query.certificateType) {
        sql += ' AND certificate_type = ?';
        params.push(query.certificateType);
      }

      sql += ' ORDER BY id DESC';

      const [rows] = await db.query(sql, params);
      return toCamelCase(rows);
    }

    // POST - создать новый сертификат
    if (method === 'POST') {
      const body = await readBody(event);
      
      const [result]: any = await db.query(
        `INSERT INTO certificates (
          employee_id, certificate_number, certificate_type, issuing_organization,
          issue_date, expiry_date, course_name, course_hours, status,
          file_url, file_name, file_type, verification_status, extracted_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.employeeId,
          body.certificateNumber,
          body.certificateType,
          body.issuingOrganization,
          body.issueDate,
          body.expiryDate || null,
          body.courseName,
          body.courseHours || null,
          body.status || 'active',
          body.fileUrl,
          body.fileName,
          body.fileType,
          body.verificationStatus || 'pending',
          body.extractedData ? JSON.stringify(body.extractedData) : null
        ]
      );

      // Получить созданный сертификат
      const [newCertificate]: any = await db.query(
        'SELECT * FROM certificates WHERE id = ?',
        [result.insertId]
      );

      return toCamelCase(newCertificate[0]);
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    });
  } catch (error: any) {
    console.error('Ошибка в API certificates:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка при работе с базой данных',
    });
  }
});
