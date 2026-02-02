# 📖 Примеры использования OpenAI в проекте

## 🎯 Сценарий 1: Базовое использование (текущее)

### Как это работает сейчас:

```typescript
// server/api/certificates/upload.post.ts

// 1. OCR через Tesseract (бесплатно)
const extractedData = await CertificateAIProcessor.processCertificate(file);

// 2. Точный поиск (бесплатно)
let employee = CertificateAIProcessor.findMatchingEmployee(extractedData, employees);

// 3. Если не нашли → OpenAI (платно)
if (!employee) {
  const aiResult = await OpenAIEmployeeMatcher.findMatchingEmployee(
    extractedData,
    employees
  );
  employee = aiResult.employee;
}
```

### Пример лога:

```
🔍 Начинаем обработку сертификата: certificate.jpg
🚀 Запускаем Tesseract OCR...
OCR прогресс: 100%
✅ OCR завершён. Уверенность: 92%
📝 Распознанное имя: "IVANOV SERGEY"
🔍 Шаг 1: Обычный поиск...
⚠️ Обычный поиск не дал результатов
🤖 Шаг 2: Запуск OpenAI...
📤 Отправка запроса в OpenAI...
⏱️ OpenAI ответил за 450мс
✅ AI нашел сотрудника: Иванов Сергей
🎯 Уверенность AI: 95%
💭 Объяснение: Точное совпадение с транслитерацией
💰 Использовано токенов: { prompt: 145, completion: 28, total: 173 }
```

---

## 🚀 Сценарий 2: Использование GPT-4 Vision (максимальная точность)

### Когда использовать:

- Сложные/нечеткие изображения
- Рукописный текст
- Нестандартный формат сертификата
- Нужна максимальная точность

### Код:

```typescript
// server/api/certificates/upload-advanced.post.ts

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  const fileData = formData.find(item => item.name === 'file');
  
  // Конвертируем файл в base64
  const imageBase64 = Buffer.from(fileData.data).toString('base64');
  
  // Используем GPT-4 Vision для полного анализа
  const extractedData = await OpenAIEmployeeMatcher.analyzeFullCertificate(imageBase64);
  
  console.log('Извлечённые данные:', extractedData);
  // {
  //   fullName: "Иванов Сергей Петрович",
  //   certificateNumber: "ATC25_APAP_176",
  //   issueDate: "2025-12-27",
  //   organization: "UZBEKISTAN AIRPORTS TRAINING CENTER",
  //   courseName: "INITIAL TRAINING FOR PASSENGER HANDLING SERVICES",
  //   confidence: 0.98
  // }
  
  return { success: true, data: extractedData };
});
```

### Стоимость:

- ~$0.01-0.03 за изображение
- Зависит от размера и качества

---

## 🔧 Сценарий 3: Настройка параметров OpenAI

### Изменение модели:

```typescript
// server/utils/openaiMatcher.ts

// Вместо GPT-3.5-turbo использовать GPT-4
const completion = await client.chat.completions.create({
  model: 'gpt-4-turbo-preview', // Более точная модель
  messages: [...],
  temperature: 0.1,
  max_tokens: 150,
});

// Или использовать GPT-4o (баланс цены и качества)
const completion = await client.chat.completions.create({
  model: 'gpt-4o', // Новая модель
  messages: [...],
});
```

### Изменение порога уверенности:

```typescript
// server/api/certificates/upload.post.ts

// Было: 0.7 (70%)
if (aiResult.employee && aiResult.confidence > 0.7) {
  suggestedEmployee = aiResult.employee;
}

// Стало: 0.85 (85%) - более строгий порог
if (aiResult.employee && aiResult.confidence > 0.85) {
  suggestedEmployee = aiResult.employee;
}
```

---

## 💡 Сценарий 4: Batch обработка (экономия 50%)

### Для больших объемов:

```typescript
// server/utils/openaiMatcher.ts

static async batchFindEmployees(
  certificates: ExtractedCertificateData[],
  employees: any[]
): Promise<any[]> {
  
  // Формируем batch запрос
  const batchRequests = certificates.map((cert, i) => ({
    custom_id: `request-${i}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '...' },
        { role: 'user', content: `Найди сотрудника для: ${cert.fullName}` }
      ]
    }
  }));
  
  // Отправляем batch
  const batch = await client.batches.create({
    input_file_id: fileId,
    endpoint: '/v1/chat/completions',
    completion_window: '24h'
  });
  
  // Ждем результата (до 24 часов)
  // Стоимость: 50% скидка!
  
  return results;
}
```

### Когда использовать:

- Обработка архива сертификатов
- Ночная обработка
- Не критична скорость

---

## 🎨 Сценарий 5: Кастомизация промптов

### Улучшение точности для специфичных случаев:

```typescript
// server/utils/openaiMatcher.ts

const systemPrompt = `Ты эксперт по сопоставлению имен сотрудников авиакомпании.

СПЕЦИФИКА:
- Часто встречаются узбекские имена (Абдуллаев, Каримов, Рахимов)
- Транслитерация может быть разной (Abdullayev, Abdullaev, Abdullaiev)
- Учитывай региональные особенности написания

ПРИМЕРЫ ПРАВИЛЬНЫХ СОПОСТАВЛЕНИЙ:
- "ABDULLAYEV BOBUR" → "Абдуллаев Бобур"
- "KARIMOVA DILNOZA" → "Каримова Дильноза"
- "RAKHIMOV JASUR" → "Рахимов Жасур"

ВАЖНО:
- Ж = J (Жасур = Jasur)
- Ш = SH (Шахзод = Shakhzod)
- Х = KH (Хасан = Khasan)

...`;
```

---

## 📊 Сценарий 6: Мониторинг и логирование

### Детальное логирование:

```typescript
// server/utils/openaiMatcher.ts

