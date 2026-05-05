/**
 * API endpoint для обновления инструктора
 * PUT /api/instructors/:id
 * 
 * Поддерживает:
 * - Обновление данных инструктора
 * - Смена пароля связанного аккаунта
 * - Создание аккаунта для существующего инструктора
 */

import {
  updateInstructor,
  instructorEmailExists,
  getInstructorById,
  linkInstructorToUser,
  type UpdateInstructorInput
} from '../../repositories/instructorRepository';
import {
  createUser,
  updateUserPassword,
  userEmailExists,
  hashPassword
} from '../../repositories/userRepository';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';

const updateInstructorSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email('Некорректный email').nullable().optional(),
  phone: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  contractInfo: z.string().nullable().optional(),
  maxHours: z.number().min(0, 'Часы не могут быть отрицательными').optional(),
  isActive: z.boolean().optional(),
  
  // Qualification fields
  birthDate: z.string().nullable().optional(),
  passportData: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  diploma_file_ids: z.array(z.string()).nullable().optional(),
  specialty: z.string().nullable().optional(),
  academic_degree: z.string().nullable().optional(),
  academic_rank: z.string().nullable().optional(),
  certificates: z.array(z.object({
    name: z.string(),
    date: z.string(),
    fileId: z.string().optional(),
  })).nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
  photo_base64: z.string().nullable().optional(),
  additional_files: z.array(z.string()).nullable().optional(),

  // Поля для смены пароля
  changePassword: z.boolean().optional(),
  newPassword: z.string().min(8, 'Пароль должен быть минимум 8 символов').optional(),
  // Поля для создания аккаунта
  createAccount: z.boolean().optional(),
  accountEmail: z.string().email('Некорректный email').optional(),
  accountPassword: z.string().min(8, 'Пароль должен быть минимум 8 символов').optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID инструктора не указан',
      };
    }

    const body = await readBody(event);

    // Валидация
    const validationResult = updateInstructorSchema.safeParse(body);
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

    // Получаем существующего инструктора
    const existingInstructor = await getInstructorById(id);
    if (!existingInstructor) {
      return {
        success: false,
        message: 'Инструктор не найден',
      };
    }

    // Проверяем уникальность email если он изменяется
    if (data.email && data.email !== '') {
      const emailExists = await instructorEmailExists(data.email, id);
      if (emailExists) {
        return {
          success: false,
          message: 'Инструктор с таким email уже существует',
          field: 'email',
        };
      }
    }

    let accountEmail: string | undefined;

    // Смена пароля для существующего аккаунта
    if (data.changePassword && existingInstructor.userId) {
      if (!data.newPassword || data.newPassword.length < 8) {
        return {
          success: false,
          message: 'Новый пароль должен быть минимум 8 символов',
          field: 'newPassword',
        };
      }

      const hashedPassword = await hashPassword(data.newPassword);
      await updateUserPassword(existingInstructor.userId, hashedPassword);

      accountEmail = existingInstructor.email || undefined;

      // Логируем действие смены пароля
      await logActivity(
        event,
        'UPDATE',
        'USER',
        existingInstructor.userId,
        `Смена пароля инструктора: ${existingInstructor.fullName}`,
        { action: 'password_change' }
      );
    }

    // Создание аккаунта для существующего инструктора
    if (data.createAccount && !existingInstructor.userId) {
      accountEmail = data.accountEmail || existingInstructor.email || `instructor_${id}@local`;

      // Проверяем уникальность email пользователя
      const userExists = await userEmailExists(accountEmail);
      if (userExists) {
        return {
          success: false,
          message: 'Пользователь с таким email уже существует',
          field: 'accountEmail',
        };
      }

      // Проверяем наличие пароля
      if (!data.accountPassword || data.accountPassword.length < 8) {
        return {
          success: false,
          message: 'Пароль должен быть минимум 8 символов',
          field: 'accountPassword',
        };
      }

      const hashedPassword = await hashPassword(data.accountPassword);

      // Создаём пользователя
      const newUser = await createUser({
        email: accountEmail,
        password: hashedPassword,
        name: existingInstructor.fullName,
        role: 'TEACHER',
      });

      // Связываем инструктора с пользователем
      await linkInstructorToUser(id, newUser.id);

      // Логируем действие
      await logActivity(
        event,
        'CREATE',
        'USER',
        newUser.id,
        `Создан аккаунт для инструктора: ${existingInstructor.fullName}`,
        { instructorId: id, email: accountEmail }
      );
    }

    // Обновляем данные инструктора
    const updateData: UpdateInstructorInput = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email ?? null;
    if (data.phone !== undefined) updateData.phone = data.phone ?? null;
    if (data.hireDate !== undefined) updateData.hireDate = data.hireDate ?? null;
    if (data.contractInfo !== undefined) updateData.contractInfo = data.contractInfo ?? null;
    if (data.maxHours !== undefined) updateData.maxHours = data.maxHours ?? 0;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Qualification fields
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.passportData !== undefined) updateData.passportData = data.passportData;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.university !== undefined) updateData.university = data.university;
    if (data.diploma_file_ids !== undefined) updateData.diploma_file_ids = data.diploma_file_ids;
    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.academic_degree !== undefined) updateData.academic_degree = data.academic_degree;
    if (data.academic_rank !== undefined) updateData.academic_rank = data.academic_rank;
    if (data.certificates !== undefined) updateData.certificates = data.certificates;
    if (data.languages !== undefined) updateData.languages = data.languages;
    if (data.photo_base64 !== undefined) updateData.photo_base64 = data.photo_base64;
    if (data.additional_files !== undefined) updateData.additional_files = data.additional_files;

    const instructor = await updateInstructor(id, updateData);

    // Логируем действие обновления
    await logActivity(
      event,
      'UPDATE',
      'INSTRUCTOR',
      id,
      instructor?.fullName || existingInstructor.fullName,
      { updatedFields: Object.keys(updateData) }
    );

    return {
      success: true,
      message: data.changePassword
        ? 'Пароль успешно изменён'
        : data.createAccount
          ? 'Аккаунт успешно создан'
          : 'Инструктор успешно обновлён',
      instructor,
    };
  } catch (error) {
    console.error('Ошибка обновления инструктора:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Ошибка при обновлении инструктора',
    };
  }
});
