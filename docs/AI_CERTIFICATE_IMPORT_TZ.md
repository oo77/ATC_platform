# 📋 Техническое задание: Интеграция AI-импорта сертификатов

## 🎯 Цель проекта

Внедрить систему автоматического распознавания и импорта сертификатов с использованием AI (GPT-4 Vision) в существующую платформу ATC. Система должна автоматически извлекать данные из отсканированных сертификатов и привязывать их к существующим слушателям.

---

## 📊 Анализ существующей системы

### Текущая система сертификатов (ATC_platform)

**Таблица БД `certificates`:**

```sql
- id VARCHAR(191) PRIMARY KEY
- student_id VARCHAR(191) NOT NULL          -- Связь со слушателем
- course_name VARCHAR(255) NOT NULL         -- Название курса
- issue_date DATE NOT NULL                  -- Дата выдачи
- certificate_number VARCHAR(100) NOT NULL  -- Номер сертификата
- file_url VARCHAR(500)                     -- URL файла
- expiry_date DATE                          -- Срок действия
- created_at, updated_at
```

**Таблица БД `students`:**

```sql
- id VARCHAR(191) PRIMARY KEY
- full_name VARCHAR(255) NOT NULL           -- ФИО слушателя
- pinfl VARCHAR(14) NOT NULL UNIQUE         -- ПИНФЛ (уникальный идентификатор)
- organization VARCHAR(255) NOT NULL        -- Организация
- organization_id VARCHAR(191) NULL         -- Ссылка на таблицу organizations
- department VARCHAR(255)                   -- Отдел
- position VARCHAR(255) NOT NULL            -- Должность
```

### Система AI-Certificate (источник)

**Ключевые возможности:**

- ✅ GPT-4 Vision для распознавания изображений сертификатов
- ✅ OCR для PDF-файлов
- ✅ Автоматическое извлечение данных:
  - ФИО
  - Номер сертификата
  - Дата выдачи
  - Организация
  - Название курса
  - Количество часов
  - Срок действия
- ✅ Умный поиск сотрудников по нечётким совпадениям
- ✅ Оценка уверенности AI (confidence)

---

## 🎨 Архитектурное решение

### Принципы интеграции

1. **Минимальное изменение существующей БД** ✅
   - Добавим только новые поля в таблицу `certificates`
   - Старые сертификаты продолжат работать без изменений

2. **Отдельная страница для AI-импорта** ✅
   - Новый роут: `/admin/database/ai-import-certificates`
   - Кнопка на странице БД сертификатов для перехода

3. **Доступ только для администраторов** ✅
   - Проверка прав: `Permission.CERTIFICATE_MANAGE`
   - Логирование всех действий

4. **Использование существующих компонентов** ✅
   - Стиль и UI-компоненты из текущего проекта
   - Адаптация логики AI-Certificate под архитектуру ATC

---

## 🗄️ Изменения в базе данных

### 1. Расширение таблицы `certificates`

```sql
ALTER TABLE certificates
  -- AI-данные
  ADD COLUMN ai_extracted_data JSON NULL COMMENT 'Данные, извлечённые AI из сертификата',
  ADD COLUMN ai_confidence DECIMAL(3,2) NULL COMMENT 'Уровень уверенности AI (0.00-1.00)',
  ADD COLUMN ai_processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT NULL COMMENT 'Статус AI-обработки',
  ADD COLUMN ai_processing_error TEXT NULL COMMENT 'Ошибка при AI-обработке',

  -- Метаданные импорта
  ADD COLUMN import_source ENUM('manual', 'ai_scan', 'excel', 'group_journal') DEFAULT 'manual' COMMENT 'Источник создания сертификата',
  ADD COLUMN original_file_url VARCHAR(500) NULL COMMENT 'URL оригинального отсканированного файла',

  -- Дополнительные поля из AI-Certificate
  ADD COLUMN course_hours INT NULL COMMENT 'Количество часов курса',
  ADD COLUMN issuing_organization VARCHAR(300) NULL COMMENT 'Организация, выдавшая сертификат',

  -- Индексы
  ADD INDEX idx_import_source (import_source),
  ADD INDEX idx_ai_processing_status (ai_processing_status),
  ADD INDEX idx_ai_confidence (ai_confidence);
```

