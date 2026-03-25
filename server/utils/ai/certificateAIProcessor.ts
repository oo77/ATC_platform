/**
 * Утилита для обработки сертификатов с помощью OpenAI GPT-4 Vision / Текстовой модели
 *
 * Рефакторинг (Senior):
 * 1. Убрано жесткое требование к изображениям для PDF
 * 2. Добавлен метод обработки на основе текста (для PDF без canvas)
 * 3. Оптимизация под GPT-4o и GPT-4o-mini (они отлично понимают текст без Vision)
 */

import OpenAI from "openai";
import type {
  ExtractedCertificateData,
  TokenUsage,
} from "../../types/aiCertificateImport";

export class CertificateAIProcessor {
  private static client: OpenAI | null = null;
  private static currentSettingId: string | null = null;
  private static currentConfig: {
    maxTokens: number;
    temperature: number;
    visionModel: string;
    textModel: string;
  } | null = null;

  private static async getAIConfig() {
    try {
      const { aiSettingsRepository } =
        await import("../../repositories/aiSettingsRepository");
      const dbSettings = await aiSettingsRepository.getDefault();
      if (dbSettings) {
        const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
          dbSettings.id,
        );
        if (decryptedKey) {
          return {
            apiKey: decryptedKey,
            provider: dbSettings.provider,
            baseUrl: dbSettings.baseUrl,
            visionModel: dbSettings.visionModel,
            textModel: dbSettings.textModel,
            maxTokens: dbSettings.maxTokens,
            temperature: dbSettings.temperature,
            settingId: dbSettings.id,
          };
        }
      }
    } catch (error) {
      console.log("⚠️ AI Settings из БД недоступны, используем .env");
    }

