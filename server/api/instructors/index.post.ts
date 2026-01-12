/**
 * API endpoint для создания нового инструктора
 * POST /api/instructors
 * 
 * Поддерживает опциональное создание учётной записи (user) для входа в систему.
 * Если createAccount = true, создаётся user с ролью TEACHER и связывается с instructor.
 */

import { randomUUID } from 'crypto';
import { createInstructor, instructorEmailExists, type CreateInstructorInput, linkInstructorToUser } from '../../repositories/instructorRepository';
import { executeQuery } from '../../utils/db';
import { hashPassword } from '../../utils/auth';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';
import type { User } from '../../types/auth';

const instructorSchema = z.object({
  fullName: z.string().min(1, 'ФИО обязательно'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  hireDate: z.string().optional().or(z.literal('')),
  contractInfo: z.string().optional(),
  maxHours: z.number().min(0, 'Часы не могут быть отрицательными').optional(),
  isActive: z.boolean().optional(),

  // Поля для создания учётной записи
  createAccount: z.boolean().optional().default(false),
  accountEmail: z.string().email('Некорректный email для аккаунта').optional(),
  accountPassword: z.string().min(8, 'Пароль должен быть минимум 8 символов').optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    console.log('[Instructors API] Создание инструктора:', {
      fullName: body.fullName,
      createAccount: body.createAccount
    });

    // Валидация
    const validationResult = instructorSchema.safeParse(body);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Ошибка валидации данных',
        errors: validationResult.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    const data = validationResult.data;

    // Проверяем уникальность email инструктора если указан
    if (data.email && data.email !== '') {
      const emailExists = await instructorEmailExists(data.email);
      if (emailExists) {
        return {
          success: false,
          message: 'Инструктор с таким email уже существует',
          field: 'email',
        };
      }
    }

    let userId: string | null = null;

    // Если нужно создать учётную запись
    if (data.createAccount) {
      const accountEmail = data.accountEmail || data.email;

      if (!accountEmail) {
        return {
          success: false,
          message: 'Email обязателен для создания учётной записи',
          field: 'accountEmail',
        };
      }

      // Проверяем уникальность email в таблице users
      const existingUsers = await executeQuery<User[]>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [accountEmail]
      );

      if (existingUsers.length > 0) {
        return {
          success: false,
          message: 'Пользователь с таким email уже существует в системе',
          field: 'accountEmail',
        };
      }

      // Проверяем наличие пароля
      const password = data.accountPassword;

      if (!password || password.length < 8) {
        return {
          success: false,
          message: 'Пароль обязателен и должен быть минимум 8 символов',
          field: 'accountPassword',
        };
      }

      // Хешируем пароль
      const passwordHash = await hashPassword(password);

      // Создаём пользователя с ролью TEACHER
      userId = randomUUID();
      await executeQuery(
        `INSERT INTO users (id, role, name, email, password_hash, phone, created_at, updated_at)
         VALUES (?, 'TEACHER', ?, ?, ?, ?, NOW(3), NOW(3))`,
        [userId, data.fullName, accountEmail, passwordHash, data.phone || null]
      );

      console.log(`[Instructors API] Создан пользователь: ${accountEmail} (role=TEACHER)`);
    }

    // Создаём инструктора
    const instructor = await createInstructor(data as CreateInstructorInput);

    // Если создали пользователя, связываем с инструктором
    if (userId) {
      await linkInstructorToUser(instructor.id, userId);
      console.log(`[Instructors API] Связан instructor.id=${instructor.id} с user.id=${userId}`);
    }

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'INSTRUCTOR',
      String(instructor.id),
      instructor.fullName,
      {
        email: instructor.email,
        accountCreated: !!userId,
        accountEmail: data.createAccount ? (data.accountEmail || data.email) : undefined
      }
    );

    return {
      success: true,
      message: data.createAccount
        ? 'Инструктор и учётная запись успешно созданы'
        : 'Инструктор успешно создан',
      instructor,
    };
  } catch (error) {
    console.error('Ошибка создания инструктора:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при создании инструктора',
    };
  }
});
