import db, { toCamelCase } from '../../utils/db';
import type { Employee } from '../../../types';

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    // GET - получить всех сотрудников
    if (method === 'GET') {
      const [rows] = await db.query('SELECT * FROM employees ORDER BY id DESC');
      return toCamelCase(rows);
    }

    // POST - создать нового сотрудника
    if (method === 'POST') {
      const body = await readBody(event);
      
      const [result]: any = await db.query(
        `INSERT INTO employees (first_name, last_name, middle_name, position, department, email, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          body.firstName,
          body.lastName,
          body.middleName || null,
          body.position,
          body.department,
          body.email,
          body.phone || null
        ]
      );

      // Получить созданного сотрудника
      const [newEmployee]: any = await db.query(
        'SELECT * FROM employees WHERE id = ?',
        [result.insertId]
      );

      return toCamelCase(newEmployee[0]);
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    });
  } catch (error: any) {
    console.error('Ошибка в API employees:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка при работе с базой данных',
    });
  }
});
