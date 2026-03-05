# 📊 Конструктор отчётности — Архитектура

> **Дата:** 2026-03-05  
> **Принцип:** существующие таблицы БД — только READ. Новые таблицы — только для метаданных конфигурации.  
> **Страница:** `/reports` и `/reports/builder`

---

## Концепция: Pivot-подобный Builder

Аналог Excel PivotTable, адаптированный под предметную область АТЦ.

**Три оси отчёта:**

- **Строки (GROUP BY)** — группировка: по организации, курсу, группе, преподавателю или по временным шкалам
- **Столбцы** — поля данных с агрегацией: SUM, COUNT, AVG, MIN, MAX, LIST
- **Фильтры** — ограничение выборки по любым измерениям

---

## Полный каталог полей по сущностям

### 📚 Курсы и дисциплины

| Ключ поля                     | Название            | Тип     | Агрегации          |
| ----------------------------- | ------------------- | ------- | ------------------ |
| `course.name`                 | Название курса      | text    | LIST               |
| `course.short_name`           | Краткое название    | text    | LIST               |
| `course.code`                 | Код курса           | text    | LIST               |
| `course.total_hours`          | Всего часов         | number  | SUM, AVG, MIN, MAX |
| `course.is_active`            | Активен             | boolean | COUNT              |
| `discipline.name`             | Название дисциплины | text    | LIST               |
| `discipline.hours`            | Всего часов         | number  | SUM, AVG           |
| `discipline.theory_hours`     | Часы теории         | number  | SUM, AVG           |
| `discipline.practice_hours`   | Часы практики       | number  | SUM, AVG           |
| `discipline.assessment_hours` | Часы оценки         | number  | SUM, AVG           |

### 👥 Учебные группы

| Ключ поля              | Название            | Тип      | Агрегации     |
| ---------------------- | ------------------- | -------- | ------------- |
| `group.code`           | Код группы          | text     | LIST          |
| `group.start_date`     | Дата начала         | date     | MIN, MAX      |
| `group.end_date`       | Дата окончания      | date     | MIN, MAX      |
| `group.classroom`      | Аудитория           | text     | LIST          |
| `group.is_active`      | Активна             | boolean  | COUNT         |
| `group.students_count` | Кол-во слушателей   | number   | SUM, AVG, MAX |
| `group.duration_days`  | Длительность (дней) | computed | AVG, MAX      |

### 🧑‍🎓 Слушатели

| Ключ поля              | Название            | Тип  | Агрегации   |
| ---------------------- | ------------------- | ---- | ----------- |
| `student.full_name`    | ФИО                 | text | LIST, COUNT |
| `student.pinfl`        | ПИНФЛ               | text | COUNT       |
| `student.organization` | Организация (текст) | text | LIST        |
| `student.department`   | Отдел               | text | LIST        |
| `student.position`     | Должность           | text | LIST        |
| `student.created_at`   | Дата регистрации    | date | MIN, MAX    |

### 👨‍🏫 Инструкторы

| Ключ поля              | Название        | Тип     | Агрегации   |
| ---------------------- | --------------- | ------- | ----------- |
| `instructor.full_name` | ФИО инструктора | text    | LIST, COUNT |
| `instructor.email`     | Email           | text    | LIST        |
| `instructor.phone`     | Телефон         | text    | LIST        |
| `instructor.hire_date` | Дата найма      | date    | MIN, MAX    |
| `instructor.max_hours` | Макс. часы      | number  | SUM, AVG    |
| `instructor.is_active` | Активен         | boolean | COUNT       |

### 🏢 Организации

| Ключ поля            | Название         | Тип     | Агрегации |
| -------------------- | ---------------- | ------- | --------- |
| `org.name`           | Название         | text    | LIST      |
| `org.short_name`     | Краткое название | text    | LIST      |
| `org.code`           | Код              | text    | LIST      |
| `org.contact_phone`  | Телефон          | text    | LIST      |
| `org.contact_email`  | Email            | text    | LIST      |
| `org.students_count` | Слушателей       | number  | SUM, AVG  |
| `org.is_active`      | Активна          | boolean | COUNT     |

### 📋 Посещаемость (attendance_marking_status)

| Ключ поля                   | Название             | Тип      | Агрегации     |
| --------------------------- | -------------------- | -------- | ------------- |
| `attendance.status`         | Статус отметки       | enum     | COUNT         |
| `attendance.marked_count`   | Отмечено студентов   | number   | SUM, AVG      |
| `attendance.students_count` | Всего студентов      | number   | SUM, AVG      |
| `attendance.percent`        | % посещаемости       | computed | AVG, MIN, MAX |
| `attendance.late`           | Опоздания с отметкой | boolean  | COUNT         |

