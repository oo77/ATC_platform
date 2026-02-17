import { g as defineEventHandler, i as getQuery, h as createError } from '../../../../_/nitro.mjs';
import { aiSettingsRepository } from '../../../../_/aiSettingsRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../../_/permissions.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const usage_get = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);
  console.log("[AI Settings API] GET usage history");
  try {
    const query = getQuery(event);
    const settingId = query.settingId;
    const days = parseInt(query.days) || 30;
    const limit = parseInt(query.limit) || 100;
    const usage = await aiSettingsRepository.getUsageHistory(
      settingId,
      days,
      limit
    );
    const usageByDay = {};
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
        usageByDay: Object.entries(usageByDay).map(([date, data]) => ({
          date,
          ...data
        })).sort((a, b) => a.date.localeCompare(b.date))
      }
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F AI"
    });
  }
});

export { usage_get as default };
//# sourceMappingURL=usage.get.mjs.map
