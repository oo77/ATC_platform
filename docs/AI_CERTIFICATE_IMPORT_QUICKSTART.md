# 🚀 Быстрый старт: AI-импорт сертификатов

## 📋 Краткая сводка

Интеграция системы автоматического распознавания сертификатов из проекта `AI-Certificate` в `ATC_platform`.

**Цель:** Автоматизировать импорт отсканированных сертификатов с помощью GPT-4 Vision и привязывать их к существующим слушателям.

---

## 🎯 Ключевые решения (Senior подход)

### 1. Минимальное изменение БД ✅

**Стратегия:** Добавляем только новые поля, не трогая существующие.

```sql
-- Расширяем таблицу certificates
ALTER TABLE certificates
  ADD COLUMN ai_extracted_data JSON NULL,
  ADD COLUMN ai_confidence DECIMAL(3,2) NULL,
  ADD COLUMN import_source ENUM('manual', 'ai_scan', 'excel', 'group_journal') DEFAULT 'manual',
  ADD COLUMN original_file_url VARCHAR(500) NULL,
  ADD COLUMN course_hours INT NULL,
  ADD COLUMN issuing_organization VARCHAR(300) NULL;
```

**Почему так:**

- ✅ Обратная совместимость: старые сертификаты работают без изменений
- ✅ Все новые поля `NULL` или с `DEFAULT` - безопасно
- ✅ Можно откатить без потери данных

### 2. Отдельная страница для AI-импорта ✅

**Роут:** `/admin/database/ai-import-certificates`

**Почему так:**

- ✅ Не перегружаем существующий интерфейс
- ✅ Можно постепенно улучшать без риска сломать текущий функционал
- ✅ Легко добавить/убрать функционал

### 3. Поэтапная обработка (5 шагов) ✅

```
1. Загрузка файла → 2. AI-анализ → 3. Проверка данных →
4. Выбор слушателя → 5. Сохранение
```

**Почему так:**

- ✅ Пользователь контролирует каждый этап
- ✅ Можно исправить ошибки AI на любом шаге
- ✅ Прозрачность процесса

### 4. Умный поиск слушателей (3 уровня) ✅

```typescript
// Приоритет 1: Точный поиск по ПИНФЛ (если есть в сертификате)
const byPinfl = await findByPinfl(extractedData.pinfl);

// Приоритет 2: Точный поиск по ФИО
const byName = await findByExactName(extractedData.fullName);

// Приоритет 3: AI-поиск с нечёткими совпадениями (GPT-3.5)
const byAI = await findByFuzzyMatch(extractedData, candidates);
```

**Почему так:**

- ✅ Экономим деньги: сначала бесплатные методы
- ✅ Точность: ПИНФЛ > точное имя > AI
- ✅ Гибкость: AI справляется с опечатками и вариациями имён

### 5. Логирование всех операций ✅

**Две таблицы:**

1. `certificates` - основные данные + AI-метаданные
2. `ai_certificate_processing_logs` - детальные логи обработки

**Почему так:**

- ✅ Аудит: кто, когда, что импортировал
- ✅ Мониторинг: точность AI, расходы, время
- ✅ Отладка: можно воспроизвести любую обработку
- ✅ Аналитика: улучшение системы на основе данных

---

## 🗄️ Изменения в БД (осторожный подход)

### Миграция 1: Расширение таблицы certificates

```typescript
// server/database/migrations/20260202_001_ai_certificate_import.ts

export async function up(db: Knex): Promise<void> {
  // Проверяем, что таблица существует
  const hasTable = await db.schema.hasTable("certificates");
  if (!hasTable) {
    throw new Error("Таблица certificates не существует!");
  }

  // Добавляем поля только если их ещё нет
  await db.schema.alterTable("certificates", (table) => {
    // AI-данные
    if (!hasColumn("ai_extracted_data")) {
      table.json("ai_extracted_data").nullable();
    }
    if (!hasColumn("ai_confidence")) {
      table.decimal("ai_confidence", 3, 2).nullable();
    }
    // ... остальные поля
  });

  console.log("✅ Миграция AI-импорта применена успешно");
}

export async function down(db: Knex): Promise<void> {
  // Откат: удаляем только новые поля
  await db.schema.alterTable("certificates", (table) => {
    table.dropColumn("ai_extracted_data");
    table.dropColumn("ai_confidence");
    // ... остальные поля
  });

  console.log("✅ Миграция AI-импорта откачена");
}
```

**Критично:**

- ⚠️ Проверяем существование таблицы перед изменением
- ⚠️ Проверяем существование столбцов перед добавлением
- ⚠️ Тестируем на копии БД перед продакшеном
- ⚠️ Делаем бэкап перед применением

### Миграция 2: Таблица логов (опционально)

