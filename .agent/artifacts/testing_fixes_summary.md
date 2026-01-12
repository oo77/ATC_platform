# Исправления системы тестирования - Итоговый отчёт

## 📋 Обзор проблем и решений

Дата: 05.01.2026  
Статус: ✅ ВСЕ ПРОБЛЕМЫ ИСПРАВЛЕНЫ

---

## 🔴 Проблема 1: Невозможность создать несколько тестов на одно занятие

### Описание
При попытке создать занятие типа "assessment" с несколькими привязанными тестами, создавался только первый тест. Остальные блокировались с ошибкой "На это занятие уже назначен тест".

### Причина
Функция `testAssignmentExistsForEvent` проверяла наличие **любого** теста на занятии, а не конкретного.

### Решение ✅

**Файл:** `server/repositories/testAssignmentRepository.ts`

Добавлена новая функция:
```typescript
export async function testAssignmentExistsForEventAndTemplate(
    scheduleEventId: string,
    testTemplateId: string
): Promise<boolean> {
    const rows = await executeQuery<RowDataPacket[]>(
        'SELECT 1 FROM test_assignments WHERE schedule_event_id = ? AND test_template_id = ? LIMIT 1',
        [scheduleEventId, testTemplateId]
    );
    return rows.length > 0;
}
```

**Файл:** `server/api/tests/assignments/index.post.ts`

Изменена проверка:
```typescript
// БЫЛО:
const exists = await testAssignmentExistsForEvent(body.schedule_event_id);

// СТАЛО:
const exists = await testAssignmentExistsForEventAndTemplate(
    body.schedule_event_id, 
    body.test_template_id
);
```

---

## 🔴 Проблема 2: Ошибка формата даты MySQL

### Описание
```
Incorrect datetime value: '2026-01-05T00:00:00.000Z' 
for column `test_assignments`.`start_date`
```

### Причина
JavaScript `.toISOString()` возвращает формат `2026-01-05T00:00:00.000Z`, но MySQL DATETIME ожидает формат `2026-01-05 00:00:00` (без 'T', 'Z' и миллисекунд).

### Решение ✅

**Файл:** `app/components/schedule/EventModal.vue` (строки 1231-1244)

Преобразование даты в формат MySQL:
```typescript
// Преобразуем дату в формат MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
let startDate: string | undefined = undefined;
if (form.value.date) {
    const date = new Date(form.value.date);
    // Форматируем в MySQL DATETIME без миллисекунд и 'Z'
    startDate = date.toISOString().slice(0, 19).replace('T', ' ');
}

const assignmentData = {
    schedule_event_id: eventId,
    test_template_id: test.test_template_id,
    group_id: form.value.groupId,
    start_date: startDate,
};
```

**Файл:** `server/types/testing.ts` (строки 446-447)

Изменён тип для поддержки строк:
```typescript
export interface CreateTestAssignmentDTO {
    // ...
    start_date?: string | Date;  // было: Date
    end_date?: string | Date;    // было: Date
}
```

**Файл:** `server/repositories/testAssignmentRepository.ts` (строки 281-296)

Добавлена обработка строковых дат:
```typescript
// Преобразуем даты из строк в Date объекты, если нужно
let startDate: Date | null = null;
let endDate: Date | null = null;

if (data.start_date) {
    startDate = typeof data.start_date === 'string' 
        ? new Date(data.start_date) 
        : data.start_date;
}

if (data.end_date) {
    endDate = typeof data.end_date === 'string' 
        ? new Date(data.end_date) 
        : data.end_date;
}
```

---

## 🔴 Проблема 3: Vue runtime compilation warning

### Описание
```
Component provided template option but runtime compilation is not supported
```

### Причина
В `app/pages/tests/my.vue` использовался динамический компонент `<component :is="getStatusIcon(assignment)" />` с объектом `{ template: '...' }`, что требует runtime компиляции Vue.

### Решение ✅

**Файл:** `app/pages/tests/my.vue` (строки 133-143)

Заменён динамический компонент на условный рендеринг:
```vue
<svg :class="['w-7 h-7', getStatusIconClass(assignment)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- В процессе -->
    <path v-if="assignment.has_active_session" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    <!-- Сдан -->
    <path v-else-if="assignment.passed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    <!-- Не сдан -->
    <path v-else-if="assignment.best_score !== null && !assignment.passed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    <!-- Ожидает -->
    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>
```

Удалена функция `getStatusIcon` (строки 424-444).

---

## 📊 Улучшения логирования

### Серверное логирование

