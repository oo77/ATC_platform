import OpenAI from 'openai';
import fs from 'fs/promises';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

class CertificateAIProcessor {
  static client = null;
  static currentSettingId = null;
  static currentConfig = null;
  /**
   * Получить настройки AI (из БД или .env)
   * Приоритет: БД > .env
   */
  static async getAIConfig() {
    try {
      const { aiSettingsRepository } = await import('./aiSettingsRepository.mjs');
      const dbSettings = await aiSettingsRepository.getDefault();
      if (dbSettings) {
        const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
          dbSettings.id
        );
        if (decryptedKey) {
          console.log(
            `\u{1F527} AI Config: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u0437 \u0411\u0414 (${dbSettings.apiKeyName || dbSettings.provider})`
          );
          return {
            apiKey: decryptedKey,
            provider: dbSettings.provider,
            baseUrl: dbSettings.baseUrl,
            visionModel: dbSettings.visionModel,
            textModel: dbSettings.textModel,
            maxTokens: dbSettings.maxTokens,
            temperature: dbSettings.temperature,
            settingId: dbSettings.id
          };
        }
      }
    } catch (error) {
      console.log("\u26A0\uFE0F AI Settings \u0438\u0437 \u0411\u0414 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C .env");
    }
    const apiKey = process.env.OPENAI_API_KEY;
    const useOpenRouter = process.env.USE_OPENROUTER === "true";
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error(
        "AI API \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043A\u043B\u044E\u0447 \u0447\u0435\u0440\u0435\u0437 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 > AI \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u043B\u0438 \u0432 \u0444\u0430\u0439\u043B .env"
      );
    }
    console.log("\u{1F527} AI Config: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u0437 .env");
    return {
      apiKey,
      provider: useOpenRouter ? "openrouter" : "openai",
      baseUrl: useOpenRouter ? "https://openrouter.ai/api/v1" : null,
      visionModel: process.env.OPENAI_VISION_MODEL || "openai/gpt-4o",
      textModel: process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo",
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1500"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.1"),
      settingId: null
    };
  }
  /**
   * Инициализация OpenAI/OpenRouter API
   * Поддерживает настройки из БД и fallback на .env
   */
  static async initAPIAsync() {
    const config = await this.getAIConfig();
    this.currentSettingId = config.settingId;
    this.currentConfig = {
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      visionModel: config.visionModel,
      textModel: config.textModel
    };
    if (config.provider === "openrouter" || config.baseUrl?.includes("openrouter")) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "ATC Platform - Certificate AI Import"
        }
      });
      console.log("\u2705 OpenRouter API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    } else if (config.provider === "anthropic") {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || "https://api.anthropic.com/v1"
      });
      console.log("\u2705 Anthropic API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    } else if (config.provider === "custom" && config.baseUrl) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl
      });
      console.log("\u2705 Custom API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D:", config.baseUrl);
    } else {
      this.client = new OpenAI({
        apiKey: config.apiKey
      });
      console.log("\u2705 OpenAI API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    }
    return this.client;
  }
  /**
   * Синхронная инициализация (legacy, использует .env)
   * @deprecated Используйте initAPIAsync для поддержки настроек из БД
   */
  static initAPI() {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      const useOpenRouter = process.env.USE_OPENROUTER === "true";
      if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error(
          "OPENAI_API_KEY \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043A\u043B\u044E\u0447 \u043D\u0430 https://platform.openai.com/api-keys \u0438\u043B\u0438 https://openrouter.ai/keys \u0438 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0432 \u0444\u0430\u0439\u043B .env"
        );
      }
      if (useOpenRouter) {
        this.client = new OpenAI({
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
            "X-Title": "ATC Platform - Certificate AI Import"
          }
        });
        console.log("\u2705 OpenRouter API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (legacy)");
      } else {
        this.client = new OpenAI({
          apiKey
        });
        console.log("\u2705 OpenAI API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (legacy)");
      }
    }
    return this.client;
  }
  /**
   * Получить текущий settingId (для логирования использования)
   */
  static getCurrentSettingId() {
    return this.currentSettingId;
  }
  /**
   * Сбросить клиент (для переинициализации после изменения настроек)
   */
  static resetClient() {
    this.client = null;
    this.currentSettingId = null;
    this.currentConfig = null;
    console.log("\u{1F504} AI Client \u0441\u0431\u0440\u043E\u0448\u0435\u043D");
  }
  /**
   * Обработать файл сертификата (изображение или PDF)
   */
  static async processCertificate(fileBuffer, mimeType, filename) {
    try {
      console.log("\u{1F50D} \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", filename, mimeType);
      const startTime = Date.now();
      let base64Image;
      let imageType;
      if (mimeType === "application/pdf") {
        console.log("\u{1F4C4} \u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D PDF \u0444\u0430\u0439\u043B");
        throw new Error(
          "PDF \u0444\u0430\u0439\u043B\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F (JPG/PNG)"
        );
      } else {
        console.log("\u{1F5BC}\uFE0F \u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435, \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0438\u0440\u0443\u0435\u043C \u0432 base64...");
        base64Image = fileBuffer.toString("base64");
        imageType = mimeType.includes("png") ? "image/png" : "image/jpeg";
        console.log("\u{1F4F8} \u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 base64");
      }
      console.log("\u{1F4CF} \u0420\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u0430:", fileBuffer.length, "\u0431\u0430\u0439\u0442");
      const result = await this.analyzeImageWithVision(base64Image, imageType);
      const processingTime = Date.now() - startTime;
      console.log(`\u2705 AI \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430 \u0437\u0430 ${processingTime}\u043C\u0441`);
      return {
        extractedData: result.extractedData,
        tokensUsed: result.tokensUsed,
        processingTime
      };
    } catch (error) {
      console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
      throw new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442: ${error.message}`);
    }
  }
  /**
   * Анализ изображения с помощью GPT-4 Vision
   */
  static async analyzeImageWithVision(base64Image, imageType) {
    try {
      console.log("\u{1F916} \u0417\u0430\u043F\u0443\u0441\u043A GPT-4 Vision \u0434\u043B\u044F \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430...");
      const client = await this.initAPIAsync();
      const visionModel = this.currentConfig?.visionModel || process.env.OPENAI_VISION_MODEL || "openai/gpt-4o";
      const visionCapablePatterns = [
        "gpt-4o",
        "gpt-4-vision",
        "gpt-4-turbo",
        "gemini",
        "claude-3",
        "qwen",
        "llama-3",
        "pixtral",
        "phi-3",
        "gemma",
        "vision",
        "free"
        // Разрешаем бесплатные модели, так как они могут быть мультимодальными
      ];
      const isVisionCapable = visionCapablePatterns.some(
        (pattern) => visionModel.toLowerCase().includes(pattern.toLowerCase())
      );
      if (!isVisionCapable) {
        console.error(
          `\u274C \u041C\u043E\u0434\u0435\u043B\u044C "${visionModel}" \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0430\u043D\u0430\u043B\u0438\u0437 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439!`
        );
        console.error(
          `   \u27A1\uFE0F \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u0435 Vision Model \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 AI \u043D\u0430 \u043E\u0434\u043D\u0443 \u0438\u0437:`
        );
        console.error(`      \u2022 openai/gpt-4o (\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F)`);
        console.error(`      \u2022 openai/gpt-4-vision-preview`);
        console.error(`      \u2022 google/gemini-pro-vision`);
        throw new Error(
          `\u041C\u043E\u0434\u0435\u043B\u044C "${visionModel}" \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0430\u043D\u0430\u043B\u0438\u0437 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439. \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u0435 Vision Model \u0432 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 AI \u043D\u0430 "openai/gpt-4o" \u0438\u043B\u0438 \u0434\u0440\u0443\u0433\u0443\u044E Vision-\u043C\u043E\u0434\u0435\u043B\u044C.`
        );
      }
      const systemPrompt = `\u0422\u044B \u044D\u043A\u0441\u043F\u0435\u0440\u0442 \u043F\u043E \u0430\u043D\u0430\u043B\u0438\u0437\u0443 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432. \u0422\u0432\u043E\u044F \u0437\u0430\u0434\u0430\u0447\u0430 - \u0438\u0437\u0432\u043B\u0435\u0447\u044C \u0438\u0437 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E:

\u041E\u0411\u042F\u0417\u0410\u0422\u0415\u041B\u042C\u041D\u042B\u0415 \u041F\u041E\u041B\u042F:
1. **fullName** - \u041F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 (\u0424\u0430\u043C\u0438\u043B\u0438\u044F \u0418\u043C\u044F \u0438\u043B\u0438 \u0424\u0430\u043C\u0438\u043B\u0438\u044F \u0418\u043C\u044F \u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E)
   - \u041C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C (\u0418\u0432\u0430\u043D\u043E\u0432 \u0421\u0435\u0440\u0433\u0435\u0439 \u041F\u0435\u0442\u0440\u043E\u0432\u0438\u0447) \u0438\u043B\u0438 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C (IVANOV SERGEY)
   - \u041E\u0431\u044B\u0447\u043D\u043E \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0441\u043B\u043E\u0432 "THAT", "\u0427\u0422\u041E", "\u041D\u0410\u0421\u0422\u041E\u042F\u0429\u0418\u041C \u041F\u041E\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0410\u0415\u0422\u0421\u042F"
   
2. **certificateNumber** - \u041D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430
   - \u0424\u043E\u0440\u043C\u0430\u0442: \u0431\u0443\u043A\u0432\u044B \u0438 \u0446\u0438\u0444\u0440\u044B (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: ATC25_APAP_176, AV-2024-001234)
   - \u041E\u0431\u044B\u0447\u043D\u043E \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u0432 \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0447\u0430\u0441\u0442\u0438 \u0438\u043B\u0438 \u0432\u043D\u0438\u0437\u0443 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430
   
3. **issueDate** - \u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430
   - \u0424\u043E\u0440\u043C\u0430\u0442 \u041E\u0411\u042F\u0417\u0410\u0422\u0415\u041B\u042C\u041D\u041E: YYYY-MM-DD (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: 2025-12-27)
   - \u041C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u0430 \u043A\u0430\u043A DD.MM.YYYY \u0438\u043B\u0438 DD/MM/YYYY - \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u0443\u0439 \u0432 YYYY-MM-DD
   
4. **organization** - \u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u0432\u044B\u0434\u0430\u0432\u0448\u0430\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442
   - \u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: "\u0423\u0447\u0435\u0431\u043D\u044B\u0439 \u0446\u0435\u043D\u0442\u0440 \u0410\u0422\u0421")
   
5. **courseName** - \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430/\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F
   - \u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430

\u0414\u041E\u041F\u041E\u041B\u041D\u0418\u0422\u0415\u041B\u042C\u041D\u042B\u0415 \u041F\u041E\u041B\u042F (\u0435\u0441\u043B\u0438 \u0435\u0441\u0442\u044C):
- **expiryDate** - \u0414\u0430\u0442\u0430 \u0438\u0441\u0442\u0435\u0447\u0435\u043D\u0438\u044F \u0441\u0440\u043E\u043A\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F (\u0444\u043E\u0440\u043C\u0430\u0442: YYYY-MM-DD)
- **courseHours** - \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0447\u0430\u0441\u043E\u0432 \u043A\u0443\u0440\u0441\u0430 (\u0447\u0438\u0441\u043B\u043E)
- **position** - \u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F
- **department** - \u041E\u0442\u0434\u0435\u043B/\u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435
- **pinfl** - \u041F\u0418\u041D\u0424\u041B (14-\u0437\u043D\u0430\u0447\u043D\u044B\u0439 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440)

\u0412\u0410\u0416\u041D\u041E:
- \u0415\u0441\u043B\u0438 \u043F\u043E\u043B\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E - \u043E\u0441\u0442\u0430\u0432\u044C \u0435\u0433\u043E \u043F\u0443\u0441\u0442\u044B\u043C (\u043D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439!)
- \u0411\u0443\u0434\u044C \u0432\u043D\u0438\u043C\u0430\u0442\u0435\u043B\u0435\u043D \u043A \u0442\u0440\u0430\u043D\u0441\u043B\u0438\u0442\u0435\u0440\u0430\u0446\u0438\u0438 (IVANOV = \u0418\u0432\u0430\u043D\u043E\u0432)
- \u0414\u0430\u0442\u044B \u041E\u0411\u042F\u0417\u0410\u0422\u0415\u041B\u042C\u041D\u041E \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 YYYY-MM-DD
- \u0423\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C (confidence) \u043E\u0442 0 \u0434\u043E 1 (\u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0442\u044B \u0443\u0432\u0435\u0440\u0435\u043D \u0432 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0435)

\u0424\u041E\u0420\u041C\u0410\u0422 \u041E\u0422\u0412\u0415\u0422\u0410:
\u0412\u0435\u0440\u043D\u0438 \u0422\u041E\u041B\u042C\u041A\u041E JSON \u043E\u0431\u044A\u0435\u043A\u0442 (\u0431\u0435\u0437 markdown, \u0431\u0435\u0437 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430):
{
  "fullName": "\u0424\u0430\u043C\u0438\u043B\u0438\u044F \u0418\u043C\u044F \u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E",
  "certificateNumber": "\u043D\u043E\u043C\u0435\u0440",
  "issueDate": "YYYY-MM-DD",
  "organization": "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438",
  "courseName": "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430",
  "expiryDate": "YYYY-MM-DD",
  "courseHours": 72,
  "position": "\u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "department": "\u043E\u0442\u0434\u0435\u043B",
  "pinfl": "12345678901234",
  "confidence": 0.95,
  "rawText": "\u043A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0447\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u043D\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0435"
}`;
      console.log("\u{1F4E4} \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u0432 GPT-4 Vision...");
      const requestStartTime = Date.now();
      const model = this.currentConfig?.visionModel || process.env.OPENAI_VISION_MODEL || "openai/gpt-4o";
      console.log(`\u{1F916} \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C: ${model}`);
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageType};base64,${base64Image}`,
                  detail: "high"
                  // Высокое качество для лучшей точности
                }
              }
            ]
          }
        ],
        max_tokens: this.currentConfig?.maxTokens || parseInt(process.env.OPENAI_MAX_TOKENS || "1500"),
        temperature: this.currentConfig?.temperature || parseFloat(process.env.OPENAI_TEMPERATURE || "0.1")
      });
      const requestDuration = Date.now() - requestStartTime;
      console.log(`\u23F1\uFE0F GPT-4 Vision \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u0437\u0430 ${requestDuration}\u043C\u0441`);
      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log(
        "\u{1F4E5} \u041E\u0442\u0432\u0435\u0442 GPT-4 Vision:",
        responseText?.substring(0, 200) + "..."
      );
      if (!responseText) {
        throw new Error("\u041F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 GPT-4 Vision");
      }
      const tokensUsed = {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0
      };
      console.log("\u{1F4B0} \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432:", {
        ...tokensUsed,
        estimatedCost: this.estimateCost(tokensUsed.total)
      });
      let extractedData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("JSON \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u043E\u0442\u0432\u0435\u0442\u0435");
        }
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error(
          "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0430 \u043E\u0442\u0432\u0435\u0442\u0430 GPT-4 Vision:",
          parseError.message
        );
        console.error("\u041E\u0442\u0432\u0435\u0442 \u0431\u044B\u043B:", responseText);
        throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430");
      }
      const result = {
        fullName: extractedData.fullName || "",
        certificateNumber: extractedData.certificateNumber || "",
        issueDate: extractedData.issueDate || "",
        expiryDate: extractedData.expiryDate,
        organization: extractedData.organization || "",
        courseName: extractedData.courseName || "",
        courseHours: extractedData.courseHours ? parseInt(extractedData.courseHours) : void 0,
        position: extractedData.position,
        department: extractedData.department,
        pinfl: extractedData.pinfl,
        confidence: extractedData.confidence || 0.85,
        rawText: extractedData.rawText || "Analyzed by GPT-4 Vision"
      };
      return {
        extractedData: result,
        tokensUsed
      };
    } catch (error) {
      console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0440\u0430\u0431\u043E\u0442\u0435 \u0441 GPT-4 Vision:", error.message);
      await this.logApiError(error);
      throw error;
    }
  }
  /**
   * Логирование ошибок API с классификацией типа ошибки
   */
  static async logApiError(error) {
    try {
      const { aiSettingsRepository } = await import('./aiSettingsRepository.mjs');
      const message = error.message || String(error);
      let errorCode = "unknown";
      let errorType = "other";
      let tokensRequested;
      let tokensAvailable;
      if (message.includes("402") || message.includes("credits") || message.includes("afford")) {
        errorCode = "402";
        errorType = "insufficient_credits";
        const requestedMatch = message.match(/requested up to (\d+) tokens/);
        const availableMatch = message.match(/can only afford (\d+)/);
        if (requestedMatch) tokensRequested = parseInt(requestedMatch[1]);
        if (availableMatch) tokensAvailable = parseInt(availableMatch[1]);
        console.error(
          `\u{1F4B0} \u041E\u0448\u0438\u0431\u043A\u0430 402: \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432. \u0417\u0430\u043F\u0440\u043E\u0448\u0435\u043D\u043E: ${tokensRequested}, \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ${tokensAvailable}`
        );
        console.error(
          `   \u27A1\uFE0F \u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0431\u0430\u043B\u0430\u043D\u0441 \u043D\u0430 https://openrouter.ai/settings/credits`
        );
      } else if (message.includes("401") || message.includes("Unauthorized") || message.includes("invalid_api_key")) {
        errorCode = "401";
        errorType = "invalid_key";
        console.error("\u{1F511} \u041E\u0448\u0438\u0431\u043A\u0430 401: \u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 API \u043A\u043B\u044E\u0447");
      } else if (message.includes("429") || message.includes("rate") || message.includes("Too Many Requests")) {
        errorCode = "429";
        errorType = "rate_limit";
        console.error("\u23F1\uFE0F \u041E\u0448\u0438\u0431\u043A\u0430 429: \u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432");
      } else if (message.includes("ECONNREFUSED") || message.includes("network") || message.includes("ETIMEDOUT")) {
        errorCode = "network_error";
        errorType = "network";
        console.error("\u{1F310} \u0421\u0435\u0442\u0435\u0432\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 \u043A API");
      } else if (message.includes("model") || message.includes("does not exist")) {
        errorCode = "model_not_found";
        errorType = "model_error";
        console.error("\u{1F916} \u041E\u0448\u0438\u0431\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u0438: \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430");
      }
      await aiSettingsRepository.logApiError({
        errorCode,
        errorType,
        errorMessage: message,
        model: this.currentConfig?.visionModel || process.env.OPENAI_VISION_MODEL || "openai/gpt-4o",
        tokensRequested,
        tokensAvailable
      });
    } catch (logError) {
      console.error("\u26A0\uFE0F \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043E\u0448\u0438\u0431\u043A\u0443 \u0432 \u043B\u043E\u0433:", logError);
    }
  }
  /**
   * Оценка стоимости запроса
   * Возвращает стоимость в USD
   */
  static estimateCost(totalTokens) {
    const costPer1MTokens = 10;
    const cost = totalTokens / 1e6 * costPer1MTokens;
    return parseFloat(cost.toFixed(6));
  }
  /**
   * Валидация извлечённых данных
   */
  static validateExtractedData(data) {
    const errors = [];
    if (!data.fullName || data.fullName.trim().length < 3) {
      errors.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0424\u0418\u041E");
    }
    if (!data.certificateNumber || data.certificateNumber.trim().length < 3) {
      errors.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430");
    }
    if (!data.issueDate) {
      errors.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0434\u0430\u0442\u0443 \u0432\u044B\u0434\u0430\u0447\u0438");
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.issueDate)) {
        errors.push("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B \u0432\u044B\u0434\u0430\u0447\u0438 (\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F YYYY-MM-DD)");
      }
    }
    if (!data.organization || data.organization.trim().length < 3) {
      errors.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0432\u044B\u0434\u0430\u0432\u0448\u0443\u044E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E");
    }
    if (!data.courseName || data.courseName.trim().length < 3) {
      errors.push("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430");
    }
    if (data.confidence < 0.5) {
      errors.push("\u041D\u0438\u0437\u043A\u0430\u044F \u0443\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0432 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 (< 50%)");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Batch-обработка нескольких сертификатов
   *
   * Оптимизации:
   * - Переиспользует AI-клиент (инициализация один раз)
   * - Последовательная обработка с задержками (защита от rate limit)
   * - Graceful degradation (частичные ошибки не ломают процесс)
   * - Детальная статистика по каждому файлу
   * - Автоматическое увеличение задержки при обнаружении rate limit
   *
   * @param files - Массив файлов для обработки
   * @returns Результат batch-обработки с детальной статистикой
   */
  static async processBatch(files) {
    console.log(`\u{1F680} \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C batch-\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 ${files.length} \u0444\u0430\u0439\u043B\u043E\u0432...`);
    const batchStartTime = Date.now();
    try {
      await this.initAPIAsync();
      console.log("\u2705 AI-\u043A\u043B\u0438\u0435\u043D\u0442 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D \u0434\u043B\u044F batch-\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438");
    } catch (error) {
      console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 AI-\u043A\u043B\u0438\u0435\u043D\u0442\u0430:", error.message);
      return {
        results: files.map((f) => ({
          fileId: f.fileId,
          filename: f.filename,
          success: false,
          extractedData: null,
          tokensUsed: null,
          processingTime: 0,
          error: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 AI: ${error.message}`
        })),
        totalTokens: 0,
        totalCost: "0.00",
        totalTime: Date.now() - batchStartTime,
        successCount: 0,
        errorCount: files.length
      };
    }
    const results = [];
    console.log(
      `\u2699\uFE0F \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432 \u043F\u043E\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u043E (\u0437\u0430\u0449\u0438\u0442\u0430 \u043E\u0442 rate limit)...`
    );
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileStartTime = Date.now();
      try {
        console.log(
          `\u{1F4C4} \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0444\u0430\u0439\u043B\u0430 ${i + 1}/${files.length}: ${file.filename}`
        );
        const result = await this.processCertificate(
          file.buffer,
          file.mimeType,
          file.filename
        );
        results.push({
          fileId: file.fileId,
          filename: file.filename,
          success: true,
          extractedData: result.extractedData,
          tokensUsed: result.tokensUsed,
          processingTime: Date.now() - fileStartTime
        });
        if (i < files.length - 1) {
          const delay = 2e3;
          console.log(`\u23F3 \u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 ${delay}\u043C\u0441 \u043F\u0435\u0440\u0435\u0434 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u043C \u0444\u0430\u0439\u043B\u043E\u043C...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(
          `\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0444\u0430\u0439\u043B\u0430 ${file.filename}:`,
          error.message
        );
        results.push({
          fileId: file.fileId,
          filename: file.filename,
          success: false,
          extractedData: null,
          tokensUsed: null,
          processingTime: Date.now() - fileStartTime,
          error: error.message
        });
        if (error.message.includes("429") || error.message.includes("rate")) {
          const retryDelay = 5e3;
          console.log(`\u26A0\uFE0F Rate limit \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D, \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 ${retryDelay}\u043C\u0441...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    const totalTokens = results.reduce(
      (sum, r) => sum + (r.tokensUsed?.total || 0),
      0
    );
    const totalCost = this.estimateCost(totalTokens);
    const totalTime = Date.now() - batchStartTime;
    console.log(`\u2705 Batch-\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430 \u0437\u0430 ${totalTime}\u043C\u0441`);
    console.log(`\u{1F4CA} \u0423\u0441\u043F\u0435\u0448\u043D\u043E: ${successCount}, \u041E\u0448\u0438\u0431\u043E\u043A: ${errorCount}`);
    console.log(`\u{1F4B0} \u0412\u0441\u0435\u0433\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432: ${totalTokens}, \u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C: $${totalCost}`);
    return {
      results,
      totalTokens,
      totalCost: totalCost.toFixed(6),
      totalTime,
      successCount,
      errorCount
    };
  }
}

class StudentMatcher {
  static client = null;
  static currentConfig = null;
  /**
   * Получить настройки AI (из БД или .env)
   * Приоритет: БД > .env
   */
  static async getAIConfig() {
    try {
      const { aiSettingsRepository } = await import('./aiSettingsRepository.mjs');
      const dbSettings = await aiSettingsRepository.getDefault();
      if (dbSettings) {
        const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
          dbSettings.id
        );
        if (decryptedKey) {
          console.log(
            `\u{1F527} StudentMatcher: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u0437 \u0411\u0414 (${dbSettings.apiKeyName || dbSettings.provider})`
          );
          return {
            apiKey: decryptedKey,
            provider: dbSettings.provider,
            baseUrl: dbSettings.baseUrl,
            textModel: dbSettings.textModel,
            maxTokens: dbSettings.maxTokens,
            temperature: dbSettings.temperature
          };
        }
      }
    } catch (error) {
      console.log(
        "\u26A0\uFE0F StudentMatcher: \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u0437 \u0411\u0414 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C .env"
      );
    }
    const apiKey = process.env.OPENAI_API_KEY;
    const useOpenRouter = process.env.USE_OPENROUTER === "true";
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error(
        "AI API \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043A\u043B\u044E\u0447 \u0447\u0435\u0440\u0435\u0437 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 > AI \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u043B\u0438 \u0432 \u0444\u0430\u0439\u043B .env"
      );
    }
    console.log("\u{1F527} StudentMatcher: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u0437 .env");
    return {
      apiKey,
      provider: useOpenRouter ? "openrouter" : "openai",
      baseUrl: useOpenRouter ? "https://openrouter.ai/api/v1" : null,
      textModel: process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo",
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "150"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.1")
    };
  }
  /**
   * Асинхронная инициализация OpenAI/OpenRouter API
   * Поддерживает настройки из БД
   */
  static async initAPIAsync() {
    const config = await this.getAIConfig();
    this.currentConfig = {
      textModel: config.textModel,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    };
    if (config.provider === "openrouter" || config.baseUrl?.includes("openrouter")) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "ATC Platform - Student Matcher"
        }
      });
      console.log("\u2705 StudentMatcher: OpenRouter API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    } else {
      this.client = new OpenAI({
        apiKey: config.apiKey
      });
      console.log("\u2705 StudentMatcher: OpenAI API \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    }
    return this.client;
  }
  /**
   * @deprecated Используйте initAPIAsync для поддержки настроек из БД
   */
  static initAPI() {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      const useOpenRouter = process.env.USE_OPENROUTER === "true";
      if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error(
          "OPENAI_API_KEY \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043A\u043B\u044E\u0447 \u043D\u0430 https://platform.openai.com/api-keys \u0438\u043B\u0438 https://openrouter.ai/keys \u0438 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0432 \u0444\u0430\u0439\u043B .env"
        );
      }
      if (useOpenRouter) {
        this.client = new OpenAI({
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
            "X-Title": "ATC Platform - Student Matcher"
          }
        });
      } else {
        this.client = new OpenAI({
          apiKey
        });
      }
    }
    return this.client;
  }
  /**
   * Главный метод поиска слушателя
   * Использует 3-уровневую систему поиска
   */
  static async findMatchingStudent(extractedData, students) {
    if (!extractedData.fullName || students.length === 0) {
      console.log("\u26A0\uFE0F [\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430] \u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430");
      console.log(`   - \u0424\u0418\u041E: ${extractedData.fullName || "\u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442"}`);
      console.log(`   - \u0421\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u0432 \u0441\u043F\u0438\u0441\u043A\u0435: ${students.length}`);
      return {
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430",
        topAlternatives: []
      };
    }
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log("\u{1F50D} [\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430] \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C 3-\u0443\u0440\u043E\u0432\u043D\u0435\u0432\u044B\u0439 \u043F\u043E\u0438\u0441\u043A...");
    console.log(
      `\u{1F4DD} [\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430] \u0418\u043C\u044F \u0438\u0437 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430: "${extractedData.fullName}"`
    );
    console.log(`\u{1F465} [\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430] \u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0432 \u0431\u0430\u0437\u0435: ${students.length}`);
    if (extractedData.pinfl) {
      console.log(`\u{1F194} [\u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430] \u041F\u0418\u041D\u0424\u041B: ${extractedData.pinfl}`);
    }
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    if (extractedData.pinfl) {
      console.log("\u{1F50D} [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 1] \u041F\u043E\u0438\u0441\u043A \u043F\u043E \u041F\u0418\u041D\u0424\u041B...");
      const pinflMatch = this.findByPINFL(extractedData.pinfl, students);
      if (pinflMatch) {
        console.log("\u2705 [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 1] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0442\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043F\u043E \u041F\u0418\u041D\u0424\u041B");
        return pinflMatch;
      }
      console.log("\u26A0\uFE0F [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 1] \u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439 \u043F\u043E \u041F\u0418\u041D\u0424\u041B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    }
    console.log("\u{1F50D} [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 2] \u0423\u043C\u043D\u044B\u0439 \u043F\u043E\u0438\u0441\u043A \u043F\u043E \u0424\u0418\u041E...");
    const smartMatch = this.findBySmartName(extractedData.fullName, students);
    if (smartMatch) {
      console.log("\u2705 [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 2] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043F\u043E \u0424\u0418\u041E");
      return smartMatch;
    }
    console.log("\u26A0\uFE0F [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 2] \u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    console.log("\u{1F916} [\u0423\u0440\u043E\u0432\u0435\u043D\u044C 3] \u0417\u0430\u043F\u0443\u0441\u043A AI-\u043F\u043E\u0438\u0441\u043A\u0430...");
    const aiMatch = await this.findByAI(extractedData, students);
    return aiMatch;
  }
  /**
   * Уровень 1: Поиск по ПИНФЛ (14-значный идентификатор)
   */
  static findByPINFL(pinfl, students) {
    console.log("\u{1F50D} \u041F\u043E\u0438\u0441\u043A \u043F\u043E \u041F\u0418\u041D\u0424\u041B:", pinfl);
    const normalizedPINFL = pinfl.replace(/\D/g, "");
    if (normalizedPINFL.length !== 14) {
      console.log("\u26A0\uFE0F \u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u041F\u0418\u041D\u0424\u041B (\u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C 14 \u0446\u0438\u0444\u0440)");
      return null;
    }
    const found = students.find((s) => s.pinfl === normalizedPINFL);
    if (found) {
      return {
        student: found,
        confidence: 1,
        // 100% уверенность при совпадении ПИНФЛ
        matchMethod: "exact_pinfl",
        explanation: `\u0422\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043F\u043E \u041F\u0418\u041D\u0424\u041B: ${normalizedPINFL}`,
        topAlternatives: []
      };
    }
    return null;
  }
  /**
   * Уровень 2: Умный поиск по ФИО
   * Учитывает:
   * - Полное совпадение
   * - Транслитерацию (Ivanov = Иванов)
   * - Перестановку слов (Ivanov Ivan = Ivan Ivanov)
   * - Небольшие опечатки (для длинных имен)
   */
  static findBySmartName(searchName, students) {
    console.log("\u{1F50D} \u0423\u043C\u043D\u044B\u0439 \u043F\u043E\u0438\u0441\u043A \u043F\u043E \u0424\u0418\u041E:", searchName);
    const cleanSearch = this.normalizeName(searchName);
    const latSearch = this.transliterate(cleanSearch);
    const tokensSearch = latSearch.split(" ").sort().join(" ");
    let bestMatch = null;
    let maxScore = 0;
    let matchReason = "";
    for (const student of students) {
      const cleanStudent = this.normalizeName(student.fullName);
      const latStudent = this.transliterate(cleanStudent);
      if (cleanSearch === cleanStudent || latSearch === latStudent) {
        return {
          student,
          confidence: 0.99,
          matchMethod: "exact_name",
          explanation: `\u0422\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u0424\u0418\u041E: ${student.fullName}`,
          topAlternatives: []
        };
      }
      const tokensStudent = latStudent.split(" ").sort().join(" ");
      if (tokensSearch === tokensStudent) {
        return {
          student,
          confidence: 0.95,
          matchMethod: "exact_name",
          explanation: `\u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u0441\u043B\u043E\u0432 \u0432 \u0424\u0418\u041E: ${student.fullName}`,
          topAlternatives: []
        };
      }
      if (Math.abs(tokensSearch.length - tokensStudent.length) <= 3) {
        const similarity = this.levenshteinSimilarity(
          tokensSearch,
          tokensStudent
        );
        if (similarity > 0.9 && similarity > maxScore) {
          maxScore = similarity;
          bestMatch = student;
          matchReason = `\u0412\u044B\u0441\u043E\u043A\u0430\u044F \u0441\u0445\u043E\u0436\u0435\u0441\u0442\u044C \u0438\u043C\u0435\u043D (${Math.round(similarity * 100)}%): ${student.fullName}`;
        }
      }
    }
    if (bestMatch && maxScore > 0.9) {
      return {
        student: bestMatch,
        confidence: Number(maxScore.toFixed(2)),
        matchMethod: "fuzzy_ai",
        // Помечаем как fuzzy, хотя нашли локально
        explanation: matchReason,
        topAlternatives: []
      };
    }
    return null;
  }
  /**
   * Транслитерация кириллицы в латиницу для сравнения
   */
  static transliterate(text) {
    const map = {
      \u0430: "a",
      \u0431: "b",
      \u0432: "v",
      \u0433: "g",
      \u0434: "d",
      \u0435: "e",
      \u0451: "yo",
      \u0436: "zh",
      \u0437: "z",
      \u0438: "i",
      \u0439: "y",
      \u043A: "k",
      \u043B: "l",
      \u043C: "m",
      \u043D: "n",
      \u043E: "o",
      \u043F: "p",
      \u0440: "r",
      \u0441: "s",
      \u0442: "t",
      \u0443: "u",
      \u0444: "f",
      \u0445: "kh",
      \u0446: "ts",
      \u0447: "ch",
      \u0448: "sh",
      \u0449: "shch",
      \u044A: "",
      \u044B: "y",
      \u044C: "",
      \u044D: "e",
      \u044E: "yu",
      \u044F: "ya",
      gh: "g",
      sh: "sh",
      ch: "ch",
      ng: "n",
      // Uzbek digraphs normalization
      "o'": "o",
      "g'": "g",
      "\u2018": "",
      "\u2019": ""
      // Apostrophes
    };
    return text.split("").map((char) => {
      const lower = char.toLowerCase();
      return map[lower] !== void 0 ? map[lower] : lower;
    }).join("");
  }
  /**
   * Уровень 3: AI-поиск с нечёткими совпадениями
   */
  static async findByAI(extractedData, students) {
    console.log(`\u{1F50D} [AI-\u043F\u043E\u0438\u0441\u043A] \u041D\u0430\u0447\u0430\u043B\u043E \u043F\u043E\u0438\u0441\u043A\u0430 \u0434\u043B\u044F: "${extractedData.fullName}"`);
    console.log(
      `\u{1F465} [AI-\u043F\u043E\u0438\u0441\u043A] \u0412\u0441\u0435\u0433\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u0432 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438: ${students.length}`
    );
    const candidates = this.getTopCandidates(
      extractedData.fullName,
      students,
      20
    );
    const topAlternatives = this.convertToTopAlternatives(
      candidates.slice(0, 5)
    );
    console.log(
      `\u{1F50D} [AI-\u043F\u043E\u0438\u0441\u043A] \u041E\u0442\u043E\u0431\u0440\u0430\u043D\u043E ${candidates.length} \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432 \u0434\u043B\u044F AI-\u0430\u043D\u0430\u043B\u0438\u0437\u0430`
    );
    console.log(
      `\u{1F4CA} [AI-\u043F\u043E\u0438\u0441\u043A] \u0422\u043E\u043F-5 \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u044B: ${topAlternatives.length} \u0437\u0430\u043F\u0438\u0441\u0435\u0439`
    );
    const studentList = candidates.map((s, i) => `${i}. ${s.fullName} (${s.organization}, ${s.position})`).join("\n");
    const systemPrompt = `\u0422\u044B \u044D\u043A\u0441\u043F\u0435\u0440\u0442 \u043F\u043E \u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u044E \u0424\u0418\u041E \u043B\u044E\u0434\u0435\u0439. \u0422\u0432\u043E\u044F \u0437\u0430\u0434\u0430\u0447\u0430 - \u043D\u0430\u0439\u0442\u0438 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0422\u041E\u0427\u041D\u041E \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u043C \u0438\u0437 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430.

\u041A\u0420\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0418 \u0412\u0410\u0416\u041D\u042B\u0415 \u041F\u0420\u0410\u0412\u0418\u041B\u0410:

1. \u0424\u0410\u041C\u0418\u041B\u0418\u042F \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0442\u044C! 
   - "Usmanov" \u2260 "Azimov" (\u0440\u0430\u0437\u043D\u044B\u0435 \u0444\u0430\u043C\u0438\u043B\u0438\u0438!)
   - "Usmanov" \u2260 "Usmanovich" (\u044D\u0442\u043E \u041E\u0422\u0427\u0415\u0421\u0422\u0412\u041E, \u043D\u0435 \u0444\u0430\u043C\u0438\u043B\u0438\u044F!)
   - "Petrov" \u2260 "Petrovskiy" (\u0440\u0430\u0437\u043D\u044B\u0435 \u0444\u0430\u043C\u0438\u043B\u0438\u0438!)

2. \u0418\u041C\u042F \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0442\u044C!
   - "Bakhtiyor" = "Bakhtiyor" = "Bakhtier" (\u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0442\u0440\u0430\u043D\u0441\u043B\u0438\u0442\u0435\u0440\u0430\u0446\u0438\u0438 OK)
   - "Bakhtiyor" \u2260 "Sardor" (\u0440\u0430\u0437\u043D\u044B\u0435 \u0438\u043C\u0435\u043D\u0430!)

3. \u0422\u0440\u0430\u043D\u0441\u043B\u0438\u0442\u0435\u0440\u0430\u0446\u0438\u044F \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F:
   - \u0418\u0432\u0430\u043D\u043E\u0432 = Ivanov
   - \u0421\u0435\u0440\u0433\u0435\u0439 = Sergey = Sergei
   - \u0411\u0430\u0445\u0442\u0438\u0451\u0440 = Bakhtiyor = Bakhtier

4. \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u043B\u043E\u0432 \u043D\u0435 \u0432\u0430\u0436\u0435\u043D:
   - "Ivanov Sergey" = "Sergey Ivanov"

5. \u041C\u0435\u043B\u043A\u0438\u0435 \u043E\u043F\u0435\u0447\u0430\u0442\u043A\u0438 OCR \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u044E\u0442\u0441\u044F:
   - "Ivanov" \u2248 "lvanov" (l \u0432\u043C\u0435\u0441\u0442\u043E I)
   - "Usmanov" \u2248 "Usman\u043Ev" (\u043A\u0438\u0440\u0438\u043B\u043B\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E)

6. \u041D\u0415 \u0421\u041E\u041F\u041E\u0421\u0422\u0410\u0412\u041B\u042F\u0419 \u0435\u0441\u043B\u0438:
   - \u0424\u0430\u043C\u0438\u043B\u0438\u0438 \u0420\u0410\u0417\u041D\u042B\u0415 (\u0434\u0430\u0436\u0435 \u0435\u0441\u043B\u0438 \u043F\u043E\u0445\u043E\u0436\u0438 \u043F\u043E \u0437\u0432\u0443\u0447\u0430\u043D\u0438\u044E)
   - \u0418\u043C\u0435\u043D\u0430 \u0420\u0410\u0417\u041D\u042B\u0415
   - \u0421\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0447\u0435\u0441\u0442\u0432\u043E
   - \u0421\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0430\u0441\u0442\u044C \u0444\u0430\u043C\u0438\u043B\u0438\u0438

\u041F\u0420\u0418\u041C\u0415\u0420\u042B \u041D\u0415\u041F\u0420\u0410\u0412\u0418\u041B\u042C\u041D\u042B\u0425 \u0421\u041E\u041F\u041E\u0421\u0422\u0410\u0412\u041B\u0415\u041D\u0418\u0419 (\u041D\u0415 \u0414\u0415\u041B\u0410\u0419 \u0422\u0410\u041A!):
- "Bakhtiyor Usmanov" \u2192 "AZIMOV SARDOR USMANOVICH" \u274C (\u0444\u0430\u043C\u0438\u043B\u0438\u0438 \u0440\u0430\u0437\u043D\u044B\u0435!)
- "Ivan Petrov" \u2192 "Petr Ivanov" \u274C (\u0438\u043C\u044F \u0438 \u0444\u0430\u043C\u0438\u043B\u0438\u044F \u043F\u0435\u0440\u0435\u043F\u0443\u0442\u0430\u043D\u044B!)
- "Sergey Sidorov" \u2192 "Sergey Sidorenko" \u274C (\u0440\u0430\u0437\u043D\u044B\u0435 \u0444\u0430\u043C\u0438\u043B\u0438\u0438!)

\u0423\u0420\u041E\u0412\u0415\u041D\u042C \u0423\u0412\u0415\u0420\u0415\u041D\u041D\u041E\u0421\u0422\u0418:
- 95-100%: \u0422\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u0432\u0441\u0435\u0445 \u0447\u0430\u0441\u0442\u0435\u0439 \u0424\u0418\u041E
- 80-95%: \u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u0441 \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0438\u043C\u0438 \u0432\u0430\u0440\u0438\u0430\u0446\u0438\u044F\u043C\u0438 \u0442\u0440\u0430\u043D\u0441\u043B\u0438\u0442\u0435\u0440\u0430\u0446\u0438\u0438
- 60-80%: \u0415\u0441\u0442\u044C \u0441\u043E\u043C\u043D\u0435\u043D\u0438\u044F, \u043D\u043E \u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E \u044D\u0442\u043E \u0442\u043E\u0442 \u0447\u0435\u043B\u043E\u0432\u0435\u043A
- <60%: \u041D\u0415 \u0421\u041E\u041F\u041E\u0421\u0422\u0410\u0412\u041B\u042F\u0419! \u0412\u0435\u0440\u043D\u0438 null

\u0412\u0410\u0416\u041D\u041E! \u0424\u041E\u0420\u041C\u0410\u0422 \u041E\u0422\u0412\u0415\u0422\u0410:
\u0412\u0435\u0440\u043D\u0438 \u0422\u041E\u041B\u042C\u041A\u041E \u0447\u0438\u0441\u0442\u044B\u0439 JSON \u043E\u0431\u044A\u0435\u043A\u0442, \u0411\u0415\u0417:
- markdown \u0431\u043B\u043E\u043A\u043E\u0432 (\\\`\\\`\\\`json)
- \u0442\u0435\u0433\u043E\u0432 <think> \u0438\u043B\u0438 \u0434\u0440\u0443\u0433\u0438\u0445 \u0442\u0435\u0433\u043E\u0432
- \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430 \u0434\u043E \u0438\u043B\u0438 \u043F\u043E\u0441\u043B\u0435 JSON
- \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432

\u0424\u043E\u0440\u043C\u0430\u0442 JSON:
{
  "originalIndex": <\u043D\u043E\u043C\u0435\u0440 \u0441\u0442\u0440\u043E\u043A\u0438 \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 (0, 1, 2...) \u0438\u043B\u0438 null \u0435\u0441\u043B\u0438 \u043D\u0435\u0442 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u044F>,
  "confidence": <\u0443\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u043E\u0442 0 \u0434\u043E 1>,
  "reasoning": "<\u043A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C>"
}`;
    const userPrompt = `\u0421\u041F\u0418\u0421\u041E\u041A \u041A\u0410\u041D\u0414\u0418\u0414\u0410\u0422\u041E\u0412:
${studentList}

\u0414\u0410\u041D\u041D\u042B\u0415 \u0418\u0417 \u0421\u0415\u0420\u0422\u0418\u0424\u0418\u041A\u0410\u0422\u0410:
\u0424\u0418\u041E: "${extractedData.fullName}"
${extractedData.organization ? `\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F: "${extractedData.organization}"` : ""}
${extractedData.position ? `\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C: "${extractedData.position}"` : ""}

\u041D\u0430\u0439\u0434\u0438 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430.`;
    try {
      const client = await this.initAPIAsync();
      console.log("\u{1F4E4} \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u0432 AI...");
      const startTime = Date.now();
      const model = this.currentConfig?.textModel || process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo";
      console.log(`\u{1F916} \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C: ${model}`);
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: this.currentConfig?.temperature || 0.1,
        max_tokens: this.currentConfig?.maxTokens || 150
        // Не используем response_format, так как многие бесплатные модели его не поддерживают
        // Вместо этого используем универсальный парсер JSON
      });
      const duration = Date.now() - startTime;
      console.log(`\u23F1\uFE0F AI \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u0437\u0430 ${duration}\u043C\u0441`);
      console.log("\u{1F4E6} \u041F\u043E\u043B\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442 AI:", JSON.stringify(completion, null, 2));
      if (!completion.choices || completion.choices.length === 0) {
        console.error("\u274C AI \u0432\u0435\u0440\u043D\u0443\u043B \u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432 choices:", completion);
        throw new Error(
          `AI \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B \u043E\u0442\u0432\u0435\u0442. \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0438\u043B\u0438 \u043F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0442\u043E\u043A\u0435\u043D\u043E\u0432. \u0414\u0435\u0442\u0430\u043B\u0438: ${JSON.stringify(completion)}`
        );
      }
      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log("\u{1F4E5} \u041E\u0442\u0432\u0435\u0442 AI:", responseText);
      if (!responseText) {
        throw new Error("\u041F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 AI");
      }
      let aiResponse;
      try {
        let jsonText = responseText;
        jsonText = jsonText.replace(/<think>[\s\S]*?<\/think>/gi, "");
        jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("JSON \u043E\u0431\u044A\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u043E\u0442\u0432\u0435\u0442\u0435");
        }
        aiResponse = JSON.parse(jsonMatch[0]);
        console.log("\u2705 JSON \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0435\u043D:", {
          originalIndex: aiResponse.originalIndex,
          confidence: aiResponse.confidence
        });
      } catch (parseError) {
        console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0430 \u043E\u0442\u0432\u0435\u0442\u0430 AI:", parseError.message);
        console.error("\u{1F4C4} \u041F\u043E\u043B\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442 AI:", responseText);
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0430 \u043E\u0442\u0432\u0435\u0442\u0430 AI: ${parseError.message}`,
          topAlternatives
          // matchScore уже в диапазоне 0-100
        };
      }
      if (aiResponse.originalIndex === null || aiResponse.originalIndex === "null" || aiResponse.originalIndex === void 0) {
        console.log("\u26A0\uFE0F AI \u043D\u0435 \u043D\u0430\u0448\u0435\u043B \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F");
        return {
          student: null,
          confidence: aiResponse.confidence || 0,
          matchMethod: "none",
          explanation: aiResponse.reasoning || "AI \u043D\u0435 \u043D\u0430\u0448\u0435\u043B \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439",
          topAlternatives
        };
      }
      const index = parseInt(aiResponse.originalIndex);
      if (isNaN(index) || index < 0 || index >= candidates.length) {
        console.error(
          "\u274C \u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u043E\u0442 AI:",
          aiResponse.originalIndex
        );
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u043E\u0442 AI"
        };
      }
      const foundStudent = candidates[index];
      console.log("\u2705 AI \u043D\u0430\u0448\u0435\u043B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F:", foundStudent.fullName);
      console.log(
        "\u{1F3AF} \u0423\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C:",
        Math.round(aiResponse.confidence * 100) + "%"
      );
      console.log("\u{1F4AD} \u041E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435:", aiResponse.reasoning);
      console.log("\u{1F4B0} \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432:", {
        prompt: completion.usage?.prompt_tokens,
        completion: completion.usage?.completion_tokens,
        total: completion.usage?.total_tokens
      });
      const searchTokens = this.transliterate(
        this.normalizeName(extractedData.fullName)
      ).split(" ").filter((t) => t.length > 1);
      const studentTokens = this.transliterate(
        this.normalizeName(foundStudent.fullName)
      ).split(" ").filter((t) => t.length > 1);
      const tokenScore = this.calculateTokenMatchScore(
        searchTokens,
        studentTokens
      );
      console.log(
        `\u{1F50D} \u0412\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F \u0442\u043E\u043A\u0435\u043D\u043E\u0432: ${tokenScore.toFixed(2)} (search=[${searchTokens.join(",")}], student=[${studentTokens.join(",")}])`
      );
      if (tokenScore < 0.3) {
        console.warn(
          "\u26A0\uFE0F AI \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435\u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0449\u0435\u0433\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F! \u0422\u043E\u043A\u0435\u043D\u043D\u044B\u0439 \u0441\u043A\u043E\u0440 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043D\u0438\u0437\u043A\u0438\u0439:",
          tokenScore
        );
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: `AI \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u043B "${foundStudent.fullName}", \u043D\u043E \u0442\u043E\u043A\u0435\u043D\u044B \u0424\u0418\u041E \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0442 (\u0441\u043A\u043E\u0440=${tokenScore.toFixed(2)}). \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u0443\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u0432\u0440\u0443\u0447\u043D\u0443\u044E.`,
          topAlternatives
        };
      }
      if (aiResponse.confidence < 0.6) {
        console.warn(
          "\u26A0\uFE0F \u0423\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C AI \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043D\u0438\u0437\u043A\u0430\u044F:",
          aiResponse.confidence
        );
        return {
          student: null,
          confidence: aiResponse.confidence,
          matchMethod: "none",
          explanation: `AI \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u043B "${foundStudent.fullName}" \u0441 \u043D\u0438\u0437\u043A\u043E\u0439 \u0443\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C\u044E (${Math.round(aiResponse.confidence * 100)}%). ${aiResponse.reasoning}`,
          topAlternatives
        };
      }
      return {
        student: foundStudent,
        confidence: aiResponse.confidence,
        matchMethod: "fuzzy_ai",
        explanation: aiResponse.reasoning,
        topAlternatives
      };
    } catch (error) {
      console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0440\u0430\u0431\u043E\u0442\u0435 \u0441 AI:", error.message);
      if (error.message && error.message.includes("404") && error.message.includes("data policy")) {
        console.warn(
          "\u26A0\uFE0F \u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 OpenRouter. \u041F\u0440\u043E\u0431\u0443\u0435\u043C fallback..."
        );
        try {
          const currentModel = this.currentConfig?.textModel || "";
          if (!currentModel.includes("gpt-3.5-turbo")) {
            console.log("\u{1F504} Fallback: \u041F\u0440\u043E\u0431\u0443\u0435\u043C openai/gpt-3.5-turbo...");
            const client = await this.initAPIAsync();
            const fallbackCompletion = await client.chat.completions.create({
              model: "openai/gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.1,
              response_format: { type: "json_object" }
            });
          }
        } catch (fallbackError) {
          console.error("\u274C Fallback \u0442\u043E\u0436\u0435 \u043D\u0435 \u0441\u0440\u0430\u0431\u043E\u0442\u0430\u043B:", fallbackError);
        }
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A OpenRouter: \u0414\u043B\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0445 \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 'Allow inputs and outputs to be used for model training' \u043D\u0430 https://openrouter.ai/settings/privacy`,
          topAlternatives
        };
      }
      return {
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: `\u041E\u0448\u0438\u0431\u043A\u0430 AI: ${error.message}`,
        topAlternatives
      };
    }
  }
  /**
   * Нормализация имени для сравнения
   */
  static normalizeName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^а-яёa-z\s]/gi, "");
  }
  /**
   * Отбирает топ кандидатов по похожести имени
   * ВАЖНО: Использует токенное сравнение ФИО, а не подстроки!
   */
  static getTopCandidates(searchName, students, limit) {
    const normalizedSearch = this.normalizeName(searchName);
    const searchTokens = this.transliterate(normalizedSearch).split(" ").filter((t) => t.length > 1);
    console.log(`\u{1F50D} \u0422\u043E\u043A\u0435\u043D\u044B \u043F\u043E\u0438\u0441\u043A\u0430: [${searchTokens.join(", ")}]`);
    const scoredStudents = students.map((student) => {
      const normalizedStudent = this.normalizeName(student.fullName);
      const studentTokens = this.transliterate(normalizedStudent).split(" ").filter((t) => t.length > 1);
      const tokenScore = this.calculateTokenMatchScore(
        searchTokens,
        studentTokens
      );
      const levenshteinScore = this.levenshteinSimilarity(
        searchTokens.join(" "),
        studentTokens.join(" ")
      );
      const finalScore = tokenScore * 0.7 + levenshteinScore * 0.3;
      return {
        student,
        score: finalScore,
        tokenScore,
        debug: `tokens=[${studentTokens.join(",")}] tokenScore=${tokenScore.toFixed(2)}`
      };
    });
    scoredStudents.sort((a, b) => b.score - a.score);
    const minScore = 0.2;
    const filtered = scoredStudents.filter((s) => s.score >= minScore);
    console.log("\u{1F4CA} \u0422\u043E\u043F-5 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432:");
    filtered.slice(0, 5).forEach((s, i) => {
      console.log(
        `  ${i + 1}. ${s.student.fullName} (score=${s.score.toFixed(2)}, ${s.debug})`
      );
    });
    return filtered.slice(0, limit).map((s) => ({
      ...s.student,
      matchScore: Math.round(s.score * 100),
      // Конвертируем 0-1 в 0-100
      matchDebug: s.debug
    }));
  }
  /**
   * Преобразует StudentWithMatchInfo[] в формат topAlternatives
   * {student: Student, matchScore: number}[]
   */
  static convertToTopAlternatives(students) {
    return students.map((s) => {
      const { matchScore, matchDebug, ...studentData } = s;
      return {
        student: studentData,
        matchScore: matchScore || 0
      };
    });
  }
  /**
   * Вычисляет скор совпадения токенов ФИО (0..1)
   *
   * Логика:
   * - Каждый токен из поиска пытаемся найти в токенах студента
   * - Сравнение токенов: точное совпадение = 1.0, похожие = Левенштейн
   * - ВАЖНО: "Usman" != "Usmanovich" (частичное вхождение НЕ считается)
   * - Учитываем, сколько токенов совпало
   */
  static calculateTokenMatchScore(searchTokens, studentTokens) {
    if (searchTokens.length === 0 || studentTokens.length === 0) {
      return 0;
    }
    let totalScore = 0;
    let matchedCount = 0;
    for (const searchToken of searchTokens) {
      let bestMatchScore = 0;
      for (const studentToken of studentTokens) {
        if (searchToken === studentToken) {
          bestMatchScore = 1;
          break;
        }
        const lenDiff = Math.abs(searchToken.length - studentToken.length);
        if (lenDiff <= 2) {
          const similarity = this.levenshteinSimilarity(
            searchToken,
            studentToken
          );
          if (similarity > 0.8 && similarity > bestMatchScore) {
            bestMatchScore = similarity;
          }
        }
      }
      if (bestMatchScore > 0) {
        matchedCount++;
        totalScore += bestMatchScore;
      }
    }
    const matchRatio = matchedCount / searchTokens.length;
    const avgQuality = matchedCount > 0 ? totalScore / matchedCount : 0;
    return matchRatio * avgQuality;
  }
  /**
   * Вычисляет схожесть строк по Левенштейну (0..1)
   */
  static levenshteinSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) {
      return 1;
    }
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  /**
   * Расстояние Левенштейна
   */
  static levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
  }
  /**
   * Проверка доступности AI API
   */
  static async checkAvailability() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === "your_api_key_here") {
        return false;
      }
      const client = this.initAPI();
      await client.chat.completions.create({
        model: process.env.USE_OPENROUTER === "true" ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5
      });
      console.log("\u2705 AI API \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
      return true;
    } catch (error) {
      console.warn("\u26A0\uFE0F AI API \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D:", error.message);
      return false;
    }
  }
  /**
   * Batch-сопоставление студентов для нескольких сертификатов
   *
   * Оптимизации:
   * - Единый запрос к БД для всех имен (вместо N запросов)
   * - Один AI-запрос с массивом (вместо N запросов)
   * - Возвращает топ-5 кандидатов для каждого сертификата
   * - Graceful degradation при ошибках
   *
   * @param extractedDataArray - Массив извлеченных данных из сертификатов
   * @param students - Все студенты из БД
   * @returns Массив результатов сопоставления с топ-5 для каждого
   */
  static async batchMatchStudents(extractedDataArray, students) {
    console.log(
      `\u{1F50D} \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C batch-\u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043B\u044F ${extractedDataArray.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432...`
    );
    console.log(`\u{1F465} \u0412\u0441\u0435\u0433\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u0432 \u0431\u0430\u0437\u0435: ${students.length}`);
    if (extractedDataArray.length === 0 || students.length === 0) {
      return extractedDataArray.map(() => ({
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430",
        topAlternatives: []
      }));
    }
    const results = [];
    for (let i = 0; i < extractedDataArray.length; i++) {
      const extractedData = extractedDataArray[i];
      console.log(
        `
\u{1F4C4} \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${i + 1}/${extractedDataArray.length}: ${extractedData.fullName}`
      );
      if (extractedData.pinfl) {
        const pinflMatch = this.findByPINFL(extractedData.pinfl, students);
        if (pinflMatch) {
          console.log("\u2705 \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0442\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043F\u043E \u041F\u0418\u041D\u0424\u041B");
          const candidates = this.getTopCandidates(
            extractedData.fullName,
            students.filter((s) => s.id !== pinflMatch.student?.id),
            5
          );
          const topAlternatives = this.convertToTopAlternatives(candidates);
          results.push({
            ...pinflMatch,
            topAlternatives
          });
          continue;
        }
      }
      const smartMatch = this.findBySmartName(extractedData.fullName, students);
      if (smartMatch) {
        console.log("\u2705 \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043F\u043E \u0424\u0418\u041E");
        const candidates = this.getTopCandidates(
          extractedData.fullName,
          students.filter((s) => s.id !== smartMatch.student?.id),
          5
        );
        const topAlternatives = this.convertToTopAlternatives(candidates);
        results.push({
          ...smartMatch,
          topAlternatives
        });
        continue;
      }
      console.log("\u{1F916} \u0417\u0430\u043F\u0443\u0441\u043A AI-\u043F\u043E\u0438\u0441\u043A\u0430...");
      const aiMatch = await this.findByAI(extractedData, students);
      results.push(aiMatch);
    }
    console.log(
      `
\u2705 Batch-\u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E: ${results.filter((r) => r.student).length}/${extractedDataArray.length} \u043D\u0430\u0439\u0434\u0435\u043D\u043E`
    );
    return results;
  }
  /**
   * Оптимизированный batch-поиск с единым AI-запросом (экспериментально)
   *
   * ВНИМАНИЕ: Этот метод делает ОДИН AI-запрос для всех сертификатов сразу.
   * Это экономит токены и время, но может быть менее точным для больших batch'ей.
   * Используйте batchMatchStudents для более надежного результата.
   *
   * @param extractedDataArray - Массив извлеченных данных
   * @param students - Все студенты из БД
   * @returns Массив результатов сопоставления
   */
  static async batchMatchStudentsOptimized(extractedDataArray, students) {
    console.log(
      `\u{1F680} \u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 batch-\u043F\u043E\u0438\u0441\u043A \u0434\u043B\u044F ${extractedDataArray.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432...`
    );
    if (extractedDataArray.length === 0 || students.length === 0) {
      return extractedDataArray.map(() => ({
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430",
        topAlternatives: []
      }));
    }
    const certificatesWithCandidates = extractedDataArray.map(
      (extractedData, index) => {
        const candidates = this.getTopCandidates(
          extractedData.fullName,
          students,
          20
        );
        return {
          index,
          extractedData,
          candidates
        };
      }
    );
    const systemPrompt = `\u0422\u044B \u044D\u043A\u0441\u043F\u0435\u0440\u0442 \u043F\u043E \u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u044E \u0424\u0418\u041E \u043B\u044E\u0434\u0435\u0439. \u0422\u0432\u043E\u044F \u0437\u0430\u0434\u0430\u0447\u0430 - \u0434\u043B\u044F \u041A\u0410\u0416\u0414\u041E\u0413\u041E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0430\u0439\u0442\u0438 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432.

\u041A\u0420\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0418 \u0412\u0410\u0416\u041D\u042B\u0415 \u041F\u0420\u0410\u0412\u0418\u041B\u0410:
1. \u0424\u0410\u041C\u0418\u041B\u0418\u042F \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0442\u044C!
2. \u0418\u041C\u042F \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0442\u044C!
3. \u0422\u0440\u0430\u043D\u0441\u043B\u0438\u0442\u0435\u0440\u0430\u0446\u0438\u044F \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F (\u0418\u0432\u0430\u043D\u043E\u0432 = Ivanov)
4. \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u043B\u043E\u0432 \u043D\u0435 \u0432\u0430\u0436\u0435\u043D (Ivanov Sergey = Sergey Ivanov)
5. \u041C\u0435\u043B\u043A\u0438\u0435 \u043E\u043F\u0435\u0447\u0430\u0442\u043A\u0438 OCR \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u044E\u0442\u0441\u044F
6. \u041D\u0415 \u0421\u041E\u041F\u041E\u0421\u0422\u0410\u0412\u041B\u042F\u0419 \u0435\u0441\u043B\u0438 \u0444\u0430\u043C\u0438\u043B\u0438\u0438 \u0438\u043B\u0438 \u0438\u043C\u0435\u043D\u0430 \u0420\u0410\u0417\u041D\u042B\u0415

\u0424\u041E\u0420\u041C\u0410\u0422 \u041E\u0422\u0412\u0415\u0422\u0410 (\u0422\u041E\u041B\u042C\u041A\u041E JSON):
{
  "matches": [
    {
      "certificateIndex": 0,
      "candidateIndex": 2,
      "confidence": 0.95,
      "reasoning": "\u043E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435"
    },
    ...
  ]
}

\u0415\u0441\u043B\u0438 \u0434\u043B\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435\u0442 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u0430, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439:
{
  "certificateIndex": N,
  "candidateIndex": null,
  "confidence": 0,
  "reasoning": "\u043F\u0440\u0438\u0447\u0438\u043D\u0430"
}`;
    const certificatesDescription = certificatesWithCandidates.map((cert, i) => {
      const candidatesList = cert.candidates.map((c, idx) => `    ${idx}. ${c.fullName}`).join("\n");
      return `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${i}:
  \u0424\u0418\u041E: "${cert.extractedData.fullName}"
  \u041A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u044B:
${candidatesList}`;
    }).join("\n\n");
    const userPrompt = `\u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u044C \u043A\u0430\u0436\u0434\u044B\u0439 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u043C \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u043C:

${certificatesDescription}`;
    try {
      const client = await this.initAPIAsync();
      const model = this.currentConfig?.textModel || process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo";
      console.log(`\u{1F916} \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 batch-\u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u0432 AI (\u043C\u043E\u0434\u0435\u043B\u044C: ${model})...`);
      const startTime = Date.now();
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: this.currentConfig?.temperature || 0.1,
        max_tokens: Math.min(
          this.currentConfig?.maxTokens || 1e3,
          extractedDataArray.length * 100
        ),
        response_format: { type: "json_object" }
      });
      const duration = Date.now() - startTime;
      console.log(`\u23F1\uFE0F AI \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u0437\u0430 ${duration}\u043C\u0441`);
      console.log("\u{1F4B0} \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432:", completion.usage?.total_tokens);
      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error("\u041F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 AI");
      }
      const aiResponse = JSON.parse(responseText);
      const matches = aiResponse.matches || [];
      const results = extractedDataArray.map(
        (extractedData, certIndex) => {
          const match = matches.find(
            (m) => m.certificateIndex === certIndex
          );
          if (!match || match.candidateIndex === null) {
            const candidates2 = certificatesWithCandidates[certIndex].candidates.slice(0, 5);
            const topAlternatives2 = this.convertToTopAlternatives(candidates2);
            return {
              student: null,
              confidence: 0,
              matchMethod: "none",
              explanation: match?.reasoning || "AI \u043D\u0435 \u043D\u0430\u0448\u0435\u043B \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439",
              topAlternatives: topAlternatives2
            };
          }
          const candidateIndex = parseInt(match.candidateIndex);
          const candidates = certificatesWithCandidates[certIndex].candidates;
          if (candidateIndex < 0 || candidateIndex >= candidates.length) {
            const topAlternatives2 = this.convertToTopAlternatives(
              candidates.slice(0, 5)
            );
            return {
              student: null,
              confidence: 0,
              matchMethod: "none",
              explanation: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u043E\u0442 AI",
              topAlternatives: topAlternatives2
            };
          }
          const foundStudent = candidates[candidateIndex];
          const alternativeCandidates = candidates.filter((c) => c.id !== foundStudent.id).slice(0, 5);
          const topAlternatives = this.convertToTopAlternatives(
            alternativeCandidates
          );
          return {
            student: foundStudent,
            confidence: match.confidence || 0.8,
            matchMethod: "fuzzy_ai",
            explanation: match.reasoning || "AI-\u0441\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
            topAlternatives
          };
        }
      );
      console.log(
        `\u2705 Batch-\u043F\u043E\u0438\u0441\u043A \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D: ${results.filter((r) => r.student).length}/${extractedDataArray.length} \u043D\u0430\u0439\u0434\u0435\u043D\u043E`
      );
      return results;
    } catch (error) {
      console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 batch AI-\u043F\u043E\u0438\u0441\u043A\u0430:", error.message);
      console.log("\u{1F504} Fallback \u043D\u0430 \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u043C\u0435\u0442\u043E\u0434...");
      return this.batchMatchStudents(extractedDataArray, students);
    }
  }
}