```sql
CREATE TABLE IF NOT EXISTS ai_certificate_processing_logs (
  id VARCHAR(191) PRIMARY KEY,
  certificate_id VARCHAR(191) NULL,
  status ENUM('success', 'failed', 'partial') NOT NULL,
  ai_confidence DECIMAL(3,2) NULL,
  ai_cost_usd DECIMAL(10,6) NULL,
  processing_duration_ms INT NULL,
  matched_student_id VARCHAR(191) NULL,
  match_method ENUM('exact_pinfl', 'exact_name', 'fuzzy_ai', 'manual') NULL,
  processed_by VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  -- Foreign keys
  CONSTRAINT fk_ai_logs_certificate
    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_ai_logs_student
    FOREIGN KEY (matched_student_id) REFERENCES students(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_ai_logs_user
    FOREIGN KEY (processed_by) REFERENCES users(id)
    ON DELETE CASCADE
);
```

---

## 🔧 Архитектура решения

### Backend структура

```
server/
├── utils/
│   └── ai/
│       ├── certificateAIProcessor.ts   # Главный AI-процессор
│       ├── studentMatcher.ts           # Умный поиск слушателей
│       └── pdfConverter.ts             # PDF → изображения
├── repositories/
│   └── aiCertificateRepository.ts      # Работа с БД
└── api/
    └── admin/
        └── certificates/
            └── ai-import/
                ├── upload.post.ts      # Загрузка файла
                ├── analyze.post.ts     # AI-анализ
                ├── confirm.post.ts     # Сохранение
                ├── stats.get.ts        # Статистика
                └── logs.get.ts         # Логи
```

### Frontend структура

```
app/
├── pages/
│   └── admin/
│       └── database/
│           └── ai-import-certificates.vue  # Главная страница (5 шагов)
├── components/
│   └── database/
│       └── ai-import/
│           ├── FileUploader.vue            # Шаг 1
│           ├── AIAnalysisProgress.vue      # Шаг 2
│           ├── ExtractedDataReview.vue     # Шаг 3
│           ├── StudentMatcher.vue          # Шаг 4
│           ├── FinalConfirmation.vue       # Шаг 5
│           ├── ImportStats.vue             # Статистика
│           └── ProcessingLogs.vue          # Логи
└── composables/
    └── useAICertificateImport.ts           # Бизнес-логика
```

---

## 💰 Экономика и производительность

### Стоимость обработки

| Компонент                 | Модель        | Стоимость   | Время   |
| ------------------------- | ------------- | ----------- | ------- |
| **Точный поиск по ПИНФЛ** | -             | $0.00       | 10ms    |
| **Точный поиск по ФИО**   | -             | $0.00       | 50ms    |
| **AI-анализ изображения** | GPT-4o Vision | ~$0.01      | 2-4s    |
| **AI-поиск слушателя**    | GPT-3.5-turbo | ~$0.001     | 0.5s    |
| **ИТОГО (worst case)**    | -             | **~$0.011** | **~5s** |

### Оптимизация расходов

```typescript
// Стратегия: сначала бесплатные методы
async function findStudent(data: ExtractedData) {
  // 1. ПИНФЛ (бесплатно, 70% случаев)
  if (data.pinfl) {
    const student = await findByPinfl(data.pinfl);
    if (student) return { student, cost: 0, method: "pinfl" };
  }

  // 2. Точное имя (бесплатно, 20% случаев)
  const students = await findByExactName(data.fullName);
  if (students.length === 1) {
    return { student: students[0], cost: 0, method: "exact_name" };
  }

  // 3. AI-поиск (платно, 10% случаев)
  const result = await findByFuzzyMatch(data, students);
  return { ...result, cost: 0.001, method: "fuzzy_ai" };
}
```

**Экономия:** ~90% запросов обрабатываются бесплатно!

---

## 🎨 Использование существующих компонентов

### Стилизация (из текущего проекта)

```vue
<!-- Используем существующие классы -->
<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Карточка -->
    <div
      class="rounded-sm border border-stroke bg-white shadow-default 
                dark:border-strokedark dark:bg-boxdark"
    >
      <!-- Кнопка -->
      <button
        class="inline-flex items-center justify-center rounded-md 
                     bg-primary px-10 py-4 text-center font-medium 
                     text-white hover:bg-opacity-90"
      >
        Сохранить
      </button>

      <!-- Инпут -->
      <input
        class="w-full rounded border-[1.5px] border-stroke 
                    bg-transparent px-5 py-3 text-black outline-none 
                    transition focus:border-primary 
                    dark:border-form-strokedark dark:bg-form-input 
                    dark:text-white dark:focus:border-primary"
      />
    </div>
  </div>
</template>
```

### Компоненты (переиспользуем)

