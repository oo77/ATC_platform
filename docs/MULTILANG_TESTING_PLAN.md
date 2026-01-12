# 🌐 План реализации многоязычной поддержки для системы тестирования

> **Дата создания:** 2026-01-05
> **Статус:** 📋 Планирование
> **Приоритет:** Высокий

## 📋 Краткое описание требований

1. **Язык вопросов** — каждый вопрос должен иметь поле `language` (en, ru, uz)
2. **Отображение языка** — в таблице вопросов при создании и импорте должен быть виден язык
3. **Языки шаблона** — при создании шаблона теста выбираются языки через multiple select
4. **Валидация минимума** — количество вопросов каждого выбранного языка должно быть >= N (questions_count)
5. **Фильтрация** — в банке вопросов добавить фильтр по языкам
6. **Выбор языка при старте** — студент выбирает язык перед началом теста, без возможности вернуться

---

## 📊 Прогресс реализации

| Этап | Название | Статус | Дата |
|------|----------|--------|------|
| 1 | Миграция БД | ✅ Готово | 2026-01-05 |
| 2 | Обновление TypeScript типов | ✅ Готово | 2026-01-05 |
| 3 | Обновление репозиториев | ✅ Готово | 2026-01-05 |
| 4 | Обновление API | ✅ Готово | 2026-01-05 |
| 5 | UI — Банк вопросов | ✅ Готово | 2026-01-05 |
| 6 | UI — Шаблоны тестов | ✅ Готово | 2026-01-05 |
| 7 | UI — Прохождение теста | ✅ Готово | 2026-01-05 |
| 8 | Тестирование | ⏳ Ожидает | - |

---

## 🏗️ Архитектура изменений

### Схема потока данных

```
┌─────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 1: БАНК ВОПРОСОВ                                       │
│  questions.language: ENUM('en', 'ru', 'uz')                     │
│  + фильтрация по языку                                          │
│  + отображение языка в таблице                                  │
│  + импорт с указанием языка                                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (привязка)
┌─────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 2: ШАБЛОНЫ ТЕСТОВ                                      │
│  test_templates.allowed_languages: JSON(['ru', 'uz'])           │
│  + валидация: MIN(N) вопросов на каждом языке                   │
│  + multiple select при создании                                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (прохождение)
┌─────────────────────────────────────────────────────────────────┐
│  УРОВЕНЬ 3: СЕССИЯ ТЕСТА                                        │
│  test_sessions.language: ENUM('en', 'ru', 'uz')                 │
│  + выбор языка ДО начала теста                                  │
│  + фиксация: изменить нельзя                                    │
│  + фильтрация вопросов по языку сессии                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Детальное описание этапов

### Этап 1: Миграция БД

**Файл:** `server/database/migrations/20260105_029_multilang_questions.ts`

**SQL изменения:**

```sql
-- 1. Добавить язык к вопросам
ALTER TABLE questions 
ADD COLUMN language ENUM('en', 'ru', 'uz') NOT NULL DEFAULT 'ru' AFTER difficulty;

-- 2. Добавить разрешённые языки к шаблонам
ALTER TABLE test_templates 
ADD COLUMN allowed_languages JSON DEFAULT NULL AFTER proctoring_settings 
COMMENT 'Разрешённые языки: ["ru", "uz", "en"]';

-- 3. Добавить язык к сессиям
ALTER TABLE test_sessions 
ADD COLUMN language ENUM('en', 'ru', 'uz') DEFAULT NULL AFTER is_preview 
COMMENT 'Выбранный язык теста';

-- 4. Индексы для оптимизации
CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_test_sessions_language ON test_sessions(language);
```

**Примечание:** По умолчанию все существующие вопросы получат `language = 'ru'`.

---

### Этап 2: Обновление типов TypeScript

**Файл:** `server/types/testing.ts`

**Изменения:**

```typescript
// Новый enum
export enum QuestionLanguage {
    EN = 'en',
    RU = 'ru',
    UZ = 'uz',
}

// Обновление интерфейса Question
export interface Question {
    // ...existing fields
    language: QuestionLanguage;  // NEW
}

