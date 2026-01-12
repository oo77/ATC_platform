# 🔐 СИСТЕМА РАЗРЕШЕНИЙ (PERMISSIONS) — ПЛАН РЕАЛИЗАЦИИ

> **Версия:** 1.1  
> **Дата:** 2025-12-30  
> **Статус:** Утверждён к реализации

---

## 📋 ПОЛНЫЙ АНАЛИЗ ТЕКУЩЕЙ СТРУКТУРЫ

### 1. ТЕКУЩИЕ РОЛИ В СИСТЕМЕ

```typescript
export enum UserRole {
  ADMIN = "ADMIN", // Администратор системы
  MANAGER = "MANAGER", // Менеджер/Модератор
  TEACHER = "TEACHER", // Преподаватель/Инструктор
  STUDENT = "STUDENT", // Слушатель курсов
}
```

### 2. ТЕКУЩИЕ СУЩНОСТИ В СИСТЕМЕ

| Сущность              | Таблица БД                     | Описание                                 |
| --------------------- | ------------------------------ | ---------------------------------------- |
| Users                 | `users`                        | Пользователи системы                     |
| Students              | `students`                     | Слушатели курсов                         |
| Instructors           | `instructors`                  | Преподаватели                            |
| Organizations         | `organizations`                | Организации                              |
| Representatives       | `organization_representatives` | Представители организаций (Telegram-бот) |
| Courses               | `courses`                      | Учебные программы                        |
| Disciplines           | `disciplines`                  | Дисциплины курсов                        |
| Study Groups          | `study_groups`                 | Учебные группы                           |
| Schedule Events       | `schedule_events`              | Занятия в расписании                     |
| Certificates          | `certificates`                 | Сертификаты                              |
| Certificate Templates | `certificate_templates`        | Шаблоны сертификатов                     |
| Files                 | `files`                        | Файлы                                    |
| Folders               | `folders`                      | Папки файлового менеджера                |
| Activity Logs         | `activity_logs`                | Логи действий                            |

### 3. СВЯЗИ РОЛЕЙ С СУЩНОСТЯМИ

| Роль        | Связь с сущностью                                                                     |
| ----------- | ------------------------------------------------------------------------------------- |
| **ADMIN**   | `users` (role = 'ADMIN')                                                              |
| **MANAGER** | `users` (role = 'MANAGER')                                                            |
| **TEACHER** | `users` (role = 'TEACHER') → `instructors` (через `users.id` ↔ `instructors.user_id`) |
| **STUDENT** | `users` (role = 'STUDENT') → `students` (через `users.id` ↔ `students.user_id`)       |

> ⚠️ **ТРЕБУЕТСЯ:** Добавить поле `user_id` в таблицы `instructors` и `students` для связи с `users`.

---

## 🏗️ АРХИТЕКТУРА СИСТЕМЫ PERMISSIONS

### УРОВЕНЬ 1: РОЛИ (Roles) — КТО

```typescript
export enum UserRole {
  ADMIN = "ADMIN", // Полный доступ ко всему
  MANAGER = "MANAGER", // Управление контентом и пользователями
  TEACHER = "TEACHER", // Работа с группами и расписанием (свои)
  STUDENT = "STUDENT", // Просмотр своих данных
}
```

### УРОВЕНЬ 2: РАЗРЕШЕНИЯ (Permissions) — ЧТО МОЖНО ДЕЛАТЬ