- ✅ Модальные окна из `app/components/database/`
- ✅ Таблицы из `app/components/database/`
- ✅ Формы из существующих страниц
- ✅ Иконки из `app/components/icons/`

---

## 🔐 Безопасность (критично!)

### 1. Проверка прав на каждом endpoint

```typescript
// server/api/admin/certificates/ai-import/*.ts

export default defineEventHandler(async (event) => {
  // 1. Аутентификация
  const user = await requireAuth(event);

  // 2. Авторизация
  checkPermission(user, Permission.CERTIFICATE_MANAGE);

  // 3. Логирование
  await logActivity({
    userId: user.id,
    actionType: 'IMPORT',
    entityType: 'CERTIFICATE',
    details: { ... }
  });

  // 4. Бизнес-логика
  // ...
});
```

### 2. Валидация файлов

```typescript
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 МБ

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Неподдерживаемый тип файла");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Файл слишком большой (макс. 10 МБ)");
  }
}
```

### 3. Защита API ключей

```env
# .env (НЕ коммитить в Git!)
OPENAI_API_KEY=sk-proj-ваш-секретный-ключ
```

```typescript
// server/utils/ai/certificateAIProcessor.ts

// ❌ НЕПРАВИЛЬНО: ключ в коде
const client = new OpenAI({ apiKey: "sk-proj-..." });

// ✅ ПРАВИЛЬНО: из переменных окружения
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## 📊 Мониторинг и метрики

### Ключевые метрики

```typescript
interface AIImportMetrics {
  // Производительность
  totalProcessed: number; // Всего обработано
  successRate: number; // % успешных (цель: ≥95%)
  averageConfidence: number; // Средняя уверенность AI (цель: ≥0.9)
  averageProcessingTime: number; // Среднее время (цель: ≤5s)

  // Экономика
  totalCost: number; // Общие расходы
  averageCost: number; // Средняя стоимость (цель: ≤$0.02)

  // Качество
  matchMethodsBreakdown: {
    exact_pinfl: number; // % точных совпадений по ПИНФЛ
    exact_name: number; // % точных совпадений по имени
    fuzzy_ai: number; // % AI-поиска
    manual: number; // % ручного выбора
  };

  // Проблемы
  errorRate: number; // % ошибок (цель: ≤5%)
  manualCorrectionRate: number; // % ручных корректировок (цель: ≤10%)
}
```

### Дашборд статистики

```vue
<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <!-- Карточка метрики -->
    <div class="rounded-sm border border-stroke bg-white p-6 shadow-default">
      <div class="flex items-end justify-between">
        <div>
          <h4 class="text-title-md font-bold text-black dark:text-white">
            {{ stats.totalProcessed }}
          </h4>
          <span class="text-sm font-medium">Всего обработано</span>
        </div>
        <div
          class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2"
        >
          <svg><!-- icon --></svg>
        </div>
      </div>
    </div>

    <!-- Точность -->
    <div class="...">
      <h4>{{ (stats.successRate * 100).toFixed(1) }}%</h4>
      <span>Точность распознавания</span>
      <div class="mt-2 h-2 w-full rounded-full bg-stroke">
        <div
          class="h-2 rounded-full bg-primary"
          :style="{ width: `${stats.successRate * 100}%` }"
        />
      </div>
    </div>

    <!-- Стоимость -->
    <div class="...">
      <h4>${{ stats.averageCost.toFixed(3) }}</h4>
      <span>Средняя стоимость</span>
    </div>

    <!-- Время -->
    <div class="...">
      <h4>{{ (stats.averageProcessingTime / 1000).toFixed(1) }}s</h4>
      <span>Среднее время</span>
    </div>
  </div>
</template>
```

---

## 🚀 План запуска (пошагово)

### Этап 1: Подготовка (1 день)

```bash
# 1. Получить OpenAI API ключ
# https://platform.openai.com/api-keys

# 2. Добавить в .env
echo "OPENAI_API_KEY=sk-proj-ваш-ключ" >> .env

# 3. Установить зависимости
npm install openai pdf-parse

# 4. Создать директории
mkdir -p storage/ai-import-temp
mkdir -p storage/certificates/ai-imported
```

### Этап 2: База данных (1 день)

```bash
# 1. Создать миграцию
# server/database/migrations/20260202_001_ai_certificate_import.ts

# 2. Протестировать на копии БД
npm run db:migrate

# 3. Проверить
npm run db:status

# 4. Откатить для проверки
npm run db:rollback

# 5. Применить снова
npm run db:migrate
```

### Этап 3: Backend (3-4 дня)

```
День 1: Утилиты AI
  - certificateAIProcessor.ts
  - pdfConverter.ts
  - studentMatcher.ts

День 2: Репозиторий и типы
  - aiCertificateRepository.ts
  - Обновление types

