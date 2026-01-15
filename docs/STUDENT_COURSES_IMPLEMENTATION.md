# План добавления блока "Мои курсы" на страницу студента

## Файл: `app/pages/students/[id].vue`

### 1. Добавить интерфейсы и состояние (в секцию `<script setup>`)

После строки `const selectedCertificate = ref<StudentCertificate | null>(null);` добавить:

```typescript
// Интерфейс для курса студента
interface StudentCourse {
  group_id: string;
  course_id: string;
  course_name: string;
  group_name: string;
  status: "active" | "completed" | "dropped";
  start_date: Date | string;
  end_date: Date | string;
  teacher_name: string | null;
  progress: number;
  total_lessons: number;
  attended_lessons: number;
}

// Состояние для курсов
const studentCourses = ref<StudentCourse[]>([]);
const coursesLoading = ref(false);

// Computed для разделения курсов по статусу
const activeCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "active")
);

const completedCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "completed")
);
```

### 2. Добавить функцию загрузки курсов

После функции `fetchStudent`:

```typescript
// Загрузка курсов студента
const fetchStudentCourses = async () => {
  if (!student.value?.user_id) return;

  coursesLoading.value = true;

  try {
    const response = await authFetch<StudentCourse[]>(
      `/api/students/my-courses`,
      {
        method: "GET",
      }
    );

    studentCourses.value = response || [];
  } catch (err) {
    console.error("Ошибка загрузки курсов студента:", err);
    studentCourses.value = [];
  } finally {
    coursesLoading.value = false;
  }
};
```

### 3. Добавить вспомогательную функцию форматирования даты

После функции `formatDate`:

```typescript
const formatShortDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
```

### 4. Обновить функцию `fetchStudent`

В функции `fetchStudent`, после успешной загрузки студента добавить:

```typescript
if (response.success) {
  student.value = response.student;
  // Загружаем курсы студента
  await fetchStudentCourses();
}
```

### 5. Добавить блок UI в template

После блока "Сертификаты" (перед `<!-- Модальные окна -->`), добавить блок "Мои курсы".

Полный код блока находится в файле: `docs/STUDENT_COURSES_BLOCK.md`

## Альтернативный подход

Если нужен API endpoint специально для админа/модератора для просмотра курсов конкретного студента:

### Создать новый endpoint: `server/api/students/[id]/courses.get.ts`

```typescript
import { getStudentCourses } from "../../../repositories/studentCourseRepository";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const studentId = event.context.params?.id;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Проверка прав доступа
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Student ID is required",
    });
  }

  try {
    // Получаем user_id студента
    const studentData = await executeQuery<any[]>(
      "SELECT user_id FROM students WHERE id = ? LIMIT 1",
      [studentId]
    );

    if (studentData.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Student not found",
      });
    }

    const courses = await getStudentCourses(studentData[0].user_id);
    return courses;
  } catch (error: any) {
    console.error("Failed to get student courses:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve courses",
    });
  }
});
```

Тогда в компоненте использовать:

```typescript
const response = await authFetch<StudentCourse[]>(
  `/api/students/${studentId}/courses`,
  { method: "GET" }
);
```
