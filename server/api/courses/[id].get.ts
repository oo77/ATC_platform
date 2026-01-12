/**
 * API endpoint для получения курса по ID
 * GET /api/courses/:id
 */

import { getCourseById } from '../../repositories/courseRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    console.log('[API] Getting course by ID:', id);

    if (!id) {
      console.error('[API] No ID provided');
      return {
        success: false,
        message: 'ID курса не указан',
      };
    }

    const course = await getCourseById(id, true);

    console.log('[API] Course fetched:', course ? 'Found' : 'Not found');

    if (!course) {
      console.error('[API] Course not found with ID:', id);
      return {
        success: false,
        message: 'Курс не найден',
      };
    }

    return {
      success: true,
      course,
    };
  } catch (error) {
    console.error('[API] Error getting course:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return {
      success: false,
      message: 'Ошибка при получении курса',
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
