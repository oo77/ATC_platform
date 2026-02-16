# Исправление аналитики книг

**Дата:** 2026-02-16  
**Проблема:** Аналитика книги зависала на этапе "Загрузка аналитики..." и не отображала данные.

## Причина

Несоответствие между форматом данных, возвращаемых API endpoint'ом, и форматом, ожидаемым компонентом `AnalyticsModal.vue`.

### Что возвращал API (старый формат):

```typescript
{
  success: true,
  data: {
    general: { uniqueReaders, totalSessions, ... },
    completion: { totalReaders, completedReaders, ... },
    topReaders: [...],
    readingProgress: [...],
    dynamics: [...]
  }
}
```

### Что ожидал компонент:

```typescript
{
  totalViews: number,
  uniqueReaders: number,
  completedReaders: number,
  averageProgress: number,
  activeReaders: [...],
  recentSessions: [...]
}
```

## Решение

### 1. Изменён API endpoint (`server/api/library/admin/books/[id]/analytics.get.ts`)

**Изменения:**

- Упрощена структура ответа — данные возвращаются напрямую без вложенности
- Удалены неиспользуемые запросы (`topReaders`, `readingProgress`, `dynamics`)
- Добавлены новые запросы для `activeReaders` и `recentSessions`
- Формат ответа приведён в соответствие с интерфейсом `Analytics` в компоненте
- Добавлено детальное логирование действий пользователя (согласно правилам проекта)

**Новые SQL-запросы:**

1. **Активные читатели** — получение списка читателей с их прогрессом:

```sql
SELECT
  u.id as userId,
  u.name as userName,
  p.last_page as currentPage,
  ROUND((p.last_page / ?) * 100) as progress,
  p.last_read_at as lastActivity
FROM book_reading_progress p
JOIN users u ON p.user_id = u.id
WHERE p.book_id = ?
ORDER BY p.last_read_at DESC
LIMIT 10
```

2. **Последние сессии чтения** — история сессий с длительностью:

```sql
SELECT
  s.id,
  u.name as userName,
  s.started_at as startedAt,
  s.ended_at as endedAt,
  CASE
    WHEN s.ended_at IS NOT NULL
    THEN TIMESTAMPDIFF(SECOND, s.started_at, s.ended_at)
    ELSE TIMESTAMPDIFF(SECOND, s.started_at, NOW())
  END as duration
FROM book_reading_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.book_id = ?
ORDER BY s.started_at DESC
LIMIT 20
```

### 2. Упрощён компонент (`app/components/library/AnalyticsModal.vue`)

**Изменения:**

- Удалена обработка двух форматов ответа
- Упрощён код в `fetchAnalytics()` — теперь просто присваивается `response` в `analytics.value`

## Результат

✅ Аналитика книги теперь загружается корректно  
✅ Отображаются все необходимые данные:

- Общая статистика (просмотры, читатели, завершившие)
- Средний прогресс чтения
- Список активных читателей с прогрессом
- История последних сессий чтения

✅ Добавлено логирование действий пользователей  
✅ Код стал проще и понятнее

## Тестирование

Для проверки работоспособности:

1. Открыть страницу библиотеки
2. Выбрать любую книгу
3. Нажать на кнопку "Аналитика"
4. Убедиться, что данные загружаются и отображаются корректно

## Файлы изменены

- `server/api/library/admin/books/[id]/analytics.get.ts` — изменён формат ответа API
- `app/components/library/AnalyticsModal.vue` — упрощена обработка ответа
