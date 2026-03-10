/**
 * GET /api/tg-app/training-requests
 * Список заявок представителя
 */
import {
  getRequestsByRepresentative,
} from "../../repositories/trainingRequestRepository";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const initData = getHeader(event, "x-init-data") || (query.initData as string);
    const representativeId = query.representativeId as string;

    console.log("[TG-App] GET /api/tg-app/training-requests");

    if (!representativeId) {
      throw createError({ statusCode: 400, message: "representativeId обязателен" });
    }

    const requests = await getRequestsByRepresentative(representativeId);

    console.log(
      `[TG-App] Заявки представителя ${representativeId}: ${requests.length} шт.`,
    );

    // Формируем ответ — без лишних данных
    const formatted = requests.map((r) => ({
      id: r.id,
      status: r.status,
      contractStatus: r.contractStatus,
      paymentStatus: r.paymentStatus,
      adminComment: r.adminComment,
      totalItemsCount: r.totalItemsCount,
      totalStudentsCount: r.totalStudentsCount,
      createdAt: r.createdAt,
      items: (r.items || []).map((item) => ({
        id: item.id,
        courseId: item.courseId,
        courseName: item.courseName,
        trainingMonth: item.trainingMonth,
        studentsCount: item.studentsCount,
        groupLabel: item.groupLabel,
      })),
    }));

    return { success: true, requests: formatted, total: formatted.length };
  } catch (error: any) {
    console.error("[TG-App] Ошибка получения заявок:", error);
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message: "Внутренняя ошибка сервера" });
  }
});
