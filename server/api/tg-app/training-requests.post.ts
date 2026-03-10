/**
 * POST /api/tg-app/training-requests
 * Подача новой заявки на обучение от представителя
 *
 * Body:
 * {
 *   representativeId: string,
 *   organizationId: string,
 *   items: Array<{
 *     courseId: string,
 *     courseName: string,
 *     trainingMonth: string,   // 'YYYY-MM'
 *     studentIds: string[],
 *     groupLabel?: string
 *   }>
 * }
 */
import {
  createTrainingRequest,
  type CreateTrainingRequestInput,
} from "../../repositories/trainingRequestRepository";
import { createActivityLog } from "../../repositories/activityLogRepository";

export default defineEventHandler(async (event) => {
  try {
    console.log("[TG-App] POST /api/tg-app/training-requests");

    const body = await readBody<CreateTrainingRequestInput & { representativeName?: string }>(event);

    // --- Валидация ---
    if (!body?.representativeId) {
      throw createError({ statusCode: 400, message: "representativeId обязателен" });
    }
    if (!body?.organizationId) {
      throw createError({ statusCode: 400, message: "organizationId обязателен" });
    }
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: "Необходимо добавить хотя бы одну позицию" });
    }

    // Валидация каждой позиции
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      const prefix = `Позиция ${i + 1}`;

      if (!item.courseId) {
        throw createError({ statusCode: 400, message: `${prefix}: не указан курс` });
      }
      if (!item.courseName) {
        throw createError({ statusCode: 400, message: `${prefix}: не указано название курса` });
      }
      if (!item.trainingMonth || !/^\d{4}-\d{2}$/.test(item.trainingMonth)) {
        throw createError({
          statusCode: 400,
          message: `${prefix}: неверный формат месяца (ожидается YYYY-MM)`,
        });
      }
      if (!item.studentIds || !Array.isArray(item.studentIds) || item.studentIds.length === 0) {
        throw createError({
          statusCode: 400,
          message: `${prefix}: необходимо выбрать хотя бы одного сотрудника`,
        });
      }
    }

    // --- Создание ---
    const request = await createTrainingRequest({
      representativeId: body.representativeId,
      organizationId: body.organizationId,
      items: body.items.map((item, idx) => ({
        courseId: item.courseId,
        courseName: item.courseName,
        trainingMonth: item.trainingMonth,
        studentIds: item.studentIds,
        groupLabel: item.groupLabel || undefined,
        sortOrder: idx,
      })),
    });

    // Логирование
    await createActivityLog({
      userId: body.representativeId,
      actionType: "CREATE",
      entityType: "TRAINING_REQUEST",
      entityId: request.id,
      details: {
        organizationId: body.organizationId,
        itemsCount: body.items.length,
        totalStudents: request.totalStudentsCount,
      },
    });

    console.log(
      `[TG-App] ✅ Заявка создана: ${request.id}, позиций: ${request.totalItemsCount}, слушателей: ${request.totalStudentsCount}`,
    );

    return {
      success: true,
      request: {
        id: request.id,
        status: request.status,
        totalItemsCount: request.totalItemsCount,
        totalStudentsCount: request.totalStudentsCount,
        createdAt: request.createdAt,
      },
      message: "Заявка успешно отправлена",
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка создания заявки:", error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message: "Внутренняя ошибка сервера" });
  }
});
