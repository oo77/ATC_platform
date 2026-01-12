/**
 * API endpoint для изменения пароля текущего пользователя
 * PUT /api/profile/password
 */

import { defineEventHandler, readBody } from 'h3'
import { requireAuth } from '../../utils/permissions'
import { executeQuery } from '../../utils/db'
import { logActivity } from '../../utils/activityLogger'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Схема валидации для изменения пароля
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
    newPassword: z.string().min(6, 'Новый пароль должен содержать минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
})

export default defineEventHandler(async (event) => {
    // Проверяем авторизацию
    const context = await requireAuth(event)

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидируем данные
    const validationResult = changePasswordSchema.safeParse(body)
    if (!validationResult.success) {
        throw createError({
            statusCode: 400,
            message: 'Ошибка валидации данных',
            data: validationResult.error.issues,
        })
    }

    const { currentPassword, newPassword } = validationResult.data

    try {
        // Получаем текущий хеш пароля
        const users = await executeQuery<any[]>(
            'SELECT password_hash FROM users WHERE id = ?',
            [context.userId]
        )

        if (!users || users.length === 0) {
            throw createError({
                statusCode: 404,
                message: 'Пользователь не найден',
            })
        }

        const user = users[0]

        // Проверяем текущий пароль
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
        if (!isPasswordValid) {
            throw createError({
                statusCode: 400,
                message: 'Неверный текущий пароль',
            })
        }

        // Хешируем новый пароль
        const newPasswordHash = await bcrypt.hash(newPassword, 10)

        // Обновляем пароль
        await executeQuery(
            `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
            [newPasswordHash, context.userId]
        )

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'USER',
            context.userId,
            'Изменение пароля'
        )

        return {
            success: true,
            message: 'Пароль успешно изменен',
        }
    } catch (error: any) {
        console.error('Error changing password:', error)

        // Если это наша ошибка с кодом, пробрасываем её
        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: 'Ошибка при изменении пароля',
        })
    }
})
