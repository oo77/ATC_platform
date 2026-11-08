/**
 * API endpoint для получения тестов дисциплины
 * GET /api/discipline-tests?discipline_id=...
 */

import { getDisciplineTests } from '../../repositories/disciplineTestRepository';
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.COURSES_VIEW);

    try {
        const query = getQuery(event);
        const disciplineId = query.discipline_id as string;

        console.log('[API discipline-tests] Запрос с discipline_id:', disciplineId);

        if (!disciplineId) {
            return {
                success: false,
                message: 'ID дисциплины обязателен',
                tests: [],
            };
        }

        const tests = await getDisciplineTests(disciplineId);

        console.log('[API discipline-tests] Найдено тестов:', tests.length, 'для discipline_id:', disciplineId);

        return {
            success: true,
            tests,
        };
    } catch (error) {
        console.error('Ошибка получения тестов дисциплины:', error);

        return {
            success: false,
            message: 'Ошибка при получении тестов дисциплины',
            tests: [],
        };
    }
});