**Обоснование:**

- ✅ Обратная совместимость: все новые поля `NULL` или с `DEFAULT`
- ✅ Старые записи не затронуты
- ✅ Можно отследить источник каждого сертификата
- ✅ Сохраняем AI-данные для аудита и улучшения

### 2. Новая таблица для логов AI-обработки (опционально)

```sql
CREATE TABLE IF NOT EXISTS ai_certificate_processing_logs (
  id VARCHAR(191) PRIMARY KEY,
  certificate_id VARCHAR(191) NULL COMMENT 'ID созданного сертификата (если успешно)',
  original_filename VARCHAR(255) NOT NULL,
  file_size_bytes INT NOT NULL,
  processing_started_at DATETIME(3) NOT NULL,
  processing_completed_at DATETIME(3) NULL,
  processing_duration_ms INT NULL,

  -- AI-данные
  ai_model VARCHAR(50) NOT NULL COMMENT 'Модель AI (gpt-4o, gpt-4-vision-preview)',
  ai_tokens_used INT NULL,
  ai_cost_usd DECIMAL(10,6) NULL,
  ai_confidence DECIMAL(3,2) NULL,

  -- Результат
  status ENUM('success', 'failed', 'partial') NOT NULL,
  extracted_data JSON NULL,
  error_message TEXT NULL,

  -- Сопоставление со слушателем
  matched_student_id VARCHAR(191) NULL,
  match_method ENUM('exact_pinfl', 'exact_name', 'fuzzy_ai', 'manual') NULL,
  match_confidence DECIMAL(3,2) NULL,

  -- Аудит
  processed_by VARCHAR(191) NOT NULL COMMENT 'ID администратора',
  ip_address VARCHAR(45) NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_certificate_id (certificate_id),
  INDEX idx_status (status),
  INDEX idx_processed_by (processed_by),
  INDEX idx_created_at (created_at),

  CONSTRAINT fk_ai_logs_certificate
    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ai_logs_student
    FOREIGN KEY (matched_student_id) REFERENCES students(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ai_logs_user
    FOREIGN KEY (processed_by) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Назначение:**

- 📊 Мониторинг эффективности AI
- 💰 Отслеживание расходов на API OpenAI
- 🔍 Аудит и отладка
- 📈 Статистика точности распознавания

---

## 🔧 Технические компоненты

### 1. Backend (Server)

#### 1.1. Утилиты AI-обработки

**Файл:** `server/utils/ai/certificateAIProcessor.ts`

```typescript
/**
 * Основной процессор для AI-обработки сертификатов
 * Адаптирован из AI-Certificate/server/utils/certificateAI.ts
 */
export class CertificateAIProcessor {
  // Инициализация OpenAI API
  static initAPI(): OpenAI;

  // Обработка файла (PDF/JPG/PNG)
  static async processCertificate(
    file: File,
  ): Promise<ExtractedCertificateData>;

  // Анализ изображения с GPT-4 Vision
  static async analyzeImageWithVision(
    base64Image: string,
    mimeType: string,
  ): Promise<ExtractedCertificateData>;

  // Анализ текста из PDF с GPT-3.5
  static async analyzeTextWithGPT(
    text: string,
  ): Promise<ExtractedCertificateData>;

  // Оценка стоимости
  static estimateCost(totalTokens: number): string;

  // Валидация данных
  static validateExtractedData(data: ExtractedCertificateData): {
    valid: boolean;
    errors: string[];
  };
}
```

**Файл:** `server/utils/ai/studentMatcher.ts`

```typescript
/**
 * Умный поиск слушателей по извлечённым данным
 */