const studentMatcher = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  StudentMatcher: StudentMatcher
}, Symbol.toStringTag, { value: 'Module' }));

const IMAGE_CONFIG = {
  width: 1600,
  // Высокое разрешение для OCR
  quality: 85,
  format: "jpeg"
  // Vision API хорошо работает с JPEG
};
let browserInstance = null;
let browserCloseTimeout = null;
async function getBrowser() {
  if (browserCloseTimeout) {
    clearTimeout(browserCloseTimeout);
    browserCloseTimeout = null;
  }
  if (!browserInstance) {
    const puppeteer = await import('puppeteer');
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        // Важно для Docker/Serverless
        "--font-render-hinting=none"
        // Улучшает четкость текста
      ]
    });
  }
  browserCloseTimeout = setTimeout(async () => {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
  }, 6e4);
  return browserInstance;
}
const pdfConverter = {
  /**
   * Извлекает текст из PDF
   * Использует Puppeteer + PDF.js для надежного извлечения текста
   * Взамен проблемного pdf-parse
   */
  async extractText(filePath) {
    const browser = await getBrowser();
    let page = null;
    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfBase64 = pdfBytes.toString("base64");
      page = await browser.newPage();
      await page.setContent(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
          <script>
            // \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0432\u043E\u0440\u043A\u0435\u0440\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          <\/script>
        </head>
        <body></body>
        </html>
      `,
        { waitUntil: "domcontentloaded" }
      );
      const text = await page.evaluate(async (pdfData) => {
        try {
          const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
          const pdfDoc = await loadingTask.promise;
          const numPages = pdfDoc.numPages;
          let fullText = "";
          for (let i = 1; i <= numPages; i++) {
            const page2 = await pdfDoc.getPage(i);
            const textContent = await page2.getTextContent();
            const pageStrings = textContent.items.map((item) => item.str);
            fullText += pageStrings.join(" ") + "\n\n";
          }
          return fullText;
        } catch (e) {
          return "Error inside page evaluate: " + e.toString();
        }
      }, pdfBase64);
      return text.trim();
    } catch (error) {
      console.error("[AI PDF] Text extraction failed:", error);
      return "";
    } finally {
      if (page) await page.close();
    }
  },
  /**
   * Конвертирует первую страницу PDF в изображение для Vision API
   */
  async convertFirstPageToImage(filePath) {
    const browser = await getBrowser();
    let page = null;
    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfBase64 = pdfBytes.toString("base64");
      page = await browser.newPage();
      await page.setViewport({ width: IMAGE_CONFIG.width, height: 1200 });
      await page.setContent(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          <\/script>
          <style>
            body { margin: 0; overflow: hidden; background: white; }
            canvas { display: block; }
          </style>
        </head>
        <body>
          <canvas id="the-canvas"></canvas>
        </body>
        </html>
      `,
        { waitUntil: "domcontentloaded" }
      );
      await page.evaluate(async (pdfData) => {
        const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1);
        const viewport = pdfPage.getViewport({ scale: 2 });
        const canvas = document.getElementById("the-canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await pdfPage.render({
          canvasContext: context,
          viewport,
          enableWebHost: false
        }).promise;
      }, pdfBase64);
      const canvasElement = await page.$("#the-canvas");
      if (!canvasElement) {
        throw new Error("Canvas rendering failed");
      }
      const screenshot = await canvasElement.screenshot({
        type: "jpeg",
        quality: 90
      });
      const optimizedBuffer = await sharp(screenshot).resize(IMAGE_CONFIG.width, null, {
        fit: "inside",
        withoutEnlargement: true
      }).jpeg({ quality: IMAGE_CONFIG.quality }).toBuffer();
      return optimizedBuffer;
    } catch (error) {
      console.error("[AI PDF] Image conversion failed:", error);
      throw new Error(
        `Failed to convert PDF to image: ${error.message}`
      );
    } finally {
      if (page) await page.close();
    }
  },
  /**
   * Получает количество страниц
   */
  async getPageCount(filePath) {
    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      return pdfDoc.getPageCount();
    } catch {
      return 1;
    }
  }
};

export { CertificateAIProcessor as C, StudentMatcher as S, pdfConverter as p, studentMatcher as s };
//# sourceMappingURL=pdfConverter.mjs.map
