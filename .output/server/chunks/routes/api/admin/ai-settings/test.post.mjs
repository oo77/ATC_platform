import { g as defineEventHandler, r as readBody, h as createError } from '../../../../_/nitro.mjs';
import { aiSettingsRepository } from '../../../../_/aiSettingsRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../../_/permissions.mjs';
import OpenAI from 'openai';
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

const test_post = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);
  console.log("[AI Settings API] POST test connection");
  try {
    const body = await readBody(event);
    let apiKey;
    let provider;
    let baseUrl;
    if (body.settingId) {
      const settings = await aiSettingsRepository.getById(body.settingId);
      if (!settings) {
        throw createError({
          statusCode: 404,
          message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        });
      }
      const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
        body.settingId
      );
      if (!decryptedKey) {
        throw createError({
          statusCode: 500,
          message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u0442\u044C API \u043A\u043B\u044E\u0447"
        });
      }
      apiKey = decryptedKey;
      provider = settings.provider;
      baseUrl = settings.baseUrl || void 0;
    } else if (body.apiKey) {
      apiKey = body.apiKey;
      provider = body.provider || "openrouter";
      baseUrl = body.baseUrl;
    } else {
      throw createError({
        statusCode: 400,
        message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 settingId \u0438\u043B\u0438 apiKey \u0434\u043B\u044F \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F"
      });
    }
    let clientBaseUrl = baseUrl;
    if (!clientBaseUrl) {
      switch (provider) {
        case "openrouter":
          clientBaseUrl = "https://openrouter.ai/api/v1";
          break;
        case "anthropic":
          clientBaseUrl = "https://api.anthropic.com/v1";
          break;
        case "openai":
        default:
          clientBaseUrl = void 0;
      }
    }
    const client = new OpenAI({
      apiKey,
      baseURL: clientBaseUrl,
      defaultHeaders: provider === "openrouter" ? {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "ATC Platform - AI Settings Test"
      } : void 0
    });
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: provider === "openrouter" ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Connection successful!' in one sentence."
        }
      ],
      max_tokens: 20
    });
    const duration = Date.now() - startTime;
    const message = response.choices[0]?.message?.content || "OK";
    console.log(`[AI Settings API] \u2705 Test successful in ${duration}ms`);
    return {
      success: true,
      data: {
        connected: true,
        responseTime: duration,
        message: message.trim(),
        model: response.model,
        tokensUsed: response.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error("[AI Settings API] Test failed:", error.message);
    let errorType = "unknown";
    let errorMessage = error.message;
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      errorType = "invalid_key";
      errorMessage = "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 API \u043A\u043B\u044E\u0447";
    } else if (error.message?.includes("402") || error.message?.includes("credits")) {
      errorType = "insufficient_credits";
      errorMessage = "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432 \u043D\u0430 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0435";
    } else if (error.message?.includes("429") || error.message?.includes("rate")) {
      errorType = "rate_limit";
      errorMessage = "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432";
    } else if (error.message?.includes("network") || error.message?.includes("ECONNREFUSED")) {
      errorType = "network";
      errorMessage = "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0442\u0438 \u043F\u0440\u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u043A API";
    }
    return {
      success: false,
      data: {
        connected: false,
        errorType,
        errorMessage,
        rawError: error.message
      }
    };
  }
});

export { test_post as default };
//# sourceMappingURL=test.post.mjs.map