export class StudentMatcher {
  // Точный поиск по ПИНФЛ
  static async findByPinfl(pinfl: string): Promise<Student | null>;

  // Точный поиск по ФИО
  static async findByExactName(fullName: string): Promise<Student[]>;

  // Нечёткий поиск с помощью AI (GPT-3.5)
  static async findByFuzzyMatch(
    extractedData: ExtractedCertificateData,
    candidates: Student[],
  ): Promise<{
    student: Student | null;
    confidence: number;
    explanation: string;
  }>;

  // Комбинированный поиск (сначала точный, потом AI)
  static async findMatchingStudent(
    extractedData: ExtractedCertificateData,
  ): Promise<StudentMatchResult>;
}
```

**Файл:** `server/utils/ai/pdfConverter.ts`

```typescript
/**
 * Конвертация PDF в изображения для AI-анализа
 * Из AI-Certificate/server/utils/pdfConverter.ts
 */
export class PDFConverter {
  static async convertToImages(pdfBuffer: Buffer): Promise<Buffer[]>;
  static async extractText(pdfBuffer: Buffer): Promise<string>;
}
```

#### 1.2. API Endpoints

**1. POST `/api/admin/certificates/ai-import/upload`**

```typescript
/**
 * Загрузка и первичная обработка файла сертификата
 *
 * Input: multipart/form-data с файлом
 * Output: {
 *   fileId: string;
 *   filename: string;
 *   fileSize: number;
 *   mimeType: string;
 *   previewUrl?: string; // для изображений
 * }
 */
```

**2. POST `/api/admin/certificates/ai-import/analyze`**

```typescript
/**
 * AI-анализ загруженного файла
 *
 * Input: { fileId: string }
 * Output: {
 *   success: boolean;
 *   extractedData: ExtractedCertificateData;
 *   confidence: number;
 *   suggestedStudent: Student | null;
 *   matchConfidence: number;
 *   matchMethod: 'exact_pinfl' | 'exact_name' | 'fuzzy_ai' | 'none';
 *   aiCost: string;
 *   processingTime: number;
 * }
 */
```

**3. POST `/api/admin/certificates/ai-import/confirm`**

```typescript
/**
 * Подтверждение и сохранение сертификата
 *
 * Input: {
 *   fileId: string;
 *   studentId: string;
 *   extractedData: ExtractedCertificateData;
 *   overrideData?: Partial<ExtractedCertificateData>; // ручная корректировка
 * }
 * Output: {
 *   success: boolean;
 *   certificateId: string;
 *   certificate: Certificate;
 * }
 */
```

**4. GET `/api/admin/certificates/ai-import/stats`**

```typescript
/**
 * Статистика AI-импорта
 *
 * Output: {
 *   totalProcessed: number;
 *   successRate: number;
 *   averageConfidence: number;
 *   totalCost: number;
 *   averageProcessingTime: number;
 *   matchMethodsBreakdown: {
 *     exact_pinfl: number;
 *     exact_name: number;
 *     fuzzy_ai: number;
 *     manual: number;
 *   }
 * }
 */
```

**5. GET `/api/admin/certificates/ai-import/logs`**

```typescript
/**
 * Журнал AI-обработки
 *
 * Query: { page?, limit?, status?, dateFrom?, dateTo? }
 * Output: {
 *   logs: AIProcessingLog[];
 *   total: number;
 *   page: number;
 *   totalPages: number;
 * }
 */
```

#### 1.3. Репозиторий

**Файл:** `server/repositories/aiCertificateRepository.ts`

```typescript
export class AICertificateRepository {
  // Создание сертификата из AI-данных
  static async createFromAI(
    data: CreateAICertificateInput,
  ): Promise<Certificate>;

  // Сохранение лога обработки
  static async saveProcessingLog(log: AIProcessingLogInput): Promise<void>;

  // Получение статистики
  static async getStats(dateFrom?: Date, dateTo?: Date): Promise<AIImportStats>;

