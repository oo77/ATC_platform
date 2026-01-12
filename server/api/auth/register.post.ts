import { randomUUID } from 'crypto';
import { executeQuery } from '../../utils/db';
import { hashPassword, generateToken, generateRefreshToken, toPublicUser, createTokenPayload } from '../../utils/auth';
import { validate, registerSchema } from '../../utils/validation';
import { logActivity } from '../../utils/activityLogger';
import type { User, RegisterData, AuthResponse } from '../../types/auth';

/**
 * API endpoint для регистрации нового пользователя
 * POST /api/auth/register
 * 
 * Body: { name, email, password, phone?, workplace?, position?, pinfl?, role? }
 */
export default defineEventHandler(async (event) => {
  try {
    // Чтение тела запроса
    const body = await readBody<RegisterData>(event);

    // Валидация данных
    const validation = validate(registerSchema, body);
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

    // Проверка существования пользователя с таким email
    const existingUsers = await executeQuery<User[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [data.email]
    );

    if (existingUsers.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User Already Exists',
        data: {
          success: false,
          message: 'Пользователь с таким email уже существует',
          errors: { email: ['Email уже зарегистрирован'] },
        },
      });
    }

    // Хеширование пароля
    const passwordHash = await hashPassword(data.password);

    // Создание пользователя
    const userId = randomUUID();
    const role = data.role || 'STUDENT'; // По умолчанию роль STUDENT

    await executeQuery(
      `INSERT INTO users (id, role, name, email, password_hash, phone, workplace, position, pinfl, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        userId,
        role,
        data.name,
        data.email,
        passwordHash,
        data.phone || null,
        data.workplace || null,
        data.position || null,
        data.pinfl || null,
      ]
    );

    // Получение созданного пользователя
    const [newUser] = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Генерация токенов
    const tokenPayload = createTokenPayload(newUser);
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Возврат ответа
    const response: AuthResponse = {
      success: true,
      user: toPublicUser(newUser),
      token,
      refreshToken,
    };

    console.log(`✅ User registered: ${newUser.email} (${newUser.role})`);

    // Логируем регистрацию
    await logActivity(
      event,
      'CREATE',
      'USER',
      newUser.id,
      newUser.name,
      { email: newUser.email, role: newUser.role, selfRegistration: true }
    );

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    // Иначе создаем общую ошибку
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration Failed',
      data: {
        success: false,
        message: 'Ошибка при регистрации пользователя',
      },
    });
  }
});
