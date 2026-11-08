/**
 * API endpoint для получения шаблона теста по ID
 * GET /api/test-bank/templates/:id
 */

import { getTestTemplateById } from '../../../repositories/testTemplateRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.TEST_TEMPLATES_VIEW, Permission.TEST_TEMPLATES_MANAGE, Permission.TESTS_ASSIGN]);

    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        const template = await getTestTemplateById(id);

        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        return {
            success: true,
            template,
        };
    } catch (error) {
        console.error('Ошибка получения шаблона теста:', error);

        return {
            success: false,
            message: 'Ошибка при получении шаблона теста',
        };
    }
});