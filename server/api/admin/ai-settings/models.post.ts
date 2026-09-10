/**
 * POST /api/admin/ai-settings/models
 * Загружает все доступные модели по API ключу провайдера с разделением на Vision и Text
 */

import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { fetchProviderModels } from "../../../utils/ai/aiProvidersConfig";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  const body = await readBody<{
    provider: string;
    apiKey?: string;
    baseUrl?: string;
    settingId?: string;
  }>(event);

  if (!body.provider) {
    throw createError({
      statusCode: 400,
      message: "Укажите провайдера",
    });
  }

  let apiKey = body.apiKey || "";

  // Если ключ не передан напрямую, но передан settingId, читаем и расшифровываем из базы
  if (!apiKey && body.settingId) {
    const decrypted = await aiSettingsRepository.getDecryptedApiKey(body.settingId).catch(() => null);
    if (decrypted) {
      apiKey = decrypted;
    }
  }

  const result = await fetchProviderModels({
    provider: body.provider,
    apiKey,
    baseUrl: body.baseUrl,
  });

  return {
    ...result,
    data: result,
  };
});
