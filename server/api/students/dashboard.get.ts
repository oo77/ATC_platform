import { getStudentDashboardStats } from '../../repositories/studentCourseRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const stats = await getStudentDashboardStats(user.id);
    
    // Если stats null (юзер не студент), можно вернуть пустой объект или индикатор
    if (!stats) {
       return {
         isStudent: false,
         upcomingEvents: [],
         activeCourses: [],
         upcomingDeadlines: []
       };
    }

    return {
      isStudent: true,
      ...stats
    };
  } catch (error: any) {
    console.error('Failed to get dashboard stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve dashboard data',
    });
  }
});
