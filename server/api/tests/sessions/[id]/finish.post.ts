/**
 * API endpoint для завершения теста
 * POST /api/tests/sessions/:id/finish
 */

import { requireTestSessionAccess } from "../../../../utils/resourceAccess";
import { completeTestSession } from "../../../../utils/examCompletion";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireTestSessionAccess(event, getRouterParam(event, "id") || "", "owner");

    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID сессии не указан',
            };
        }

        // Подсчёт, завершение и запись оценки в журнал (атомарно: повторный
        // вызов или автозавершение по времени не задвоят результат)
        const outcome = await completeTestSession(id);

        if (!outcome) {
            return {
                success: false,
                message: 'Невозможно завершить тест в текущем статусе',
            };
        }

        if (!outcome.completedNow) {
            return {
                success: true,
                message: 'Тест уже завершён',
                results: outcome.results,
            };
        }

        return {
            success: true,
            message: outcome.results.passed ? 'Тест успешно сдан!' : 'Тест завершён',
            results: outcome.results,
        };
    } catch (error) {
        console.error('Ошибка завершения теста:', error);

        return {
            success: false,
            message: 'Ошибка при завершении теста',
        };
    }
});
