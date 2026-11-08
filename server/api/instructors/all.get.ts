/**
 * API endpoint для получения списка всех активных инструкторов (без пагинации)
 * GET /api/instructors/all
 */

import { getAllInstructors } from '../../repositories/instructorRepository';
import { Permission, requireAnyPermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  // Полные данные инструкторов (контакты, договоры) — только тем, кто управляет инструкторами/аттестацией
  await requireAnyPermission(event, [Permission.INSTRUCTORS_VIEW, Permission.ATTESTATION_MANAGE]);

  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== 'false'; // По умолчанию только активные

    const instructors = await getAllInstructors(activeOnly);

    return {
      success: true,
      instructors,
    };
  } catch (error) {
    console.error('Ошибка получения списка инструкторов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка инструкторов',
      instructors: [],
    };
  }
});
