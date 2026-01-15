# Исправление расчета посещаемости

## Проблема

1. **Процент посещаемости превышал 100%** на странице выдачи сертификатов
2. **Перездачи учитывались для всех студентов**, а не только для тех, кому они назначены

## Причина

В функции `checkStudentEligibility` (файл `certificateTemplateRepository.ts`) при расчете посещаемости учитывались **все** занятия группы, включая перездачи.

### Как это работало (неправильно):

```typescript
// Считаем ВСЕ занятия группы
SELECT SUM(...) FROM schedule_events WHERE group_id = ?

// Проблема:
// - Студент А посетил 10 обычных занятий из 10 (100%)
// - Создана перездача для студента Б
// - Теперь в группе 11 занятий
// - Студент А: 10/11 = 90.9% (хотя должно быть 100%)
// - Студент Б: если посетит перездачу = 1/11 = 9% (хотя должно быть 100% для него)
```

### Почему превышало 100%:

Если студент посещал и обычное занятие, и перездачу по той же дисциплине, оба засчитывались в числитель, но знаменатель был меньше (не учитывал, что перездача - это дополнительное занятие только для определенных студентов).

## Решение

Добавлена фильтрация по `allowed_student_ids` во все SQL-запросы, связанные с расчетом посещаемости.

### Логика фильтрации:

```sql
WHERE ... AND (
  se.allowed_student_ids IS NULL          -- Обычное занятие (для всех)
  OR JSON_CONTAINS(se.allowed_student_ids, ?) -- Перездача, и студент в списке
)
```

## Измененные запросы

### 1. Подсчет посещенных часов (строки 750-765)

**Было:**

```sql
SELECT SUM(a.hours_attended) as total_attended_hours
FROM attendance a
JOIN schedule_events se ON a.schedule_event_id = se.id
WHERE a.student_id = ? AND se.group_id = ?
```

**Стало:**

```sql
SELECT SUM(a.hours_attended) as total_attended_hours
FROM attendance a
JOIN schedule_events se ON a.schedule_event_id = se.id
WHERE a.student_id = ?
  AND se.group_id = ?
  AND (
    se.allowed_student_ids IS NULL
    OR JSON_CONTAINS(se.allowed_student_ids, ?)
  )
```

### 2. Подсчет запланированных часов (строки 767-777)

**Было:**

```sql
SELECT SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 45) as scheduled_hours
FROM schedule_events se
WHERE se.group_id = ?
```

**Стало:**

```sql
SELECT SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 45) as scheduled_hours
FROM schedule_events se
WHERE se.group_id = ?
  AND (
    se.allowed_student_ids IS NULL
    OR JSON_CONTAINS(se.allowed_student_ids, ?)
  )
```

### 3. Подсчет посещенных дисциплин (строки 835-848)

**Было:**

```sql
SELECT DISTINCT se.discipline_id
FROM attendance a
JOIN schedule_events se ON a.schedule_event_id = se.id
WHERE a.student_id = ? AND se.group_id = ? AND a.hours_attended > 0
```

**Стало:**

```sql
SELECT DISTINCT se.discipline_id
FROM attendance a
JOIN schedule_events se ON a.schedule_event_id = se.id
WHERE a.student_id = ?
  AND se.group_id = ?
  AND a.hours_attended > 0
  AND (
    se.allowed_student_ids IS NULL
    OR JSON_CONTAINS(se.allowed_student_ids, ?)
  )
```

## Результат

✅ Процент посещаемости корректно рассчитывается (не превышает 100%)  
✅ Перездачи учитываются только для студентов, которым они назначены  
✅ Студенты, не участвующие в перездачах, не видят снижения процента посещаемости  
✅ Студенты, участвующие в перездачах, видят корректный процент с учетом дополнительных занятий

## Пример работы

### До исправления:

**Группа:** 10 обычных занятий + 1 перездача для студента Б

**Студент А** (не участвует в перездаче):

- Посетил: 10 обычных занятий
- Всего занятий в группе: 11
- Посещаемость: 10/11 = **90.9%** ❌ (неправильно)

**Студент Б** (участвует в перездаче):

- Посетил: 8 обычных + 1 перездача = 9
- Всего занятий в группе: 11
- Посещаемость: 9/11 = **81.8%** ❌ (неправильно)

### После исправления:

**Студент А** (не участвует в перездаче):

- Посетил: 10 обычных занятий
- Всего занятий **для него**: 10 (перездача не учитывается)
- Посещаемость: 10/10 = **100%** ✅ (правильно)

**Студент Б** (участвует в перездаче):

- Посетил: 8 обычных + 1 перездача = 9
- Всего занятий **для него**: 11 (10 обычных + 1 перездача)
- Посещаемость: 9/11 = **81.8%** ✅ (правильно)

## Файлы

- `server/repositories/certificateTemplateRepository.ts` - функция `checkStudentEligibility`
