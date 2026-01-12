import { executeQuery } from '../../utils/db';
import { verifyRefreshToken, generateToken, generateRefreshToken, createTokenPayload } from '../../utils/auth';
import type { User } from '../../types/auth';

/**
 * API endpoint для обновления access токена с помощью refresh токена
 * POST /api/auth/refresh
 * 
 * Body: { refreshToken }
 */
export default defineEventHandler(async (event) => {
  try {
    // Чтение тела запроса
    const body = await readBody<{ refreshToken: string }>(event);

    if (!body.refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No Refresh Token',
        data: {
          success: false,
          message: 'Refresh токен не предоставлен',
        },
      });
    }

    // Верификация refresh токена
    const payload = verifyRefreshToken(body.refreshToken);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Refresh Token',
        data: {
          success: false,
          message: 'Недействительный или истекший refresh токен',
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

    // Генерация новых токенов
    const tokenPayload = createTokenPayload(user);
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    console.log(`✅ Token refreshed for user: ${user.email}`);

    return {
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    console.error('Token refresh error:', error);

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    // Иначе создаем общую ошибку
    throw createError({
      statusCode: 500,
      statusMessage: 'Token Refresh Failed',
      data: {
        success: false,
        message: 'Ошибка при обновлении токена',
      },
    });
  }
});
