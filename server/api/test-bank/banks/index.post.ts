/**
 * API endpoint для создания банка вопросов
 * POST /api/test-bank/banks
 */

import { createQuestionBank, questionBankCodeExists } from '../../../repositories/questionBankRepository';
import { logActivity } from '../../../utils/activityLogger';
import type { CreateQuestionBankDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<CreateQuestionBankDTO>(event);

        // Валидация
        if (!body.name?.trim()) {
            return {
                success: false,
                message: 'Название банка обязательно',
            };
        }

        if (!body.code?.trim()) {
            return {
                success: false,
                message: 'Код банка обязателен',
            };
        }

        // Проверяем уникальность кода
        const codeExists = await questionBankCodeExists(body.code);
        if (codeExists) {
            return {
                success: false,
                message: `Банк с кодом "${body.code}" уже существует`,
            };
        }

        // Получаем пользователя из контекста
        const userId = event.context.user?.id;

        // Создаём банк
        const bank = await createQuestionBank({
            name: body.name.trim(),
            code: body.code.trim().toUpperCase(),
            description: body.description?.trim(),
            category: body.category?.trim(),
            is_active: body.is_active !== false,
        }, userId);

        // Логируем действие
        await logActivity(
            event,
            'CREATE',
            'COURSE', // Используем существующий тип для банков вопросов
            bank.id,
            bank.name,
            { code: bank.code, category: bank.category }
        );

        return {
            success: true,
            message: 'Банк вопросов успешно создан',
            bank,
        };
    } catch (error) {
        console.error('Ошибка создания банка вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при создании банка вопросов',
        };
    }
});
