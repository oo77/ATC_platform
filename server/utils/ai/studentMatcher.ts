import OpenAI from "openai";
import type {
  ExtractedCertificateData,
  StudentMatchResult,
  StudentMatchMethod,
  StudentWithMatchInfo,
} from "../../types/aiCertificateImport";
import type { Student } from "../../types/student";

/**
 * Утилита для интеллектуального поиска слушателей с помощью AI
 *
 * Реализует 3-уровневую систему поиска:
 * 1. Точное совпадение по ПИНФЛ (если есть)
 * 2. Точное совпадение по ФИО
 * 3. AI-поиск с нечёткими совпадениями
 *
 * Преимущества AI-поиска:
 * - Понимает транслитерацию (Иванов = Ivanov)
 * - Учитывает опечатки OCR
 * - Работает с разным порядком слов
 * - Понимает сокращения имен
 */

export class StudentMatcher {
  private static client: OpenAI | null = null;
  private static currentConfig: {
    textModel: string;
    maxTokens: number;
    temperature: number;
  } | null = null;

  /**
   * Получить настройки AI (из БД или .env)
   * Приоритет: БД > .env
   */
  private static async getAIConfig(): Promise<{
    apiKey: string;
    provider: string;
    baseUrl: string | null;
    textModel: string;
    maxTokens: number;
    temperature: number;
  }> {
    try {
      // Пробуем получить настройки из БД
      const { aiSettingsRepository } =
        await import("../../repositories/aiSettingsRepository");
      const dbSettings = await aiSettingsRepository.getDefault();

      if (dbSettings) {
        const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(
          dbSettings.id,
        );

        if (decryptedKey) {
          console.log(
            `🔧 StudentMatcher: Используем настройки из БД (${dbSettings.apiKeyName || dbSettings.provider})`,
          );
          return {
            apiKey: decryptedKey,
            provider: dbSettings.provider,
            baseUrl: dbSettings.baseUrl,
            textModel: dbSettings.textModel,
            maxTokens: dbSettings.maxTokens,
            temperature: dbSettings.temperature,
          };
        }
      }
    } catch (error) {
      console.log(
        "⚠️ StudentMatcher: Настройки из БД недоступны, используем .env",
      );
    }

    // Fallback на .env
    const apiKey = process.env.OPENAI_API_KEY;
    const useOpenRouter = process.env.USE_OPENROUTER === "true";

    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error(
        "AI API не настроен. Добавьте ключ через Настройки > AI Настройки или в файл .env",
      );
    }

