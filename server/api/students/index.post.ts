/**
 * API endpoint для создания нового студента
 * POST /api/students
 * 
 * Автоматически создаёт учётную запись (user) для входа в систему.
 * Логин: ПИНФЛ@student.local, Пароль: ПИНФЛ (или указанный)
 */

import { randomUUID } from 'crypto';
import { createStudent, studentExistsByPinfl, linkStudentToUser } from '../../repositories/studentRepository';
import { executeQuery } from '../../utils/db';
import { hashPassword } from '../../utils/auth';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';
import type { User } from '../../types/auth';

const studentSchema = z.object({
  fullName: z.string().min(1, 'ФИО обязательно'),
  pinfl: z.string().regex(/^\d{14}$/, 'ПИНФЛ должен содержать ровно 14 цифр'),
  organization: z.string().min(1, 'Организация обязательна'),
  department: z.string().optional(),
  position: z.string().min(1, 'Должность обязательна'),
  // Опциональный пароль (если не указан — используется ПИНФЛ)
  accountPassword: z.string().min(8, 'Пароль должен быть минимум 8 символов').optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    console.log('[Students API] Создание студента:', {
      fullName: body.fullName,
      pinfl: body.pinfl,
      createAccount: body.createAccount
    });

    // Валидация
    const validationResult = studentSchema.safeParse(body);
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

    // Проверка уникальности ПИНФЛ
    const exists = await studentExistsByPinfl(data.pinfl);
    if (exists) {
      return {
        success: false,
        message: 'Студент с таким ПИНФЛ уже существует',
        field: 'pinfl',
      };
    }

    let userId: string | null = null;
    let accountEmail: string | null = null;

    // Всегда создаём учётную запись для студента
    // Логин: ПИНФЛ@student.local, Пароль: ПИНФЛ
    accountEmail = `${data.pinfl}@student.local`;

    // Проверяем уникальность email в таблице users
    const existingUsers = await executeQuery<User[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [accountEmail]
    );

    if (existingUsers.length === 0) {
      // Пароль = ПИНФЛ (если не указан свой)
      const password = data.accountPassword || data.pinfl;

      // Хешируем пароль
      const passwordHash = await hashPassword(password);

      // Создаём пользователя с ролью STUDENT
      userId = randomUUID();
      await executeQuery(
        `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
         VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [userId, data.fullName, accountEmail, passwordHash, data.pinfl, data.organization, data.position]
      );

      console.log(`[Students API] Создан пользователь: ${accountEmail} (role=STUDENT, password=${data.accountPassword ? 'custom' : 'ПИНФЛ'})`);
    } else {
      // Пользователь уже существует, используем его ID
      userId = existingUsers[0].id;
      console.log(`[Students API] Пользователь ${accountEmail} уже существует, связываем со студентом`);
    }

    // Создаём студента
    const student = await createStudent({
      fullName: data.fullName.trim(),
      pinfl: data.pinfl.trim(),
      organization: data.organization.trim(),
      department: data.department?.trim() || undefined,
      position: data.position.trim(),
    });

    // Если создали пользователя, связываем со студентом
    if (userId) {
      await linkStudentToUser(student.id, userId);
      console.log(`[Students API] Связан student.id=${student.id} с user.id=${userId}`);
    }

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'STUDENT',
      student.id,
      student.fullName,
      {
        pinfl: student.pinfl,
        organization: student.organization,
        accountCreated: !!userId,
        accountEmail: accountEmail || undefined
      }
    );

    return {
      success: true,
      message: 'Студент и учётная запись успешно созданы',
      student,
      accountEmail,
    };
  } catch (error) {
    console.error('Ошибка создания студента:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при создании студента',
    };
  }
});
