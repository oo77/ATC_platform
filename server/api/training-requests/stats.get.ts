/**
 * GET /api/training-requests/stats
 * Аналитика по заявкам: по месяцам, по курсам, итоги по статусам
 */
import {
  getStatsByMonth,
  getStatsByCourse,
  getStatusTotals,
} from "../../repositories/trainingRequestRepository";
import { createActivityLog } from "../../repositories/activityLogRepository";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const year = query.year as string | undefined;

    console.log("[API] GET /api/training-requests/stats, year:", year);

    const [byMonth, byCourse, totals] = await Promise.all([
      getStatsByMonth(year),
      getStatsByCourse(),
      getStatusTotals(),
    ]);

    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "VIEW",
      entityType: "TRAINING_REQUEST",
      details: { action: "stats", year },
    });

    return {
      success: true,
      stats: {
        byMonth,
        byCourse,
        totals,
      },
    };
  } catch (error: any) {
    console.error("[API] Ошибка получения статистики заявок:", error);
    throw createError({ statusCode: 500, statusMessage: "Ошибка получения статистики" });
  }
});
