/**
 * API endpoint для выхода пользователя
 * POST /api/auth/logout
 * 
 * В текущей реализации с JWT токенами, выход происходит на клиенте
 * путем удаления токена. Этот endpoint используется для логирования.
 */
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;

    // Логируем выход если пользователь авторизован
    if (user) {
      await logActivity(
        event,
        'LOGOUT',
        'SYSTEM',
        user.id,
        user.name
      );
    }

    console.log('✅ User logged out');

    return {
      success: true,
      message: 'Выход выполнен успешно',
    };
  } catch (error: any) {
    console.error('Logout error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Logout Failed',
      data: {
        success: false,
        message: 'Ошибка при выходе из системы',
      },
    });
  }
});
