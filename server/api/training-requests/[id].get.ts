/**
 * GET /api/training-requests/:id
 * Детали заявки с позициями и списками слушателей (Admin)
 */
import { getTrainingRequestById } from "../../repositories/trainingRequestRepository";
import { executeQuery } from "../../utils/db";
import { createActivityLog } from "../../repositories/activityLogRepository";
import type { RowDataPacket } from "mysql2/promise";

interface StudentRow extends RowDataPacket {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
}

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID заявки не указан" });
    }

    console.log(`[API] GET /api/training-requests/${id}`);

    const request = await getTrainingRequestById(id);

    if (!request) {
      throw createError({ statusCode: 404, statusMessage: "Заявка не найдена" });
    }

    // Обогащаем каждую позицию данными о студентах
    const enrichedItems = await Promise.all(
      (request.items || []).map(async (item) => {
        if (!item.studentIds || item.studentIds.length === 0) {
          return { ...item, students: [] };
        }

        // Получаем данные студентов из БД (по их UUID)
        const placeholders = item.studentIds.map(() => "?").join(", ");
        const students = await executeQuery<StudentRow[]>(
          `SELECT id, full_name, position, department
           FROM students
           WHERE id IN (${placeholders})
           ORDER BY full_name ASC`,
          item.studentIds,
        );

        return {
          ...item,
          students: students.map((s) => ({
            id: s.id,
            fullName: s.full_name,
            position: s.position || null,
            department: s.department || null,
          })),
        };
      }),
    );

    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "VIEW",
      entityType: "TRAINING_REQUEST",
      entityId: id,
    });

    return {
      success: true,
      data: {
        ...request,
        items: enrichedItems,
      },
    };
  } catch (error: any) {
    console.error("[API] Ошибка получения заявки:", error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Ошибка получения заявки" });
  }
});