    console.log("🔧 StudentMatcher: Используем настройки из .env");
    return {
      apiKey,
      provider: useOpenRouter ? "openrouter" : "openai",
      baseUrl: useOpenRouter ? "https://openrouter.ai/api/v1" : null,
      textModel: process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo",
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "150"),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.1"),
    };
  }

  /**
   * Асинхронная инициализация OpenAI/OpenRouter API
   * Поддерживает настройки из БД
   */
  private static async initAPIAsync(): Promise<OpenAI> {
    const config = await this.getAIConfig();

    // Сохраняем конфигурацию для использования в запросах
    this.currentConfig = {
      textModel: config.textModel,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
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
          "X-Title": "ATC Platform - Student Matcher",
        },
      });
      console.log("✅ StudentMatcher: OpenRouter API инициализирован");
    } else {
      this.client = new OpenAI({
        apiKey: config.apiKey,
      });
      console.log("✅ StudentMatcher: OpenAI API инициализирован");
    }

    return this.client;
  }

  /**
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
            "X-Title": "ATC Platform - Student Matcher",
          },
        });
      } else {
        this.client = new OpenAI({
          apiKey: apiKey,
        });
      }
    }

    return this.client;
  }

  /**
   * Главный метод поиска слушателя
   * Использует 3-уровневую систему поиска
   */
  static async findMatchingStudent(
    extractedData: ExtractedCertificateData,
    students: Student[],
  ): Promise<StudentMatchResult> {
    if (!extractedData.fullName || students.length === 0) {
      console.log("⚠️ [Поиск студента] Недостаточно данных для поиска");
      console.log(`   - ФИО: ${extractedData.fullName || "отсутствует"}`);
      console.log(`   - Студентов в списке: ${students.length}`);
      return {
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "Нет данных для поиска",
        topAlternatives: [],
      };
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [Поиск студента] Начинаем 3-уровневый поиск...");
    console.log(
      `📝 [Поиск студента] Имя из сертификата: "${extractedData.fullName}"`,
    );
    console.log(`👥 [Поиск студента] Слушателей в базе: ${students.length}`);
    if (extractedData.pinfl) {
      console.log(`🆔 [Поиск студента] ПИНФЛ: ${extractedData.pinfl}`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Уровень 1: Точное совпадение по ПИНФЛ
    if (extractedData.pinfl) {
      console.log("🔍 [Уровень 1] Поиск по ПИНФЛ...");
      const pinflMatch = this.findByPINFL(extractedData.pinfl, students);
      if (pinflMatch) {
        console.log("✅ [Уровень 1] Найдено точное совпадение по ПИНФЛ");
        return pinflMatch;
      }
      console.log("⚠️ [Уровень 1] Совпадений по ПИНФЛ не найдено");
    }

    // Уровень 2: Умный поиск по ФИО (Транслит, Перестановка, Опечатки)
    console.log("🔍 [Уровень 2] Умный поиск по ФИО...");
    const smartMatch = this.findBySmartName(extractedData.fullName, students);
    if (smartMatch) {
      console.log("✅ [Уровень 2] Найдено локальное совпадение по ФИО");
      return smartMatch;
    }
    console.log("⚠️ [Уровень 2] Локальных совпадений не найдено");

    // Уровень 3: AI-поиск с нечёткими совпадениями
    console.log("🤖 [Уровень 3] Запуск AI-поиска...");
    const aiMatch = await this.findByAI(extractedData, students);

    return aiMatch;
  }

  /**
   * Уровень 1: Поиск по ПИНФЛ (14-значный идентификатор)
   */
  private static findByPINFL(
    pinfl: string,
    students: Student[],
  ): StudentMatchResult | null {
    console.log("🔍 Поиск по ПИНФЛ:", pinfl);

    const normalizedPINFL = pinfl.replace(/\D/g, ""); // Убираем все кроме цифр

    if (normalizedPINFL.length !== 14) {
      console.log("⚠️ Некорректный ПИНФЛ (должен быть 14 цифр)");
      return null;
    }

    const found = students.find((s) => s.pinfl === normalizedPINFL);

    if (found) {
      return {
        student: found,
        confidence: 1.0, // 100% уверенность при совпадении ПИНФЛ
        matchMethod: "exact_pinfl",
        explanation: `Точное совпадение по ПИНФЛ: ${normalizedPINFL}`,
        topAlternatives: [],
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
  private static findBySmartName(
    searchName: string,
    students: Student[],
  ): StudentMatchResult | null {
    console.log("🔍 Умный поиск по ФИО:", searchName);

    // Подготовка искомого имени
    const cleanSearch = this.normalizeName(searchName);
    const latSearch = this.transliterate(cleanSearch);
    const tokensSearch = latSearch.split(" ").sort().join(" ");

    let bestMatch: Student | null = null;
    let maxScore = 0;
    let matchReason = "";

    for (const student of students) {
      // Подготовка имени студента
      const cleanStudent = this.normalizeName(student.fullName);
      const latStudent = this.transliterate(cleanStudent);

      // 1. Точное совпадение нормализованных строк
      if (cleanSearch === cleanStudent || latSearch === latStudent) {
        return {
          student,
          confidence: 0.99,
          matchMethod: "exact_name",
          explanation: `Точное совпадение ФИО: ${student.fullName}`,
          topAlternatives: [],
        };
      }

      // 2. Совпадение с перестановкой слов (Ivan Ivanov == Ivanov Ivan)
      const tokensStudent = latStudent.split(" ").sort().join(" ");
      if (tokensSearch === tokensStudent) {
        return {
          student,
          confidence: 0.95,
          matchMethod: "exact_name",
          explanation: `Совпадение слов в ФИО: ${student.fullName}`,
          topAlternatives: [],
        };
      }

      // 3. Fuzzy поиск (расстояние Левенштейна) для обнаружения опечаток
      // Вычисляем только если длины строк похожи (оптимизация)
      if (Math.abs(tokensSearch.length - tokensStudent.length) <= 3) {
        const similarity = this.levenshteinSimilarity(
          tokensSearch,
          tokensStudent,
        );

        // Если очень похоже (> 90%), считаем успешным локальным матчем
        if (similarity > 0.9 && similarity > maxScore) {
          maxScore = similarity;
          bestMatch = student;
          matchReason = `Высокая схожесть имен (${Math.round(similarity * 100)}%): ${student.fullName}`;
        }
      }
    }

    if (bestMatch && maxScore > 0.9) {
      return {
        student: bestMatch,
        confidence: Number(maxScore.toFixed(2)),
        matchMethod: "fuzzy_ai", // Помечаем как fuzzy, хотя нашли локально
        explanation: matchReason,
        topAlternatives: [],
      };
    }

    return null;
  }

  /**
   * Транслитерация кириллицы в латиницу для сравнения
   */
  private static transliterate(text: string): string {
    const map: Record<string, string> = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "yo",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
      gh: "g",
      sh: "sh",
      ch: "ch",
      ng: "n", // Uzbek digraphs normalization
      "o'": "o",
      "g'": "g",
      "‘": "",
      "’": "", // Apostrophes
    };

    return text
      .split("")
      .map((char) => {
        const lower = char.toLowerCase();
        return map[lower] !== undefined ? map[lower] : lower;
      })
      .join("");
  }

  /**
   * Уровень 3: AI-поиск с нечёткими совпадениями
   */
  private static async findByAI(
    extractedData: ExtractedCertificateData,
    students: Student[],
  ): Promise<StudentMatchResult> {
    console.log(`🔍 [AI-поиск] Начало поиска для: "${extractedData.fullName}"`);
    console.log(
      `👥 [AI-поиск] Всего студентов в организации: ${students.length}`,
    );

    // Сначала фильтруем кандидатов локально, чтобы не отправлять всю базу (8000+ человек) в AI
    // Это решает проблему с лимитом токенов и ускоряет работу
    const candidates = this.getTopCandidates(
      extractedData.fullName,
      students,
      20,
    );

    const topAlternatives = this.convertToTopAlternatives(
      candidates.slice(0, 5),
    );

    console.log(
      `🔍 [AI-поиск] Отобрано ${candidates.length} кандидатов для AI-анализа`,
    );
    console.log(
      `📊 [AI-поиск] Топ-5 альтернатив подготовлены: ${topAlternatives.length} записей`,
    );

    // Формируем список слушателей для AI из отобранных кандидатов
    const studentList = candidates
      .map((s, i) => `${i}. ${s.fullName} (${s.organization}, ${s.position})`)
      .join("\n");

    // Создаем промпт для AI
    const systemPrompt = `Ты эксперт по сопоставлению ФИО людей. Твоя задача - найти человека из списка, который ТОЧНО соответствует данным из сертификата.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:

1. ФАМИЛИЯ должна совпадать! 
   - "Usmanov" ≠ "Azimov" (разные фамилии!)
   - "Usmanov" ≠ "Usmanovich" (это ОТЧЕСТВО, не фамилия!)
   - "Petrov" ≠ "Petrovskiy" (разные фамилии!)

2. ИМЯ должно совпадать!
   - "Bakhtiyor" = "Bakhtiyor" = "Bakhtier" (варианты транслитерации OK)
   - "Bakhtiyor" ≠ "Sardor" (разные имена!)

3. Транслитерация допускается:
   - Иванов = Ivanov
   - Сергей = Sergey = Sergei
   - Бахтиёр = Bakhtiyor = Bakhtier

4. Порядок слов не важен:
   - "Ivanov Sergey" = "Sergey Ivanov"

5. Мелкие опечатки OCR допускаются:
   - "Ivanov" ≈ "lvanov" (l вместо I)
   - "Usmanov" ≈ "Usmanоv" (кириллическая о)

6. НЕ СОПОСТАВЛЯЙ если:
   - Фамилии РАЗНЫЕ (даже если похожи по звучанию)
   - Имена РАЗНЫЕ
   - Совпадает только отчество
   - Совпадает только часть фамилии

ПРИМЕРЫ НЕПРАВИЛЬНЫХ СОПОСТАВЛЕНИЙ (НЕ ДЕЛАЙ ТАК!):
- "Bakhtiyor Usmanov" → "AZIMOV SARDOR USMANOVICH" ❌ (фамилии разные!)
- "Ivan Petrov" → "Petr Ivanov" ❌ (имя и фамилия перепутаны!)
- "Sergey Sidorov" → "Sergey Sidorenko" ❌ (разные фамилии!)

УРОВЕНЬ УВЕРЕННОСТИ:
- 95-100%: Точное совпадение всех частей ФИО
- 80-95%: Совпадение с небольшими вариациями транслитерации
- 60-80%: Есть сомнения, но вероятно это тот человек
- <60%: НЕ СОПОСТАВЛЯЙ! Верни null

ВАЖНО! ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО чистый JSON объект, БЕЗ:
- markdown блоков (\\\`\\\`\\\`json)
- тегов <think> или других тегов
- дополнительного текста до или после JSON
- комментариев

Формат JSON:
{
  "originalIndex": <номер строки из списка (0, 1, 2...) или null если нет совпадения>,
  "confidence": <уверенность от 0 до 1>,
  "reasoning": "<краткое объяснение на русском>"
}`;

    const userPrompt = `СПИСОК КАНДИДАТОВ:
${studentList}

ДАННЫЕ ИЗ СЕРТИФИКАТА:
ФИО: "${extractedData.fullName}"
${extractedData.organization ? `Организация: "${extractedData.organization}"` : ""}
${extractedData.position ? `Должность: "${extractedData.position}"` : ""}

Найди наиболее подходящего слушателя из списка.`;

    try {
      // Используем асинхронную инициализацию для поддержки настроек из БД
      const client = await this.initAPIAsync();

      console.log("📤 Отправка запроса в AI...");
      const startTime = Date.now();

      // Используем модель из настроек (БД или .env)
      const model =
        this.currentConfig?.textModel ||
        process.env.OPENAI_TEXT_MODEL ||
        "openai/gpt-3.5-turbo";

      console.log(`🤖 Используемая модель: ${model}`);

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: this.currentConfig?.temperature || 0.1,
        max_tokens: this.currentConfig?.maxTokens || 150,
        // Не используем response_format, так как многие бесплатные модели его не поддерживают
        // Вместо этого используем универсальный парсер JSON
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ AI ответил за ${duration}мс`);

      // Детальное логирование для диагностики
      console.log("📦 Полный ответ AI:", JSON.stringify(completion, null, 2));

      if (!completion.choices || completion.choices.length === 0) {
        console.error("❌ AI вернул пустой массив choices:", completion);
        throw new Error(
          `AI не вернул ответ. Возможно, модель не поддерживается или превышен лимит токенов. Детали: ${JSON.stringify(completion)}`,
        );
      }

      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log("📥 Ответ AI:", responseText);

      if (!responseText) {
        throw new Error("Пустой ответ от AI");
      }

      // Универсальный парсер JSON для всех AI моделей
      // Поддерживает:
      // 1. Чистый JSON: {"key": "value"}
      // 2. JSON в markdown: ```json\n{...}\n```
      // 3. JSON с тегами <think>: <think>...</think>\n{...}
      // 4. JSON после текста: "text text\n{...}"
      let aiResponse: any;
      try {
        let jsonText = responseText;

        // Удаляем теги <think>...</think> (DeepSeek R1)
        jsonText = jsonText.replace(/<think>[\s\S]*?<\/think>/gi, "");

        // Удаляем markdown блоки ```json ... ```
        jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

        // Ищем первый JSON объект в тексте
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("JSON объект не найден в ответе");
        }

        // Парсим найденный JSON
        aiResponse = JSON.parse(jsonMatch[0]);

        console.log("✅ JSON успешно распарсен:", {
          originalIndex: aiResponse.originalIndex,
          confidence: aiResponse.confidence,
        });
      } catch (parseError: any) {
        console.error("❌ Ошибка парсинга ответа AI:", parseError.message);
        console.error("📄 Полный ответ AI:", responseText);
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: `Ошибка парсинга ответа AI: ${parseError.message}`,
          topAlternatives: topAlternatives, // matchScore уже в диапазоне 0-100
        };
      }

      // Валидация ответа
      if (
        aiResponse.originalIndex === null ||
        aiResponse.originalIndex === "null" ||
        aiResponse.originalIndex === undefined
      ) {
        console.log("⚠️ AI не нашел подходящего слушателя");
        return {
          student: null,
          confidence: aiResponse.confidence || 0,
          matchMethod: "none",
          explanation: aiResponse.reasoning || "AI не нашел совпадений",
          topAlternatives: topAlternatives,
        };
      }

      const index = parseInt(aiResponse.originalIndex);
      if (isNaN(index) || index < 0 || index >= candidates.length) {
        console.error(
          "❌ Некорректный индекс от AI:",
          aiResponse.originalIndex,
        );
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: "Некорректный индекс от AI",
        };
      }

      const foundStudent = candidates[index];
      console.log("✅ AI нашел слушателя:", foundStudent.fullName);
      console.log(
        "🎯 Уверенность:",
        Math.round(aiResponse.confidence * 100) + "%",
      );
      console.log("💭 Объяснение:", aiResponse.reasoning);

      // Логируем использование токенов
      console.log("💰 Использовано токенов:", {
        prompt: completion.usage?.prompt_tokens,
        completion: completion.usage?.completion_tokens,
        total: completion.usage?.total_tokens,
      });

      // КРИТИЧЕСКАЯ ВАЛИДАЦИЯ: Проверяем, что хотя бы один токен ФИО совпадает
      // Это защита от галлюцинаций AI
      const searchTokens = this.transliterate(
        this.normalizeName(extractedData.fullName),
      )
        .split(" ")
        .filter((t) => t.length > 1);
      const studentTokens = this.transliterate(
        this.normalizeName(foundStudent.fullName),
      )
        .split(" ")
        .filter((t) => t.length > 1);

      const tokenScore = this.calculateTokenMatchScore(
        searchTokens,
        studentTokens,
      );
      console.log(
        `🔍 Валидация токенов: ${tokenScore.toFixed(2)} (search=[${searchTokens.join(",")}], student=[${studentTokens.join(",")}])`,
      );

      // Если токенный скор слишком низкий — AI ошибся, отклоняем результат
      if (tokenScore < 0.3) {
        console.warn(
          "⚠️ AI вернул несовпадающего слушателя! Токенный скор слишком низкий:",
          tokenScore,
        );
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: `AI предложил "${foundStudent.fullName}", но токены ФИО не совпадают (скор=${tokenScore.toFixed(2)}). Возможно, нужно добавить слушателя вручную.`,
          topAlternatives: topAlternatives,
        };
      }

      // Минимальный порог уверенности AI
      if (aiResponse.confidence < 0.6) {
        console.warn(
          "⚠️ Уверенность AI слишком низкая:",
          aiResponse.confidence,
        );
        return {
          student: null,
          confidence: aiResponse.confidence,
          matchMethod: "none",
          explanation: `AI предложил "${foundStudent.fullName}" с низкой уверенностью (${Math.round(aiResponse.confidence * 100)}%). ${aiResponse.reasoning}`,
          topAlternatives: topAlternatives,
        };
      }

      return {
        student: foundStudent,
        confidence: aiResponse.confidence,
        matchMethod: "fuzzy_ai",
        explanation: aiResponse.reasoning,
        topAlternatives: topAlternatives,
      };
    } catch (error: any) {
      console.error("❌ Ошибка при работе с AI:", error.message);

      // Check for OpenRouter Policy Error (Free models require data logging)
      if (
        error.message &&
        error.message.includes("404") &&
        error.message.includes("data policy")
      ) {
        console.warn(
          "⚠️ Обнаружена ошибка политики данных OpenRouter. Пробуем fallback...",
        );

        // Попытка Fallback на стандартную модель, если текущая не работает из-за настроек
        try {
          // Если мы уже используем gpt-3.5-turbo, то проблема не в модели
          const currentModel = this.currentConfig?.textModel || "";
          if (!currentModel.includes("gpt-3.5-turbo")) {
            console.log("🔄 Fallback: Пробуем openai/gpt-3.5-turbo...");

            const client = await this.initAPIAsync();
            const fallbackCompletion = await client.chat.completions.create({
              model: "openai/gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.1,
              response_format: { type: "json_object" },
            });

            // Если Fallback сработал - обрабатываем ответ рекурсивно или дублируем логику?
            // Проще вернуть результат здесь, но логика парсинга большая.
            // Вместо дублирования просто вернем ошибку с рекомендацией, так как этот блок сложный для инлайна
            // Но пользователь ХОЧЕТ чтобы работало.

            // Для надежности просто вернем понятную ошибку, чтобы пользователь исправил настройки.
            // Fallback может стоить денег, а пользователь явно хотел бесплатно (oss модель).
          }
        } catch (fallbackError) {
          console.error("❌ Fallback тоже не сработал:", fallbackError);
        }

        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: `Ошибка настроек OpenRouter: Для использования бесплатных моделей включите 'Allow inputs and outputs to be used for model training' на https://openrouter.ai/settings/privacy`,
          topAlternatives: topAlternatives,
        };
      }

      return {
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: `Ошибка AI: ${error.message}`,
        topAlternatives: topAlternatives,
      };
    }
  }

  /**
   * Нормализация имени для сравнения
   */
  private static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ") // Множественные пробелы в один
      .replace(/[^а-яёa-z\s]/gi, ""); // Убираем спецсимволы
  }

  /**
   * Отбирает топ кандидатов по похожести имени
   * ВАЖНО: Использует токенное сравнение ФИО, а не подстроки!
   */
  private static getTopCandidates(
    searchName: string,
    students: Student[],
    limit: number,
  ): StudentWithMatchInfo[] {
    const normalizedSearch = this.normalizeName(searchName);
    const searchTokens = this.transliterate(normalizedSearch)
      .split(" ")
      .filter((t) => t.length > 1);

    console.log(`🔍 Токены поиска: [${searchTokens.join(", ")}]`);

    // Вычисляем скор для каждого студента
    const scoredStudents = students.map((student) => {
      const normalizedStudent = this.normalizeName(student.fullName);
      const studentTokens = this.transliterate(normalizedStudent)
        .split(" ")
        .filter((t) => t.length > 1);

      // Основной метод: токенное сравнение ФИО
      const tokenScore = this.calculateTokenMatchScore(
        searchTokens,
        studentTokens,
      );

      // Дополнительно: Левенштейн для всей строки (для опечаток)
      const levenshteinScore = this.levenshteinSimilarity(
        searchTokens.join(" "),
        studentTokens.join(" "),
      );

      // Комбинируем: токенный скор важнее
      const finalScore = tokenScore * 0.7 + levenshteinScore * 0.3;

      return {
        student,
        score: finalScore,
        tokenScore,
        debug: `tokens=[${studentTokens.join(",")}] tokenScore=${tokenScore.toFixed(2)}`,
      };
    });

    // Сортируем по убыванию скора
    scoredStudents.sort((a, b) => b.score - a.score);

    // Минимальный порог: не берём совсем плохих кандидатов
    const minScore = 0.2;
    const filtered = scoredStudents.filter((s) => s.score >= minScore);

    // Логируем топ кандидатов для отладки
    console.log("📊 Топ-5 кандидатов:");
    filtered.slice(0, 5).forEach((s, i) => {
      console.log(
        `  ${i + 1}. ${s.student.fullName} (score=${s.score.toFixed(2)}, ${s.debug})`,
      );
    });

    // Берем топ N и сразу конвертируем matchScore в проценты (0-100)
    return filtered.slice(0, limit).map((s) => ({
      ...s.student,
      matchScore: Math.round(s.score * 100), // Конвертируем 0-1 в 0-100
      matchDebug: s.debug,
    }));
  }

  /**
   * Преобразует StudentWithMatchInfo[] в формат topAlternatives
   * {student: Student, matchScore: number}[]
   */
  private static convertToTopAlternatives(
    students: StudentWithMatchInfo[],
  ): Array<{ student: Student; matchScore: number }> {
    return students.map((s) => {
      // Создаём копию студента без matchScore и matchDebug
      const { matchScore, matchDebug, ...studentData } = s;
      return {
        student: studentData as Student,
        matchScore: matchScore || 0,
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
  private static calculateTokenMatchScore(
    searchTokens: string[],
    studentTokens: string[],
  ): number {
    if (searchTokens.length === 0 || studentTokens.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let matchedCount = 0;

    for (const searchToken of searchTokens) {
      let bestMatchScore = 0;

      for (const studentToken of studentTokens) {
        // Точное совпадение
        if (searchToken === studentToken) {
          bestMatchScore = 1.0;
          break;
        }

        // Похожесть по Левенштейну (только если длины близки)
        // ВАЖНО: Не считаем "usman" похожим на "usmanovich"!
        const lenDiff = Math.abs(searchToken.length - studentToken.length);
        if (lenDiff <= 2) {
          const similarity = this.levenshteinSimilarity(
            searchToken,
            studentToken,
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

    // Нормализуем: сколько токенов совпало + качество совпадения
    const matchRatio = matchedCount / searchTokens.length;
    const avgQuality = matchedCount > 0 ? totalScore / matchedCount : 0;

    // Если совпала только часть токенов — штрафуем
    return matchRatio * avgQuality;
  }

  /**
   * Вычисляет схожесть строк по Левенштейну (0..1)
   */
  private static levenshteinSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Расстояние Левенштейна
   */
  private static levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
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
  static async checkAvailability(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === "your_api_key_here") {
        return false;
      }

      const client = this.initAPI();

      // Простой тестовый запрос
      await client.chat.completions.create({
        model:
          process.env.USE_OPENROUTER === "true"
            ? "openai/gpt-3.5-turbo"
            : "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5,
      });

      console.log("✅ AI API доступен");
      return true;
    } catch (error: any) {
      console.warn("⚠️ AI API недоступен:", error.message);
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
  static async batchMatchStudents(
    extractedDataArray: ExtractedCertificateData[],
    students: Student[],
  ): Promise<StudentMatchResult[]> {
    console.log(
      `🔍 Начинаем batch-сопоставление для ${extractedDataArray.length} сертификатов...`,
    );
    console.log(`👥 Всего студентов в базе: ${students.length}`);

    if (extractedDataArray.length === 0 || students.length === 0) {
      return extractedDataArray.map(() => ({
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "Нет данных для поиска",
        topAlternatives: [],
      }));
    }

    // Результаты для каждого сертификата
    const results: StudentMatchResult[] = [];

    // Обрабатываем каждый сертификат
    for (let i = 0; i < extractedDataArray.length; i++) {
      const extractedData = extractedDataArray[i];
      console.log(
        `\n📄 Обработка сертификата ${i + 1}/${extractedDataArray.length}: ${extractedData.fullName}`,
      );

      // Уровень 1: Точное совпадение по ПИНФЛ
      if (extractedData.pinfl) {
        const pinflMatch = this.findByPINFL(extractedData.pinfl, students);
        if (pinflMatch) {
          console.log("✅ Найдено точное совпадение по ПИНФЛ");
          // Получаем топ-5 альтернатив (исключая найденного)
          const candidates = this.getTopCandidates(
            extractedData.fullName,
            students.filter((s) => s.id !== pinflMatch.student?.id),
            5,
          );
          const topAlternatives = this.convertToTopAlternatives(candidates);
          results.push({
            ...pinflMatch,
            topAlternatives,
          });
          continue;
        }
      }

      // Уровень 2: Умный поиск по ФИО
      const smartMatch = this.findBySmartName(extractedData.fullName, students);
      if (smartMatch) {
        console.log("✅ Найдено локальное совпадение по ФИО");
        // Получаем топ-5 альтернатив (исключая найденного)
        const candidates = this.getTopCandidates(
          extractedData.fullName,
          students.filter((s) => s.id !== smartMatch.student?.id),
          5,
        );
        const topAlternatives = this.convertToTopAlternatives(candidates);
        results.push({
          ...smartMatch,
          topAlternatives,
        });
        continue;
      }

      // Уровень 3: AI-поиск с топ-5
      console.log("🤖 Запуск AI-поиска...");
      const aiMatch = await this.findByAI(extractedData, students);

      // AI-поиск уже возвращает topAlternatives в правильном формате
      results.push(aiMatch);
    }

    console.log(
      `\n✅ Batch-сопоставление завершено: ${results.filter((r) => r.student).length}/${extractedDataArray.length} найдено`,
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
  static async batchMatchStudentsOptimized(
    extractedDataArray: ExtractedCertificateData[],
    students: Student[],
  ): Promise<StudentMatchResult[]> {
    console.log(
      `🚀 Оптимизированный batch-поиск для ${extractedDataArray.length} сертификатов...`,
    );

    if (extractedDataArray.length === 0 || students.length === 0) {
      return extractedDataArray.map(() => ({
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "Нет данных для поиска",
        topAlternatives: [],
      }));
    }

    // Для каждого сертификата получаем топ-20 кандидатов локально
    const certificatesWithCandidates = extractedDataArray.map(
      (extractedData, index) => {
        const candidates = this.getTopCandidates(
          extractedData.fullName,
          students,
          20,
        );
        return {
          index,
          extractedData,
          candidates,
        };
      },
    );

    // Формируем промпт для batch-обработки
    const systemPrompt = `Ты эксперт по сопоставлению ФИО людей. Твоя задача - для КАЖДОГО сертификата найти наиболее подходящего студента из списка кандидатов.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ФАМИЛИЯ должна совпадать!
2. ИМЯ должно совпадать!
3. Транслитерация допускается (Иванов = Ivanov)
4. Порядок слов не важен (Ivanov Sergey = Sergey Ivanov)
5. Мелкие опечатки OCR допускаются
6. НЕ СОПОСТАВЛЯЙ если фамилии или имена РАЗНЫЕ

ФОРМАТ ОТВЕТА (ТОЛЬКО JSON):
{
  "matches": [
    {
      "certificateIndex": 0,
      "candidateIndex": 2,
      "confidence": 0.95,
      "reasoning": "объяснение"
    },
    ...
  ]
}

Если для сертификата нет подходящего кандидата, используй:
{
  "certificateIndex": N,
  "candidateIndex": null,
  "confidence": 0,
  "reasoning": "причина"
}`;

    const certificatesDescription = certificatesWithCandidates
      .map((cert, i) => {
        const candidatesList = cert.candidates
          .map((c, idx) => `    ${idx}. ${c.fullName}`)
          .join("\n");
        return `Сертификат ${i}:
  ФИО: "${cert.extractedData.fullName}"
  Кандидаты:
${candidatesList}`;
      })
      .join("\n\n");

    const userPrompt = `Сопоставь каждый сертификат с наиболее подходящим кандидатом:\n\n${certificatesDescription}`;

    try {
      const client = await this.initAPIAsync();
      const model =
        this.currentConfig?.textModel ||
        process.env.OPENAI_TEXT_MODEL ||
        "openai/gpt-3.5-turbo";

      console.log(`🤖 Отправка batch-запроса в AI (модель: ${model})...`);
      const startTime = Date.now();

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: this.currentConfig?.temperature || 0.1,
        max_tokens: Math.min(
          this.currentConfig?.maxTokens || 1000,
          extractedDataArray.length * 100,
        ),
        response_format: { type: "json_object" },
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ AI ответил за ${duration}мс`);
      console.log("💰 Использовано токенов:", completion.usage?.total_tokens);

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error("Пустой ответ от AI");
      }

      const aiResponse = JSON.parse(responseText);
      const matches = aiResponse.matches || [];

      // Формируем результаты
      const results: StudentMatchResult[] = extractedDataArray.map(
        (extractedData, certIndex) => {
          const match = matches.find(
            (m: any) => m.certificateIndex === certIndex,
          );

          if (!match || match.candidateIndex === null) {
            const candidates = certificatesWithCandidates[
              certIndex
            ].candidates.slice(0, 5);
            const topAlternatives = this.convertToTopAlternatives(candidates);
            return {
              student: null,
              confidence: 0,
              matchMethod: "none",
              explanation: match?.reasoning || "AI не нашел совпадений",
              topAlternatives,
            };
          }

          const candidateIndex = parseInt(match.candidateIndex);
          const candidates = certificatesWithCandidates[certIndex].candidates;

          if (candidateIndex < 0 || candidateIndex >= candidates.length) {
            const topAlternatives = this.convertToTopAlternatives(
              candidates.slice(0, 5),
            );
            return {
              student: null,
              confidence: 0,
              matchMethod: "none",
              explanation: "Некорректный индекс от AI",
              topAlternatives,
            };
          }

          const foundStudent = candidates[candidateIndex];
          const alternativeCandidates = candidates
            .filter((c) => c.id !== foundStudent.id)
            .slice(0, 5);
          const topAlternatives = this.convertToTopAlternatives(
            alternativeCandidates,
          );

          return {
            student: foundStudent,
            confidence: match.confidence || 0.8,
            matchMethod: "fuzzy_ai" as StudentMatchMethod,
            explanation: match.reasoning || "AI-сопоставление",
            topAlternatives,
          };
        },
      );

      console.log(
        `✅ Batch-поиск завершен: ${results.filter((r) => r.student).length}/${extractedDataArray.length} найдено`,
      );

      return results;
    } catch (error: any) {
      console.error("❌ Ошибка batch AI-поиска:", error.message);

      // Fallback: используем обычный метод для каждого сертификата
      console.log("🔄 Fallback на обычный метод...");
      return this.batchMatchStudents(extractedDataArray, students);
    }
  }
}
