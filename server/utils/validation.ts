import { z } from 'zod';
import { UserRole } from '../types/auth';

/**
 * Схемы валидации для модуля аутентификации
 */

// Валидация email
export const emailSchema = z
  .string()
  .email('Некорректный формат email')
  .min(5, 'Email должен содержать минимум 5 символов')
  .max(191, 'Email не должен превышать 191 символ');

// Валидация пароля
export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен содержать минимум 6 символов')
  .max(100, 'Пароль не должен превышать 100 символов')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру'
  );

// Валидация имени
export const nameSchema = z
  .string()
  .min(2, 'Имя должно содержать минимум 2 символа')
  .max(191, 'Имя не должно превышать 191 символ')
  .regex(/^[а-яА-ЯёЁa-zA-Z\s'-]+$/, 'Имя может содержать только буквы, пробелы, дефисы и апострофы');

// Валидация телефона (узбекский формат)
export const phoneSchema = z
  .string()
  .regex(
    /^\+998[0-9]{9}$/,
    'Телефон должен быть в формате +998XXXXXXXXX'
  )
  .optional();

// Валидация ПИНФЛ (14 цифр)
export const pinflSchema = z
  .string()
  .regex(/^[0-9]{14}$/, 'ПИНФЛ должен содержать 14 цифр')
  .optional();

// Валидация роли
export const roleSchema = z.nativeEnum(UserRole).describe('Роль пользователя');

// Схема регистрации
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  workplace: z.string().max(191).optional(),
  position: z.string().max(191).optional(),
  pinfl: pinflSchema,
  role: roleSchema.optional(),
});

// Схема входа
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Пароль обязателен'),
});

// Схема обновления профиля
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  workplace: z.string().max(191).optional(),
  position: z.string().max(191).optional(),
  pinfl: pinflSchema,
});

// Схема смены пароля
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

/**
 * Валидация данных по схеме
 * @param schema - Zod схема
 * @param data - Данные для валидации
 * @returns Результат валидации
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validData = schema.parse(data);
    return {
      success: true as const,
      data: validData,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      return {
        success: false as const,
        data: null,
        errors,
      };
    }
    return {
      success: false as const,
      data: null,
      errors: { _general: ['Ошибка валидации'] },
    };
  }
}
