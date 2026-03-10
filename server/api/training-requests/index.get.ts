/**
 * GET /api/training-requests
 * Список всех заявок с пагинацией и фильтрами (Admin/Moderator)
 */
import {
  getTrainingRequestsPaginated,
  type TrainingRequestFilters,
} from "../../repositories/trainingRequestRepository";
import { createActivityLog } from "../../repositories/activityLogRepository";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const filters: TrainingRequestFilters = {
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 20,
      status: query.status as any || undefined,
      organizationId: query.organizationId as string || undefined,
      representativeId: query.representativeId as string || undefined,
      courseId: query.courseId as string || undefined,
      month: query.month as string || undefined,
      year: query.year as string || undefined,
    };

    console.log("[API] GET /api/training-requests", filters);

    const result = await getTrainingRequestsPaginated(filters);

    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "VIEW",
      entityType: "TRAINING_REQUEST",
      details: {
        filters,
        resultCount: result.data.length,
        total: result.total,
      },
    });

    return { success: true, ...result };
  } catch (error: any) {
    console.error("[API] Ошибка получения заявок:", error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Ошибка получения заявок" });
  }
});
