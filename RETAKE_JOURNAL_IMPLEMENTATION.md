# Реализация режима пересдачи в журнале

## Обзор

Реализована функциональность режима пересдачи для тестирований, которая позволяет:

1. Визуально выделять пересдачи в журнале
2. Показывать данные только для студентов, участвующих в пересдаче
3. Корректно рассчитывать среднюю оценку с учетом пересдач

## Изменения в бэкенде

### 1. Репозиторий посещаемости (`server/repositories/attendanceRepository.ts`)

- **Обновлен запрос событий** для получения `allowed_student_ids` из таблицы `test_assignments`
- **Добавлено поле** `allowed_student_ids` в интерфейс `JournalEventRow`

```typescript
interface JournalEventRow extends RowDataPacket {
  id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  event_type: string;
  allowed_student_ids: string | null; // Новое поле
}
```

### 2. API журнала (`server/api/attendance/journal.get.ts`)

#### Обновлен интерфейс `JournalColumn`:

```typescript
interface JournalColumn {
  scheduleEvent: {
    // ... существующие поля
    isRetake: boolean; // Флаг режима пересдачи
    allowedStudentIds: string[] | null; // Список разрешенных студентов
  };
  hasGrade: boolean;
}
```

#### Обновлен интерфейс `JournalCell`:

```typescript
interface JournalCell {
  // ... существующие поля
  isHidden?: boolean; // Маркер скрытой ячейки
}
```

#### Логика формирования данных:

1. **Парсинг `allowed_student_ids`** из JSON при формировании столбцов
2. **Фильтрация ячеек**: для пересдач показываются данные только для разрешенных студентов
3. **Расчет средней оценки**: исключаются скрытые ячейки

```typescript
// Проверка на пересдачу
const allowedStudentIds = evt.allowed_student_ids
  ? JSON.parse(evt.allowed_student_ids)
  : null;
const isRetake = allowedStudentIds !== null && allowedStudentIds.length > 0;

// Если студент не в списке - скрываем ячейку
if (isRetake && !allowedStudentIds.includes(student.student_id)) {
  return {
    studentId: student.student_id,
    scheduleEventId: evt.id,
    attendance: undefined,
    grade: undefined,
    isHidden: true,
  };
}

// Средняя оценка (только для видимых ячеек)
const gradeValues = cells
  .filter((cell) => !cell.isHidden && cell.grade)
  .map((cell) => cell.grade!.grade);
```

## Изменения во фронтенде

### 1. Страница журнала (`app/pages/groups/journal/[slug].vue`)

#### Обновлены интерфейсы:

```typescript
interface JournalColumn {
  scheduleEvent: {
    // ... существующие поля
    isRetake?: boolean;
    allowedStudentIds?: string[] | null;
  };
  hasGrade: boolean;
}

interface JournalCell {
  // ... существующие поля
  isHidden?: boolean;
}
```

#### Визуальное выделение пересдач:

1. **Фиолетовый индикатор** вместо обычного цвета типа занятия
2. **Маркер "П"** для обозначения режима пересдачи
3. **Добавлена легенда** с объяснением цвета пересдачи

```vue
<span
  class="inline-block w-2 h-2 rounded-full"
  :class="{
    'bg-purple-500': column.scheduleEvent.isRetake,
    'bg-blue-500':
      !column.scheduleEvent.isRetake &&
      column.scheduleEvent.eventType === 'theory',
    // ... другие типы
  }"
></span>
<span
  v-if="column.scheduleEvent.isRetake"
  class="inline-flex items-center justify-center w-4 h-4 text-[8px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
  title="Режим пересдачи"
>
  П
</span>
```

### 2. Компонент ячейки (`app/components/attendance/AttendanceCell.vue`)

#### Обработка скрытых ячеек:

```vue
<!-- Скрытая ячейка (студент не участвует в пересдаче) -->
<div
  v-if="cell.isHidden"
  class="w-10 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600"
  title="Не участвует в этом занятии"
>
  —
</div>

<!-- Обычная ячейка -->
<div v-else-if="column.hasGrade" class="flex flex-col items-center gap-1">
  <!-- ... -->
</div>
```

## Визуальные изменения

### Цветовая схема

| Тип занятия     | Цвет индикатора                  | Описание                       |
| --------------- | -------------------------------- | ------------------------------ |
| Теория          | Синий (`bg-blue-500`)            | Обычное теоретическое занятие  |
| Практика        | Зеленый (`bg-green-500`)         | Практическое занятие с оценкой |
| Проверка знаний | Оранжевый (`bg-orange-500`)      | Обычное тестирование           |
| **Пересдача**   | **Фиолетовый (`bg-purple-500`)** | **Режим пересдачи**            |

### Маркеры

- **"П"** - маркер режима пересдачи в заголовке столбца
- **"—"** - отображается в ячейках студентов, не участвующих в пересдаче

## Поведение системы

### Для студентов, участвующих в пересдаче:

- Видят ячейку посещаемости и оценки
- Могут получить оценку
- Оценка учитывается в средней оценке

### Для студентов, НЕ участвующих в пересдаче:

- Видят прочерк "—" в ячейке
- Не могут взаимодействовать с ячейкой
- Ячейка не учитывается в расчете средней оценки

### Расчет средней оценки:

- Исключаются скрытые ячейки (пересдачи для других студентов)
- Учитываются только видимые оценки
- Корректно отображается для каждого студента индивидуально

## Примечания

1. **Обратная совместимость**: Обычные занятия (не пересдачи) работают как раньше
2. **Производительность**: Минимальное влияние на производительность благодаря оптимизированным запросам
3. **UX**: Интуитивно понятное визуальное отличие пересдач от обычных занятий