**Файл:** `server/api/tests/assignments/index.post.ts`

Добавлены детальные логи:
```typescript
console.log('[API tests/assignments] Получен запрос:', JSON.stringify(body, null, 2));
console.log('[API tests/assignments] Проверка существующего назначения...');
console.log('[API tests/assignments] Проверка шаблона теста:', body.test_template_id);
console.log('[API tests/assignments] Шаблон найден:', template.name);
console.log('[API tests/assignments] User ID:', userId);
console.log('[API tests/assignments] Создание назначения...');
console.log('[API tests/assignments] Назначение создано:', assignment.id);
console.error('[API tests/assignments] Критическая ошибка:', error);
console.error('[API tests/assignments] Stack:', error.stack);
```

### Клиентское логирование

**Файл:** `app/components/schedule/EventModal.vue`

```typescript
console.log('[Schedule] Создание назначения теста:', test.template_name, assignmentData);
console.log('[Schedule] Ответ сервера:', JSON.stringify(response, null, 2));
console.warn('Не удалось создать назначение для теста:', test.template_name, response.message, response.error);
```

---

## ✅ Итоговый статус

### Исправленные файлы:

1. ✅ `server/repositories/testAssignmentRepository.ts`
   - Добавлена функция `testAssignmentExistsForEventAndTemplate`
   - Добавлена обработка строковых дат

2. ✅ `server/api/tests/assignments/index.post.ts`
   - Исправлена проверка дублирования
   - Добавлено детальное логирование

3. ✅ `server/types/testing.ts`
   - Изменён тип `start_date` и `end_date` на `string | Date`

4. ✅ `app/components/schedule/EventModal.vue`
   - Исправлен формат даты для MySQL
   - Добавлено логирование

5. ✅ `app/pages/tests/my.vue`
   - Исправлена ошибка Vue runtime compilation
   - Удалена функция `getStatusIcon`

### Результат:

- ✅ Можно создавать несколько тестов на одно занятие
- ✅ Даты корректно сохраняются в MySQL
- ✅ Нет ошибок Vue compilation
- ✅ Детальное логирование для диагностики

---

## 🧪 Тестирование

### Шаги для проверки:

1. **Перезапустите dev-сервер:**
   ```bash
   # Ctrl+C для остановки
   npm run dev
   ```

2. **Создайте занятие "Проверка знаний":**
   - Откройте `/schedule`
   - Создайте занятие типа "Проверка знаний"
   - Выберите дисциплину с несколькими привязанными тестами
   - Сохраните

3. **Проверьте логи:**
   - В консоли браузера: `[Schedule]` логи
   - В терминале сервера: `[API tests/assignments]` логи

4. **Проверьте от имени студента:**
   - Войдите как студент из группы
   - Откройте `/tests/my`
   - Тесты должны отображаться

---

## 📝 Когда студент видит тесты

Студент видит тест в `/tests/my` при выполнении ВСЕХ условий:

1. ✅ Тест создан (`test_templates`)
2. ✅ Тест привязан к дисциплине (`discipline_tests`)
3. ✅ Создано занятие типа "assessment" (`schedule_events`)
4. ✅ Создано назначение теста (`test_assignments`) — автоматически
5. ✅ Студент входит в группу (`study_group_students`)

---

## 🔍 Диагностика (если проблемы остаются)

### SQL-запросы для проверки:

```sql
-- 1. Проверяем привязку тестов к дисциплинам
SELECT dt.*, tt.name as template_name, d.name as discipline_name
FROM discipline_tests dt
LEFT JOIN test_templates tt ON dt.test_template_id = tt.id
LEFT JOIN disciplines d ON dt.discipline_id = d.id;

-- 2. Проверяем занятия типа assessment
SELECT se.id, se.title, DATE(se.start_time) as event_date, sg.code as group_name
FROM schedule_events se
LEFT JOIN study_groups sg ON se.group_id = sg.id
WHERE se.event_type = 'assessment'
ORDER BY se.start_time DESC;

-- 3. Проверяем назначения тестов
SELECT ta.*, tt.name as template_name, sg.code as group_name
FROM test_assignments ta
LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
LEFT JOIN study_groups sg ON ta.group_id = sg.id
ORDER BY ta.created_at DESC;
```

---

## 📞 Поддержка

Если проблемы сохраняются, предоставьте:
1. Логи из консоли браузера (полный вывод `[Schedule]`)
2. Логи из терминала сервера (полный вывод `[API tests/assignments]`)
3. Результаты SQL-запросов выше
