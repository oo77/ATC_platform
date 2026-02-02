import type { ExtractedCertificateData } from '../../types';
import OpenAI from 'openai';
import { PDFConverter } from './pdfConverter';

/**
 * Утилита для обработки сертификатов с помощью OpenAI GPT-4 Vision
 * Использует GPT-4 Vision для прямого анализа изображений сертификатов
 */

export class CertificateAIProcessor {
  private static client: OpenAI | null = null;

  /**
   * Инициализация OpenAI API
   */
  private static initAPI(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      const useOpenRouter = process.env.USE_OPENROUTER === 'true';
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error(
          'OPENAI_API_KEY не настроен. Получите ключ на https://platform.openai.com/api-keys ' +
          'или https://openrouter.ai/keys и добавьте в файл .env'
        );
      }

      // Если используем OpenRouter
      if (useOpenRouter) {
        this.client = new OpenAI({
          apiKey: apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'Certificate AI System',
          }
        });
        console.log('✅ OpenRouter API инициализирован');
      } else {
        // Обычный OpenAI
        this.client = new OpenAI({
          apiKey: apiKey,
        });
        console.log('✅ OpenAI API инициализирован');
      }
    }

    return this.client;
  }

  /**
   * Обработать изображение или PDF сертификата
   */
  static async processCertificate(file: File): Promise<ExtractedCertificateData> {
    try {
      console.log('🔍 Начинаем обработку сертификата:', file.name, file.type);
      
      let base64Image: string;
      let mimeType: string;
      
      // Проверяем, является ли файл PDF
      if (PDFConverter.isPDF(file.type)) {
        console.log('📄 Обнаружен PDF файл, конвертируем в изображение...');
        
        // Конвертируем файл в buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Конвертируем PDF в изображение
        const converted = await PDFConverter.convertPDFToImage(buffer);
        base64Image = converted.base64;
        mimeType = converted.mimeType;
        
        console.log('✅ PDF успешно конвертирован в изображение');
      } else {
        // Обычное изображение
        console.log('🖼️ Обнаружено изображение, конвертируем в base64...');
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Image = buffer.toString('base64');
        mimeType = file.type;
        
        console.log('📸 Изображение конвертировано в base64');
      }
      
      console.log('📏 Размер файла:', file.size, 'байт');
      
      // Анализируем изображение с помощью GPT-4 Vision
      const extractedData = await this.analyzeImageWithVision(base64Image, mimeType);
      
      console.log('✅ AI обработка завершена. Извлечённые данные:', extractedData);
      
      return {
        ...extractedData,
        confidence: extractedData.confidence || 0.90,
      };
    } catch (error) {
      console.error('❌ Ошибка при обработке сертификата:', error);
      throw new Error('Не удалось обработать сертификат');
    }
  }

  /**
   * Анализ изображения с помощью GPT-4 Vision
   */
  private static async analyzeImageWithVision(
    base64Image: string,
    mimeType: string
  ): Promise<ExtractedCertificateData> {
    try {
      console.log('🤖 Запуск GPT-4 Vision для анализа сертификата...');
      
      const client = this.initAPI();
      
      // Определяем MIME type
      const imageType = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
      
      const systemPrompt = `Ты эксперт по анализу сертификатов. Твоя задача - извлечь из изображения сертификата следующую информацию:

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ:
1. **fullName** - Полное имя человека (Фамилия Имя или Фамилия Имя Отчество)
   - Может быть на русском (Иванов Сергей) или английском (IVANOV SERGEY)
   - Обычно находится после слов "THAT", "ЧТО", "НАСТОЯЩИМ ПОДТВЕРЖДАЕТСЯ"
   
2. **certificateNumber** - Номер сертификата
   - Формат: буквы и цифры (например: ATC25_APAP_176, AV-2024-001234)
   - Обычно находится в верхней части или внизу сертификата
   
3. **issueDate** - Дата выдачи сертификата
   - Формат ОБЯЗАТЕЛЬНО: YYYY-MM-DD (например: 2025-12-27)
   - Может быть написана как DD.MM.YYYY или DD/MM/YYYY - преобразуй в YYYY-MM-DD
   
4. **organization** - Организация, выдавшая сертификат
   - Полное название организации
   
5. **courseName** - Название курса/программы обучения
   - Полное название курса

ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (если есть):
- **expiryDate** - Дата истечения (формат: YYYY-MM-DD)
- **instructor** - Имя инструктора/преподавателя
- **grade** - Оценка или результат

ВАЖНО:
- Если поле не найдено - оставь его пустым (не придумывай!)
- Будь внимателен к транслитерации (IVANOV = Иванов)
- Даты ОБЯЗАТЕЛЬНО в формате YYYY-MM-DD
- Уверенность (confidence) от 0 до 1 (насколько ты уверен в результате)

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО JSON объект (без markdown, без дополнительного текста):
{
  "fullName": "Фамилия Имя",
  "certificateNumber": "номер",
  "issueDate": "YYYY-MM-DD",
  "organization": "название организации",
  "courseName": "название курса",
  "expiryDate": "YYYY-MM-DD",
  "confidence": 0.95,
  "rawText": "краткое описание что видно на сертификате",
  "additionalInfo": {}
}`;

      console.log('📤 Отправка запроса в GPT-4 Vision...');
      const startTime = Date.now();
      
      // Выбираем модель в зависимости от провайдера
      const useOpenRouter = process.env.USE_OPENROUTER === 'true';
      const model = useOpenRouter 
        ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o') // OpenRouter использует формат provider/model
        : 'gpt-4o'; // Обычный OpenAI
      
      console.log(`🤖 Используемая модель: ${model}`);
      
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: systemPrompt 
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageType};base64,${base64Image}`,
                  detail: 'high' // Высокое качество для лучшей точности
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1, // Низкая температура для точности
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ GPT-4 Vision ответил за ${duration}мс`);
      
      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log('📥 Ответ GPT-4 Vision:', responseText);

      if (!responseText) {
        throw new Error('Пустой ответ от GPT-4 Vision');
      }

      // Логируем использование токенов для мониторинга расходов
      console.log('💰 Использовано токенов:', {
        prompt: completion.usage?.prompt_tokens,
        completion: completion.usage?.completion_tokens,
        total: completion.usage?.total_tokens,
        estimatedCost: this.estimateCost(completion.usage?.total_tokens || 0)
      });

      // Парсим JSON ответ
      let extractedData;
      try {
        // Извлекаем JSON из ответа (может быть обернут в markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('JSON не найден в ответе');
        }
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (parseError: any) {
        console.error('❌ Ошибка парсинга ответа GPT-4 Vision:', parseError.message);
        console.error('Ответ был:', responseText);
        throw new Error('Не удалось распознать данные из сертификата');
      }

      // Валидация и нормализация данных
      return {
        fullName: extractedData.fullName || '',
        certificateNumber: extractedData.certificateNumber || '',
        issueDate: extractedData.issueDate || '',
        expiryDate: extractedData.expiryDate,
        organization: extractedData.organization || '',
        courseName: extractedData.courseName || '',
        confidence: extractedData.confidence || 0.85,
        rawText: extractedData.rawText || 'Analyzed by GPT-4 Vision',
        additionalInfo: extractedData.additionalInfo || {}
      };

    } catch (error: any) {
      console.error('❌ Ошибка при работе с GPT-4 Vision:', error.message);
      throw error;
    }
  }

  /**
   * Оценка стоимости запроса
   */
  private static estimateCost(totalTokens: number): string {
    // GPT-4o pricing: $5 per 1M input tokens, $15 per 1M output tokens
    // Примерно $10 per 1M tokens в среднем
    const costPer1MTokens = 10;
    const cost = (totalTokens / 1000000) * costPer1MTokens;
    return `$${cost.toFixed(4)}`;
  }

  /**
   * Анализ текста с помощью GPT-3.5 (для PDF)
   */
  private static async analyzeTextWithGPT(text: string): Promise<Omit<ExtractedCertificateData, 'rawText'>> {
    try {
      console.log('🤖 Запуск GPT-3.5 для анализа текста...');
      
      const client = this.initAPI();
      
      const systemPrompt = `Ты эксперт по анализу сертификатов. Твоя задача - извлечь из текста сертификата следующую информацию:

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ:
1. **fullName** - Полное имя человека (Фамилия Имя или Фамилия Имя Отчество)
   - Может быть на русском (Иванов Сергей) или английском (IVANOV SERGEY)
   - Обычно находится после слов "THAT", "ЧТО", "НАСТОЯЩИМ ПОДТВЕРЖДАЕТСЯ"
   
2. **certificateNumber** - Номер сертификата
   - Формат: буквы и цифры (например: ATC25_APAP_176, AV-2024-001234)
   - Обычно находится в верхней части или внизу сертификата
   
3. **issueDate** - Дата выдачи сертификата
   - Формат ОБЯЗАТЕЛЬНО: YYYY-MM-DD (например: 2025-12-27)
   - Может быть написана как DD.MM.YYYY или DD/MM/YYYY - преобразуй в YYYY-MM-DD
   
4. **organization** - Организация, выдавшая сертификат
   - Полное название организации
   
5. **courseName** - Название курса/программы обучения
   - Полное название курса

ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (если есть):
- **expiryDate** - Дата истечения (формат: YYYY-MM-DD)
- **instructor** - Имя инструктора/преподавателя
- **grade** - Оценка или результат

ВАЖНО:
- Если поле не найдено - оставь его пустым (не придумывай!)
- Будь внимателен к транслитерации (IVANOV = Иванов)
- Даты ОБЯЗАТЕЛЬНО в формате YYYY-MM-DD
- Уверенность (confidence) от 0 до 1 (насколько ты уверен в результате)

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО JSON объект (без markdown, без дополнительного текста):
{
  "fullName": "Фамилия Имя",
  "certificateNumber": "номер",
  "issueDate": "YYYY-MM-DD",
  "organization": "название организации",
  "courseName": "название курса",
  "expiryDate": "YYYY-MM-DD",
  "confidence": 0.95,
  "additionalInfo": {}
}`;

      console.log('📤 Отправка запроса в GPT-3.5...');
      const startTime = Date.now();
      
      // Выбираем модель в зависимости от провайдера
      const useOpenRouter = process.env.USE_OPENROUTER === 'true';
      const model = useOpenRouter 
        ? (process.env.OPENROUTER_MODEL_TEXT || 'openai/gpt-3.5-turbo')
        : 'gpt-3.5-turbo';
      
      console.log(`🤖 Используемая модель: ${model}`);
      
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Проанализируй следующий текст сертификата и извлеки данные:\n\n${text}` }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ GPT-3.5 ответил за ${duration}мс`);
      
      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log('📥 Ответ GPT-3.5:', responseText);

      if (!responseText) {
        throw new Error('Пустой ответ от GPT-3.5');
      }

      // Логируем использование токенов
      console.log('💰 Использовано токенов:', {
        prompt: completion.usage?.prompt_tokens,
        completion: completion.usage?.completion_tokens,
        total: completion.usage?.total_tokens,
        estimatedCost: this.estimateCost(completion.usage?.total_tokens || 0)
      });

      // Парсим JSON ответ
      let extractedData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('JSON не найден в ответе');
        }
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (parseError: any) {
        console.error('❌ Ошибка парсинга ответа GPT-3.5:', parseError.message);
        console.error('Ответ был:', responseText);
        throw new Error('Не удалось распознать данные из текста');
      }

      // Валидация и нормализация данных
      return {
        fullName: extractedData.fullName || '',
        certificateNumber: extractedData.certificateNumber || '',
        issueDate: extractedData.issueDate || '',
        expiryDate: extractedData.expiryDate,
        organization: extractedData.organization || '',
        courseName: extractedData.courseName || '',
        confidence: extractedData.confidence || 0.80,
        additionalInfo: extractedData.additionalInfo || {}
      };

    } catch (error: any) {
      console.error('❌ Ошибка при работе с GPT-3.5:', error.message);
      throw error;
    }
  }


  /**
   * Найти наиболее подходящего сотрудника по извлечённым данным
   * (Этот метод теперь используется только для точного поиска)
   */
  static findMatchingEmployee(extractedData: ExtractedCertificateData, employees: any[]): any | null {
    if (!extractedData.fullName || employees.length === 0) {
      return null;
    }

    console.log('🔍 Ищем сотрудника для:', extractedData.fullName);
    console.log('📋 Всего сотрудников в базе:', employees.length);

    const nameParts = extractedData.fullName.toLowerCase().split(/\s+/);
    
    // Поиск по совпадению ФИО
    for (const employee of employees) {
      const employeeFullName = `${employee.lastName} ${employee.firstName} ${employee.middleName || ''}`.toLowerCase();
      
      // Проверяем, содержит ли имя сотрудника все части извлечённого имени
      const allPartsMatch = nameParts.every(part => employeeFullName.includes(part));
      
      if (allPartsMatch) {
        console.log('✅ Найден сотрудник:', employeeFullName);
        return employee;
      }
    }

    console.log('⚠️ Сотрудник не найден');
    return null;
  }

  /**
   * Валидация извлечённых данных
   */
  static validateExtractedData(data: ExtractedCertificateData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.fullName) {
      errors.push('Не удалось определить ФИО');
    }

    if (!data.certificateNumber) {
      errors.push('Не удалось определить номер сертификата');
    }

    if (!data.issueDate) {
      errors.push('Не удалось определить дату выдачи');
    }

    if (!data.organization) {
      errors.push('Не удалось определить выдавшую организацию');
    }

    if (data.confidence < 0.5) {
      errors.push('Низкая уверенность в распознанных данных');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
