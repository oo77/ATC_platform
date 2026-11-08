import { requirePermission, Permission } from "../../../../utils/permissions";
/**
 * API endpoint для получения статуса импорта
 * GET /api/students/import/status/:jobId
 */

import { defineEventHandler, getRouterParam } from 'h3';
import { getImportJobStatus } from '../../../../utils/importUtils';

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.STUDENTS_IMPORT);

  const jobId = getRouterParam(event, 'jobId');

  if (!jobId) {
    return {
      success: false,
      error: 'Job ID не указан',
    };
  }

  const status = getImportJobStatus(jobId);

  if (!status) {
    return {
      success: false,
      error: 'Задача импорта не найдена',
    };
  }

  return {
    success: true,
    status,
  };
});
