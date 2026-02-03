/**
 * GET /api/admin/ai-settings/usage
 * Получить историю использования токенов
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  console.log("[AI Settings API] GET usage history");

  try {
    const query = getQuery(event);
    const settingId = query.settingId as string | undefined;
    const days = parseInt(query.days as string) || 30;
    const limit = parseInt(query.limit as string) || 100;

    const usage = await aiSettingsRepository.getUsageHistory(
      settingId,
      days,
      limit,
    );

    // Группировка по дням для графика
    const usageByDay: Record<
      string,
      { tokens: number; cost: number; count: number }
    > = {};
    usage.forEach((log) => {
      const date = new Date(log.createdAt).toISOString().split("T")[0];
      if (!usageByDay[date]) {
        usageByDay[date] = { tokens: 0, cost: 0, count: 0 };
      }
      usageByDay[date].tokens += log.totalTokens;
      usageByDay[date].cost += log.costUsd;
      usageByDay[date].count += 1;
    });

    return {
      success: true,
      data: {
        logs: usage,
        usageByDay: Object.entries(usageByDay)
          .map(([date, data]) => ({
            date,
            ...data,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения истории использования AI",
    });
  }
});
