import db, { toCamelCase } from '../../utils/db';
import type { Employee } from '../../../types';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const searchQuery = (query.q as string || '').trim();

    if (!searchQuery) {
      return [];
    }

    // Поиск по ФИО, должности, отделу, email
    const [rows] = await db.query(
      `SELECT * FROM employees
       WHERE CONCAT(last_name, ' ', first_name, ' ', IFNULL(middle_name, '')) LIKE ?
          OR position LIKE ?
          OR department LIKE ?
          OR email LIKE ?
       ORDER BY last_name, first_name
       LIMIT 50`,
      [
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`
      ]
    );

    return toCamelCase(rows);
  } catch (error: any) {
    console.error('Ошибка в API search:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка при поиске сотрудников',
    });
  }
});