// Обновление интерфейса TestTemplate
export interface TestTemplate {
    // ...existing fields
    allowed_languages: QuestionLanguage[] | null;  // NEW
}

// Обновление интерфейса TestSession
export interface TestSession {
    // ...existing fields
    language: QuestionLanguage | null;  // NEW
}

// Обновление DTO
export interface CreateQuestionDTO {
    // ...existing fields
    language?: QuestionLanguage;  // NEW
}

export interface UpdateQuestionDTO {
    // ...existing fields
    language?: QuestionLanguage;  // NEW
}

export interface CreateTestTemplateDTO {
    // ...existing fields
    allowed_languages?: QuestionLanguage[];  // NEW
}

export interface UpdateTestTemplateDTO {
    // ...existing fields
    allowed_languages?: QuestionLanguage[];  // NEW
}

export interface StartTestSessionDTO {
    // ...existing fields
    language: QuestionLanguage;  // NEW - required
}

// Новый фильтр
export interface QuestionFilters {
    // ...existing fields
    language?: QuestionLanguage;  // NEW
}
```

---

### Этап 3: Обновление репозиториев

#### 3.1 `questionRepository.ts`

**Изменения:**
- Добавить поле `language` в маппинг `mapRowToQuestion`
- Обновить `getQuestions` — добавить фильтр `language`
- Обновить `createQuestion` — сохранять `language`
- Обновить `updateQuestion` — обновлять `language`
- Обновить `bulkCreateQuestions` — сохранять `language`
- **Новая функция:** `getQuestionCountByLanguage(bankId, language)` — для валидации
- **Новая функция:** `getQuestionStatsByLanguage(bankId)` — статистика по языкам

#### 3.2 `testTemplateRepository.ts`

**Изменения:**
- Добавить поле `allowed_languages` в маппинг `mapRowToTestTemplate`
- Обновить `createTestTemplate` — сохранять `allowed_languages` как JSON
- Обновить `updateTestTemplate` — обновлять `allowed_languages`
- **Новая функция:** `validateLanguagesQuestionCount(bankId, languages, minCount)` — проверка достаточности вопросов

#### 3.3 `testSessionRepository.ts`

**Изменения:**
- Добавить поле `language` в маппинг `mapRowToTestSession`
- Обновить `createTestSession` — сохранять `language`
- **Важно:** При создании сессии фильтровать вопросы по выбранному языку

---

### Этап 4: Обновление API

#### 4.1 Вопросы

| Endpoint | Изменение |
|----------|-----------|
| `GET /api/test-bank/questions` | Добавить query-параметр `language` для фильтрации |
| `POST /api/test-bank/questions` | Добавить поле `language` в body |
| `PUT /api/test-bank/questions/[id]` | Добавить возможность обновления `language` |
| `POST /api/test-bank/questions/import` | Добавить поле `language` в импорт (колонка в Excel) |
| `GET /api/test-bank/questions/stats-by-language` | **НОВЫЙ** — статистика по языкам для банка |

#### 4.2 Шаблоны

| Endpoint | Изменение |
|----------|-----------|
| `POST /api/test-bank/templates` | Добавить `allowed_languages`, валидация минимума |
| `PUT /api/test-bank/templates/[id]` | Добавить `allowed_languages`, валидация |
| `GET /api/test-bank/templates/[id]/validate-languages` | **НОВЫЙ** — проверка достаточности вопросов |

#### 4.3 Сессии

| Endpoint | Изменение |
|----------|-----------|
| `POST /api/tests/sessions/start` | **ОБЯЗАТЕЛЬНОЕ** поле `language`, фильтрация вопросов |
| `GET /api/tests/assignments/[id]/available-languages` | **НОВЫЙ** — доступные языки для назначения |

---

### Этап 5: UI — Банк вопросов

#### 5.1 `app/pages/test-bank/[id].vue`

**Изменения:**
- Добавить фильтр "Язык" в панель фильтров (multiselect: en, ru, uz)
- Добавить колонку "Язык" в таблицу вопросов с цветными бейджами
- В модалку создания/редактирования вопроса добавить select "Язык"

**UI элементы (бейджи):**
```vue
<span v-if="question.language === 'ru'" class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
  🇷🇺 RU
