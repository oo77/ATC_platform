import { executeQuery } from '../../utils/db';
import { toPublicUser } from '../../utils/auth';
import type { User } from '../../types/auth';

/**
 * API endpoint для получения пользователя по ID
 * GET /api/users/:id
 */
export default defineEventHandler(async (event) => {
  try {
    // Получаем текущего пользователя из контекста
    const currentUser = event.context.user;
    
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        data: {
          success: false,
          message: 'Требуется авторизация',
        },
      });
    }

    // Получаем ID пользователя из параметров
    const userId = event.context.params?.id;

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          message: 'ID пользователя не указан',
        },
      });
    }

    // Получаем пользователя
    const [user] = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          success: false,
          message: 'Пользователь не найден',
        },
      });
    }

    // Проверка прав: админ видит всех, остальные - только себя
    const canView = 
      currentUser.role === 'ADMIN' || 
      currentUser.role === 'MANAGER' ||
      currentUser.id === userId;

    if (!canView) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          success: false,
          message: 'Недостаточно прав для просмотра этого пользователя',
        },
      });
    }

    return {
      success: true,
      user: toPublicUser(user),
    };
  } catch (error: any) {
    console.error('Get user error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        message: 'Ошибка при получении пользователя',
      },
    });
  }
});
