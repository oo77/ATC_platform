/**
 * GET /api/classrooms
 * Получение списка аудиторий
 */

import { getClassrooms } from '../../repositories/scheduleRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== 'false';

    const classrooms = await getClassrooms(activeOnly);

    return {
      success: true,
      classrooms: classrooms.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении аудиторий',
    });
  }
});