День 3-4: API endpoints
  - upload.post.ts
  - analyze.post.ts
  - confirm.post.ts
  - stats.get.ts
  - logs.get.ts
```

### Этап 4: Frontend (3-4 дня)

```
День 1: Компоненты шагов 1-2
  - FileUploader.vue
  - AIAnalysisProgress.vue

День 2: Компоненты шагов 3-5
  - ExtractedDataReview.vue
  - StudentMatcher.vue
  - FinalConfirmation.vue

День 3: Главная страница
  - ai-import-certificates.vue
  - useAICertificateImport.ts

День 4: Статистика и логи
  - ImportStats.vue
  - ProcessingLogs.vue
```

### Этап 5: Тестирование (2 дня)

```
День 1: Функциональное тестирование
  - Различные типы файлов
  - Граничные случаи
  - Обработка ошибок

День 2: Интеграционное тестирование
  - Полный цикл импорта
  - Проверка БД
  - Проверка логов
```

### Этап 6: Развёртывание (1 день)

```bash
# 1. Бэкап БД
mysqldump -u root -p atc_test > backup_before_ai_import.sql

# 2. Применить миграции на продакшене
npm run db:migrate

# 3. Деплой кода
npm run build
# ... деплой на сервер

# 4. Проверка
# Тестовый импорт сертификата

# 5. Мониторинг
# Проверка логов, метрик, расходов
```

**Итого:** ~10-12 рабочих дней

---

## ⚠️ Критические моменты (на что обратить внимание)

### 1. Миграция БД

```typescript
// ❌ ОПАСНО: не проверяем существование
await db.schema.alterTable("certificates", (table) => {
  table.json("ai_extracted_data"); // Упадёт если поле уже есть!
});

// ✅ БЕЗОПАСНО: проверяем перед добавлением
const hasColumn = await db.schema.hasColumn(
  "certificates",
  "ai_extracted_data",
);
if (!hasColumn) {
  await db.schema.alterTable("certificates", (table) => {
    table.json("ai_extracted_data");
  });
}
```

### 2. Обработка ошибок OpenAI API

```typescript
try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  // Разные типы ошибок
  if (error.status === 429) {
    // Rate limit - подождать и повторить
    throw new Error('Превышен лимит запросов. Попробуйте позже.');
  } else if (error.status === 401) {
    // Неверный API ключ
    throw new Error('Ошибка аутентификации OpenAI. Проверьте API ключ.');
  } else if (error.status === 402) {
    // Недостаточно средств
    throw new Error('Недостаточно средств на балансе OpenAI.');
  } else {
    // Другие ошибки
    throw new Error(`Ошибка OpenAI: ${error.message}`);
  }
}
```

### 3. Очистка временных файлов

```typescript
// Cron job для очистки старых файлов
// server/api/cron/cleanup-ai-temp.ts

export default defineEventHandler(async (event) => {
  const tempDir = process.env.AI_IMPORT_UPLOAD_DIR;
  const maxAge = 24 * 60 * 60 * 1000; // 24 часа

  const files = await fs.readdir(tempDir);

  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const stats = await fs.stat(filePath);

    if (Date.now() - stats.mtimeMs > maxAge) {
      await fs.unlink(filePath);
      console.log(`🗑️ Удалён старый файл: ${file}`);
    }
  }
});
```

### 4. Мониторинг расходов

```typescript
// Лимит на количество запросов в день
const DAILY_LIMIT = 100;

async function checkDailyLimit(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const count = await db("ai_certificate_processing_logs")
    .where("processed_by", userId)
    .where("created_at", ">=", today)
    .count("* as total")
    .first();

  if (count.total >= DAILY_LIMIT) {
    throw new Error(`Превышен дневной лимит импортов (${DAILY_LIMIT})`);
  }
}
```

---

## 📚 Полезные ссылки

### Документация проекта

- [Техническое задание](./AI_CERTIFICATE_IMPORT_TZ.md)
- [Полный чеклист](./AI_CERTIFICATE_IMPORT_CHECKLIST.md)

### OpenAI

- [Platform](https://platform.openai.com)
- [API Keys](https://platform.openai.com/api-keys)
- [Usage](https://platform.openai.com/usage)
- [Pricing](https://openai.com/api/pricing)
- [Documentation](https://platform.openai.com/docs)

### Проект AI-Certificate

- Путь: `D:\Projects\ATC_platform\AI-Certificate`
- README: `AI-Certificate/README.md`
- Основной процессор: `AI-Certificate/server/utils/certificateAI.ts`

---

**Дата создания:** 2026-02-02  
**Автор:** Senior Developer  
**Статус:** Готово к старту

**Следующий шаг:** Получить OpenAI API ключ и начать с Этапа 1 (Подготовка)
