/**
 * Завершить аттестационный тест
 * POST /api/attestation/sessions/:id/finish
 */

import { requireAttestationSessionAccess } from "../../../../utils/resourceAccess";
import { completeAttestationSession } from "../../../../utils/examCompletion";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAttestationSessionAccess(event, getRouterParam(event, "id") || "", "owner");

  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID сессии не указан" };

    // Атомарно: повторный вызов или автозавершение по времени не задвоят результат
    const outcome = await completeAttestationSession(id);
    if (!outcome) return { success: false, message: "Невозможно завершить тест в текущем статусе" };

    if (!outcome.completedNow) {
      return { success: true, message: "Тест уже завершён", results: outcome.results };
    }

    return {
      success: true,
      message: outcome.results.passed ? "Тест успешно сдан!" : "Тест завершён",
      results: outcome.results,
    };
  } catch (error) {
    console.error("Ошибка завершения аттестационного теста:", error);
    return { success: false, message: "Ошибка при завершении теста" };
  }
});
