/**
 * API endpoint для обновления данных профиля текущего пользователя
 * PUT /api/profile
 */

import { defineEventHandler, readBody } from 'h3'
import { requireAuth } from '../../utils/permissions'
import { executeQuery } from '../../utils/db'
import { logActivity } from '../../utils/activityLogger'
import { z } from 'zod'

// Схема валидации для обновления профиля
const updateProfileSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
    phone: z.string().optional().nullable(),
    workplace: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    pinfl: z.string().length(14, 'ПИНФЛ должен содержать 14 цифр').optional().nullable().or(z.literal('')),
})

export default defineEventHandler(async (event) => {
    // Проверяем авторизацию
    const context = await requireAuth(event)

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидируем данные
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
        throw createError({
            statusCode: 400,
            message: 'Ошибка валидации данных',
            data: validationResult.error.issues,
        })
    }

    const data = validationResult.data

    try {
        // Формируем запрос на обновление только переданных полей
        const updateFields: string[] = []
        const updateValues: any[] = []

        if (data.name !== undefined) {
            updateFields.push('name = ?')
            updateValues.push(data.name)
        }
        if (data.phone !== undefined) {
            updateFields.push('phone = ?')
            updateValues.push(data.phone || null)
        }
        if (data.workplace !== undefined) {
            updateFields.push('workplace = ?')
            updateValues.push(data.workplace || null)
        }
        if (data.position !== undefined) {
            updateFields.push('position = ?')
            updateValues.push(data.position || null)
        }
        if (data.pinfl !== undefined) {
            updateFields.push('pinfl = ?')
            updateValues.push(data.pinfl || null)
        }

        if (updateFields.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'Нет данных для обновления',
            })
        }

        // Добавляем updated_at
        updateFields.push('updated_at = NOW()')
        updateValues.push(context.userId)

        // Выполняем обновление
        await executeQuery(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        )

        // Получаем обновленные данные пользователя
        const users = await executeQuery<any[]>(
            `
      SELECT 
        id,
        role,
        name,
        email,
        phone,
        workplace,
        position,
        pinfl,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      `,
            [context.userId]
        )

        const user = users[0]

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'USER',
            context.userId,
            'Обновление профиля',
            { updatedFields: Object.keys(data).filter(k => data[k] !== undefined) }
        )

        return {
            success: true,
            message: 'Профиль успешно обновлен',
            user,
        }
    } catch (error: any) {
        console.error('Error updating profile:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            message: 'Ошибка при обновлении профиля',
        })
    }
})