```typescript
export enum Permission {
  // ========== DASHBOARD ==========
  DASHBOARD_VIEW = "dashboard:view",
  DASHBOARD_STATS = "dashboard:stats",

  // ========== USERS ==========
  USERS_VIEW = "users:view",
  USERS_CREATE = "users:create",
  USERS_UPDATE = "users:update",
  USERS_DELETE = "users:delete",
  USERS_MANAGE_ROLES = "users:manage_roles",

  // ========== STUDENTS ==========
  STUDENTS_VIEW = "students:view",
  STUDENTS_VIEW_OWN = "students:view_own", // Только свои данные
  STUDENTS_VIEW_ALL = "students:view_all", // Все слушатели
  STUDENTS_CREATE = "students:create",
  STUDENTS_UPDATE = "students:update",
  STUDENTS_DELETE = "students:delete",
  STUDENTS_IMPORT = "students:import",
  STUDENTS_EXPORT = "students:export",

  // ========== INSTRUCTORS ==========
  INSTRUCTORS_VIEW = "instructors:view",
  INSTRUCTORS_CREATE = "instructors:create",
  INSTRUCTORS_UPDATE = "instructors:update",
  INSTRUCTORS_DELETE = "instructors:delete",
  INSTRUCTORS_HOURS = "instructors:hours", // Просмотр часов

  // ========== ORGANIZATIONS ==========
  ORGANIZATIONS_VIEW = "organizations:view",
  ORGANIZATIONS_CREATE = "organizations:create",
  ORGANIZATIONS_UPDATE = "organizations:update",
  ORGANIZATIONS_DELETE = "organizations:delete",

  // ========== REPRESENTATIVES ==========
  REPRESENTATIVES_VIEW = "representatives:view",
  REPRESENTATIVES_APPROVE = "representatives:approve",
  REPRESENTATIVES_BLOCK = "representatives:block",
  REPRESENTATIVES_MANAGE = "representatives:manage",

  // ========== COURSES ==========
  COURSES_VIEW = "courses:view",
  COURSES_CREATE = "courses:create",
  COURSES_UPDATE = "courses:update",
  COURSES_DELETE = "courses:delete",

  // ========== DISCIPLINES ==========
  DISCIPLINES_VIEW = "disciplines:view",
  DISCIPLINES_MANAGE = "disciplines:manage",

  // ========== GROUPS ==========
  GROUPS_VIEW = "groups:view",
  GROUPS_VIEW_OWN = "groups:view_own", // Свои группы (для инструктора)
  GROUPS_VIEW_ALL = "groups:view_all", // Все группы
  GROUPS_CREATE = "groups:create",
  GROUPS_UPDATE = "groups:update",
  GROUPS_DELETE = "groups:delete",
  GROUPS_MANAGE_STUDENTS = "groups:manage_students",

  // ========== SCHEDULE ==========
  SCHEDULE_VIEW = "schedule:view",
  SCHEDULE_VIEW_OWN = "schedule:view_own", // Своё расписание
  SCHEDULE_VIEW_ALL = "schedule:view_all", // Все события
  SCHEDULE_CREATE = "schedule:create",
  SCHEDULE_UPDATE = "schedule:update",
  SCHEDULE_DELETE = "schedule:delete",

  // ========== ATTENDANCE ==========
  ATTENDANCE_VIEW = "attendance:view",
  ATTENDANCE_MARK = "attendance:mark",
  ATTENDANCE_EDIT = "attendance:edit",

  // ========== GRADES ==========
  GRADES_VIEW = "grades:view",
  GRADES_MANAGE = "grades:manage",

  // ========== CERTIFICATES ==========
  CERTIFICATES_VIEW = "certificates:view",
  CERTIFICATES_VIEW_OWN = "certificates:view_own",
  CERTIFICATES_ISSUE = "certificates:issue",
  CERTIFICATES_REVOKE = "certificates:revoke",
  CERTIFICATES_DOWNLOAD = "certificates:download",

  // ========== CERTIFICATE TEMPLATES ==========
  TEMPLATES_VIEW = "templates:view",
  TEMPLATES_CREATE = "templates:create",
  TEMPLATES_UPDATE = "templates:update",
  TEMPLATES_DELETE = "templates:delete",

  // ========== FILES ==========
  FILES_VIEW = "files:view",
  FILES_UPLOAD = "files:upload",
  FILES_DELETE = "files:delete",
  FILES_MANAGE = "files:manage",

  // ========== SETTINGS ==========
  SETTINGS_VIEW = "settings:view",
  SETTINGS_MANAGE = "settings:manage",

  // ========== ACTIVITY LOGS ==========
  LOGS_VIEW = "logs:view",
}
```

