/**
 * API endpoint для сброса пароля пользователя администратором
 * PUT /api/users/:id/password
 */

import { defineEventHandler, readBody } from 'h3';
import { executeQuery } from '../../../utils/db';
import { logActivity } from '../../../utils/activityLogger';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Схема валидации для сброса пароля
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export default defineEventHandler(async (event) => {
  try {
    // Получаем текущего пользователя из контекста
    const currentUser = event.context.user;

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    // Получаем ID пользователя из параметров
    const targetUserId = event.context.params?.id;

    if (!targetUserId) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя не указан',
      });
    }

    // Проверка прав доступа
    // Только ADMIN может менять пароли другим пользователям
    // MANAGER может менять пароли (но не ADMIN'ам) - проверим это ниже
    const canReset = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

    if (!canReset) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав для сброса пароля',
      });
    }

    // Получаем целевого пользователя
    const [targetUser] = await executeQuery<any[]>(
      'SELECT id, role, email, name FROM users WHERE id = ? LIMIT 1',
      [targetUserId]
    );

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден',
      });
    }

    // Дополнительная проверка: MANAGER не может менять пароль ADMIN'у
    if (currentUser.role === 'MANAGER' && targetUser.role === 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Модератор не может менять пароль администратору',
      });
    }

    // Читаем тело запроса
    const body = await readBody(event);
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации данных',
        data: validation.error.issues,
      });
    }

    const { password } = validation.data;

    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Обновляем пароль
    await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, targetUserId]
    );

    console.log(`✅ User password reset by ${currentUser.email} for ${targetUser.email}`);

    // Логируем действие
    await logActivity(
      event,
      'RESET_PASSWORD',
      'USER',
      targetUserId,
      targetUser.name,
      {
        initiator: currentUser.email
      }
    );

    return {
      success: true,
      message: 'Пароль успешно изменен',
    };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при сбросе пароля',
    });
  }
});
