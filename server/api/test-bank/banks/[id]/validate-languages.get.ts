/**
 * API endpoint для валидации языков по банку вопросов
 * GET /api/test-bank/banks/:id/validate-languages?min_count=10&languages=ru,uz,en
 * 
 * Проверяет, достаточно ли вопросов каждого языка в банке
 */

import { validateLanguagesQuestionCount } from '../../../../repositories/testTemplateRepository';
import { QuestionLanguage } from '../../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const bankId = getRouterParam(event, 'id');
        const query = getQuery(event);

        if (!bankId) {
            return {
                success: false,
                message: 'ID банка не указан',
                validation: [],
            };
        }

        // Получаем параметры из query
        const minCount = parseInt(query.min_count as string) || 1;
        const languagesStr = query.languages as string || 'ru';
        const languages = languagesStr.split(',').filter(l => ['ru', 'uz', 'en'].includes(l)) as QuestionLanguage[];

        if (languages.length === 0) {
            return {
                success: true,
                isValid: true,
                validation: [],
            };
        }

        // Валидируем количество вопросов по языкам
        const result = await validateLanguagesQuestionCount(bankId, languages, minCount);

        return {
            success: true,
            isValid: result.isValid,
            validation: result.validations,
            minCount,
        };
    } catch (error) {
        console.error('Ошибка валидации языков:', error);

        return {
            success: false,
            message: 'Ошибка при валидации языков',
            validation: [],
        };
    }
});
