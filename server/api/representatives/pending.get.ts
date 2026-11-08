import { defineEventHandler } from 'h3';
import { getPendingRepresentatives } from '../../repositories/representativeRepository';
import { Permission, requirePermission } from "../../utils/permissions";

/**
 * GET /api/representatives/pending
 * Получение списка представителей, ожидающих одобрения
 */
export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.REPRESENTATIVES_VIEW);

  try {
    const pending = await getPendingRepresentatives();

    return {
      success: true,
      data: pending,
      count: pending.length,
    };
  } catch (error) {
    console.error('Error fetching pending representatives:', error);
    return {
      success: false,
      data: [],
      count: 0,
    };
  }
});
