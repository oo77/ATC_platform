/**
 * API endpoint для валидации языков шаблона теста
 * GET /api/test-bank/templates/:id/validate-languages
 * 
 * Проверяет, достаточно ли вопросов каждого выбранного языка
 */

import { getTestTemplateById, validateLanguagesQuestionCount } from '../../../../repositories/testTemplateRepository';
import { QuestionLanguage } from '../../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        // Получаем шаблон
        const template = await getTestTemplateById(id);
        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Если языки не указаны, валидация не требуется
        if (!template.allowed_languages || template.allowed_languages.length === 0) {
            return {
                success: true,
                isValid: true,
                message: 'Языки не ограничены',
                validations: [],
            };
        }

        // Определяем минимальное количество вопросов
        let minQuestions = 1;
        if (template.questions_mode === 'random' && template.questions_count) {
            minQuestions = template.questions_count;
        }

        // Валидируем
        const result = await validateLanguagesQuestionCount(
            template.bank_id,
            template.allowed_languages,
            minQuestions
        );

        return {
            success: true,
            isValid: result.isValid,
            validations: result.validations,
            minQuestions,
        };
    } catch (error) {
        console.error('Ошибка валидации языков:', error);

        return {
            success: false,
            message: 'Ошибка при валидации языков',
        };
    }
});
