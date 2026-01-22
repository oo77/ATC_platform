/**
 * API для логирования скачивания отчётов
 * POST /api/reports/log-download
 */

import { H3Event } from "h3";
import { logActivity } from "../../utils/activityLogger";

export default defineEventHandler(async (event: H3Event) => {
  // Проверяем авторизацию
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  const body = await readBody(event);

  const { reportType, format, groupCode, groupId, disciplineName } = body;

  if (!reportType || !format) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Не указан тип отчёта или формат",
    });
  }

  // Формируем описание
  const reportNames: Record<string, string> = {
    empty_journal: "Пустой журнал",
    group_report: "Зачётная ведомость",
    certificate_report: "Ведомость выдачи сертификатов",
  };

  const reportName = reportNames[reportType] || reportType;
  const entityName = `${reportName} (${format.toUpperCase()})`;

  // Логируем действие
  await logActivity(
    event,
    "DOWNLOAD",
    "GROUP_REPORT",
    groupId || undefined,
    entityName,
    {
      reportType,
      format,
      groupCode,
      disciplineName,
      downloadedAt: new Date().toISOString(),
    },
  );

  return {
    success: true,
    message: "Действие записано в журнал",
  };
});
