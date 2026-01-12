/**
 * API endpoint для привязки теста к дисциплине
 * POST /api/discipline-tests
 */

import { createDisciplineTest, disciplineTestExists } from '../../repositories/disciplineTestRepository';
import { getTestTemplateById } from '../../repositories/testTemplateRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<{
            discipline_id: string;
            test_template_id: string;
            is_required?: boolean;
            notes?: string;
        }>(event);

        // Валидация
        if (!body.discipline_id) {
            return {
                success: false,
                message: 'ID дисциплины обязателен',
            };
        }

        if (!body.test_template_id) {
            return {
                success: false,
                message: 'ID шаблона теста обязателен',
            };
        }

        // Проверяем существование шаблона
        const template = await getTestTemplateById(body.test_template_id);
        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Проверяем, не привязан ли уже
        const exists = await disciplineTestExists(body.discipline_id, body.test_template_id);
        if (exists) {
            return {
                success: false,
                message: 'Этот тест уже привязан к дисциплине',
            };
        }

        // Создаём привязку
        const disciplineTest = await createDisciplineTest({
            discipline_id: body.discipline_id,
            test_template_id: body.test_template_id,
            is_required: body.is_required,
            notes: body.notes,
        });

        // Логируем действие
        await logActivity(
            event,
            'CREATE',
            'COURSE', // Используем COURSE для discipline tests
            String(disciplineTest.id),
            `Привязка теста к дисциплине: ${template.name}`,
            { 
                disciplineId: body.discipline_id,
                testTemplateId: body.test_template_id,
                isRequired: body.is_required
            }
        );

        return {
            success: true,
            message: 'Тест успешно привязан к дисциплине',
            disciplineTest,
        };
    } catch (error) {
        console.error('Ошибка привязки теста:', error);

        return {
            success: false,
            message: 'Ошибка при привязке теста к дисциплине',
        };
    }
});
