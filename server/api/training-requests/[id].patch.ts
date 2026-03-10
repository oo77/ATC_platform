/**
 * PATCH /api/training-requests/:id
 * Обновление статусов заявки (Admin/Moderator)
 *
 * Body (все поля опциональны):
 * {
 *   status?: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed',
 *   contractStatus?: 'not_signed' | 'signed',
 *   paymentStatus?: 'not_paid' | 'paid',
 *   adminComment?: string
 * }
 */
import {
  updateTrainingRequest,
  type UpdateTrainingRequestInput,
} from "../../repositories/trainingRequestRepository";
import { createActivityLog } from "../../repositories/activityLogRepository";

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID заявки не указан" });
    }

    const body = await readBody<UpdateTrainingRequestInput>(event);

    if (!body || Object.keys(body).length === 0) {
      throw createError({ statusCode: 400, statusMessage: "Нет данных для обновления" });
    }

    // Валидация статусов
    const validStatuses = ["pending", "approved", "rejected", "in_progress", "completed"];
    if (body.status && !validStatuses.includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: "Недопустимый статус заявки" });
    }
    if (body.contractStatus && !["not_signed", "signed"].includes(body.contractStatus)) {
      throw createError({ statusCode: 400, statusMessage: "Недопустимый статус договора" });
    }
    if (body.paymentStatus && !["not_paid", "paid"].includes(body.paymentStatus)) {
      throw createError({ statusCode: 400, statusMessage: "Недопустимый статус оплаты" });
    }

    const userId = event.context.user?.id || "system";

    console.log(`[API] PATCH /api/training-requests/${id}`, body);

    const updated = await updateTrainingRequest(id, body, userId);

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: "Заявка не найдена" });
    }

    await createActivityLog({
      userId,
      actionType: "UPDATE",
      entityType: "TRAINING_REQUEST",
      entityId: id,
      details: { changes: body },
    });

    return {
      success: true,
      data: updated,
      message: "Заявка обновлена",
    };
  } catch (error: any) {
    console.error("[API] Ошибка обновления заявки:", error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Ошибка обновления заявки" });
  }
});