### 📅 Расписание (schedule_events)

| Ключ поля              | Название         | Тип      | Агрегации |
| ---------------------- | ---------------- | -------- | --------- |
| `event.title`          | Название         | text     | LIST      |
| `event.event_type`     | Тип занятия      | enum     | COUNT     |
| `event.start_time`     | Время начала     | datetime | MIN, MAX  |
| `event.end_time`       | Время окончания  | datetime | MIN, MAX  |
| `event.duration_hours` | Длительность (ч) | computed | SUM, AVG  |

### 🏆 Оценки (test_sessions)

| Ключ поля             | Название     | Тип     | Агрегации     |
| --------------------- | ------------ | ------- | ------------- |
| `grade.score_percent` | % результата | number  | AVG, MIN, MAX |
| `grade.passed`        | Сдал/не сдал | boolean | COUNT         |
| `grade.grade`         | Оценка       | number  | AVG, MIN, MAX |
| `grade.attempts`      | Попыток      | number  | AVG, MAX      |

### 📜 Выданные сертификаты (issued_certificates)

| Ключ поля                 | Название          | Тип  | Агрегации       |
| ------------------------- | ----------------- | ---- | --------------- |
| `cert.certificate_number` | Номер сертификата | text | COUNT           |
| `cert.issue_date`         | Дата выдачи       | date | MIN, MAX, COUNT |
| `cert.expiry_date`        | Дата истечения    | date | MIN, MAX        |
| `cert.import_source`      | Источник          | enum | COUNT           |

### ⏰ Временные шкалы (Cross-cutting)

| Ключ           | Название | Применяется к               |
| -------------- | -------- | --------------------------- |
| `time.year`    | Год      | Все поля типа date/datetime |
| `time.quarter` | Квартал  | Все поля типа date/datetime |
| `time.month`   | Месяц    | Все поля типа date/datetime |
| `time.week`    | Неделя   | Все поля типа date/datetime |
| `time.day`     | День     | Все поля типа date/datetime |

---

## Схема БД (только 2 новые таблицы)

