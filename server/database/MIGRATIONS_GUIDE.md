# Инструкция по работе с миграциями

## Основные команды

```bash
# Проверить статус миграций
npm run db:status

# Применить новые миграции
npm run db:migrate

# Откатить последнюю миграцию
npm run db:rollback

# Откатить все миграции
npm run db:rollback:all
```

## Вспомогательные скрипты

```bash
# Проверить миграции в БД
npx tsx server/database/check-migrations.ts

# Очистить устаревшие миграции (используйте осторожно!)
npx tsx server/database/cleanup-migrations.ts
```

## Создание новой миграции

1. Создайте файл в `server/database/migrations/` с именем в формате:
   ```
   YYYYMMDD_NNN_description.ts
   ```
   Например: `20260117_053_add_new_feature.ts`

2. Используйте шаблон из `server/database/migrations/_template.ts`

3. **ОБЯЗАТЕЛЬНО** зарегистрируйте миграцию в `server/database/migrator.ts`:
   
   a) Добавьте импорт:
   ```typescript
   import * as addNewFeature from "./migrations/20260117_053_add_new_feature";
   ```
   
   b) Добавьте в `MIGRATIONS_REGISTRY`:
   ```typescript
   {
     name: "20260117_053_add_new_feature",
     up: addNewFeature.up,
     down: addNewFeature.down,
     description: addNewFeature.description,
   },
   ```

4. Примените миграцию:
   ```bash
   npm run db:migrate
   ```

## Важные правила

### ✅ DO (Делайте так)

- Всегда регистрируйте миграции в `migrator.ts`
- Используйте транзакции для критичных операций
- Пишите функцию `down()` для отката
- Проверяйте статус перед применением
- Документируйте изменения в описании

### ❌ DON'T (Не делайте так)

- Не редактируйте уже примененные миграции
- Не удаляйте файлы миграций без удаления записей из БД
- Не применяйте миграции напрямую в БД
- Не забывайте про функцию `down()`

## Проверка консистентности

Периодически проверяйте, что количество миграций в реестре совпадает с количеством в БД:

```bash
npm run db:status
```

Вывод должен показывать:
```
Total migrations: X
Executed: X
Pending: 0
```

Если `Pending` отрицательное число - есть проблема с синхронизацией!

## Решение проблем

### Проблема: Миграции в БД больше, чем в реестре

1. Проверьте список миграций:
   ```bash
   npx tsx server/database/check-migrations.ts
   ```

2. Найдите устаревшие миграции (которых нет в файловой системе)

3. Обновите `cleanup-migrations.ts` со списком устаревших миграций

4. Запустите очистку:
   ```bash
   npx tsx server/database/cleanup-migrations.ts
   ```

### Проблема: Миграция не применяется

1. Проверьте, что миграция зарегистрирована в `migrator.ts`
2. Проверьте синтаксис файла миграции
3. Проверьте логи ошибок
4. Убедитесь, что БД доступна

### Проблема: Нужно откатить миграцию

```bash
# Откатить последнюю
npm run db:rollback

# Откатить все (ОСТОРОЖНО!)
npm run db:rollback:all
```

## История изменений

- **17.01.2026** - Очистка 12 устаревших миграций системы объявлений
- **17.01.2026** - Создание вспомогательных скриптов для диагностики

## Полезные ссылки

- Шаблон миграции: `server/database/migrations/_template.ts`
- Мигратор: `server/database/migrator.ts`
- Отчет об очистке: `server/database/MIGRATIONS_CLEANUP_REPORT.md`