### УРОВЕНЬ 3: МАППИНГ РОЛЕЙ НА РАЗРЕШЕНИЯ

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // =========================================================
  // ADMIN — Полный доступ ко всему
  // =========================================================
  [UserRole.ADMIN]: [
    // Все разрешения
    ...Object.values(Permission),
  ],

  // =========================================================
  // MANAGER — Управление контентом
  // =========================================================
  [UserRole.MANAGER]: [
    // Dashboard
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,

    // Users (ограниченно)
    Permission.USERS_VIEW,
    // НЕ может создавать/удалять пользователей и менять роли

    // Students
    Permission.STUDENTS_VIEW,
    Permission.STUDENTS_VIEW_ALL,
    Permission.STUDENTS_CREATE,
    Permission.STUDENTS_UPDATE,
    Permission.STUDENTS_IMPORT,
    Permission.STUDENTS_EXPORT,
    // НЕ может удалять слушателей

    // Instructors
    Permission.INSTRUCTORS_VIEW,
    Permission.INSTRUCTORS_HOURS,
    // НЕ может создавать/редактировать/удалять

    // Organizations
    Permission.ORGANIZATIONS_VIEW,
    Permission.ORGANIZATIONS_CREATE,
    Permission.ORGANIZATIONS_UPDATE,
    // НЕ может удалять

    // Representatives
    Permission.REPRESENTATIVES_VIEW,
    Permission.REPRESENTATIVES_APPROVE,
    Permission.REPRESENTATIVES_BLOCK,
    // НЕ может полностью управлять (удалять)

    // Courses
    Permission.COURSES_VIEW,
    // НЕ может создавать/редактировать/удалять

    // Disciplines
    Permission.DISCIPLINES_VIEW,
    // НЕ может управлять

    // Groups
    Permission.GROUPS_VIEW,
    Permission.GROUPS_VIEW_ALL,
    Permission.GROUPS_CREATE,
    Permission.GROUPS_UPDATE,
    Permission.GROUPS_MANAGE_STUDENTS,
    // НЕ может удалять группы

    // Schedule
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_ALL,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_UPDATE,
    // НЕ может удалять события

    // Attendance
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.ATTENDANCE_EDIT,

    // Grades
    Permission.GRADES_VIEW,
    Permission.GRADES_MANAGE,

    // Certificates
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_ISSUE,
    Permission.CERTIFICATES_DOWNLOAD,
    // НЕ может отзывать сертификаты

    // Templates (только просмотр)
    Permission.TEMPLATES_VIEW,

    // Files
    Permission.FILES_VIEW,
    Permission.FILES_UPLOAD,
    // НЕ может удалять/управлять

    // Settings (только просмотр)
    Permission.SETTINGS_VIEW,

    // Logs
    Permission.LOGS_VIEW,
  ],

  // =========================================================
  // TEACHER — Преподаватель
  // =========================================================
  [UserRole.TEACHER]: [
    // Dashboard
    Permission.DASHBOARD_VIEW,

    // Students (только просмотр своих групп)
    Permission.STUDENTS_VIEW,
    Permission.STUDENTS_VIEW_OWN, // Только слушатели из своих групп

    // Groups (свои группы)
    Permission.GROUPS_VIEW,
    Permission.GROUPS_VIEW_OWN,

    // Schedule (своё расписание)
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_OWN,

    // Attendance (для своих групп)
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,

    // Grades (для своих групп)
    Permission.GRADES_VIEW,
    Permission.GRADES_MANAGE,

    // Files (только просмотр)
    Permission.FILES_VIEW,

    // Courses (только просмотр)
    Permission.COURSES_VIEW,
    Permission.DISCIPLINES_VIEW,
  ],

  // =========================================================
  // STUDENT — Слушатель
  // =========================================================
  [UserRole.STUDENT]: [
    // Dashboard (минимальный)
    Permission.DASHBOARD_VIEW,

    // Свои данные
    Permission.STUDENTS_VIEW_OWN,

    // Schedule (своё)
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_OWN,

    // Attendance (только просмотр своего)
    Permission.ATTENDANCE_VIEW,

    // Grades (только просмотр своих)
    Permission.GRADES_VIEW,

    // Certificates (свои)
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_VIEW_OWN,
    Permission.CERTIFICATES_DOWNLOAD,
  ],
};
```

---

## 🔗 ФИЛЬТРАЦИЯ ДАННЫХ ПО РОЛЯМ

### TEACHER — Фильтрация через `instructor_id` в расписании

> **Выбран оптимальный вариант без структурных изменений БД.**

```typescript
// Получение групп преподавателя через schedule_events
async function getTeacherGroups(instructorId: string): Promise<string[]> {
  const query = `
    SELECT DISTINCT se.group_id 
    FROM schedule_events se 
    WHERE se.instructor_id = ?
  `;
  const [rows] = await executeQuery(query, [instructorId]);
  return rows.map((r) => r.group_id);
}