```sql
-- Шаблоны отчётов
CREATE TABLE report_templates (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data_sources JSON NOT NULL,       -- ["groups", "students", "attendance"]
  row_grouping JSON NOT NULL DEFAULT '[]',
  -- [{"field": "org.name", "label": "Организация"},
  --  {"field": "time.month", "date_field": "group.start_date", "label": "Месяц"}]
  filters JSON NOT NULL DEFAULT '{}',
  -- {"date_from": "2026-01-01", "date_to": "2026-12-31", "course_ids": [], "org_ids": []}
  sort_field VARCHAR(100),
  sort_direction ENUM('asc', 'desc') DEFAULT 'asc',
  created_by VARCHAR(191) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  last_used_at DATETIME(3),
  use_count INT DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_created_by (created_by),
  CONSTRAINT fk_rt_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Столбцы шаблона
CREATE TABLE report_template_columns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id VARCHAR(191) NOT NULL,
  field_key VARCHAR(150) NOT NULL,
  label VARCHAR(255) NOT NULL,
  aggregation ENUM('none','count','count_distinct','sum','avg','min','max','list') DEFAULT 'none',
  order_index INT NOT NULL DEFAULT 0,
  width INT DEFAULT 150,
  align ENUM('left','center','right') DEFAULT 'left',
  format VARCHAR(50),               -- 'date:DD.MM.YYYY', 'number:0.00', 'percent', 'boolean:Да/Нет'
  show_in_total BOOLEAN DEFAULT FALSE,
  total_aggregation ENUM('sum','avg','count','max','min') DEFAULT 'sum',
  INDEX idx_template_id (template_id),
  CONSTRAINT fk_rtc_template FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## UI — Layout страницы

```
+------------------------------------------------------------------+
| ХЕДЕР: [<- Назад]  "Название отчёта"  [Сформировать][💾][📥 Excel] |
+---------------------+--------------------------------------------+
| ЛЕВАЯ ПАНЕЛЬ (360px)|  РЕЗУЛЬТАТ (после нажатия "Сформировать")  |
|                     |                                            |
| [+ Курсы/Дисц.   >] |  Организация | Янв | Фев | Март | ИТОГО   |
|                     |  ООО АТЦ    |  12 |   8 |   15 |    35   |
| [- Группы        v] |  ЗАО Нур    |   5 |  10 |    7 |    22   |
|  [x] Код группы     |  ИТОГО      |  17 |  18 |   22 |    57   |
|  [x] Дата начала    |                                            |
|  [ ] Аудитория      |  [< 1 2 3 >]  Показано 1-20 из 57        |
|  [x] Кол-во слуш.  |                                            |
|    COUNT v  Итог[x] |                                            |
|                     |                                            |
| [+ Слушатели     >] |                                            |
| [+ Инструкторы   >] |                                            |
| [+ Организации   >] |                                            |
| [+ Посещаемость  >] |                                            |
| [+ Оценки        >] |                                            |
| [+ Сертификаты   >] |                                            |
|                     |                                            |
| --- ГРУППИРОВКА --- |                                            |
| [org.name      x]  |                                            |
| [time.month    x]  |                                            |
| [+ Добавить...  ]  |                                            |
|                     |                                            |
| --- ФИЛЬТРЫ ------- |                                            |
| Дата от: [______]  |                                            |
| Дата до: [______]  |                                            |
| Курс: [MultiSelect]|                                            |
| Орг:  [MultiSelect]|                                            |
+---------------------+--------------------------------------------+
```

---

## API Endpoints

| Метод  | URL                               | Описание                     |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/api/reports/templates`          | Список шаблонов              |
| POST   | `/api/reports/templates`          | Создать шаблон               |
| GET    | `/api/reports/templates/:id`      | Получить шаблон              |
| PUT    | `/api/reports/templates/:id`      | Обновить шаблон              |
| DELETE | `/api/reports/templates/:id`      | Удалить шаблон               |
| GET    | `/api/reports/meta/fields`        | Все поля по сущностям        |
| POST   | `/api/reports/preview`            | Предпросмотр (max 100 строк) |
| POST   | `/api/reports/export/excel`       | Экспорт .xlsx                |
| GET    | `/api/reports/meta/courses`       | Справочник курсов            |
| GET    | `/api/reports/meta/organizations` | Справочник организаций       |
| GET    | `/api/reports/meta/instructors`   | Справочник инструкторов      |

---

## JOIN-граф сущностей

```
courses ←→ disciplines ←→ discipline_instructors ←→ instructors
    |
study_groups ←→ study_group_students ←→ students ←→ organizations
    |
schedule_events ←→ attendance_marking_status
    |
test_assignments ←→ test_sessions (grades)
    |
issued_certificates
```

Система автоматически строит нужные JOIN-ы по набору выбранных `field_key`.

---

## Пример SQL для отчёта "Слушатели по организациям по месяцам"

```sql
SELECT
  org.name                                    AS `Организация`,
  DATE_FORMAT(sg.start_date, '%Y-%m')         AS `Период`,
  COUNT(DISTINCT sgs.student_id)              AS `Кол-во слушателей`
FROM study_groups sg
INNER JOIN study_group_students sgs ON sgs.group_id = sg.id
INNER JOIN students s              ON s.id = sgs.student_id
INNER JOIN organizations org       ON org.id = s.organization_id
WHERE sg.start_date BETWEEN ? AND ?
GROUP BY org.name, DATE_FORMAT(sg.start_date, '%Y-%m')
ORDER BY org.name, `Период`
LIMIT 20 OFFSET 0;
```

---

## Подводные камни

| Проблема                  | Решение                                                   |
| ------------------------- | --------------------------------------------------------- |
| SQL Injection             | Строгий allowlist `field_key` на сервере                  |
| Медленные запросы         | Лимит 100 строк для preview; индексы на датах уже есть    |
| Пустые значения LEFT JOIN | `COALESCE(value, 0)` для числовых полей                   |
| Большой экспорт           | Стриминг XLSX через Node.js Transform stream              |
| Несовместимые сущности    | JOIN-граф ориентированный; UI предупреждает при конфликте |

---

## Технологии

| Задача                 | Решение                                                       |
| ---------------------- | ------------------------------------------------------------- |
| Excel экспорт          | `exceljs` — **уже есть** в проекте                            |
| PDF экспорт            | `jspdf` + `jspdf-autotable`                                   |
| Состояние конструктора | Vue 3 `reactive` + `computed`                                 |
| UI-компоненты          | Переиспользуем `Modal`, `Button`, `MultiSelect`, `Pagination` |
