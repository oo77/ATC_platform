/**
 * API endpoint для получения списка шаблонов сертификатов
 * GET /api/courses/templates
 */

import { getAllCertificateTemplates } from '../../repositories/courseRepository';
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.COURSES_VIEW);

  try {
    const templates = await getAllCertificateTemplates();

    return {
      success: true,
      templates,
    };
  } catch (error) {
    console.error('Ошибка получения шаблонов сертификатов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении шаблонов сертификатов',
      templates: [],
    };
  }
});