</span>
<span v-if="question.language === 'uz'" class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
  🇺🇿 UZ
</span>
<span v-if="question.language === 'en'" class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
  🇬🇧 EN
</span>
```

#### 5.2 `app/components/test-bank/ImportQuestionsModal.vue`

**Изменения:**
- Добавить колонку "Язык" в шаблон Excel (значения: en, ru, uz)
- Обновить парсинг: извлекать язык из Excel
- В preview показывать язык каждого вопроса
- **Альтернатива:** Добавить select "Язык по умолчанию для всех вопросов" — если в Excel не указан

---

### Этап 6: UI — Шаблоны тестов

#### 6.1 `app/pages/test-bank/templates/index.vue`

**Изменения:**
- В карточках шаблонов показывать выбранные языки (бейджи)

#### 6.2 `app/pages/test-bank/templates/[id].vue`

**Изменения:**
- Добавить секцию "Языки тестирования" с бейджами
- Показывать статистику: количество вопросов на каждом языке

#### 6.3 Модалка создания/редактирования шаблона

**Изменения:**
- Добавить multiple select "Доступные языки" (required)
- Динамическая валидация:
  ```
  ✓ ru: 25 вопросов (достаточно, минимум: 10)
  ✗ en: 5 вопросов (нужно минимум 10)
  ✓ uz: 15 вопросов (достаточно, минимум: 10)
  ```
- Блокировать сохранение, если не хватает вопросов

---

### Этап 7: UI — Прохождение теста

#### 7.1 Модалка выбора языка (новый компонент)

**Файл:** `app/components/tests/LanguageSelectModal.vue`

**Логика:**
- Показывается ПЕРЕД началом теста (после нажатия "Начать тест")
- Содержит список доступных языков с флагами
- После выбора — язык фиксируется, изменить нельзя
- Кнопка "Подтвердить и начать"

**UI макет:**
```
┌──────────────────────────────────────┐
│       Выберите язык тестирования     │
│                                      │
│   ○  🇷🇺 Русский                     │
│   ○  🇺🇿 O'zbek                       │
│   ○  🇬🇧 English                      │
│                                      │
│   ⚠️ После выбора язык изменить      │
│      будет невозможно!               │
│                                      │
│         [Подтвердить и начать]       │
└──────────────────────────────────────┘
```

#### 7.2 `app/pages/tests/my.vue`

**Изменения:**
- При нажатии "Начать тест" — открывать `LanguageSelectModal`
- После выбора языка — вызывать `/api/tests/sessions/start` с `language`

#### 7.3 `app/pages/tests/take/[id].vue`

**Изменения:**
- В header показывать выбранный язык (бейдж)
- Вопросы уже отфильтрованы на бэкенде по языку сессии

---

## 📊 Матрица изменений файлов

### Новые файлы

| Файл | Описание |
|------|----------|
| `server/database/migrations/20260105_029_multilang_questions.ts` | Миграция БД |
| `server/api/test-bank/questions/stats-by-language.get.ts` | API статистики по языкам |
| `server/api/test-bank/templates/[id]/validate-languages.get.ts` | API валидации языков |
| `server/api/tests/assignments/[id]/available-languages.get.ts` | API доступных языков |
| `app/components/tests/LanguageSelectModal.vue` | Модалка выбора языка |

### Обновляемые файлы

| Файл | Тип изменения |
|------|---------------|
| `server/types/testing.ts` | Добавление типов и enum |
| `server/repositories/questionRepository.ts` | Новые поля и функции |
| `server/repositories/testTemplateRepository.ts` | Новые поля и функции |
| `server/repositories/testSessionRepository.ts` | Новые поля, фильтрация |
| `server/api/test-bank/questions/index.get.ts` | Фильтр по языку |
| `server/api/test-bank/questions/index.post.ts` | Поле language |
| `server/api/test-bank/questions/[id].put.ts` | Поле language |
| `server/api/test-bank/questions/import.post.ts` | Колонка language в Excel |
| `server/api/test-bank/templates/index.post.ts` | Поле allowed_languages |
| `server/api/test-bank/templates/[id].put.ts` | Поле allowed_languages |
| `server/api/tests/sessions/start.post.ts` | Обязательное поле language |
| `app/pages/test-bank/[id].vue` | UI: фильтр, колонка, бейджи |
| `app/components/test-bank/ImportQuestionsModal.vue` | Колонка язык, парсинг |
| `app/pages/test-bank/templates/index.vue` | Бейджи языков |
| `app/pages/test-bank/templates/[id].vue` | Секция языков |
| `app/pages/tests/my.vue` | Интеграция модалки выбора языка |
| `app/pages/tests/take/[id].vue` | Отображение языка сессии |

---

## ⚠️ Важные моменты и подводные камни

### 1. Миграция существующих данных
- ✅ Все существующие вопросы получат `language = 'ru'` по умолчанию
- ✅ Все существующие шаблоны получат `allowed_languages = NULL` (означает "все языки")
- ⚠️ При первом использовании администратор должен будет указать языки для шаблонов

### 2. Валидация при создании шаблона
- Если режим `random` с `questions_count = 10`, то для каждого выбранного языка должно быть >= 10 вопросов
- Если режим `all`, валидация не нужна (берутся все вопросы языка)
- Если режим `manual`, проверять языки выбранных вопросов

### 3. Формирование вопросов при старте сессии
В `testSessionRepository.createTestSession`:
1. Получить вопросы банка с фильтром по языку
2. Применить `questions_mode` к отфильтрованным вопросам
3. Сохранить в `questions_order`

### 4. Обратная совместимость
- Если `allowed_languages = NULL` — доступны все языки (legacy режим)
- Если старая сессия без языка — показывать как есть (без бейджа)

### 5. Preview режим
- При предпросмотре показывать все языки или выбирать конкретный

---

## 🔄 Порядок реализации

```
1. Этап 1: Миграция БД 
   └── npm run db:migrate

