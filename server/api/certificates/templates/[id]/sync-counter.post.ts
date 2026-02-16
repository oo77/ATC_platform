import { syncCertificateNumberCounter } from "../../../../repositories/certificateTemplateRepository";

/**
 * POST /api/certificates/templates/[id]/sync-counter
 * Синхронизировать счетчик номеров сертификатов с реальными данными
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  // Только администраторы могут синхронизировать счетчики
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message: "Доступ запрещен",
    });
  }

  const templateId = getRouterParam(event, "id");

  if (!templateId) {
    throw createError({
      statusCode: 400,
      message: "ID шаблона не указан",
    });
  }

  try {
    const result = await syncCertificateNumberCounter(templateId);

    console.log(
      `[POST /api/certificates/templates/${templateId}/sync-counter] ` +
        `Счетчик ${result.synced ? "обновлен" : "актуален"}: ${result.oldCounter} -> ${result.newCounter}`,
    );

    return {
      success: true,
      data: result,
      message: result.synced
        ? `Счетчик обновлен с ${result.oldCounter} на ${result.newCounter}`
        : `Счетчик актуален (${result.oldCounter})`,
    };
  } catch (error: any) {
    console.error(
      `[POST /api/certificates/templates/${templateId}/sync-counter] Ошибка:`,
      error,
    );

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка синхронизации счетчика",
    });
  }
});
