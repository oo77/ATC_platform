# Рекомендации по оптимизации и дальнейшему развитию

**Дата:** 2026-01-13  
**Версия:** 1.0

---

## 🎯 Краткосрочные улучшения (1-2 недели)

### 1. **Автоматизация назначения пересдач** (Высокий приоритет)

#### Текущая проблема

Модератор должен вручную создавать событие пересдачи через EventModal, что неудобно.

#### Решение

Создать специализированный UI на странице результатов группы:

**Местоположение:** `app/pages/groups/[id]/index.vue` или новая страница `app/pages/groups/[id]/retakes.vue`

**Компоненты:**

```vue
<!-- RetakeScheduleModal.vue -->
<template>
  <UiModal :is-open="isOpen" title="Назначить пересдачу" size="lg">
    <!-- Шаг 1: Выбор теста -->
    <div v-if="step === 1">
      <h3>Выберите тест для пересдачи</h3>
      <select v-model="selectedTestId">
        <option v-for="test in failedTests" :value="test.id">
          {{ test.name }} ({{ test.failedCount }} студентов)
        </option>
      </select>
    </div>

    <!-- Шаг 2: Выбор студентов -->
    <div v-if="step === 2">
      <h3>Студенты с неудовлетворительными оценками</h3>
      <UiMultiSelect
        v-model="selectedStudents"
        :options="failedStudents"
        :pre-selected="failedStudents.map((s) => s.id)"
      />
    </div>

    <!-- Шаг 3: Дата и время -->
    <div v-if="step === 3">
      <DateTimePicker v-model="retakeDate" />
      <ClassroomSelector v-model="classroomId" />
    </div>
  </UiModal>
</template>
```

**API endpoint:**

```typescript
// POST /api/retakes/schedule
export default defineEventHandler(async (event) => {
  const { testTemplateId, studentIds, date, time, classroomId } =
    await readBody(event);

  // 1. Создать событие расписания
  const scheduleEvent = await createScheduleEvent({
    title: `Пересдача: ${testTemplate.name}`,
    eventType: "assessment",
    testTemplateId,
    allowedStudentIds: studentIds,
    // ...
  });

  // 2. Отправить уведомления студентам
  await sendRetakeNotifications(studentIds, scheduleEvent);

  return { success: true, event: scheduleEvent };
});
```

---

### 2. **Улучшение валидации форм** (Средний приоритет)

#### Текущая проблема

Не все поля валидируются согласно `validation.md`.

#### Решение

Создать единый composable для валидации:

```typescript
// composables/useFormValidation.ts
export const useFormValidation = () => {
  const validateRequired = (value: any, fieldName: string) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return `Поле "${fieldName}" обязательно для заполнения`;
    }
    return null;
  };

  const validateRange = (
    value: number,
    min: number,
    max: number,
    fieldName: string
  ) => {
    if (value < min || value > max) {
      return `${fieldName} должно быть от ${min} до ${max}`;
    }
    return null;
  };

  const validateGrade = (grade: number) => {
    return validateRange(grade, 0, 100, "Оценка");
  };

  return {
    validateRequired,
    validateRange,
    validateGrade,
  };
};
```

**Использование:**

```vue
<script setup>
const { validateGrade } = useFormValidation();

const saveGrade = () => {
  const error = validateGrade(gradeInput.value);
  if (error) {
    toast.error(error);
    return;
  }
  // ...
};
</script>
```

---

### 3. **Система уведомлений** (Высокий приоритет)

#### Текущая проблема

Студенты не получают уведомления о назначенных пересдачах.

#### Решение

Интегрировать с существующей системой уведомлений:

```typescript
// server/utils/notifications.ts
export async function sendRetakeNotification(
  studentId: string,
  testName: string,
  date: Date,
  time: string
) {
  // 1. Email уведомление
  await sendEmail({
    to: student.email,
    subject: `Назначена пересдача: ${testName}`,
    template: "retake-scheduled",
    data: { testName, date, time },
  });

  // 2. Push уведомление (если есть)
  await sendPushNotification(studentId, {
    title: "Назначена пересдача",
    body: `${testName} - ${formatDate(date)} в ${time}`,
  });

  // 3. Внутреннее уведомление
  await createNotification({
    userId: studentId,
    type: "retake_scheduled",
    title: "Назначена пересдача",
    message: `Вам назначена пересдача по тесту "${testName}"`,
    link: `/tests/${testId}`,
  });
}
```

---

## 🚀 Среднесрочные улучшения (1-2 месяца)

### 4. **Аналитика и отчеты**

#### Дашборд пересдач

```vue
<!-- app/pages/admin/retakes/analytics.vue -->
<template>
  <div>
    <h1>Аналитика пересдач</h1>

    <!-- Статистика -->
    <div class="grid grid-cols-4 gap-4">
      <StatCard title="Всего пересдач" :value="stats.total" />
      <StatCard title="Успешных" :value="stats.passed" />
      <StatCard title="Неуспешных" :value="stats.failed" />
      <StatCard title="Запланировано" :value="stats.scheduled" />
    </div>

    <!-- График -->
    <LineChart :data="retakesTrend" title="Динамика пересдач" />

    <!-- Топ тестов по пересдачам -->
    <DataTable :data="topRetakeTests" :columns="columns" />
  </div>
</template>
```

#### API endpoints

```typescript
// GET /api/retakes/analytics
// GET /api/retakes/stats?groupId=xxx
// GET /api/retakes/history?studentId=xxx
```

---

### 5. **История пересдач студента**

#### Компонент

