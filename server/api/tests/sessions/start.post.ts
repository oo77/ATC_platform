/**
 * API endpoint для начала теста (создание сессии)
 * POST /api/tests/sessions/start
 */

import { getStudentByUserId } from '../../../repositories/studentRepository';
import type { QuestionLanguage } from '../../../types/testing';
import { Permission, requirePermission } from "../../../utils/permissions";
import { startTestSessionForStudent } from "../../../services/testSessionStartService";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.TESTS_TAKE);

    try {
        const body = await readBody<{
            assignment_id: string;
            language: QuestionLanguage;
        }>(event);

        if (!body.assignment_id) {
            return {
                success: false,
                message: 'ID назначения обязателен',
            };
        }

        if (!body.language) {
            return {
                success: false,
                message: 'Необходимо выбрать язык тестирования',
            };
        }

        // Получаем пользователя
        const userId = event.context.user?.id;
        if (!userId) {
            return {
                success: false,
                message: 'Не авторизован',
            };
        }

        // Получаем студента
        const student = await getStudentByUserId(userId);
        if (!student) {
            return {
                success: false,
                message: 'Студент не найден',
            };
        }

        // Получаем IP и User-Agent
        const headers = getHeaders(event);
        const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || '';
        const userAgent = headers['user-agent'] || '';

        const result = await startTestSessionForStudent({
            assignmentId: body.assignment_id,
            studentId: student.id,
            language: body.language,
            ipAddress: ipAddress.toString().split(',')[0]!.trim(),
            userAgent,
        });

        if (!result.success && result.forbidden) {
            throw createError({ statusCode: 403, message: result.message });
        }

        return result;
    } catch (error) {
        console.error('Ошибка начала теста:', error);

        return {
            success: false,
            message: 'Ошибка при начале теста',
        };
    }
});
