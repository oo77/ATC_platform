import { executeQuery } from '../../utils/db';
import { logActivity } from '../../utils/activityLogger';
import type { User } from '../../types/auth';

/**
 * API endpoint для удаления пользователя
 * DELETE /api/users/:id
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

    // Проверка: нельзя удалить самого себя
    if (currentUser.id === userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          message: 'Нельзя удалить самого себя',
        },
      });
    }

    // Получаем пользователя для удаления
    const [userToDelete] = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!userToDelete) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          success: false,
          message: 'Пользователь не найден',
        },
      });
    }

    // Проверка прав доступа
    const canDelete = 
      currentUser.role === 'ADMIN' || // Админ может удалять всех (кроме себя)
      (currentUser.role === 'MANAGER' && userToDelete.role !== 'ADMIN'); // Модератор может удалять всех кроме админов

    if (!canDelete) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          success: false,
          message: 'Недостаточно прав для удаления этого пользователя',
        },
      });
    }

    // Удаляем пользователя
    await executeQuery(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    console.log(`✅ User deleted by ${currentUser.email}: ${userToDelete.email} (${userToDelete.role})`);

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'USER',
      userId,
      userToDelete.name,
      { email: userToDelete.email, role: userToDelete.role }
    );

    return {
      success: true,
      message: 'Пользователь успешно удален',
    };
  } catch (error: any) {
    console.error('Delete user error:', error);

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    // Иначе создаем общую ошибку
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        message: 'Ошибка при удалении пользователя',
      },
    });
  }
});
