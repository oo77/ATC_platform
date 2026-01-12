/**
 * API endpoint для сброса пароля студента
 * POST /api/students/[id]/reset-password
 * 
 * Сбрасывает пароль на ПИНФЛ или устанавливает новый пароль
 */

import { z } from 'zod';
import { getStudentById } from '../../../repositories/studentRepository';
import { executeQuery } from '../../../utils/db';
import { hashPassword } from '../../../utils/auth';
import { logActivity } from '../../../utils/activityLogger';
import type { RowDataPacket } from 'mysql2/promise';

const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, 'Пароль должен быть минимум 8 символов').optional(),
    resetToPinfl: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
    try {
        const studentId = getRouterParam(event, 'id');

        if (!studentId) {
            throw createError({
                statusCode: 400,
                message: 'ID студента обязателен',
            });
        }

        // Проверяем права доступа (только ADMIN и MANAGER)
        const user = event.context.user;
        if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
            throw createError({
                statusCode: 403,
                message: 'Недостаточно прав для сброса пароля',
            });
        }

        const body = await readBody(event);
        const data = resetPasswordSchema.parse(body);

        // Получаем студента
        const student = await getStudentById(studentId);
        if (!student) {
            throw createError({
                statusCode: 404,
                message: 'Студент не найден',
            });
        }

        // Ищем связанного пользователя
        const email = `${student.pinfl}@student.local`;
        const [existingUser] = await executeQuery<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ? OR pinfl = ? LIMIT 1',
            [email, student.pinfl]
        );

        if (!existingUser) {
            // Пользователь не найден - создаём новый аккаунт
            const { randomUUID } = await import('crypto');
            const userId = randomUUID();
            const password = data.newPassword || student.pinfl;
            const passwordHash = await hashPassword(password);

            await executeQuery(
                `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
         VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
                [userId, student.fullName, email, passwordHash, student.pinfl, student.organization, student.position]
            );

            // Связываем студента с пользователем
            await executeQuery(
                'UPDATE students SET user_id = ? WHERE id = ?',
                [userId, studentId]
            );

            await logActivity(
                event,
                'CREATE',
                'USER',
                userId,
                `Учётная запись для ${student.fullName}`,
                { studentId, email }
            );

            return {
                success: true,
                message: 'Учётная запись создана',
                accountEmail: email,
                passwordReset: true,
            };
        }

        // Пользователь существует - обновляем пароль
        const newPassword = data.resetToPinfl ? student.pinfl : (data.newPassword || student.pinfl);
        const passwordHash = await hashPassword(newPassword);

        await executeQuery(
            'UPDATE users SET password_hash = ?, updated_at = NOW(3) WHERE id = ?',
            [passwordHash, existingUser.id]
        );

        await logActivity(
            event,
            'UPDATE',
            'USER',
            existingUser.id,
            `Сброс пароля для ${student.fullName}`,
            { studentId, resetToPinfl: data.resetToPinfl }
        );

        return {
            success: true,
            message: data.resetToPinfl
                ? 'Пароль сброшен на ПИНФЛ'
                : 'Пароль успешно изменён',
            accountEmail: email,
        };
    } catch (error: any) {
        console.error('[POST /api/students/[id]/reset-password] Error:', error);

        if (error.statusCode) {
            throw error;
        }

        if (error.name === 'ZodError') {
            throw createError({
                statusCode: 400,
                message: 'Ошибка валидации',
                data: error.errors,
            });
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Ошибка сброса пароля',
        });
    }
});
