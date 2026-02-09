/**
 * GET /api/certificates/issue/[groupId]/instructors
 * Получить список инструкторов курса для выбора при выдаче сертификатов
 */

import { executeQuery } from "../../../../utils/db";
import { getGroupById } from "../../../../repositories/groupRepository";
import type { RowDataPacket } from "mysql2/promise";

interface InstructorRow extends RowDataPacket {
  id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  is_primary: boolean;
}

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, "groupId");

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: "ID группы обязателен",
      });
    }

    // Получаем группу
    const group = await getGroupById(groupId);

    if (!group) {
      throw createError({
        statusCode: 404,
        message: "Группа не найдена",
      });
    }

    if (!group.course?.id) {
      throw createError({
        statusCode: 400,
        message: "Курс не найден для группы",
      });
    }

    // Получаем всех инструкторов из учебной программы (discipline_instructors)
    const instructorRows = await executeQuery<InstructorRow[]>(
      `SELECT DISTINCT 
        i.id,
        i.full_name,
        i.position,
        i.email,
        CASE WHEN di.is_primary = 1 THEN true ELSE false END as is_primary
      FROM discipline_instructors di
      JOIN instructors i ON di.instructor_id = i.id
      JOIN disciplines d ON di.discipline_id = d.id
      WHERE d.course_id = ? AND i.is_active = true
      ORDER BY di.is_primary DESC, i.full_name`,
      [group.course.id],
    );

    // Преобразуем в нужный формат
    const instructors = instructorRows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      position: row.position,
      email: row.email,
      isPrimary: Boolean(row.is_primary),
    }));

    // Определяем дефолтного инструктора (первый основной или первый в списке)
    const defaultInstructorId =
      instructors.find((i) => i.isPrimary)?.id ||
      (instructors.length > 0 ? instructors[0].id : null);

    console.log(
      `[GET /api/certificates/issue/${groupId}/instructors] Найдено ${instructors.length} инструкторов, default: ${defaultInstructorId}`,
    );

    return {
      success: true,
      instructors,
      defaultInstructorId,
    };
  } catch (error: any) {
    console.error(
      "[GET /api/certificates/issue/[groupId]/instructors] Error:",
      error,
    );

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка загрузки инструкторов",
    });
  }
});