// Добавить в findMatchingEmployee:

console.log('📊 Статистика запроса:', {
  timestamp: new Date().toISOString(),
  inputName: extractedData.fullName,
  employeesCount: employees.length,
  model: 'gpt-3.5-turbo',
  tokensUsed: completion.usage?.total_tokens,
  estimatedCost: (completion.usage?.total_tokens || 0) * 0.000002, // $0.002 per 1K tokens
  responseTime: duration,
  confidence: aiResponse.confidence,
  found: !!aiResponse.employee
});

// Сохранить в БД для аналитики
await db.query(`
  INSERT INTO ai_usage_logs (timestamp, tokens, cost, success)
  VALUES (?, ?, ?, ?)
`, [new Date(), tokens, cost, success]);
```

### Создание дашборда:

```typescript
// server/api/analytics/ai-usage.get.ts

export default defineEventHandler(async () => {
  const stats = await db.query(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as requests,
      SUM(tokens) as total_tokens,
      SUM(cost) as total_cost,
      AVG(confidence) as avg_confidence
    FROM ai_usage_logs
    WHERE timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(timestamp)
  `);
  
  return stats;
});
```

---

## 🔒 Сценарий 7: Безопасность и rate limiting

### Ограничение запросов:

```typescript
// server/middleware/rateLimit.ts

const rateLimiter = new Map<string, number[]>();

export default defineEventHandler((event) => {
  const ip = getRequestIP(event);
  const now = Date.now();
  
  // Получить историю запросов
  const requests = rateLimiter.get(ip) || [];
  
  // Удалить старые запросы (старше 1 минуты)
  const recentRequests = requests.filter(time => now - time < 60000);
  
  // Проверить лимит (максимум 10 запросов в минуту)
  if (recentRequests.length >= 10) {
    throw createError({
      statusCode: 429,
      message: 'Слишком много запросов. Подождите минуту.'
    });
  }
  
  // Добавить текущий запрос
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
});
```

### Валидация API ключа:

```typescript
// server/utils/openaiMatcher.ts

private static validateApiKey(apiKey: string): boolean {
  // Проверка формата
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Некорректный формат API ключа');
  }
  
  // Проверка длины
  if (apiKey.length < 40) {
    throw new Error('API ключ слишком короткий');
  }
  
  return true;
}
```

---

## 🧪 Сценарий 8: Тестирование

### Unit тесты:

```typescript
// tests/openaiMatcher.test.ts

import { describe, it, expect } from 'vitest';
import { OpenAIEmployeeMatcher } from '../server/utils/openaiMatcher';

describe('OpenAIEmployeeMatcher', () => {
  it('должен найти сотрудника по транслитерации', async () => {
    const extractedData = {
      fullName: 'IVANOV SERGEY',
      confidence: 0.9
    };
    
    const employees = [
      { id: 1, firstName: 'Сергей', lastName: 'Иванов' }
    ];
    
    const result = await OpenAIEmployeeMatcher.findMatchingEmployee(
      extractedData,
      employees
    );
    
    expect(result.employee).toBeDefined();
    expect(result.employee.id).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### Интеграционные тесты:

```typescript
// tests/api/certificates.test.ts

describe('POST /api/certificates/upload', () => {
  it('должен обработать сертификат с OpenAI', async () => {
    const formData = new FormData();
    formData.append('file', testImage);
    
    const response = await fetch('/api/certificates/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.matchInfo.method).toBe('ai');
    expect(data.suggestedEmployee).toBeDefined();
  });
});
```

---

## 📈 Сценарий 9: Оптимизация расходов

### Кеширование результатов:

```typescript
// server/utils/cache.ts

const cache = new Map<string, any>();

export async function cachedAIMatch(
  name: string,
  employees: any[]
): Promise<any> {
  
  const cacheKey = `ai_${name}_${employees.length}`;
  
  // Проверить кеш
  if (cache.has(cacheKey)) {
    console.log('✅ Результат из кеша (бесплатно)');
    return cache.get(cacheKey);
  }
  
  // Запросить OpenAI
  const result = await OpenAIEmployeeMatcher.findMatchingEmployee(...);
  
  // Сохранить в кеш (на 1 час)
  cache.set(cacheKey, result);
  setTimeout(() => cache.delete(cacheKey), 3600000);
  
  return result;
}
```

### Fallback на более дешевую модель:

```typescript
// Сначала пробуем GPT-3.5-turbo
let result = await tryModel('gpt-3.5-turbo');

// Если уверенность низкая - пробуем GPT-4
if (result.confidence < 0.8) {
  console.log('⚠️ Низкая уверенность, пробуем GPT-4...');
  result = await tryModel('gpt-4-turbo-preview');
}
```

---

## 🎓 Полезные ссылки

- **OpenAI Cookbook:** https://cookbook.openai.com/
- **Best Practices:** https://platform.openai.com/docs/guides/production-best-practices
- **Rate Limits:** https://platform.openai.com/docs/guides/rate-limits
- **Pricing:** https://openai.com/api/pricing

---

**Дата создания:** 2026-02-02  
**Версия:** 1.0.0
