/**
 * GET /api/ai/chat/models
 * Возвращает список реально настроенных AI-провайдеров и их доступных моделей для селектора чата
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { TOP_AI_PROVIDERS } from "../../../utils/ai/aiProvidersConfig";

export interface ConfiguredModelItem {
  id: string;
  name: string;
  icon: string;
  tag: string;
  isConfigured: boolean;
}

export interface ConfiguredProviderGroup {
  settingId: string;
  provider: string;
  providerName: string;
  name: string;
  isDefault: boolean;
  models: ConfiguredModelItem[];
}

function formatModelMeta(modelId: string, isConfigured: boolean): { name: string; icon: string; tag: string } {
  let name = modelId;
  let icon = "⚡";
  let tag = isConfigured ? "Настроена" : "Пресет";

  const lower = modelId.toLowerCase();

  if (lower.includes("r1") || lower.includes("o1") || lower.includes("o3") || lower.includes("reason")) {
    icon = "🧠";
    if (!isConfigured) tag = "Рассуждения";
  } else if (lower.includes("flash") || lower.includes("mini") || lower.includes("instant") || lower.includes("haiku")) {
    icon = "⚡";
    if (!isConfigured) tag = "Быстрая";
  } else if (lower.includes("sonnet") || lower.includes("pro") || lower.includes("opus") || lower.includes("large")) {
    icon = "🔮";
    if (!isConfigured) tag = "Продвинутая";
  } else if (lower.includes("deepseek")) {
    icon = "🚀";
  } else if (lower.includes("llama")) {
    icon = "🦙";
  }

  // Человекочитаемые названия популярных моделей
  if (lower === "deepseek-chat") name = "DeepSeek-V3";
  else if (lower === "deepseek-reasoner") name = "DeepSeek-R1 (Reasoner)";
  else if (lower === "gpt-4o-mini") name = "GPT-4o mini";
  else if (lower === "gpt-4o") name = "GPT-4o";
  else if (lower === "o3-mini") name = "o3-mini (Reasoning)";
  else if (lower === "o1") name = "o1 (High Reasoning)";
  else if (lower.includes("claude-3-5-sonnet")) name = "Claude 3.5 Sonnet";
  else if (lower.includes("claude-3-5-haiku")) name = "Claude 3.5 Haiku";
  else if (lower.includes("gemini-2.0-flash")) name = "Gemini 2.0 Flash";
  else if (lower.includes("gemini-1.5-pro")) name = "Gemini 1.5 Pro";
  else if (lower.includes("gemini-1.5-flash")) name = "Gemini 1.5 Flash";
  else if (lower.includes("llama-3.3-70b")) name = "Llama 3.3 70B";
  else if (lower.includes("llama-3.1-8b")) name = "Llama 3.1 8B";

  return { name, icon, tag };
}

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: "Требуется авторизация",
    });
  }

  try {
    const allSettings = await aiSettingsRepository.getAll();
    const activeSettings = allSettings.filter((s) => s.isActive);

    // Если настроенных провайдеров нет в БД, fallback на безопасные системные пресеты
    if (!activeSettings.length) {
      const fallbackModels: ConfiguredModelItem[] = [
        { id: "gpt-4o-mini", name: "GPT-4o mini", icon: "⚡", tag: "Системная", isConfigured: true },
        { id: "gpt-4o", name: "GPT-4o", icon: "🧠", tag: "Продвинутая", isConfigured: false },
      ];

      return {
        success: true,
        data: {
          hasConfiguredProviders: false,
          defaultSettingId: null,
          defaultModel: "gpt-4o-mini",
          providers: [
            {
              settingId: "env_default",
              provider: "openai",
              providerName: "Системный (По умолчанию)",
              name: "Системный шлюз",
              isDefault: true,
              models: fallbackModels,
            },
          ],
        },
      };
    }

    const providerGroups: ConfiguredProviderGroup[] = [];

    for (const s of activeSettings) {
      const providerDef = TOP_AI_PROVIDERS.find((p) => p.id === s.provider);
      const providerName = providerDef?.name || s.provider.toUpperCase();
      const displayName = s.apiKeyName?.trim() || `${providerName} (${s.apiKeyLastFour ? `...${s.apiKeyLastFour}` : 'Активен'})`;

      const seenModels = new Set<string>();
      const modelsList: ConfiguredModelItem[] = [];

      // 1. Приоритетно добавляем модель, выбранную в настройках подключения
      if (s.textModel) {
        const trimmed = s.textModel.trim();
        seenModels.add(trimmed);
        const meta = formatModelMeta(trimmed, true);
        modelsList.push({
          id: trimmed,
          name: meta.name,
          icon: meta.icon,
          tag: meta.tag,
          isConfigured: true,
        });
      }

      // 2. Добавляем доступные пресетные текстовые модели провайдера
      if (providerDef?.presetTextModels) {
        for (const preset of providerDef.presetTextModels) {
          if (!seenModels.has(preset)) {
            seenModels.add(preset);
            const meta = formatModelMeta(preset, false);
            modelsList.push({
              id: preset,
              name: meta.name,
              icon: meta.icon,
              tag: meta.tag,
              isConfigured: false,
            });
          }
        }
      }

      providerGroups.push({
        settingId: s.id,
        provider: s.provider,
        providerName,
        name: displayName,
        isDefault: Boolean(s.isDefault),
        models: modelsList,
      });
    }

    // Определяем дефолтную группу и модель
    const defaultGroup = providerGroups.find((g) => g.isDefault) || providerGroups[0];
    const defaultModel = defaultGroup.models[0]?.id || "gpt-4o-mini";

    return {
      success: true,
      data: {
        hasConfiguredProviders: true,
        defaultSettingId: defaultGroup.settingId,
        defaultModel,
        providers: providerGroups,
      },
    };
  } catch (error: any) {
    console.error("[Chat Models API] Ошибка получения моделей:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения списка доступных моделей",
    });
  }
});
