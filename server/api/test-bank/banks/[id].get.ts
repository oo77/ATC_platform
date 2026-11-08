/**
 * API endpoint для получения банка вопросов по ID
 * GET /api/test-bank/banks/:id
 */

import {
  getQuestionBankById,
  getQuestionBankStats,
} from "../../../repositories/questionBankRepository";
import { Permission, requireAnyPermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.TEST_BANKS_VIEW, Permission.TEST_BANKS_MANAGE]);

  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return {
        success: false,
        message: "ID банка не указан",
      };
    }

    const bank = await getQuestionBankById(id);

    if (!bank) {
      return {
        success: false,
        message: "Банк вопросов не найден",
      };
    }

    const stats = await getQuestionBankStats(id);

    return {
      success: true,
      bank,
      stats,
    };
  } catch (error) {
    console.error("Ошибка получения банка вопросов:", error);

    return {
      success: false,
      message: "Ошибка при получении банка вопросов",
    };
  }
});
