import { getStudentCourseDetails } from '../../../repositories/studentCourseRepository';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const groupId = getRouterParam(event, 'id');

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (!groupId) {
     throw createError({
      statusCode: 400,
      statusMessage: 'Group ID is required',
    });
  }

  try {
    const details = await getStudentCourseDetails(user.id, groupId);
    
    if (!details) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Course not found',
      });
    }

    return details;
  } catch (error: any) {
    console.error('Failed to get student course details:', error);
    
    if (error.statusCode === 404) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve course details',
    });
  }
});
