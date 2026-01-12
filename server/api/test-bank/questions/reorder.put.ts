/**
 * API endpoint для обновления порядка вопросов
 * PUT /api/test-bank/questions/reorder
 */

import { updateQuestionsOrder } from '../../../repositories/questionRepository';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<{
            orders: Array<{ id: string; order_index: number }>;
        }>(event);

        if (!body.orders?.length) {
            return {
                success: false,
                message: 'Список порядка пуст',
            };
        }

        await updateQuestionsOrder(body.orders);

        return {
            success: true,
            message: 'Порядок вопросов обновлён',
        };
    } catch (error) {
        console.error('Ошибка обновления порядка:', error);

        return {
            success: false,
            message: 'Ошибка при обновлении порядка',
        };
    }
});
