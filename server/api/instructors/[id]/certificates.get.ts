/**
 * Сертификаты, выданные инструктору по итогам аттестации
 * GET /api/instructors/:id/certificates
 */

import { getInstructorCertificates } from "../../../repositories/certificateTemplateRepository";
import { getInstructorById } from "../../../repositories/instructorRepository";
import { UserRole } from "../../../types/auth";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const authUser = event.context.user;
    if (!id) return { success: false, message: "ID инструктора не указан" };

    const instructor = await getInstructorById(id);
    if (!instructor) return { success: false, message: "Инструктор не найден" };

    if (authUser && authUser.role === UserRole.TEACHER && instructor.userId !== authUser.id) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden", message: "Нет доступа" });
    }

    const certificates = await getInstructorCertificates(id);
    return { success: true, certificates };
  } catch (error) {
    console.error("Ошибка получения сертификатов инструктора:", error);
    return { success: false, message: "Ошибка при получении сертификатов", certificates: [] };
  }
});
