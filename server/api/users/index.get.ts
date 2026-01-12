import { executeQuery } from '../../utils/db';
import { toPublicUser } from '../../utils/auth';
import type { User, UserPublic, UserRole } from '../../types/auth';

/**
 * API endpoint для получения списка пользователей
 * GET /api/users?role=ADMIN
 * 
 * Query params:
 * - role: фильтр по роли (опционально)
 */
export default defineEventHandler(async (event) => {
  try {
    // Получаем текущего пользователя из контекста (добавлено middleware)
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

    // Проверка прав доступа (только ADMIN, MANAGER, TEACHER)
    if (!['ADMIN', 'MANAGER', 'TEACHER'].includes(currentUser.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          success: false,
          message: 'Недостаточно прав для просмотра пользователей',
        },
      });
    }

    // Получаем параметры запроса
    const query = getQuery(event);
    const roleFilter = query.role as UserRole | undefined;

    // Строим SQL запрос
    let sql = 'SELECT * FROM users';
    const params: any[] = [];

    if (roleFilter) {
      sql += ' WHERE role = ?';
      params.push(roleFilter);
    }

    // Ограничение доступа для TEACHER - только студенты
    if (currentUser.role === 'TEACHER') {
      if (roleFilter && roleFilter !== 'STUDENT') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          data: {
            success: false,
            message: 'Учителя могут просматривать только студентов',
          },
        });
      }
      sql = roleFilter ? sql : 'SELECT * FROM users WHERE role = ?';
      if (!roleFilter) {
        params.push('STUDENT');
      }
    }

    // Ограничение доступа для MANAGER - не может видеть ADMIN
    if (currentUser.role === 'MANAGER') {
      if (roleFilter === 'ADMIN') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          data: {
            success: false,
            message: 'Модераторы не могут просматривать администраторов',
          },
        });
      }
      if (!roleFilter) {
        sql += ' WHERE role != ?';
        params.push('ADMIN');
      }
    }

    sql += ' ORDER BY created_at DESC';

    // Выполняем запрос
    const users = await executeQuery<User[]>(sql, params);

    // Преобразуем в публичный формат
    const publicUsers: UserPublic[] = users.map(toPublicUser);

    console.log(`✅ Users fetched: ${publicUsers.length} users (role: ${roleFilter || 'all'})`);

    return {
      success: true,
      users: publicUsers,
    };
  } catch (error: any) {
    console.error('Get users error:', error);

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
        message: 'Ошибка при получении списка пользователей',
      },
    });
  }
});
