import OpenAI from 'openai';
import type { ExtractedCertificateData } from '../../types';

/**
 * Утилита для интеллектуального поиска сотрудников с помощью OpenAI
 * 
 * Преимущества перед обычным поиском:
 * - Понимает транслитерацию (Иванов = Ivanov)
 * - Учитывает опечатки OCR
 * - Работает с разным порядком слов
 * - Понимает сокращения имен
 * - Более точный анализ контекста
 */
export class OpenAIEmployeeMatcher {
  private static client: OpenAI | null = null;

  /**
   * Инициализация OpenAI API
   */
  private static initAPI(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error(
          'OPENAI_API_KEY не настроен. Получите ключ на https://platform.openai.com/api-keys ' +
          'и добавьте в файл .env'
        );
      }

      this.client = new OpenAI({
        apiKey: apiKey,
      });
      
      console.log('✅ OpenAI API инициализирован');
    }

    return this.client;
  }

  /**
   * Найти наиболее подходящего сотрудника с помощью AI
   */
  static async findMatchingEmployee(
    extractedData: ExtractedCertificateData,
    employees: any[]
  ): Promise<{ employee: any | null; confidence: number; reasoning?: string }> {
    
    if (!extractedData.fullName || employees.length === 0) {
      return { employee: null, confidence: 0 };
    }

    try {
      console.log('🤖 Запуск OpenAI для поиска сотрудника...');
      console.log('📝 Имя из сертификата:', extractedData.fullName);
      console.log('👥 Сотрудников в базе:', employees.length);

      const client = this.initAPI();
      
      // Формируем список сотрудников
      const employeeList = employees.map((e, i) => 
        `${i}. ${e.lastName || ''} ${e.firstName || ''} ${e.middleName || ''}`.trim()
      ).join('\n');

      // Создаем промпт для AI
      const systemPrompt = `Ты эксперт по сопоставлению имен людей. Твоя задача - найти наиболее подходящего сотрудника из базы данных.

ВАЖНЫЕ ПРАВИЛА:
1. Учитывай транслитерацию (Иванов = Ivanov, Сергей = Sergey, Алексей = Aleksey)
2. Порядок слов может быть разным (Ivanov Sergey = Sergey Ivanov)
3. Могут быть опечатки OCR (l вместо I, O вместо 0, rn вместо m)
4. Имя может быть сокращено или полностью
5. Если уверенность меньше 70%, лучше вернуть null
6. Учитывай похожие звучания (Sergey = Sergei = Сергей)

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО JSON объект (без markdown, без дополнительного текста):
{
  "index": <номер сотрудника 0,1,2... или null>,
  "confidence": <уверенность от 0 до 1>,
  "reasoning": "<краткое объяснение на русском>"
}`;

      const userPrompt = `СПИСОК СОТРУДНИКОВ В БАЗЕ ДАННЫХ:
${employeeList}

ИМЯ ИЗ СЕРТИФИКАТА: "${extractedData.fullName}"

Найди наиболее подходящего сотрудника.`;

      console.log('📤 Отправка запроса в OpenAI...');
      const startTime = Date.now();
      
      // Используем GPT-3.5-turbo для экономии (быстрее и дешевле)
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Низкая креативность для точности
        max_tokens: 150,
        response_format: { type: 'json_object' }, // Принудительный JSON ответ
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ OpenAI ответил за ${duration}мс`);
      
      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log('📥 Ответ OpenAI:', responseText);

      if (!responseText) {
        throw new Error('Пустой ответ от OpenAI');
      }

      // Парсим JSON ответ
      let aiResponse;
      try {
        aiResponse = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('❌ Ошибка парсинга ответа OpenAI:', parseError.message);
        console.error('Ответ был:', responseText);
        return { employee: null, confidence: 0, reasoning: 'Ошибка парсинга ответа AI' };
      }

      // Валидация ответа
      if (aiResponse.index === null || aiResponse.index === 'null') {
        console.log('⚠️ AI не нашел подходящего сотрудника');
        return { 
          employee: null, 
          confidence: aiResponse.confidence || 0,
          reasoning: aiResponse.reasoning 
        };
      }

      const index = parseInt(aiResponse.index);
      if (isNaN(index) || index < 0 || index >= employees.length) {
        console.error('❌ Некорректный индекс от AI:', aiResponse.index);
        return { employee: null, confidence: 0, reasoning: 'Некорректный индекс' };
      }

      const foundEmployee = employees[index];
      console.log('✅ AI нашел сотрудника:', foundEmployee.lastName, foundEmployee.firstName);
      console.log('🎯 Уверенность:', Math.round(aiResponse.confidence * 100) + '%');
      console.log('💭 Объяснение:', aiResponse.reasoning);

      // Логируем использование токенов для мониторинга расходов
      console.log('💰 Использовано токенов:', {
        prompt: completion.usage?.prompt_tokens,
        completion: completion.usage?.completion_tokens,
        total: completion.usage?.total_tokens
      });

      return {
        employee: foundEmployee,
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning
      };

    } catch (error: any) {
      console.error('❌ Ошибка при работе с OpenAI:', error.message);
      
      // Если это ошибка API ключа, выбрасываем её дальше
      if (error.message.includes('OPENAI_API_KEY')) {
        throw error;
      }

      // Для других ошибок возвращаем null (fallback к обычному поиску)
      return { 
        employee: null, 
        confidence: 0,
        reasoning: `Ошибка AI: ${error.message}` 
      };
    }
  }

  /**
   * Проверка доступности OpenAI API
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your_api_key_here') {
        return false;
      }

      const client = this.initAPI();
      
      // Простой тестовый запрос
      await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      
      console.log('✅ OpenAI API доступен');
      return true;
    } catch (error: any) {
      console.warn('⚠️ OpenAI API недоступен:', error.message);
      return false;
    }
  }

  /**
   * Альтернативный метод: использование GPT-4 Vision для полного анализа сертификата
   * (более дорогой, но может заменить и Tesseract тоже)
   */
  static async analyzeFullCertificate(
    imageBase64: string
  ): Promise<ExtractedCertificateData> {
    try {
      console.log('🤖 Запуск GPT-4 Vision для полного анализа сертификата...');

      const client = this.initAPI();
      
      const systemPrompt = `Ты эксперт по анализу сертификатов. Извлеки из изображения сертификата следующую информацию:
- ФИО (fullName)
- Номер сертификата (certificateNumber)
- Дата выдачи (issueDate) в формате YYYY-MM-DD
- Организация выдавшая сертификат (organization)
- Название курса (courseName)

Верни ТОЛЬКО JSON объект:
{
  "fullName": "Фамилия Имя",
  "certificateNumber": "номер",
  "issueDate": "YYYY-MM-DD",
  "organization": "название организации",
  "courseName": "название курса",
  "confidence": 0.95
}`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      console.log('📥 Ответ GPT-4 Vision:', responseText);

      if (!responseText) {
        throw new Error('Пустой ответ от GPT-4 Vision');
      }

      // Извлекаем JSON из ответа
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON не найден в ответе');
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      console.log('💰 Использовано токенов:', {
        prompt: completion.usage?.prompt_tokens,
        completion: completion.usage?.completion_tokens,
        total: completion.usage?.total_tokens
      });

      return {
        ...extractedData,
        rawText: 'Analyzed by GPT-4 Vision',
        additionalInfo: {}
      };

    } catch (error: any) {
      console.error('❌ Ошибка при работе с GPT-4 Vision:', error.message);
      throw error;
    }
  }
}