  // Получение логов
  static async getLogs(filters: LogFilters): Promise<PaginatedLogs>;
}
```

### 2. Frontend (App)

#### 2.1. Страница AI-импорта

**Файл:** `app/pages/admin/database/ai-import-certificates.vue`

**Структура страницы (5 шагов):**

```
┌─────────────────────────────────────────────────────────┐
│  Шаг 1: Загрузка файла                                  │
│  - Drag & Drop зона                                     │
│  - Поддержка PDF, JPG, PNG                              │
│  - Превью загруженного файла                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Шаг 2: AI-анализ (автоматический)                      │
│  - Прогресс-бар обработки                               │
│  - Индикатор использования токенов                      │
│  - Оценка стоимости                                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Шаг 3: Результаты распознавания                        │
│  - Извлечённые данные (ФИО, номер, дата и т.д.)        │
│  - Уровень уверенности AI                               │
│  - Возможность ручной корректировки                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Шаг 4: Сопоставление со слушателем                     │
│  - Автоматически найденный слушатель (если есть)        │
│  - Метод сопоставления (точный/AI/ручной)               │
│  - Поиск и выбор слушателя вручную                      │
│  - Создание нового слушателя (опционально)              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Шаг 5: Подтверждение и сохранение                      │
│  - Финальный просмотр всех данных                       │
│  - Кнопка "Сохранить сертификат"                        │
│  - Результат операции                                   │
└─────────────────────────────────────────────────────────┘
```

#### 2.2. Компоненты

**1. `app/components/database/ai-import/FileUploader.vue`**

- Drag & Drop зона
- Валидация типов файлов
- Превью изображений
- Индикатор загрузки

**2. `app/components/database/ai-import/AIAnalysisProgress.vue`**

- Анимированный прогресс-бар
- Статус обработки
- Информация о токенах и стоимости

**3. `app/components/database/ai-import/ExtractedDataReview.vue`**

- Отображение извлечённых данных
- Редактируемые поля
- Индикатор уверенности AI
- Подсветка низкой уверенности

**4. `app/components/database/ai-import/StudentMatcher.vue`**

- Карточка найденного слушателя
- Поиск по БД
- Создание нового слушателя
- Индикатор качества совпадения

**5. `app/components/database/ai-import/FinalConfirmation.vue`**

- Сводка всех данных
- Превью сертификата
- Кнопки действий

**6. `app/components/database/ai-import/ImportStats.vue`**

- Дашборд статистики
- Графики эффективности
- Расходы на API

#### 2.3. Composables

**Файл:** `app/composables/useAICertificateImport.ts`

```typescript
export function useAICertificateImport() {
  const uploadFile = async (file: File) => { ... }
  const analyzeFile = async (fileId: string) => { ... }
  const confirmImport = async (data: ConfirmImportData) => { ... }
  const getStats = async () => { ... }
  const getLogs = async (filters: LogFilters) => { ... }

  return {
    uploadFile,
    analyzeFile,
    confirmImport,
    getStats,
    getLogs,
    // Reactive state
    isProcessing,
    currentStep,
    extractedData,
    matchedStudent,
    error
  }
}
```

#### 2.4. Интеграция с существующей страницей

**Файл:** `app/pages/database/import-certificates.vue`

Добавить кнопку:

```vue
<button
  @click="navigateTo('/admin/database/ai-import-certificates')"
  class="btn-primary"
>
  <svg><!-- AI icon --></svg>
  AI Импорт сертификата
