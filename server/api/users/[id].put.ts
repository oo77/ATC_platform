import { executeQuery } from '../../utils/db';
import { toPublicUser } from '../../utils/auth';
import { validate, updateProfileSchema } from '../../utils/validation';
import { logActivity } from '../../utils/activityLogger';
import type { User } from '../../types/auth';

/**
 * API endpoint для обновления пользователя
 * PUT /api/users/:id
 * 
 * Body: { name?, phone?, workplace?, position?, pinfl? }
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

    // Получаем пользователя для обновления
    const [userToUpdate] = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!userToUpdate) {
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
    const canUpdate = 
      currentUser.role === 'ADMIN' || // Админ может редактировать всех
      (currentUser.role === 'MANAGER' && userToUpdate.role !== 'ADMIN') || // Модератор может редактировать всех кроме админов
      currentUser.id === userId; // Пользователь может редактировать себя

    if (!canUpdate) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          success: false,
          message: 'Недостаточно прав для редактирования этого пользователя',
        },
      });
    }

    // Чтение тела запроса
    const body = await readBody(event);

    // Валидация данных
    const validation = validate(updateProfileSchema, body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          success: false, 
          message: 'Ошибка валидации данных',
          errors: validation.errors,
        },
      });
    }

    const data = validation.data;

    // Формируем SQL запрос для обновления
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      params.push(data.phone || null);
    }
    if (data.workplace !== undefined) {
      updates.push('workplace = ?');
      params.push(data.workplace || null);
    }
    if (data.position !== undefined) {
      updates.push('position = ?');
      params.push(data.position || null);
    }
    if (data.pinfl !== undefined) {
      updates.push('pinfl = ?');
      params.push(data.pinfl || null);
    }

    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          success: false,
          message: 'Нет данных для обновления',
        },
      });
    }

    updates.push('updated_at = NOW(3)');
    params.push(userId);

    // Выполняем обновление
    await executeQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Получаем обновленного пользователя
    const [updatedUser] = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!updatedUser) {
      throw new Error('Failed to fetch updated user');
    }

    console.log(`✅ User updated by ${currentUser.email}: ${updatedUser.email}`);

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'USER',
      userId,
      updatedUser.name,
      { updatedFields: Object.keys(data) }
    );

    return {
      success: true,
      user: toPublicUser(updatedUser),
      message: 'Пользователь успешно обновлен',
    };
  } catch (error: any) {
    console.error('Update user error:', error);

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
        message: 'Ошибка при обновлении пользователя',
      },
    });
  }
});
