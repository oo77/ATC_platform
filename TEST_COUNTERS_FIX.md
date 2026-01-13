# Исправление счетчиков и статистики тестов

## Проблема

На странице "Мои тесты" (`/tests/my`) счетчики работали некорректно:

- Тесты перездачи, запланированные на будущее, попадали в счетчик "Ожидают прохождения"
- Не было различия между тестами, доступными сейчас, и тестами, которые начнутся в будущем

## Решение

### 1. Добавлена проверка времени начала теста

**Было:**

```typescript
const pending = assignments.value.filter((a) => {
  const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
  return (
    a.status === "scheduled" &&
    !a.has_active_session &&
    (a.attempts_used || 0) < (a.max_attempts || 1) &&
    !isExpired // Проверялось только окончание
  );
}).length;
```

**Стало:**

```typescript
const pending = assignments.value.filter((a) => {
  const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
  const notStartedYet = a.start_date && parseLocalDateTime(a.start_date) > now;
  return (
    a.status === "scheduled" &&
    !a.has_active_session &&
    (a.attempts_used || 0) < (a.max_attempts || 1) &&
    !isExpired &&
    !notStartedYet // Добавлена проверка начала
  );
}).length;
```

### 2. Добавлен новый счетчик "Ожидают начала"

Создан отдельный счетчик для тестов, которые запланированы на будущее:

```typescript
const notStarted = assignments.value.filter((a) => {
  const notStartedYet = a.start_date && parseLocalDateTime(a.start_date) > now;
  return a.status === "scheduled" && !a.has_active_session && notStartedYet;
}).length;
```

### 3. Обновлен UI страницы

#### Было: 4 карточки статистики

1. Ожидают прохождения
2. В процессе
3. Успешно пройдены
4. Не пройдены

#### Стало: 5 карточек статистики

1. **Ожидают начала** (серый) - тесты, которые начнутся в будущем
2. **Доступны сейчас** (оранжевый) - тесты, доступные для прохождения прямо сейчас
3. **В процессе** (синий) - тесты с активной сессией
4. **Успешно пройдены** (зеленый) - сданные тесты
5. **Не пройдены** (красный) - просроченные или провальные тесты

### 4. Обновлена логика фильтрации вкладок

Вкладка "Ожидают" теперь также учитывает время начала теста:

```typescript
if (activeTab.value === "pending") {
  const now = new Date();
  return assignments.value.filter((a) => {
    const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
    const notStarted = a.start_date && parseLocalDateTime(a.start_date) > now;
    return (
      a.status === "scheduled" &&
      !a.has_active_session &&
      (a.attempts_used || 0) < (a.max_attempts || 1) &&
      !isExpired &&
      !notStarted
    );
  });
}
```

## Измененные файлы

### `app/pages/tests/my.vue`

**Изменения:**

1. Добавлен счетчик `notStarted` в `stats` (строки 603-615)
2. Обновлен счетчик `pending` с проверкой `notStartedYet` (строки 617-629)
3. Обновлена функция `filteredAssignments` для вкладки "pending" (строки 645-659)
4. Добавлена карточка "Ожидают начала" в UI (строки 19-49)
5. Изменена сетка с 4 на 5 колонок (`md:grid-cols-2 lg:grid-cols-5`)
6. Переименована карточка "Ожидают прохождения" → "Доступны сейчас"

## Результат

✅ Счетчики работают корректно  
✅ Тесты перездачи в будущем не попадают в "Доступны сейчас"  
✅ Есть отдельный счетчик для будущих тестов  
✅ Улучшена читаемость и понятность статистики  
✅ Адаптивная сетка: 1 колонка на мобильных, 2 на планшетах, 5 на десктопах

## Пример работы

### Текущее время: 13 января 2026, 18:15

**Тест 1:** Обычный тест, 10 января 09:00-11:50

- ❌ Не попадает в "Доступны сейчас" (просрочен)
- ✅ Попадает в "Не пройдены" (если не сдан)

**Тест 2:** Перездача, 20 января 14:00-16:50

- ❌ Не попадает в "Доступны сейчас" (еще не начался)
- ✅ Попадает в "Ожидают начала" (запланирован на будущее)

**Тест 3:** Обычный тест, 13 января 17:00-18:30

- ✅ Попадает в "Доступны сейчас" (доступен прямо сейчас)
- ❌ Не попадает в "Ожидают начала"
