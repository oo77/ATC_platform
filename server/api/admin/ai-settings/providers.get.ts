/**
 * GET /api/admin/ai-settings/providers
 * Возвращает список поддерживаемых AI провайдеров с их описанием, дефолтными URL и пресетами
 */

import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { TOP_AI_PROVIDERS } from "../../../utils/ai/aiProvidersConfig";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  return {
    success: true,
    providers: TOP_AI_PROVIDERS,
  };
});