</button>
```

---

## 🔐 Безопасность и права доступа

### 1. Проверка прав

```typescript
// В каждом API endpoint
const user = await requireAuth(event);
checkPermission(user, Permission.CERTIFICATE_MANAGE);
```

### 2. Валидация данных

- ✅ Проверка типов файлов (только PDF, JPG, PNG)
- ✅ Ограничение размера файла (макс. 10 МБ)
- ✅ Санитизация извлечённых данных
- ✅ Проверка существования слушателя перед привязкой

### 3. Логирование

```typescript
// Логирование каждого AI-импорта
await logActivity({
  userId: user.id,
  actionType: "IMPORT",
  entityType: "CERTIFICATE",
  entityId: certificate.id,
  details: {
    source: "ai_scan",
    confidence: aiConfidence,
    matchMethod: matchMethod,
    aiCost: estimatedCost,
    processingTime: duration,
  },
});
```

---

## 🌍 Переменные окружения

**Файл:** `.env`

```env
# ========================================
# 🤖 OpenAI API (для AI-импорта сертификатов)
# ========================================
OPENAI_API_KEY=sk-proj-ваш-ключ-здесь

# Модель для анализа изображений (по умолчанию: gpt-4o)
OPENAI_VISION_MODEL=gpt-4o

# Модель для текстового анализа (по умолчанию: gpt-3.5-turbo)
OPENAI_TEXT_MODEL=gpt-3.5-turbo

# Максимальное количество токенов для ответа
OPENAI_MAX_TOKENS=1500

# Температура (креативность) AI (0.0 - 1.0)
OPENAI_TEMPERATURE=0.1

# ========================================
# 📁 Хранилище файлов AI-импорта
# ========================================
AI_IMPORT_UPLOAD_DIR=./storage/ai-import-temp
AI_IMPORT_MAX_FILE_SIZE=10485760  # 10 МБ в байтах
```

---

## 📈 Метрики успеха

### KPI системы:

1. **Точность распознавания:** ≥ 95%
2. **Скорость обработки:** ≤ 5 секунд на сертификат
3. **Точность сопоставления со слушателями:** ≥ 90%
4. **Стоимость обработки:** ≤ $0.02 на сертификат
5. **Процент ручных корректировок:** ≤ 10%

---

## 🚀 План развития (Future)

### Фаза 2 (после MVP):

- [ ] Пакетная обработка (загрузка нескольких сертификатов)
- [ ] Автоматическое создание слушателей при импорте
- [ ] Интеграция с системой уведомлений (Telegram)
- [ ] Экспорт отчётов по AI-импорту
- [ ] Fine-tuning модели на специфичных сертификатах
- [ ] Кеширование частых запросов для экономии

### Фаза 3 (расширенная):

- [ ] Распознавание рукописных сертификатов
- [ ] Проверка подлинности сертификатов
- [ ] Интеграция с внешними реестрами
- [ ] Мобильное приложение для сканирования

---

## ⚠️ Риски и ограничения

### Технические риски:

1. **Стоимость API OpenAI**
   - Митигация: Мониторинг расходов, лимиты, кеширование

2. **Качество сканов**
   - Митигация: Валидация качества, рекомендации по сканированию

3. **Нестандартные форматы сертификатов**
   - Митигация: Ручная корректировка, обучение на примерах

4. **Производительность при большой нагрузке**
   - Митигация: Очереди задач, асинхронная обработка

### Бизнес-риски:

1. **Зависимость от OpenAI**
   - Митигация: Возможность переключения на альтернативные модели

2. **Конфиденциальность данных**
   - Митигация: Использование API с гарантиями приватности

---

## 📚 Документация

### Для разработчиков:

- `docs/AI_CERTIFICATE_IMPORT_CHECKLIST.md` - Чеклист реализации
- `docs/AI_CERTIFICATE_API.md` - Документация API
- `docs/AI_CERTIFICATE_TROUBLESHOOTING.md` - Решение проблем

### Для пользователей:

- `docs/AI_CERTIFICATE_USER_GUIDE.md` - Руководство пользователя
- `docs/AI_CERTIFICATE_SCANNING_TIPS.md` - Рекомендации по сканированию

---

**Дата создания:** 2026-02-02  
**Версия:** 1.0  
**Статус:** Готово к реализации  
**Автор:** Senior Developer (AI Assistant)