2. Этап 2: Обновить TypeScript типы
   └── server/types/testing.ts

3. Этап 3: Обновить репозитории
   ├── questionRepository.ts
   ├── testTemplateRepository.ts
   └── testSessionRepository.ts

4. Этап 4: Обновить/создать API endpoints
   ├── Вопросы API
   ├── Шаблоны API
   └── Сессии API

5. Этап 5: UI — Банк вопросов
   ├── pages/test-bank/[id].vue
   └── components/test-bank/ImportQuestionsModal.vue

6. Этап 6: UI — Шаблоны тестов
   ├── pages/test-bank/templates/index.vue
   └── pages/test-bank/templates/[id].vue

7. Этап 7: UI — Прохождение теста
   ├── components/tests/LanguageSelectModal.vue (новый)
   ├── pages/tests/my.vue
   └── pages/tests/take/[id].vue

8. Тестирование
   └── E2E сценарий с разными языками
```

---

## 📝 Чек-лист тестирования

### Функциональные тесты

- [ ] Создание вопроса с указанием языка
- [ ] Редактирование языка вопроса
- [ ] Импорт вопросов с колонкой языка
- [ ] Фильтрация вопросов по языку
- [ ] Создание шаблона с выбором языков
- [ ] Валидация минимального количества вопросов на языке
- [ ] Выбор языка при старте теста
- [ ] Невозможность изменить язык после старта
- [ ] Отображение только вопросов выбранного языка
- [ ] Корректный подсчёт результатов

### Обратная совместимость

- [ ] Старые вопросы отображаются с языком 'ru'
- [ ] Старые шаблоны работают (NULL = все языки)
- [ ] Старые сессии корректно отображаются

### UI/UX

- [ ] Бейджи языков корректно отображаются
- [ ] Модалка выбора языка работает корректно
- [ ] Предупреждения о недостаточном количестве вопросов

---

## 📚 Связанные документы

- [TESTING_SYSTEM.md](./TESTING_SYSTEM.md) — основная документация системы тестирования
- [USER_GUIDE_TESTING.md](./USER_GUIDE_TESTING.md) — руководство пользователя
