# Database Migrations - Quick Reference

## 📋 Команды

| Команда                   | Описание                             |
| ------------------------- | ------------------------------------ |
| `npm run db:migrate`      | Применить все непримененные миграции |
| `npm run db:rollback`     | Откатить последнюю миграцию          |
| `npm run db:rollback:all` | Откатить все миграции                |
| `npm run db:status`       | Показать статус миграций             |

## 📝 Создание миграции

### 1. Имя файла

Формат: `YYYYMMDD_NNN_description.ts`

Примеры:

- `20251215_001_create_users_table.ts`
- `20251215_002_add_avatar_column.ts`
- `20251216_001_create_courses_table.ts`

### 2. Структура файла

```typescript
import type { PoolConnection } from "mysql2/promise";

export const up = async (connection: PoolConnection): Promise<void> => {
  // SQL для применения изменений
};

export const down = async (connection: PoolConnection): Promise<void> => {
  // SQL для отката изменений
};

export const description = "Краткое описание";
```

## 🔧 Примеры

### Создание таблицы

```typescript
export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query("DROP TABLE IF EXISTS courses");
};
```

### Добавление колонки

```typescript
export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    ALTER TABLE users 
    ADD COLUMN avatar_url VARCHAR(500) AFTER email
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    ALTER TABLE users 
    DROP COLUMN avatar_url
  `);
};
```

### Создание индекса

```typescript
export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    CREATE INDEX idx_created_at ON users(created_at)
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    DROP INDEX idx_created_at ON users
  `);
};
```

### Добавление данных

```typescript
import { randomUUID } from "crypto";

export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(
    `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`,
    [randomUUID(), "Test User", "test@example.com"]
  );
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`DELETE FROM users WHERE email = ?`, [
    "test@example.com",
  ]);
};
```

## ✅ Best Practices

- ✅ Всегда реализуйте `up()` и `down()`
- ✅ Используйте `IF NOT EXISTS` / `IF EXISTS`
- ✅ Тестируйте откат перед применением
- ✅ Одна миграция = одно логическое изменение
- ✅ Добавляйте осмысленные описания

## ❌ Чего избегать

- ❌ Не изменяйте примененные миграции
- ❌ Не удаляйте файлы миграций
- ❌ Не делайте слишком большие миграции
- ❌ Не забывайте про откат

## 🐛 Отладка

### Проверить подключение к БД

```bash
npm run db:status
```

### Проверить таблицу migrations

```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

### Логи

- 🔄 = В процессе
- ✅ = Успешно
- ❌ = Ошибка
- ⚠️ = Предупреждение
- ℹ️ = Информация

## 📚 Дополнительно

Полная документация: [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md)
