# 📚 Инструкция: Как добавить новую миграцию

## 🎯 Система миграций теперь использует статический реестр (Вариант C)

**Преимущества:**

- ✅ Нет проблем с путями на Windows/Linux/Mac
- ✅ Максимальная производительность
- ✅ TypeScript видит все зависимости
- ✅ Никаких динамических импортов

---

## 📝 Шаги для добавления новой миграции

### Шаг 1: Создайте файл миграции

Создайте новый файл в `server/database/migrations/` с именем:

```
YYYYMMDD_NNN_description.ts
```

**Пример:**

```
20251216_003_add_students_table.ts
```

**Формат:**

- `YYYYMMDD` - дата (год, месяц, день)
- `NNN` - порядковый номер (001, 002, 003...)
- `description` - краткое описание

### Шаг 2: Напишите код миграции

```typescript
import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Описание миграции
 * Дата: YYYY-MM-DD
 * Описание: Подробное описание того, что делает миграция
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: your_migration_name");

  // Ваш код для применения миграции
  await connection.query(`
    CREATE TABLE IF NOT EXISTS your_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("✅ Migration completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: your_migration_name");

  // Ваш код для отката миграции
  await connection.query("DROP TABLE IF EXISTS your_table");

  console.log("✅ Rollback completed");
};

export const description = "Краткое описание миграции";
```

### Шаг 3: Добавьте импорт в `migrator.ts`

Откройте `server/database/migrator.ts` и найдите секцию **СТАТИЧЕСКИЕ ИМПОРТЫ МИГРАЦИЙ** (примерно строка 25):

```typescript
// ============================================================================
// СТАТИЧЕСКИЕ ИМПОРТЫ МИГРАЦИЙ
// ============================================================================

import * as migration001 from "./migrations/20251215_001_create_users_table.js";
import * as migration002 from "./migrations/20251215_002_seed_admin_user.js";

// 👇 ДОБАВЬТЕ ВАШУ МИГРАЦИЮ ЗДЕСЬ:
import * as migration003 from "./migrations/20251216_003_add_students_table.js";
```

**⚠️ ВАЖНО:** Используйте расширение `.js` в импорте, даже если файл `.ts`!

### Шаг 4: Добавьте в реестр миграций

Найдите секцию **РЕЕСТР МИГРАЦИЙ** (примерно строка 50):

```typescript
const MIGRATIONS_REGISTRY: Migration[] = [
  {
    name: "20251215_001_create_users_table",
    up: migration001.up,
    down: migration001.down,
    description: migration001.description,
  },
  {
    name: "20251215_002_seed_admin_user",
    up: migration002.up,
    down: migration002.down,
    description: migration002.description,
  },
  // 👇 ДОБАВЬТЕ ВАШУ МИГРАЦИЮ ЗДЕСЬ:
  {
    name: "20251216_003_add_students_table",
    up: migration003.up,
    down: migration003.down,
    description: migration003.description,
  },
];
```

### Шаг 5: Примените миграцию

```bash
npm run db:migrate
```

---

## 🔧 Команды для работы с миграциями

```bash
# Применить все новые миграции
npm run db:migrate

# Откатить последнюю миграцию
npm run db:rollback

# Откатить все миграции (очистить БД)
npm run db:rollback:all

# Посмотреть статус миграций
npm run db:status
```

---

## 📋 Чек-лист при добавлении миграции

- [ ] Создан файл миграции с правильным именем
- [ ] Реализована функция `up` (применение)
- [ ] Реализована функция `down` (откат)
- [ ] Добавлено `description` (описание)
- [ ] Добавлен импорт в `migrator.ts` (с расширением `.js`)
- [ ] Добавлена запись в `MIGRATIONS_REGISTRY`
- [ ] Миграция протестирована (`npm run db:migrate`)
- [ ] Откат протестирован (`npm run db:rollback`)

---

## 💡 Советы

### Именование миграций

- Используйте понятные имена: `add_users_table`, `add_email_column`, `create_indexes`
- Избегайте спецсимволов, только буквы, цифры и подчеркивания

### Безопасность

- Всегда используйте `IF NOT EXISTS` при создании таблиц
- Всегда используйте `IF EXISTS` при удалении
- Используйте транзакции (автоматически в системе)

### Откат миграций

- Функция `down` должна полностью отменять `up`
- Тестируйте откат сразу после применения

### Порядок миграций

- Миграции применяются в порядке имен файлов (сортировка)
- Используйте дату и номер в начале имени для правильного порядка

---

## 🚨 Частые ошибки

### ❌ Забыли добавить `.js` в импорте

```typescript
// НЕПРАВИЛЬНО:
import * as migration003 from "./migrations/20251216_003_add_students_table";

// ПРАВИЛЬНО:
import * as migration003 from "./migrations/20251216_003_add_students_table.js";
```

### ❌ Не совпадает имя в реестре с именем файла

```typescript
// Файл: 20251216_003_add_students_table.ts

// НЕПРАВИЛЬНО:
{
  name: '20251216_003_add_student_table', // опечатка!
  ...
}

// ПРАВИЛЬНО:
{
  name: '20251216_003_add_students_table', // точно как в имени файла (без .ts)
  ...
}
```

### ❌ Забыли экспортировать функции

```typescript
// НЕПРАВИЛЬНО:
const up = async (connection: PoolConnection) => { ... }

// ПРАВИЛЬНО:
export const up = async (connection: PoolConnection) => { ... }
```

---

## 📖 Пример полной миграции

**Файл:** `server/database/migrations/20251216_003_add_students_table.ts`

```typescript
import type { PoolConnection } from "mysql2/promise";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: add_students_table");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      pinfl VARCHAR(14) UNIQUE,
      organization VARCHAR(255),
      department VARCHAR(255),
      position VARCHAR(255),
      created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_pinfl (pinfl),
      INDEX idx_organization (organization)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "students" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: add_students_table");

  await connection.query("DROP TABLE IF EXISTS students");

  console.log('✅ Table "students" dropped successfully');
};

export const description = "Создание таблицы студентов";
```

**Добавить в `migrator.ts`:**

```typescript
// Импорт (строка ~27):
import * as migration003 from './migrations/20251216_003_add_students_table.js';

// Реестр (строка ~60):
{
  name: '20251216_003_add_students_table',
  up: migration003.up,
  down: migration003.down,
  description: migration003.description,
},
```

---

## ✅ Готово!

Теперь ваша система миграций работает на статических импортах и **никогда** не будет проблем с путями! 🎉
