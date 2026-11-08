/**
 * API endpoint для получения вопроса по ID
 * GET /api/test-bank/questions/:id
 */

import { getQuestionById } from '../../../repositories/questionRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.TEST_BANKS_VIEW, Permission.TEST_BANKS_MANAGE]);

    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID вопроса не указан',
            };
        }

        const question = await getQuestionById(id);

        if (!question) {
            return {
                success: false,
                message: 'Вопрос не найден',
            };
        }

        return {
            success: true,
            question,
        };
    } catch (error) {
        console.error('Ошибка получения вопроса:', error);

        return {
            success: false,
            message: 'Ошибка при получении вопроса',
        };
    }
});
