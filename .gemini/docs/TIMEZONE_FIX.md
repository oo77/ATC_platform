# Исправление проблемы с часовыми поясами

## Описание проблемы

При работе с датами в группах происходил постоянный сдвиг на -1 день при каждом сохранении/редактировании:

- При создании группы с датой `10.12.2025` она сохранялась как `9.12.2025`
- При повторном редактировании становилась `8.12.2025`
- При добавлении расписания в предупреждениях показывалась `7.12.2025`

## Причина

### 1. Проблема в `formatDateForInput` (GroupFormModal.vue)

**Было:**

```javascript
const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0] || "";
};
```

**Проблема:**

- `new Date('2025-12-10')` создаёт объект с временем `00:00:00` по локальному времени (`+05:00`)
- `toISOString()` конвертирует в UTC: `2025-12-09T19:00:00.000Z` (минус 5 часов)
- `.split('T')[0]` даёт `2025-12-09` ❌

**Решение:**

```javascript
const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  // Используем локальные методы для избежания сдвига временной зоны
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
```

### 2. Проблема в FullCalendar (CalendarView.vue)

**Было:**

```javascript
timeZone: 'UTC',
```

**Проблема:**

- FullCalendar интерпретировал все даты как UTC
- При отображении/редактировании происходили смещения

**Решение:**

```javascript
timeZone: 'local', // Используем локальное время для избежания сдвига дат
```

## Что исправлено

### ✅ Файл: `app/components/groups/GroupFormModal.vue`

- Изменена функция `formatDateForInput` для корректной работы с датами без сдвига временной зоны

### ✅ Файл: `app/components/schedule/CalendarView.vue`

- Изменена настройка `timeZone` с `'UTC'` на `'local'`
- Добавлено отображение аудитории в заголовке события календаря

## Дополнительные улучшения

### Отображение аудитории в календаре

Теперь если у занятия указана аудитория, она отображается в заголовке события:

```
Математика (Ауд. 305)
```

Реализовано в функции `transformEventForCalendar`:

```javascript
const titleWithClassroom = event.classroom?.name
  ? `${event.title} (${event.classroom.name})`
  : event.title;
```

## Будущие улучшения

### Настройки часового пояса

В файле `app/pages/settings.vue` уже есть UI для выбора часового пояса:

```vue
<select>
  <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
  <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
  <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
</select>
```

Для полнофункциональной поддержки необходимо:

1. Создать composable для управления настройками пользователя
2. Сохранять выбранный часовой пояс в базе данных/localStorage
3. Использовать библиотеку типа `date-fns-tz` для корректной работы с разными зонами
4. Учитывать часовой пояс при всех операциях с датами

## Проверка исправления

После применения изменений проверьте:

1. ✅ Создание новой группы — дата сохраняется корректно
2. ✅ Редактирование группы — дата не меняется при сохранении
3. ✅ Создание расписания — предупреждения показывают правильную дату
4. ✅ Отображение событий в календаре — даты корректны
5. ✅ Аудитория отображается в названии занятия

## Рекомендации

### Всегда используйте локальные методы для дат в input[type="date"]

```javascript
// ✅ ПРАВИЛЬНО
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");
return `${year}-${month}-${day}`;

// ❌ НЕПРАВИЛЬНО
return date.toISOString().split("T")[0];
```

### Для timestamp используйте UTC

```javascript
// Для API и базы данных
const timestamp = date.toISOString();
```

### Для отображения пользователю используйте локальное время

```javascript
// Для календаря, форм и UI
timeZone: "local";
```
