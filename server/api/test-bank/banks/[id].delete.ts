/**
 * API endpoint для удаления банка вопросов
 * DELETE /api/test-bank/banks/:id
 */

import { deleteQuestionBank, getQuestionBankById } from '../../../repositories/questionBankRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID банка не указан',
            };
        }

        // Получаем банк для логирования
        const bank = await getQuestionBankById(id);
        if (!bank) {
            return {
                success: false,
                message: 'Банк вопросов не найден',
            };
        }

        // Проверяем, есть ли связанные шаблоны
        if (bank.templates_count > 0) {
            return {
                success: false,
                message: `Невозможно удалить банк: существует ${bank.templates_count} связанных шаблонов тестов`,
            };
        }

        // Удаляем
        const deleted = await deleteQuestionBank(id);

        if (!deleted) {
            return {
                success: false,
                message: 'Ошибка при удалении банка вопросов',
            };
        }

        // Логируем действие
        await logActivity(
            event,
            'DELETE',
            'COURSE',
            id,
            bank.name,
            { code: bank.code, questionsCount: bank.questions_count }
        );

        return {
            success: true,
            message: 'Банк вопросов успешно удалён',
        };
    } catch (error) {
        console.error('Ошибка удаления банка вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при удалении банка вопросов',
        };
    }
});