```vue
<!-- components/student/RetakeHistory.vue -->
<template>
  <div class="retake-history">
    <h3>История пересдач</h3>
    <div v-for="retake in history" :key="retake.id">
      <div class="retake-card">
        <span>{{ retake.testName }}</span>
        <span>{{ retake.date }}</span>
        <span :class="getScoreClass(retake.score)"> {{ retake.score }}% </span>
        <span>{{ retake.attempt }}/{{ retake.maxAttempts }}</span>
      </div>
    </div>
  </div>
</template>
```

---

### 6. **Автоматическое назначение пересдач**

#### Концепция

Система автоматически назначает пересдачи на основе правил:

```typescript
// server/utils/autoRetake.ts
export async function scheduleAutoRetakes(
  groupId: string,
  disciplineId: string
) {
  // 1. Найти всех студентов с неудовлетворительными оценками
  const failedStudents = await getFailedStudents(groupId, disciplineId);

  // 2. Для каждого теста создать событие пересдачи
  for (const test of failedTests) {
    const retakeDate = calculateRetakeDate(test.originalDate);

    await createScheduleEvent({
      title: `Пересдача: ${test.name}`,
      eventType: "assessment",
      testTemplateId: test.templateId,
      allowedStudentIds: test.failedStudentIds,
      date: retakeDate,
      // ...
    });
  }
}

function calculateRetakeDate(originalDate: Date): Date {
  // Логика: через 1 неделю после окончания курса
  return addDays(originalDate, 7);
}
```

---

## 💡 Долгосрочные улучшения (3-6 месяцев)

### 7. **Интеграция с календарем**

- Экспорт событий пересдач в Google Calendar / Outlook
- iCal файлы для студентов
- Напоминания за 24 часа до пересдачи

### 8. **Мобильное приложение**

- Push-уведомления о пересдачах
- Быстрый доступ к расписанию пересдач
- Возможность запросить пересдачу через приложение

### 9. **AI-ассистент для модераторов**

- Автоматические рекомендации по датам пересдач
- Анализ загруженности аудиторий
- Оптимизация расписания пересдач

---

## 🔧 Технические оптимизации

### 1. **Кэширование**

```typescript
// Кэшировать список студентов группы
const groupStudents = await useAsyncData(
  `group-students-${groupId}`,
  () => fetchGroupStudents(groupId),
  {
    maxAge: 60 * 5, // 5 минут
    staleWhileRevalidate: true,
  }
);
```

### 2. **Оптимизация запросов**

```sql
-- Индексы для быстрого поиска
CREATE INDEX idx_test_assignments_allowed_students
ON test_assignments((CAST(allowed_student_ids AS CHAR(1000))));

CREATE INDEX idx_grades_student_event
ON grades(student_id, schedule_event_id);
```

### 3. **Batch операции**

```typescript
// Массовое создание пересдач
async function createBulkRetakes(retakes: RetakeInput[]) {
  return executeTransaction(async (conn) => {
    const events = [];
    for (const retake of retakes) {
      const event = await createScheduleEvent(retake, conn);
      events.push(event);
    }
    return events;
  });
}
```

---

## 📊 Метрики успеха

### KPI для отслеживания

1. **Эффективность пересдач**

   - % студентов, сдавших с первой пересдачи
   - Средний балл на пересдаче vs. первая попытка
   - Время между неудачей и пересдачей

2. **Использование системы**

   - Количество назначенных пересдач в месяц
   - % студентов, использующих пересдачи
   - Средняя загрузка модераторов

3. **Качество обучения**
   - Итоговый % успеваемости с учетом пересдач
   - Динамика оценок по дисциплинам
   - Удовлетворенность студентов

---

## 🎨 UX улучшения

### 1. **Визуальные индикаторы**

```vue
<!-- Индикатор пересдачи в расписании -->
<div class="event-card" :class="{ 'is-retake': event.isRetake }">
  <span v-if="event.isRetake" class="retake-badge">
    🔄 Пересдача
  </span>
  {{ event.title }}
</div>
```

### 2. **Прогресс-бар**

```vue
<!-- Прогресс студента по пересдачам -->
<div class="retake-progress">
  <span>Попытка {{ attempt }}/{{ maxAttempts }}</span>
  <ProgressBar :value="(attempt / maxAttempts) * 100" />
</div>
```

### 3. **Подсказки и туториалы**

- Всплывающие подсказки при первом использовании
- Видео-инструкции для модераторов
- FAQ по пересдачам

---

## 🔒 Безопасность и права доступа

### Роли и права

```typescript
// Кто может назначать пересдачи
const canScheduleRetakes = computed(() => {
  return (
    user.role === "ADMIN" ||
    user.role === "MODERATOR" ||
    (user.role === "TEACHER" && user.isPrimaryInstructor)
  );
});

// Кто может видеть список пересдач
const canViewRetakes = computed(() => {
  return user.role !== "STUDENT" || retake.allowedStudentIds.includes(user.id);
});
```

---

## 📝 Документация

### Необходимо создать

1. **Руководство пользователя**

   - Как назначить пересдачу (для модераторов)
   - Как пройти пересдачу (для студентов)
   - Как выставить оценку за практику (для инструкторов)

2. **API документация**

   - Swagger/OpenAPI спецификация
   - Примеры запросов
   - Коды ошибок

3. **Техническая документация**
   - Архитектура системы пересдач
   - Диаграммы потоков данных
   - Схема БД

---

## ✅ Чеклист перед production

- [ ] Все API endpoints покрыты тестами
- [ ] Frontend компоненты протестированы
- [ ] Миграции БД проверены на staging
- [ ] Документация обновлена
- [ ] Пользователи обучены
- [ ] Мониторинг настроен
- [ ] Rollback план готов
- [ ] Performance тесты пройдены

---

**Автор:** Antigravity AI  
**Версия:** 1.0  
**Последнее обновление:** 2026-01-13 12:00
