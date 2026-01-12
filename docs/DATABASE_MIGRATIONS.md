# Система миграций базы данных

## 📋 Обзор

Проект использует кастомную систему миграций для управления схемой базы данных MySQL. Система обеспечивает:

- ✅ **Версионирование схемы БД** - каждая миграция имеет уникальный timestamp
- ✅ **Отслеживание выполненных миграций** - специальная таблица `migrations`
- ✅ **Откат изменений** - функция `down()` для каждой миграции
- ✅ **Транзакционность** - каждая миграция выполняется в транзакции
- ✅ **Автоматическое применение** - миграции применяются при старте приложения

## 🚀 Быстрый старт

### Применить все миграции

```bash
npm run db:migrate
```

### Откатить последнюю миграцию

```bash
npm run db:rollback
```

### Откатить все миграции

```bash
npm run db:rollback:all
```

### Показать статус миграций

```bash
npm run db:status
```

## 📁 Структура

```
server/database/
├── migrations/                    # Папка с миграциями
│   ├── 20251215_001_create_users_table.ts
│   └── 20251215_002_seed_admin_user.ts
├── migrator.ts                    # Движок миграций
├── migrate.ts                     # CLI для управления
├── init.ts                        # Инициализация БД
└── schema.sql                     # SQL-схема (для справки)
```

## ✍️ Создание новой миграции

### 1. Создайте файл миграции

Имя файла должно следовать формату: `YYYYMMDD_NNN_description.ts`

Пример: `20251215_003_add_courses_table.ts`

```typescript
import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Добавление таблицы курсов
 * Дата: 2025-12-15
 * Описание: Создает таблицу courses для хранения учебных курсов
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: add_courses_table");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      teacher_id VARCHAR(191),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_teacher (teacher_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Table "courses" created successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: add_courses_table");

  await connection.query("DROP TABLE IF EXISTS courses");

  console.log('✅ Table "courses" dropped successfully');
};

export const description = "Добавление таблицы курсов";
```

### 2. Примените миграцию

```bash
npm run db:migrate
```

## 📊 Примеры миграций

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

### Изменение типа колонки

```typescript
export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    ALTER TABLE users 
    MODIFY COLUMN phone VARCHAR(20)
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    ALTER TABLE users 
    MODIFY COLUMN phone VARCHAR(191)
  `);
};
```

### Добавление данных (seed)

```typescript
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const up = async (connection: PoolConnection): Promise<void> => {
  const users = [
    {
      id: randomUUID(),
      role: "TEACHER",
      name: "Иван Иванов",
      email: "teacher@atc.uz",
      password: await bcrypt.hash("teacher123", 10),
    },
    {
      id: randomUUID(),
      role: "STUDENT",
      name: "Петр Петров",
      email: "student@atc.uz",
      password: await bcrypt.hash("student123", 10),
    },
  ];

  for (const user of users) {
    await connection.query(
      `INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [user.id, user.role, user.name, user.email, user.password]
    );
  }

  console.log(`✅ Seeded ${users.length} users`);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`DELETE FROM users WHERE email IN (?, ?)`, [
    "teacher@atc.uz",
    "student@atc.uz",
  ]);
};
```

## 🔧 Внутреннее устройство

### Таблица migrations

Система автоматически создает таблицу для отслеживания миграций:

```sql
CREATE TABLE migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX idx_name (name),
  INDEX idx_executed_at (executed_at)
)
```

### Процесс выполнения миграции

1. **Проверка подключения** к БД
2. **Создание таблицы migrations** (если не существует)
3. **Загрузка всех файлов миграций** из `server/database/migrations/`
4. **Сравнение** с уже выполненными миграциями
5. **Выполнение** каждой новой миграции в транзакции:
   - Начало транзакции
   - Выполнение функции `up()`
   - Запись в таблицу `migrations`
   - Коммит транзакции
6. При ошибке - **откат транзакции**

### Автоматическое применение

Миграции автоматически применяются при старте приложения через `server/database/init.ts`:

```typescript
export async function initializeDatabase() {
  await testConnection();
  await runMigrations(); // Автоматическое применение
}
```

## ⚠️ Важные правила

### ✅ DO (Делайте так)

- ✅ Всегда создавайте функции `up()` и `down()`
- ✅ Используйте транзакции для критичных операций
- ✅ Тестируйте откат миграции перед применением в продакшене
- ✅ Добавляйте описательные комментарии
- ✅ Используйте осмысленные имена файлов
- ✅ Проверяйте существование объектов (`IF NOT EXISTS`, `IF EXISTS`)

### ❌ DON'T (Не делайте так)

- ❌ Не изменяйте уже примененные миграции
- ❌ Не удаляйте файлы миграций из репозитория
- ❌ Не используйте `DROP TABLE` без `IF EXISTS`
- ❌ Не забывайте про откат в функции `down()`
- ❌ Не делайте слишком большие миграции (разбивайте на части)

## 🐛 Отладка

### Проверить статус миграций

```bash
npm run db:status
```

Вывод:

```
📊 Migration Status

Total migrations: 2
Executed: 2
Pending: 0

Migrations:
✅ 20251215_001_create_users_table
   Создание таблицы пользователей с поддержкой ролей
✅ 20251215_002_seed_admin_user
   Создание администратора по умолчанию (admin@atc.uz)
```

### Проверить таблицу migrations напрямую

```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

### Логи выполнения

Все операции логируются в консоль с эмодзи-индикаторами:

- 🔄 - Процесс выполняется
- ✅ - Успешное выполнение
- ❌ - Ошибка
- ⚠️ - Предупреждение
- ℹ️ - Информация

## 🔄 Workflow для разработки

### Локальная разработка

1. Создайте миграцию
2. Примените: `npm run db:migrate`
3. Проверьте результат
4. Если нужно исправить - откатите: `npm run db:rollback`
5. Исправьте миграцию
6. Примените снова: `npm run db:migrate`

### Production deployment

1. Убедитесь, что все миграции протестированы локально
2. Сделайте бэкап БД
3. Примените миграции: `npm run db:migrate`
4. Проверьте работоспособность
5. В случае проблем - откатите: `npm run db:rollback`

## 📚 Дополнительные ресурсы

- [MySQL ALTER TABLE](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [MySQL CREATE INDEX](https://dev.mysql.com/doc/refman/8.0/en/create-index.html)
- [MySQL Transactions](https://dev.mysql.com/doc/refman/8.0/en/commit.html)

## 🆘 Частые проблемы

### Миграция не применяется

**Проблема**: Миграция есть в папке, но не применяется

**Решение**:

- Проверьте формат имени файла
- Убедитесь, что файл экспортирует `up` и `down`
- Проверьте логи: `npm run db:status`

### Ошибка при откате

**Проблема**: Откат миграции завершается с ошибкой

**Решение**:

- Проверьте функцию `down()` на корректность
- Убедитесь, что все зависимые объекты удаляются в правильном порядке
- Используйте `IF EXISTS` для безопасного удаления

### Конфликт миграций

**Проблема**: Две миграции с одинаковым timestamp

**Решение**:

- Переименуйте одну из миграций с новым timestamp
- Используйте формат `YYYYMMDD_NNN` где NNN - порядковый номер

## 📝 Changelog

### 2025-12-15

- ✨ Создана система миграций
- ✨ Добавлены первые две миграции (users table + admin seed)
- ✨ Добавлен CLI для управления
- 📚 Создана документация
