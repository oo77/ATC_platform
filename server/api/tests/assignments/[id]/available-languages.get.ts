/**
 * API endpoint для получения доступных языков для назначения теста
 * GET /api/tests/assignments/:id/available-languages
 * 
 * Возвращает языки, на которых студент может пройти тест
 */

import { getTestAssignmentById } from '../../../../repositories/testAssignmentRepository';
import { getAvailableLanguagesForTemplate } from '../../../../repositories/testTemplateRepository';
import { LANGUAGE_LABELS, LANGUAGE_FLAGS, QuestionLanguage } from '../../../../types/testing';
import { Permission, requireAnyPermission } from "../../../../utils/permissions";
import { requireTestAssignmentAccess } from "../../../../utils/resourceAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: право + доступ к группе назначения
  await requireTestAssignmentAccess(event, getRouterParam(event, "id"), "read");

    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID назначения не указан',
                languages: [],
            };
        }

        // Получаем назначение
        const assignment = await getTestAssignmentById(id);
        if (!assignment) {
            return {
                success: false,
                message: 'Назначение не найдено',
                languages: [],
            };
        }

        // Получаем доступные языки
        const availableLanguages = await getAvailableLanguagesForTemplate(assignment.test_template_id);

        // Формируем результат с метками и флагами
        const languages = availableLanguages.map(lang => ({
            value: lang,
            label: LANGUAGE_LABELS[lang],
            flag: LANGUAGE_FLAGS[lang],
        }));

        return {
            success: true,
            languages,
        };
    } catch (error) {
        console.error('Ошибка получения доступных языков:', error);

        return {
            success: false,
            message: 'Ошибка при получении доступных языков',
            languages: [],
        };
    }
});
