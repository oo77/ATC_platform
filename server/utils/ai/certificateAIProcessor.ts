import type {
  ExtractedCertificateData,
  TokenUsage,
} from "../../types/aiCertificateImport";
import OpenAI from "openai";

/**
 * Утилита для обработки сертификатов с помощью OpenAI GPT-4 Vision
 * Адаптировано для ATC Platform из AI-Certificate проекта
 * Поддерживает как OpenAI, так и OpenRouter API
 */

export class CertificateAIProcessor {
  private static client: OpenAI | null = null;
  private static currentSettingId: string | null = null;
  private static currentConfig: {
    maxTokens: number;
    temperature: number;
    visionModel: string;
    textModel: string;
  } | null = null;

  /**
   * Получить настройки AI (из БД или .env)
   * Приоритет: БД > .env
   */
  private static async getAIConfig(): Promise<{
    apiKey: string;
    provider: string;
    baseUrl: string | null;
    visionModel: string;
    textModel: string;
    maxTokens: number;
    temperature: number;
    settingId: string | null;
  }> {
    try {
      // Пробуем получить настройки из БД
      const { aiSettingsRepository } =
        await import("../../repositories/aiSettingsRepository");
      const dbSettings = await aiSettingsRepository.getDefault();

      if (dbSettings) {
        // Получаем расшифрованный ключ
        const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
          dbSettings.id,
        );

        if (decryptedKey) {
          console.log(
            `🔧 AI Config: Используем настройки из БД (${dbSettings.apiKeyName || dbSettings.provider})`,
          );
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
      // БД может быть ещё не готова (миграция не выполнена)
      console.log("⚠️ AI Settings из БД недоступны, используем .env");
    }

    // Fallback на .env
    const apiKey = process.env.OPENAI_API_KEY;
    const useOpenRouter = process.env.USE_OPENROUTER === "true";

    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error(
        "AI API не настроен. Добавьте ключ через Настройки > AI Настройки или в файл .env",
      );
    }

    console.log("🔧 AI Config: Используем настройки из .env");
    return {
      apiKey,
      provider: useOpenRouter ? "openrouter" : "openai",
      baseUrl: useOpenRouter ? "https://openrouter.ai/api/v1" : null,
      visionModel: process.env.OPENAI_VISION_MODEL || "openai/gpt-4o",
      textModel: process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo",
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1500"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.1"),
      settingId: null,
    };
  }

  /**
   * Инициализация OpenAI/OpenRouter API
   * Поддерживает настройки из БД и fallback на .env
   */
  private static async initAPIAsync(): Promise<OpenAI> {
    const config = await this.getAIConfig();
    this.currentSettingId = config.settingId;

    // Сохраняем конфигурацию для использования в запросах
    this.currentConfig = {
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      visionModel: config.visionModel,
      textModel: config.textModel,
    };

    // Создаём клиент в зависимости от провайдера
    if (
      config.provider === "openrouter" ||
      config.baseUrl?.includes("openrouter")
    ) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "ATC Platform - Certificate AI Import",
        },
      });
      console.log("✅ OpenRouter API инициализирован");
    } else if (config.provider === "anthropic") {
      // Для Anthropic используем их API через OpenAI-совместимый интерфейс
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || "https://api.anthropic.com/v1",
      });
      console.log("✅ Anthropic API инициализирован");
    } else if (config.provider === "custom" && config.baseUrl) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
      console.log("✅ Custom API инициализирован:", config.baseUrl);
    } else {
      // OpenAI по умолчанию
      this.client = new OpenAI({
        apiKey: config.apiKey,
      });
      console.log("✅ OpenAI API инициализирован");
    }

    return this.client;
  }

  /**
   * Синхронная инициализация (legacy, использует .env)
   * @deprecated Используйте initAPIAsync для поддержки настроек из БД
   */
  private static initAPI(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      const useOpenRouter = process.env.USE_OPENROUTER === "true";

      if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error(
          "OPENAI_API_KEY не настроен. Получите ключ на https://platform.openai.com/api-keys " +
            "или https://openrouter.ai/keys и добавьте в файл .env",
        );
      }

      // Если используем OpenRouter
      if (useOpenRouter) {
        this.client = new OpenAI({
          apiKey: apiKey,
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
            "X-Title": "ATC Platform - Certificate AI Import",
          },
        });
        console.log("✅ OpenRouter API инициализирован (legacy)");
      } else {
        // Обычный OpenAI
        this.client = new OpenAI({
          apiKey: apiKey,
        });
        console.log("✅ OpenAI API инициализирован (legacy)");
      }
    }

    return this.client;
  }

  /**
   * Получить текущий settingId (для логирования использования)
   */
  static getCurrentSettingId(): string | null {
    return this.currentSettingId;
  }

  /**
   * Сбросить клиент (для переинициализации после изменения настроек)
   */
  static resetClient(): void {
    this.client = null;
    this.currentSettingId = null;
    this.currentConfig = null;
    console.log("🔄 AI Client сброшен");
  }

  /**
   * Обработать файл сертификата (изображение или PDF)
   */
  static async processCertificate(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<{
    extractedData: ExtractedCertificateData;
    tokensUsed: TokenUsage;
    processingTime: number;
  }> {
    try {
      console.log("🔍 Начинаем обработку сертификата:", filename, mimeType);
      const startTime = Date.now();

      let base64Image: string;
      let imageType: string;

      // Проверяем тип файла
      if (mimeType === "application/pdf") {
        console.log("📄 Обнаружен PDF файл");
        // TODO: Реализовать конвертацию PDF в изображение
        // Пока используем прямой анализ (если PDF содержит текст)
        throw new Error(
          "PDF файлы пока не поддерживаются. Используйте изображения (JPG/PNG)",
        );
      } else {
        // Обычное изображение
        console.log("🖼️ Обнаружено изображение, конвертируем в base64...");
        base64Image = fileBuffer.toString("base64");
        imageType = mimeType.includes("png") ? "image/png" : "image/jpeg";
        console.log("📸 Изображение конвертировано в base64");
      }

      console.log("📏 Размер файла:", fileBuffer.length, "байт");

      // Анализируем изображение с помощью GPT-4 Vision
      const result = await this.analyzeImageWithVision(base64Image, imageType);

      const processingTime = Date.now() - startTime;
      console.log(`✅ AI обработка завершена за ${processingTime}мс`);

      return {
        extractedData: result.extractedData,
        tokensUsed: result.tokensUsed,
        processingTime,
      };
    } catch (error: any) {
      console.error("❌ Ошибка при обработке сертификата:", error);
      throw new Error(`Не удалось обработать сертификат: ${error.message}`);
    }
  }

  /**
   * Анализ изображения с помощью GPT-4 Vision
   */
  private static async analyzeImageWithVision(
    base64Image: string,
    imageType: string,
  ): Promise<{
    extractedData: ExtractedCertificateData;
    tokensUsed: TokenUsage;
  }> {
    try {
      console.log("🤖 Запуск GPT-4 Vision для анализа сертификата...");

      // Используем асинхронную инициализацию для поддержки настроек из БД
      const client = await this.initAPIAsync();

      // Проверяем, что модель поддерживает Vision
      const visionModel =
        this.currentConfig?.visionModel ||
        process.env.OPENAI_VISION_MODEL ||
        "openai/gpt-4o";

      // Список ключевых слов для Vision-моделей
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
        "free", // Разрешаем бесплатные модели, так как они могут быть мультимодальными
      ];

      const isVisionCapable = visionCapablePatterns.some((pattern) =>
        visionModel.toLowerCase().includes(pattern.toLowerCase()),
      );

      if (!isVisionCapable) {
        console.error(
          `❌ Модель "${visionModel}" не поддерживает анализ изображений!`,
        );
        console.error(
          `   ➡️ Измените Vision Model в настройках AI на одну из:`,
        );
        console.error(`      • openai/gpt-4o (рекомендуется)`);
        console.error(`      • openai/gpt-4-vision-preview`);
        console.error(`      • google/gemini-pro-vision`);

        throw new Error(
          `Модель "${visionModel}" не поддерживает анализ изображений. ` +
            `Измените Vision Model в Настройках AI на "openai/gpt-4o" или другую Vision-модель.`,
        );
      }

      const systemPrompt = `Ты эксперт по анализу сертификатов. Твоя задача - извлечь из изображения сертификата следующую информацию:

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ:
1. **fullName** - Полное имя человека (Фамилия Имя или Фамилия Имя Отчество)
   - Может быть на русском (Иванов Сергей Петрович) или английском (IVANOV SERGEY)
   - Обычно находится после слов "THAT", "ЧТО", "НАСТОЯЩИМ ПОДТВЕРЖДАЕТСЯ"
   
2. **certificateNumber** - Номер сертификата
   - Формат: буквы и цифры (например: ATC25_APAP_176, AV-2024-001234)
   - Обычно находится в верхней части или внизу сертификата
   
3. **issueDate** - Дата выдачи сертификата
   - Формат ОБЯЗАТЕЛЬНО: YYYY-MM-DD (например: 2025-12-27)
   - Может быть написана как DD.MM.YYYY или DD/MM/YYYY - преобразуй в YYYY-MM-DD
   
4. **organization** - Организация, выдавшая сертификат
   - Полное название организации (например: "Учебный центр АТС")
   
5. **courseName** - Название курса/программы обучения
   - Полное название курса

ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (если есть):
- **expiryDate** - Дата истечения срока действия (формат: YYYY-MM-DD)
- **courseHours** - Количество часов курса (число)
- **position** - Должность слушателя
- **department** - Отдел/подразделение
- **pinfl** - ПИНФЛ (14-значный идентификатор)

ВАЖНО:
- Если поле не найдено - оставь его пустым (не придумывай!)
- Будь внимателен к транслитерации (IVANOV = Иванов)
- Даты ОБЯЗАТЕЛЬНО в формате YYYY-MM-DD
- Уверенность (confidence) от 0 до 1 (насколько ты уверен в результате)

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО JSON объект (без markdown, без дополнительного текста):
{
  "fullName": "Фамилия Имя Отчество",
  "certificateNumber": "номер",
  "issueDate": "YYYY-MM-DD",
  "organization": "название организации",
  "courseName": "название курса",
  "expiryDate": "YYYY-MM-DD",
  "courseHours": 72,
  "position": "должность",
  "department": "отдел",
  "pinfl": "12345678901234",
  "confidence": 0.95,
  "rawText": "краткое описание что видно на сертификате"
}`;

      console.log("📤 Отправка запроса в GPT-4 Vision...");
      const requestStartTime = Date.now();

      // Используем модель из настроек (БД или .env)
      // currentConfig заполняется в initAPIAsync() из getAIConfig()
      const model =
        this.currentConfig?.visionModel ||
        process.env.OPENAI_VISION_MODEL ||
        "openai/gpt-4o";

      console.log(`🤖 Используемая модель: ${model}`);

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageType};base64,${base64Image}`,
                  detail: "high", // Высокое качество для лучшей точности
                },
              },
            ],
          },
        ],
        max_tokens:
          this.currentConfig?.maxTokens ||
          parseInt(process.env.OPENAI_MAX_TOKENS || "1500"),
        temperature:
          this.currentConfig?.temperature ||
          parseFloat(process.env.OPENAI_TEMPERATURE || "0.1"),
      });

      const requestDuration = Date.now() - requestStartTime;
      console.log(`⏱️ GPT-4 Vision ответил за ${requestDuration}мс`);

      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log(
        "📥 Ответ GPT-4 Vision:",
        responseText?.substring(0, 200) + "...",
      );

      if (!responseText) {
        throw new Error("Пустой ответ от GPT-4 Vision");
      }

      // Логируем использование токенов для мониторинга расходов
      const tokensUsed: TokenUsage = {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      };

      console.log("💰 Использовано токенов:", {
        ...tokensUsed,
        estimatedCost: this.estimateCost(tokensUsed.total),
      });

      // Парсим JSON ответ
      let extractedData: any;
      try {
        // Извлекаем JSON из ответа (может быть обернут в markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("JSON не найден в ответе");
        }
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (parseError: any) {
        console.error(
          "❌ Ошибка парсинга ответа GPT-4 Vision:",
          parseError.message,
        );
        console.error("Ответ был:", responseText);
        throw new Error("Не удалось распознать данные из сертификата");
      }

      // Валидация и нормализация данных
      const result: ExtractedCertificateData = {
        fullName: extractedData.fullName || "",
        certificateNumber: extractedData.certificateNumber || "",
        issueDate: extractedData.issueDate || "",
        expiryDate: extractedData.expiryDate,
        organization: extractedData.organization || "",
        courseName: extractedData.courseName || "",
        courseHours: extractedData.courseHours
          ? parseInt(extractedData.courseHours)
          : undefined,
        position: extractedData.position,
        department: extractedData.department,
        pinfl: extractedData.pinfl,
        confidence: extractedData.confidence || 0.85,
        rawText: extractedData.rawText || "Analyzed by GPT-4 Vision",
      };

      return {
        extractedData: result,
        tokensUsed,
      };
    } catch (error: any) {
      console.error("❌ Ошибка при работе с GPT-4 Vision:", error.message);

      // Логируем ошибку API с детальной классификацией
      await this.logApiError(error);

      throw error;
    }
  }

  /**
   * Логирование ошибок API с классификацией типа ошибки
   */
  private static async logApiError(error: any): Promise<void> {
    try {
      // Динамический импорт репозитория для избежания циклических зависимостей
      const { aiSettingsRepository } =
        await import("../../repositories/aiSettingsRepository");

      const message = error.message || String(error);
      let errorCode = "unknown";
      let errorType:
        | "rate_limit"
        | "insufficient_credits"
        | "invalid_key"
        | "model_error"
        | "network"
        | "other" = "other";
      let tokensRequested: number | undefined;
      let tokensAvailable: number | undefined;

      // Определяем тип ошибки на основе сообщения или кода статуса
      if (
        message.includes("402") ||
        message.includes("credits") ||
        message.includes("afford")
      ) {
        errorCode = "402";
        errorType = "insufficient_credits";

        // Парсим количество токенов из сообщения об ошибке
        // Пример: "You requested up to 1500 tokens, but can only afford 1349"
        const requestedMatch = message.match(/requested up to (\d+) tokens/);
        const availableMatch = message.match(/can only afford (\d+)/);

        if (requestedMatch) tokensRequested = parseInt(requestedMatch[1]);
        if (availableMatch) tokensAvailable = parseInt(availableMatch[1]);

        console.error(
          `💰 Ошибка 402: Недостаточно кредитов. Запрошено: ${tokensRequested}, Доступно: ${tokensAvailable}`,
        );
        console.error(
          `   ➡️ Пополните баланс на https://openrouter.ai/settings/credits`,
        );
      } else if (
        message.includes("401") ||
        message.includes("Unauthorized") ||
        message.includes("invalid_api_key")
      ) {
        errorCode = "401";
        errorType = "invalid_key";
        console.error("🔑 Ошибка 401: Неверный API ключ");
      } else if (
        message.includes("429") ||
        message.includes("rate") ||
        message.includes("Too Many Requests")
      ) {
        errorCode = "429";
        errorType = "rate_limit";
        console.error("⏱️ Ошибка 429: Превышен лимит запросов");
      } else if (
        message.includes("ECONNREFUSED") ||
        message.includes("network") ||
        message.includes("ETIMEDOUT")
      ) {
        errorCode = "network_error";
        errorType = "network";
        console.error("🌐 Сетевая ошибка при подключении к API");
      } else if (
        message.includes("model") ||
        message.includes("does not exist")
      ) {
        errorCode = "model_not_found";
        errorType = "model_error";
        console.error("🤖 Ошибка модели: модель не найдена или недоступна");
      }

      // Сохраняем ошибку в БД для мониторинга
      await aiSettingsRepository.logApiError({
        errorCode,
        errorType,
        errorMessage: message,
        model:
          this.currentConfig?.visionModel ||
          process.env.OPENAI_VISION_MODEL ||
          "openai/gpt-4o",
        tokensRequested,
        tokensAvailable,
      });
    } catch (logError) {
      // Не прерываем выполнение из-за ошибки логирования
      console.error("⚠️ Не удалось записать ошибку в лог:", logError);
    }
  }

  /**
   * Оценка стоимости запроса
   * Возвращает стоимость в USD
   */
  static estimateCost(totalTokens: number): number {
    // GPT-4o pricing (OpenAI):
    // Input: $5 per 1M tokens
    // Output: $15 per 1M tokens
    // Примерно $10 per 1M tokens в среднем

    // OpenRouter может иметь другие цены, но используем эту оценку
    const costPer1MTokens = 10;
    const cost = (totalTokens / 1000000) * costPer1MTokens;
    return parseFloat(cost.toFixed(6));
  }

  /**
   * Валидация извлечённых данных
   */
  static validateExtractedData(data: ExtractedCertificateData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.fullName || data.fullName.trim().length < 3) {
      errors.push("Не удалось определить ФИО");
    }

    if (!data.certificateNumber || data.certificateNumber.trim().length < 3) {
      errors.push("Не удалось определить номер сертификата");
    }

    if (!data.issueDate) {
      errors.push("Не удалось определить дату выдачи");
    } else {
      // Проверяем формат даты
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.issueDate)) {
        errors.push("Неверный формат даты выдачи (требуется YYYY-MM-DD)");
      }
    }

    if (!data.organization || data.organization.trim().length < 3) {
      errors.push("Не удалось определить выдавшую организацию");
    }

    if (!data.courseName || data.courseName.trim().length < 3) {
      errors.push("Не удалось определить название курса");
    }

    if (data.confidence < 0.5) {
      errors.push("Низкая уверенность в распознанных данных (< 50%)");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
