/**
 * GET /api/classrooms
 * Получение списка аудиторий
 */

import { getClassrooms } from '../../repositories/scheduleRepository';
import { requireAuthContext } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAuthContext(event);

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
