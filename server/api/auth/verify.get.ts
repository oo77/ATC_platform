import { executeQuery } from '../../utils/db';
import { verifyToken, extractToken, toPublicUser } from '../../utils/auth';
import type { User, UserPublic } from '../../types/auth';

/**
 * API endpoint для верификации токена и получения данных пользователя
 * GET /api/auth/verify
 * 
 * Headers: Authorization: Bearer <token>
 */
export default defineEventHandler(async (event) => {
  try {
    // Извлечение токена из заголовка
    const authHeader = getHeader(event, 'authorization');
    const token = extractToken(authHeader);

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No Token Provided',
        data: {
          success: false,
          message: 'Токен не предоставлен',
        },
      });
    }

    // Верификация токена
    const payload = verifyToken(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Token',
        data: {
          success: false,
          message: 'Недействительный или истекший токен',
        },
      });
    }

    // Получение пользователя из БД
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [payload.userId]
    );

    if (users.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User Not Found',
        data: {
          success: false,
          message: 'Пользователь не найден',
        },
      });
    }

    const user = users[0];

    // Возврат публичных данных пользователя
    return {
      success: true,
      user: toPublicUser(user),
    };
  } catch (error: any) {
    console.error('Token verification error:', error);

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    // Иначе создаем общую ошибку
    throw createError({
      statusCode: 500,
      statusMessage: 'Verification Failed',
      data: {
        success: false,
        message: 'Ошибка при верификации токена',
      },
    });
  }
});
