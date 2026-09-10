/**
 * POST /api/admin/ai-settings/test
 * Тестировать подключение AI API
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  console.log("[AI Settings API] POST test connection");

  try {
    const body = await readBody<{
      settingId?: string;
      apiKey?: string;
      provider?: string;
      baseUrl?: string;
      model?: string;
    }>(event);

    let apiKey: string;
    let provider: string;
    let baseUrl: string | undefined;
    let modelToUse: string | undefined = body.model;

    if (body.settingId) {
      // Тестируем существующие настройки
      const setting = await aiSettingsRepository.getById(body.settingId);
      if (!setting) {
        throw createError({
          statusCode: 404,
          message: "Настройка не найдена",
        });
      }
      const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
        body.settingId,
      );
      if (!decryptedKey) {
        throw createError({
          statusCode: 500,
          message: "Не удалось расшифровать API ключ",
        });
      }
      apiKey = decryptedKey;
      provider = setting.provider;
      baseUrl = setting.baseUrl || undefined;
      if (!modelToUse) {
        modelToUse = setting.textModel;
      }
    } else if (body.apiKey) {
      // Тестируем новый ключ
      apiKey = body.apiKey;
      provider = body.provider || "openrouter";
      baseUrl = body.baseUrl;
    } else {
      throw createError({
        statusCode: 400,
        message: "Укажите settingId или apiKey для тестирования",
      });
    }

    // Определяем baseURL и тестовую модель в зависимости от провайдера
    const { resolveBaseUrl, getProviderDefinition } = await import("../../../utils/ai/aiProvidersConfig");
    const def = getProviderDefinition(provider);
    const clientBaseUrl = resolveBaseUrl(provider, baseUrl);
    const testModel = modelToUse || def.testModel;

    // Создаем клиента
    const client = new OpenAI({
      apiKey,
      baseURL: clientBaseUrl,
      defaultHeaders:
        provider === "openrouter"
          ? {
              "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
              "X-Title": "ATC Platform - AI Settings Test",
            }
          : undefined,
    });

    const startTime = Date.now();

    // Делаем простой запрос для проверки
    const response = await client.chat.completions.create({
      model: testModel,
      messages: [
        {
          role: "user",
          content: "Say 'Connection successful!' in one sentence.",
        },
      ],
      max_tokens: 30,
    });

    const duration = Date.now() - startTime;
    const message = response.choices[0]?.message?.content || "OK";

    console.log(`[AI Settings API] ✅ Test successful in ${duration}ms`);

    return {
      success: true,
      data: {
        connected: true,
        responseTime: duration,
        message: message.trim(),
        model: response.model,
        tokensUsed: response.usage?.total_tokens || 0,
      },
    };
  } catch (error: any) {
    console.error("[AI Settings API] Test failed:", error.message);

    // Парсим ошибку для понятного сообщения
    let errorType = "unknown";
    let errorMessage = error.message;

    if (
      error.message?.includes("401") ||
      error.message?.includes("Unauthorized")
    ) {
      errorType = "invalid_key";
      errorMessage = "Неверный API ключ";
    } else if (
      error.message?.includes("402") ||
      error.message?.includes("credits")
    ) {
      errorType = "insufficient_credits";
      errorMessage = "Недостаточно кредитов на аккаунте";
    } else if (
      error.message?.includes("429") ||
      error.message?.includes("rate")
    ) {
      errorType = "rate_limit";
      errorMessage = "Превышен лимит запросов";
    } else if (
      error.message?.includes("guardrail restrictions")
    ) {
      errorType = "model_error";
      errorMessage = "Настройки приватности OpenRouter блокируют эту модель (отключен Data Retention)";
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      errorType = "network";
      errorMessage = "Ошибка сети при подключении к API";
    }

    return {
      success: false,
      data: {
        connected: false,
        errorType,
        errorMessage,
        rawError: error.message,
      },
    };
  }
});
