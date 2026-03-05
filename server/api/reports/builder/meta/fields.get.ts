import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import {
  ENTITY_GROUPS,
  TIME_SCALE_LABELS,
} from "../../../../utils/reports/fieldRegistry";

/**
 * GET /api/reports/builder/meta/fields
 * Возвращает полный реестр полей, сгруппированный по сущностям,
 * для построения левой панели конструктора отчётов.
 */
export default defineEventHandler(async (event) => {
  try {
    requireAuth(event);

    const result = ENTITY_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      icon: group.icon,
      fields: group.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        allowedAggregations: f.allowedAggregations,
        defaultAggregation: f.defaultAggregation,
        isDateField: f.isDateField || false,
        enumValues: f.enumValues || [],
      })),
    }));

    return {
      success: true,
      data: result,
      timeScales: TIME_SCALE_LABELS,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Error fetching meta fields:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при получении метаданных полей",
    });
  }
});
