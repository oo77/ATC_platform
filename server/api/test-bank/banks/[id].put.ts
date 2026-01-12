/**
 * API endpoint для обновления банка вопросов
 * PUT /api/test-bank/banks/:id
 */

import { updateQuestionBank, questionBankCodeExists } from '../../../repositories/questionBankRepository';
import { logActivity } from '../../../utils/activityLogger';
import type { UpdateQuestionBankDTO } from '../../../types/testing';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody<UpdateQuestionBankDTO>(event);

        if (!id) {
            return {
                success: false,
                message: 'ID банка не указан',
            };
        }

        // Если меняется код, проверяем уникальность
        if (body.code) {
            const codeExists = await questionBankCodeExists(body.code, id);
            if (codeExists) {
                return {
                    success: false,
                    message: `Банк с кодом "${body.code}" уже существует`,
                };
            }
        }

        // Обновляем
        const bank = await updateQuestionBank(id, {
            name: body.name?.trim(),
            code: body.code?.trim().toUpperCase(),
            description: body.description?.trim(),
            category: body.category?.trim(),
            is_active: body.is_active,
        });

        if (!bank) {
            return {
                success: false,
                message: 'Банк вопросов не найден',
            };
        }

        // Логируем действие
        await logActivity(
            event,
            'UPDATE',
            'COURSE',
            bank.id,
            bank.name,
            { code: bank.code, updatedFields: Object.keys(body).filter(k => body[k] !== undefined) }
        );

        return {
            success: true,
            message: 'Банк вопросов успешно обновлён',
            bank,
        };
    } catch (error) {
        console.error('Ошибка обновления банка вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении банка вопросов',
        };
    }
});