// Проверка доступа к группе
async function canAccessGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  const user = await getUserById(userId);

  if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
    return true;
  }

  if (user.role === UserRole.TEACHER) {
    // Получаем instructor_id по user_id
    const instructor = await getInstructorByUserId(userId);
    if (!instructor) return false;

    const teacherGroups = await getTeacherGroups(instructor.id);
    return teacherGroups.includes(groupId);
  }

  return false;
}
```

### STUDENT — Связь через `users.id` ↔ `students.user_id`

> **Требуется миграция:** добавить поле `user_id` в таблицу `students`.

```typescript
// Получение данных студента по user_id
async function getStudentByUserId(userId: string): Promise<Student | null> {
  const query = `SELECT * FROM students WHERE user_id = ?`;
  const [rows] = await executeQuery(query, [userId]);
  return rows[0] || null;
}

// Получение групп студента
async function getStudentGroups(studentId: string): Promise<string[]> {
  const query = `
    SELECT group_id FROM study_group_students WHERE student_id = ?
  `;
  const [rows] = await executeQuery(query, [studentId]);
  return rows.map((r) => r.group_id);
}
```

---

## 📁 СТРУКТУРА ФАЙЛОВ

```
d:\Projects\nuxt-tailadmin\
├── types\
│   ├── auth.ts           # Существует (расширить)
│   └── permissions.ts    # НОВЫЙ: Типы и enum разрешений
│
├── server\
│   ├── types\
│   │   ├── auth.ts       # Существует (синхронизировать)
│   │   └── permissions.ts # НОВЫЙ
│   │
│   ├── utils\
│   │   ├── permissions.ts # НОВЫЙ: Хелперы проверки разрешений
│   │   └── auth.ts       # Существует
│   │
│   ├── database\
│   │   └── migrations\
│   │       └── 20251230_XXX_user_entity_links.ts # НОВЫЙ: Связи user ↔ student/instructor
│   │
│   └── middleware\
│       └── auth.ts       # ОБНОВИТЬ: Добавить проверку permissions
│
├── app\
│   ├── middleware\
│   │   └── auth.global.ts # ОБНОВИТЬ: Добавить проверку permissions
│   │
│   ├── composables\
│   │   └── usePermissions.ts # НОВЫЙ: Composable для проверки
│   │
│   └── components\
│       └── common\
│           └── PermissionGuard.vue # НОВЫЙ: Компонент-обёртка
```

---

## 📊 МАТРИЦА ДОСТУПА К СТРАНИЦАМ

### ADMIN — Полный доступ

| Страница     | Путь | Доступ         |
| ------------ | ---- | -------------- |
| Все страницы | `*`  | ✅ Полный CRUD |

### MANAGER — Управление контентом

| Страница           | Путь                        | Доступ | Ограничения              |
| ------------------ | --------------------------- | ------ | ------------------------ |
| Панель управления  | `/`                         | ✅     | Полная статистика        |
| Учебные программы  | `/programs`                 | ✅     | Только просмотр          |
| Детали программы   | `/programs/[id]`            | ✅     | Только просмотр          |
| Учебные группы     | `/groups`                   | ✅     | Полный CRUD без удаления |
| Детали группы      | `/groups/[id]`              | ✅     | Управление слушателями   |
| Журнал             | `/groups/journal/*`         | ✅     | Редактирование           |
| Сертификаты группы | `/groups/[id]/certificates` | ✅     | Выдача                   |
| Расписание         | `/schedule`                 | ✅     | Создание/редактирование  |
| База данных        | `/database`                 | ✅     | Просмотр + импорт        |
| Файлы              | `/files`                    | ✅     | Загрузка (без удаления)  |
| Шаблоны            | `/certificates/templates`   | ✅     | Только просмотр          |
| Пользователи       | `/users`                    | ✅     | Просмотр (без CRUD)      |
| Слушатель          | `/students/[id]`            | ✅     | Просмотр/редактирование  |
| Инструктор         | `/instructors/[id]`         | ✅     | Только просмотр          |
| Настройки          | `/settings`                 | ✅     | Только просмотр          |

### TEACHER — Преподаватель (фильтрация по `instructor_id`)

| Страница          | Путь                | Доступ | Фильтрация                 |
| ----------------- | ------------------- | ------ | -------------------------- |
| Панель управления | `/`                 | ✅     | Личная статистика          |
| Учебные программы | `/programs`         | ✅     | Только просмотр            |
| Учебные группы    | `/groups`           | ✅     | **Только свои группы**     |
| Детали группы     | `/groups/[id]`      | ⚠️     | Только свои группы         |
| Журнал            | `/groups/journal/*` | ⚠️     | Только свои группы         |
| Расписание        | `/schedule`         | ✅     | **Только своё расписание** |
| Слушатель         | `/students/[id]`    | ⚠️     | Только из своих групп      |
| Инструктор        | `/instructors/[id]` | ⚠️     | Только свой профиль        |
| Профиль           | `/profile`          | ✅     | —                          |

**Недоступные страницы (❌):**

- `/users` — Управление пользователями
- `/database` — База данных
- `/database/import` — Импорт
- `/files` — Файловый менеджер
- `/certificates/templates` — Шаблоны
- `/settings` — Настройки
- `/programs/create` — Создание программ
- `/programs/edit/*` — Редактирование программ

### STUDENT — Слушатель (фильтрация по `students.user_id`)

| Страница          | Путь               | Доступ | Описание           |
| ----------------- | ------------------ | ------ | ------------------ |
| Панель управления | `/`                | ✅     | Личные виджеты     |
| Расписание        | `/schedule`        | ✅     | Своё расписание    |
| Профиль           | `/profile`         | ✅     | Редактирование     |
| Мои сертификаты   | `/my-certificates` | ✅     | **НОВАЯ СТРАНИЦА** |

**Все остальные страницы недоступны (❌)**

---

## 📱 МЕНЮ САЙДБАРА ПО РОЛЯМ

### ADMIN

```typescript
const menuItems = [
  { name: "Учебные программы", path: "/programs" },
  { name: "Учебные группы", path: "/groups" },
  { name: "Расписание", path: "/schedule" },
  { name: "База данных", path: "/database" },
  { name: "Файловый менеджер", path: "/files" },
  { name: "Шаблоны сертификатов", path: "/certificates/templates" },
  { name: "Управление пользователями", path: "/users" },
];
```

### MANAGER

```typescript
const menuItems = [
  { name: "Учебные программы", path: "/programs" },
  { name: "Учебные группы", path: "/groups" },
  { name: "Расписание", path: "/schedule" },
  { name: "База данных", path: "/database" },
  { name: "Файловый менеджер", path: "/files" },
  { name: "Шаблоны сертификатов", path: "/certificates/templates" }, // readonly
  { name: "Управление пользователями", path: "/users" }, // readonly
];
```

### TEACHER

```typescript
const menuItems = [
  { name: "Мои группы", path: "/groups" }, // Фильтрованный список
  { name: "Моё расписание", path: "/schedule" }, // Фильтрованный список
  { name: "Учебные программы", path: "/programs" }, // readonly
];
```

### STUDENT

```typescript
const menuItems = [
  { name: "Моё расписание", path: "/schedule" },
  { name: "Мои сертификаты", path: "/my-certificates" },
];
```

---

## 🗃️ МИГРАЦИЯ БД: Связь Users ↔ Students/Instructors

### Файл: `20251230_025_user_entity_links.ts`

```sql
-- Добавляем user_id в instructors
ALTER TABLE instructors
ADD COLUMN user_id VARCHAR(191) NULL AFTER id,
ADD CONSTRAINT fk_instructors_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE,
ADD UNIQUE INDEX idx_user_id (user_id);

-- Добавляем user_id в students
ALTER TABLE students
ADD COLUMN user_id VARCHAR(191) NULL AFTER id,
ADD CONSTRAINT fk_students_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE,
ADD UNIQUE INDEX idx_user_id (user_id);
```

---

## 🔧 ПЛАН РЕАЛИЗАЦИИ

### ФАЗА 1: Миграция и типы (1-2 часа) ✅ ЗАВЕРШЕНО

1. ✅ Создать миграцию `20251230_026_user_entity_links.ts`
2. ✅ Создать `types/permissions.ts`
3. ✅ Создать `server/types/permissions.ts`
4. ✅ Создать `server/utils/permissions.ts`

### ФАЗА 2: Middleware (2-3 часа) ✅ ЗАВЕРШЕНО

1. ✅ Обновить `app/middleware/auth.global.ts`:

   - Добавить проверку permissions для страниц
   - Реализовать редиректы для недоступных страниц

2. ⏳ Обновить `server/middleware/auth.ts` (опционально):
   - Добавить проверку permissions для API
   - Добавить контекст с разрешениями

### ФАЗА 3: Composables и компоненты (1-2 часа) ✅ ЗАВЕРШЕНО

1. ✅ Создать `composables/usePermissions.ts`
2. ✅ Создать `components/common/PermissionGuard.vue`

### ФАЗА 4: Применение к UI (3-4 часа) ✅ ЗАВЕРШЕНО

1. ✅ Обновить `AppSidebar.vue` — фильтрация меню по роли
2. ✅ Обновить страницы — скрытие кнопок действий:
   - `/groups/index.vue` — кнопка "Создать группу" скрыта для TEACHER/STUDENT
   - `/programs/index.vue` — кнопка "Создать программу" скрыта для TEACHER/STUDENT
   - `/certificates/templates/index.vue` — кнопки создания/удаления шаблонов
3. ✅ Добавить фильтрацию данных для TEACHER:
   - `/api/groups` — TEACHER видит только свои группы
   - `/api/schedule` — TEACHER/STUDENT видят только расписание своих групп

### ФАЗА 5: Страница для STUDENT (1 час) ✅ ЗАВЕРШЕНО

1. ✅ Создать `/my-certificates` — личные сертификаты
2. ✅ Создать API `/api/certificates/my` для получения сертификатов студента
3. ✅ Создать иконку `CertificateIcon.vue`

---

## � ФАЗА 6: СОЗДАНИЕ УЧЁТНЫХ ЗАПИСЕЙ ДЛЯ TEACHER/STUDENT

> **Статус:** В разработке  
> **Проблема:** При создании инструктора/студента НЕ создаётся учётная запись (user) для входа в систему.

### 6.1 ТЕКУЩАЯ ПРОБЛЕМА

| Поток создания          | Что происходит                          | Учётная запись                  |
| ----------------------- | --------------------------------------- | ------------------------------- |
| POST `/api/instructors` | Создаётся только запись в `instructors` | ❌ НЕ создаётся                 |
| POST `/api/students`    | Создаётся только запись в `students`    | ❌ НЕ создаётся                 |
| POST `/api/users`       | Создаётся только запись в `users`       | ✅ Создаётся, но НЕ связывается |

### 6.2 РЕШЕНИЕ: Вариант A — Автоматическое создание

При создании инструктора/студента через форму:

1. Добавить опцию "Создать учётную запись для входа в систему"
2. Если опция активна — запрашивать email и пароль
3. Автоматически создавать user с соответствующей ролью
4. Связывать user.id → instructor.user_id / student.user_id

### 6.3 ИЗМЕНЕНИЯ В ФОРМАХ

#### Инструктор (InstructorFormModal.vue)

```typescript
// Новые поля формы
formData = {
  // ...существующие поля...
  createAccount: false, // Чекбокс: создать аккаунт
  accountEmail: "", // Email для входа (если createAccount = true)
  accountPassword: "", // Пароль (если createAccount = true)
  autoGeneratePassword: true, // Автогенерация пароля
};
```

**UI:**

- Чекбокс "Создать учётную запись для входа"
- При активации показываются:
  - Email (обязательный, предзаполняется из email инструктора)
  - Пароль / Автогенерация
- Отображать предупреждение: "После создания учётной записи, инструктор сможет входить в систему с ролью TEACHER"

#### Студент (StudentFormModal.vue)

```typescript
// Новые поля формы
formData = {
  // ...существующие поля...
  createAccount: false,
  accountEmail: "", // Email для входа
  accountPassword: "",
  autoGeneratePassword: true,
};
```

**UI:**

- Аналогично инструктору
- Предзаполнять email из `PINFL@student.local` (как fallback)
- Предупреждение: "После создания учётной записи, слушатель сможет входить в систему с ролью STUDENT"

### 6.4 ИЗМЕНЕНИЯ В API

#### POST /api/instructors (index.post.ts)

```typescript
const instructorSchema = z.object({
  // ...существующие поля...

  // Новые поля для создания аккаунта
  createAccount: z.boolean().optional().default(false),
  accountEmail: z.string().email().optional(),
  accountPassword: z.string().min(8).optional(),
  autoGeneratePassword: z.boolean().optional().default(true),
});

// Логика:
if (data.createAccount) {
  // 1. Проверить уникальность email в users
  // 2. Сгенерировать пароль если autoGeneratePassword
  // 3. Создать user с role = 'TEACHER'
  // 4. Создать instructor с user_id = user.id
  // 5. Вернуть сгенерированный пароль (только при автогенерации)
} else {
  // Создать instructor без user_id (как раньше)
}
```

#### POST /api/students (index.post.ts)

```typescript
// Аналогичная логика, но role = 'STUDENT'
```

### 6.5 МИГРАЦИЯ: Связь с существующими записями

Для существующих инструкторов/студентов без аккаунта:

- Добавить кнопку "Создать аккаунт" в карточку профиля
- Вызывать API: `POST /api/instructors/:id/create-account`
- Вызывать API: `POST /api/students/:id/create-account`

### 6.6 ЗАДАЧИ РЕАЛИЗАЦИИ

1. ✅ **Backend:**

   - [x] Обновить схему валидации `instructorSchema` — добавить поля аккаунта
   - [x] Добавить логику создания user в `createInstructor`
   - [x] Добавить функции `linkInstructorToUser` и `getInstructorByUserId`
   - [x] Обновить схему валидации студентов
   - [x] Добавить логику создания user в `createStudent`
   - [x] Добавить функции `linkStudentToUser` и `getStudentByUserId`
   - [ ] Создать endpoint `/api/instructors/:id/create-account` (для существующих)
   - [ ] Создать endpoint `/api/students/:id/create-account` (для существующих)

2. ✅ **Frontend:**

   - [x] Обновить `InstructorFormModal.vue` — добавить секцию аккаунта
   - [x] Обновить `StudentFormModal.vue` — добавить секцию аккаунта
   - [x] Обновить `StudentManagementPanel.vue` — обработка сгенерированного пароля
   - [ ] Добавить кнопку "Создать аккаунт" в карточку инструктора (для существующих)
   - [ ] Добавить кнопку "Создать аккаунт" в карточку студента (для существующих)

3. ✅ **Уведомления:**
   - [x] Показывать сгенерированный пароль после создания
   - [ ] Отправлять email с учётными данными (опционально, будущее)

---

## �📊 ИТОГОВАЯ МАТРИЦА CRUD ПО РОЛЯМ

| Ресурс              | ADMIN | MANAGER |  TEACHER  | STUDENT  |
| ------------------- | :---: | :-----: | :-------: | :------: |
| **Users**           | CRUD  |    R    |     —     |    —     |
| **Students**        | CRUD  |   CRU   | R (свои)  | R (self) |
| **Instructors**     | CRUD  |    R    | R (self)  |    —     |
| **Organizations**   | CRUD  |   CRU   |     —     |    —     |
| **Representatives** | CRUD  |   RU    |     —     |    —     |
| **Courses**         | CRUD  |    R    |     R     |    —     |
| **Disciplines**     | CRUD  |    R    |     R     |    —     |
| **Groups**          | CRUD  |   CRU   | R (свои)  |    —     |
| **Schedule**        | CRUD  |   CRU   | R (своё)  | R (своё) |
| **Attendance**      | CRUD  |   RU    | RU (свои) | R (self) |
| **Grades**          | CRUD  |   RU    | RU (свои) | R (self) |
| **Certificates**    | CRUD  |   CRU   |     —     | R (own)  |
| **Templates**       | CRUD  |    R    |     —     |    —     |
| **Files**           | CRUD  |   RU    |     R     |    —     |
| **Settings**        | CRUD  |    R    |     —     |    —     |
| **Logs**            |   R   |    R    |     —     |    —     |

**Обозначения:**

- **C** = Create
- **R** = Read
- **U** = Update
- **D** = Delete
- **свои** = Фильтрация по instructor_id
- **self** = Только свои данные

---

## ✅ ГОТОВО К РЕАЛИЗАЦИИ

Документация утверждена. Следующий шаг — начать реализацию с Фазы 1.