    return {
      apiKey: process.env.OPENAI_API_KEY || "",
      provider: process.env.USE_OPENROUTER === "true" ? "openrouter" : "openai",
      baseUrl:
        process.env.USE_OPENROUTER === "true"
          ? "https://openrouter.ai/api/v1"
          : null,
      visionModel: process.env.OPENAI_VISION_MODEL || "openai/gpt-4o",
      textModel: process.env.OPENAI_TEXT_MODEL || "openai/gpt-4o-mini", // GPT-4o-mini быстр и дешев для текста
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1500"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.1"),
      settingId: null,
    };
  }

  private static async initAPIAsync(): Promise<OpenAI> {
    const config = await this.getAIConfig();
    this.currentSettingId = config.settingId;
    this.currentConfig = {
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      visionModel: config.visionModel,
      textModel: config.textModel,
    };

    // Определяем baseURL: используем из настроек, или автоматически по провайдеру
    let resolvedBaseUrl = config.baseUrl || undefined;
    if (!resolvedBaseUrl) {
      if (config.provider === "openrouter") {
        resolvedBaseUrl = "https://openrouter.ai/api/v1";
      } else if (config.provider === "anthropic") {
        resolvedBaseUrl = "https://api.anthropic.com/v1";
      }
    }

    // Для OpenRouter обязательны доп. заголовки
    const defaultHeaders: Record<string, string> | undefined =
      config.provider === "openrouter"
        ? {
            "HTTP-Referer":
              process.env.SITE_URL || "http://localhost:3000",
            "X-Title": "ATC Platform - Certificate AI",
          }
        : undefined;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: resolvedBaseUrl,
      defaultHeaders,
    });
    return this.client;
  }

  /**
   * Общий метод обработки сертификата (из изображения или текста)
   */
  static async processCertificate(
    fileBuffer: Buffer | null,
    mimeType: string,
    filename: string,
    rawText?: string,
  ): Promise<{
    extractedData: ExtractedCertificateData;
    tokensUsed: TokenUsage;
    processingTime: number;
  }> {
    const startTime = Date.now();
    console.log(`🔍 Обработка ${filename} (${mimeType})...`);

    try {
      if (mimeType === "application/pdf" && rawText) {
        console.log("📄 Обработка PDF через текстовое извлечение...");
        const result = await this.analyzeTextContent(rawText);
        return { ...result, processingTime: Date.now() - startTime };
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error(
          "Пустой буфер файла (невозможно обработать через Vision)",
        );
      }

      console.log("🖼️ Обработка через Vision...");
      const base64Image = fileBuffer.toString("base64");
      const imageType = mimeType.includes("png") ? "image/png" : "image/jpeg";
      const result = await this.analyzeImageWithVision(base64Image, imageType);

      return { ...result, processingTime: Date.now() - startTime };
    } catch (error: any) {
      console.error("❌ Ошибка в CertificateAIProcessor:", error);
      throw error;
    }
  }

  /**
   * Анализ текста сертификата (без Vision)
   */
  private static async analyzeTextContent(text: string): Promise<{
    extractedData: ExtractedCertificateData;
    tokensUsed: TokenUsage;
  }> {
    const client = await this.initAPIAsync();
    const model = this.currentConfig?.textModel || "openai/gpt-4o-mini";

    const systemPrompt = this.getSystemPrompt();

    try {
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Ниже представлен текст извлеченный из файла сертификата. Твое задание - распознать данные:\n\n${text}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: this.currentConfig?.maxTokens,
        temperature: this.currentConfig?.temperature,
      });

      return this.parseAIResponse(completion);
    } catch (error: any) {
      this.handleAIError(error, model, "text");
      throw error;
    }
  }

  /**
   * Централизованная обработка ошибок AI
   */
  private static handleAIError(
    error: any,
    model: string,
    type: "vision" | "text",
  ) {
    let message = error.message || String(error);

    // Специфическая ошибка OpenRouter про Guardrails
    if (
      message.includes("No endpoints available matching your guardrail restrictions")
    ) {
      console.error(
        "⚠️ ОШИБКА OPENROUTER (ПРИВАТНОСТЬ): Используемая модель (бесплатная) требует разрешения на хранение данных (Data Retention).",
      );
      console.error(
        "👉 РЕШЕНИЕ: Измените настройки приватности на https://openrouter.ai/settings/privacy (включите Data Retention) или выберите платную модель (например, openai/gpt-4o-mini).",
      );
      error.message = `OpenRouter Guardrail Error: Модель ${model} недоступна с текущими настройками приватности. Включите 'Data Retention' в профиле OpenRouter или смените модель на платную.`;
    } else if (error.status === 429 || message.includes("429")) {
      console.error(
        "⚠️ ОШИБКА 429 (RATE LIMIT): Превышен лимит запросов к AI или провайдер перегружен.",
      );
      if (model.includes("free")) {
        console.error(
          "👉 РЕШЕНИЕ: Бесплатные модели имеют жесткие лимиты. Загружайте меньше файлов за раз или используйте платную, но дешевую модель (например, openai/gpt-4o-mini).",
        );
      }
      error.message = `Ошибка 429: Слишком много запросов или сервер ${model} перегружен. Подождите пару минут или смените модель.`;
    }

    // Логируем ошибку в БД через репозиторий, если он доступен
    this.logErrorToDb(error, model, type).catch((e) =>
      console.error("Не удалось записать ошибку AI в БД:", e.message),
    );
  }

  private static async logErrorToDb(
    error: any,
    model: string,
    type: "vision" | "text",
  ) {
    try {
      const { aiSettingsRepository } = await import(
        "../../repositories/aiSettingsRepository"
      );
      await aiSettingsRepository.logApiError({
        settingId: this.currentSettingId || undefined,
        errorCode: error.status ? String(error.status) : "AI_ERROR",
        errorType: "model_error",
        errorMessage: error.message,
        model: model,
        requestPayload: { type },
      });
    } catch (e) {
      // Игнорируем ошибки логирования
    }
  }

  /**
   * Анализ изображения через Vision
   */
  private static async analyzeImageWithVision(
    base64Image: string,
    imageType: string,
  ): Promise<{
    extractedData: ExtractedCertificateData;
    tokensUsed: TokenUsage;
  }> {
    const client = await this.initAPIAsync();
    const model = this.currentConfig?.visionModel || "openai/gpt-4o";

    const systemPrompt = this.getSystemPrompt();

    try {
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageType};base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: this.currentConfig?.maxTokens,
        temperature: this.currentConfig?.temperature,
      });

      return this.parseAIResponse(completion);
    } catch (error: any) {
      this.handleAIError(error, model, "vision");
      throw error;
    }
  }

  private static getSystemPrompt() {
    return `Ты эксперт по анализу сертификатов. Твоя задача - извлечь из данных следующую информацию в JSON:
{
  "fullName": "ФИО",
  "certificateNumber": "номер",
  "issueDate": "YYYY-MM-DD",
  "organization": "кто выдал",
  "courseName": "курс",
  "expiryDate": "YYYY-MM-DD",
  "courseHours": 72,
  "confidence": 0.95,
  "rawText": "краткое описание"
}
ВАЖНО: Даты YYYY-MM-DD. Если поля нет - оставь пустым. Уверенность 0-1.`;
  }

  private static parseAIResponse(completion: any) {
    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("❌ Неожиданный ответ от API:", JSON.stringify(completion));
      throw new Error("Неверный формат ответа от AI провайдера: отсутствует свойство choices");
    }

    let responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error("Пустой ответ от AI провайдера");
    }

    // Удаляем markdown обертку, если модель (например, Puter) вернула текст с ```json ... ```
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    
    // Доп. очистка: уберут лишние пустые строки с концов
    responseText = responseText.trim();

    const tokensUsed: TokenUsage = {
      prompt: completion.usage?.prompt_tokens || 0,
      completion: completion.usage?.completion_tokens || 0,
      total: completion.usage?.total_tokens || 0,
    };

    try {
      const extractedData = JSON.parse(responseText);
      return {
        extractedData: {
          fullName: extractedData.fullName || "",
          certificateNumber: extractedData.certificateNumber || "",
          issueDate: extractedData.issueDate || "",
          expiryDate: extractedData.expiryDate,
          organization: extractedData.organization || "",
          courseName: extractedData.courseName || "",
          courseHours: extractedData.courseHours
            ? parseInt(extractedData.courseHours)
            : undefined,
          confidence: extractedData.confidence || 0.85,
          rawText: extractedData.rawText || "Analyzed by AI",
        } as ExtractedCertificateData,
        tokensUsed,
      };
    } catch (e) {
      console.error("❌ Ошибка парсинга JSON:", responseText);
      throw new Error("Не удалось распознать JSON от AI");
    }
  }

  static async processBatch(files: any[]) {
    if (files.length === 0) {
      return { results: [], successCount: 0, errorCount: 0, totalTokens: 0, totalCost: "0.00", totalTime: 0 };
    }

    // Инициализируем AI клиент ОДИН РАЗ для всего батча
    // Это сохраняет 1 DB-запрос на каждый файл
    await this.initAPIAsync();

    const results: any[] = [];
    const totalStart = Date.now();

    // Для бесплатных моделей (OpenRouter) снижаем параллельность до 1, чтобы не ловить 429 ошибку
    const isFreeModel = 
      this.currentConfig?.visionModel?.includes("free") || 
      this.currentConfig?.textModel?.includes("free");
    
    const CONCURRENCY = isFreeModel ? 1 : 3;
    
    if (isFreeModel) {
      console.log("⚠️ Используется бесплатная модель. Параллельность обработки снижена до 1 (предотвращение 429 Rate Limit).");
    }

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const chunk = files.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (file: any) => {
          try {
            const result = await this.processCertificate(
              file.buffer,
              file.mimeType,
              file.filename,
              file.rawTextFromPdf,
            );
            return {
              ...result,
              fileId: file.fileId,
              filename: file.filename,
              success: true,
            };
          } catch (error: any) {
            console.error(`❌ Ошибка обработки ${file.filename}:`, error.message);
            return {
              fileId: file.fileId,
              filename: file.filename,
              success: false,
              error: error.message,
              processingTime: 0,
              extractedData: null,
              tokensUsed: null,
            };
          }
        }),
      );
      results.push(...chunkResults);
    }

    const successCount = results.filter((r) => r.success).length;
    const totalTokens = results
      .filter((r) => r.success && r.tokensUsed)
      .reduce((sum: number, r: any) => sum + (r.tokensUsed?.total || 0), 0);

    return {
      results,
      successCount,
      errorCount: files.length - successCount,
      totalTokens,
      totalCost: this.estimateCost(totalTokens).toFixed(6),
      totalTime: Date.now() - totalStart,
    };
  }

  static estimateCost(total: number) {
    return parseFloat(((total / 1000000) * 10).toFixed(6));
  }
}
