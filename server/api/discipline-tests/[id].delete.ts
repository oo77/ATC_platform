/**
 * API endpoint для удаления привязки теста к дисциплине
 * DELETE /api/discipline-tests/:id
 */

import { deleteDisciplineTest, getDisciplineTestById } from '../../repositories/disciplineTestRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID привязки не указан',
            };
        }

        // Проверяем существование
        const disciplineTest = await getDisciplineTestById(id);
        if (!disciplineTest) {
            return {
                success: false,
                message: 'Привязка не найдена',
            };
        }

        // Удаляем
        const deleted = await deleteDisciplineTest(id);

        if (!deleted) {
            return {
                success: false,
                message: 'Ошибка при удалении привязки',
            };
        }

        // Логируем действие
        await logActivity(
            event,
            'DELETE',
            'COURSE',
            id,
            'Удаление привязки теста к дисциплине',
            { 
                disciplineId: disciplineTest.discipline_id,
                testTemplateId: disciplineTest.test_template_id
            }
        );

        return {
            success: true,
            message: 'Тест успешно отвязан от дисциплины',
        };
    } catch (error) {
        console.error('Ошибка удаления привязки:', error);

        return {
            success: false,
            message: 'Ошибка при удалении привязки',
        };
    }
});
