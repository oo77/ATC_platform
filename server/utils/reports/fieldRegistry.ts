/**
 * Report Builder — Field Registry
 *
 * Строгий allowlist всех допустимых полей для конструктора отчётов.
 * SQL-выражения строятся ТОЛЬКО на основе этого реестра.
 * Никакой пользовательский ввод напрямую в SQL не попадает.
 */

// ============================================================
// ТИПЫ
// ============================================================

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "enum"
  | "computed";
export type AggregationType =
  | "none"
  | "count"
  | "count_distinct"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "list";
export type TimeScale = "year" | "quarter" | "month" | "week" | "day";

export type JoinKey =
  | "courses"
  | "disciplines"
  | "discipline_instructors"
  | "instructors"
  | "study_groups"
  | "study_group_students"
  | "students"
  | "organizations"
  | "schedule_events"
  | "attendance_marking_status"
  | "test_sessions"
  | "test_assignments"
  | "issued_certificates";

export interface FieldDefinition {
  key: string; // уникальный ключ: 'group.students_count'
  label: string; // отображаемое имя на русском
  type: FieldType;
  sqlExpression: string; // безопасное SQL-выражение
  requiredJoins: JoinKey[]; // JOIN-ы, необходимые для этого поля
  allowedAggregations: AggregationType[];
  defaultAggregation: AggregationType;
  isDateField?: boolean; // можно ли применять временные шкалы
  enumValues?: string[]; // допустимые значения для enum-фильтра
}

export interface EntityGroup {
  key: string;
  label: string;
  icon: string;
  fields: FieldDefinition[];
}

// ============================================================
// ОПРЕДЕЛЕНИЕ JOIN-ЗАВИСИМОСТЕЙ
// Граф: базовая таблица и условие JOIN
// ============================================================

export interface JoinDefinition {
  table: string;
  alias: string;
  condition: string;
  type: "INNER" | "LEFT";
  requires?: JoinKey[]; // этот JOIN зависит от другого
}

export const JOIN_DEFINITIONS: Record<JoinKey, JoinDefinition> = {
  courses: {
    table: "courses",
    alias: "c",
    condition: "c.id = sg.course_id",
    type: "LEFT",
    requires: ["study_groups"],
  },
  disciplines: {
    table: "disciplines",
    alias: "d",
    condition: "d.course_id = c.id",
    type: "LEFT",
    requires: ["courses"],
  },
  discipline_instructors: {
    table: "discipline_instructors",
    alias: "di",
    condition: "di.discipline_id = d.id",
    type: "LEFT",
    requires: ["disciplines"],
  },
  instructors: {
    table: "instructors",
    alias: "i",
    condition: "i.id = di.instructor_id",
    type: "LEFT",
    requires: ["discipline_instructors"],
  },
  study_groups: {
    table: "study_groups",
    alias: "sg",
    condition: "", // базовая таблица FROM
    type: "LEFT",
  },
  study_group_students: {
    table: "study_group_students",
    alias: "sgs",
    condition: "sgs.group_id = sg.id",
    type: "LEFT",
    requires: ["study_groups"],
  },
  students: {
    table: "students",
    alias: "s",
    condition: "s.id = sgs.student_id",
    type: "LEFT",
    requires: ["study_group_students"],
  },
  organizations: {
    table: "organizations",
    alias: "org",
    condition: "org.id = s.organization_id",
    type: "LEFT",
    requires: ["students"],
  },
  schedule_events: {
    table: "schedule_events",
    alias: "se",
    condition: "se.group_id = sg.id",
    type: "LEFT",
    requires: ["study_groups"],
  },
  attendance_marking_status: {
    table: "attendance_marking_status",
    alias: "ams",
    condition: "ams.schedule_event_id = se.id",
    type: "LEFT",
    requires: ["schedule_events"],
  },
  test_assignments: {
    table: "test_assignments",
    alias: "ta",
    condition: "ta.group_id = sg.id",
    type: "LEFT",
    requires: ["study_groups"],
  },
  test_sessions: {
    table: "test_sessions",
    alias: "ts",
    condition: "ts.assignment_id = ta.id",
    type: "LEFT",
    requires: ["test_assignments"],
  },
  issued_certificates: {
    table: "issued_certificates",
    alias: "ic",
    condition: "ic.student_id = s.id",
    type: "LEFT",
    requires: ["students"],
  },
};

// ============================================================
// РЕЕСТР ПОЛЕЙ ПО СУЩНОСТЯМ
// ============================================================

export const ENTITY_GROUPS: EntityGroup[] = [
  // ────────────────────────────────────────────────
  // 1. Учебные программы и дисциплины
  // ────────────────────────────────────────────────
  {
    key: "courses",
    label: "Учебные программы и дисциплины",
    icon: "academic-cap",
    fields: [
      {
        key: "course.name",
        label: "Название курса",
        type: "text",
        sqlExpression: "c.name",
        requiredJoins: ["courses"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "course.short_name",
        label: "Краткое название курса",
        type: "text",
        sqlExpression: "c.short_name",
        requiredJoins: ["courses"],
        allowedAggregations: ["none", "list"],
        defaultAggregation: "none",
      },
      {
        key: "course.code",
        label: "Код курса",
        type: "text",
        sqlExpression: "c.code",
        requiredJoins: ["courses"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "course.total_hours",
        label: "Всего часов курса",
        type: "number",
        sqlExpression: "c.total_hours",
        requiredJoins: ["courses"],
        allowedAggregations: ["none", "sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
      {
        key: "discipline.name",
        label: "Название дисциплины",
        type: "text",
        sqlExpression: "d.name",
        requiredJoins: ["courses", "disciplines"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "discipline.hours",
        label: "Часов дисциплины (итого)",
        type: "number",
        sqlExpression: "d.hours",
        requiredJoins: ["courses", "disciplines"],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
      {
        key: "discipline.theory_hours",
        label: "Часов теории",
        type: "number",
        sqlExpression: "d.theory_hours",
        requiredJoins: ["courses", "disciplines"],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
      {
        key: "discipline.practice_hours",
        label: "Часов практики",
        type: "number",
        sqlExpression: "d.practice_hours",
        requiredJoins: ["courses", "disciplines"],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
      {
        key: "discipline.assessment_hours",
        label: "Часов проверки знаний",
        type: "number",
        sqlExpression: "d.assessment_hours",
        requiredJoins: ["courses", "disciplines"],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 2. Учебные группы
  // ────────────────────────────────────────────────
  {
    key: "groups",
    label: "Учебные группы",
    icon: "user-group",
    fields: [
      {
        key: "group.code",
        label: "Код группы",
        type: "text",
        sqlExpression: "sg.code",
        requiredJoins: ["study_groups"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "group.start_date",
        label: "Дата начала группы",
        type: "date",
        sqlExpression: "sg.start_date",
        requiredJoins: ["study_groups"],
        allowedAggregations: ["none", "min", "max", "count"],
        defaultAggregation: "none",
        isDateField: true,
      },
      {
        key: "group.end_date",
        label: "Дата окончания группы",
        type: "date",
        sqlExpression: "sg.end_date",
        requiredJoins: ["study_groups"],
        allowedAggregations: ["none", "min", "max", "count"],
        defaultAggregation: "none",
        isDateField: true,
      },
      {
        key: "group.classroom",
        label: "Аудитория",
        type: "text",
        sqlExpression: "sg.classroom",
        requiredJoins: ["study_groups"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "group.count",
        label: "Количество групп",
        type: "computed",
        sqlExpression: "sg.id",
        requiredJoins: ["study_groups"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count_distinct",
      },
      {
        key: "group.duration_days",
        label: "Длительность группы (дней)",
        type: "computed",
        sqlExpression: "DATEDIFF(sg.end_date, sg.start_date)",
        requiredJoins: ["study_groups"],
        allowedAggregations: ["none", "avg", "min", "max"],
        defaultAggregation: "avg",
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 3. Слушатели
  // ────────────────────────────────────────────────
  {
    key: "students",
    label: "Слушатели",
    icon: "users",
    fields: [
      {
        key: "student.full_name",
        label: "ФИО слушателя",
        type: "text",
        sqlExpression: "s.full_name",
        requiredJoins: ["students"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "student.pinfl",
        label: "ПИНФЛ",
        type: "text",
        sqlExpression: "s.pinfl",
        requiredJoins: ["students"],
        allowedAggregations: ["none", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "student.count",
        label: "Количество слушателей",
        type: "computed",
        sqlExpression: "s.id",
        requiredJoins: ["students"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count_distinct",
      },
      {
        key: "student.organization",
        label: "Организация слушателя",
        type: "text",
        sqlExpression: "s.organization",
        requiredJoins: ["students"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "student.department",
        label: "Отдел",
        type: "text",
        sqlExpression: "s.department",
        requiredJoins: ["students"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "student.position",
        label: "Должность",
        type: "text",
        sqlExpression: "s.position",
        requiredJoins: ["students"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "student.created_at",
        label: "Дата регистрации слушателя",
        type: "date",
        sqlExpression: "DATE(s.created_at)",
        requiredJoins: ["students"],
        allowedAggregations: ["none", "min", "max", "count"],
        defaultAggregation: "none",
        isDateField: true,
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 4. Инструкторы
  // ────────────────────────────────────────────────
  {
    key: "instructors",
    label: "Инструкторы",
    icon: "academic-cap",
    fields: [
      {
        key: "instructor.full_name",
        label: "ФИО инструктора",
        type: "text",
        sqlExpression: "i.full_name",
        requiredJoins: ["instructors"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "instructor.email",
        label: "Email инструктора",
        type: "text",
        sqlExpression: "i.email",
        requiredJoins: ["instructors"],
        allowedAggregations: ["none", "list"],
        defaultAggregation: "none",
      },
      {
        key: "instructor.phone",
        label: "Телефон инструктора",
        type: "text",
        sqlExpression: "i.phone",
        requiredJoins: ["instructors"],
        allowedAggregations: ["none", "list"],
        defaultAggregation: "none",
      },
      {
        key: "instructor.max_hours",
        label: "Макс. часы инструктора",
        type: "number",
        sqlExpression: "i.max_hours",
        requiredJoins: ["instructors"],
        allowedAggregations: ["none", "sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
      {
        key: "instructor.count",
        label: "Количество инструкторов",
        type: "computed",
        sqlExpression: "i.id",
        requiredJoins: ["instructors"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count_distinct",
      },
      {
        key: "instructor.hire_date",
        label: "Дата найма инструктора",
        type: "date",
        sqlExpression: "i.hire_date",
        requiredJoins: ["instructors"],
        allowedAggregations: ["none", "min", "max"],
        defaultAggregation: "none",
        isDateField: true,
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 5. Организации
  // ────────────────────────────────────────────────
  {
    key: "organizations",
    label: "Организации",
    icon: "office-building",
    fields: [
      {
        key: "org.name",
        label: "Название организации",
        type: "text",
        sqlExpression: "org.name",
        requiredJoins: ["organizations"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "org.short_name",
        label: "Краткое название орг.",
        type: "text",
        sqlExpression: "COALESCE(org.name_ru, org.name)",
        requiredJoins: ["organizations"],
        allowedAggregations: ["none", "list"],
        defaultAggregation: "none",
      },
      {
        key: "org.code",
        label: "Код организации",
        type: "text",
        sqlExpression: "org.code",
        requiredJoins: ["organizations"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "org.contact_email",
        label: "Email организации",
        type: "text",
        sqlExpression: "org.contact_email",
        requiredJoins: ["organizations"],
        allowedAggregations: ["none", "list"],
        defaultAggregation: "none",
      },
      {
        key: "org.contact_phone",
        label: "Телефон организации",
        type: "text",
        sqlExpression: "org.contact_phone",
        requiredJoins: ["organizations"],
        allowedAggregations: ["none", "list"],
        defaultAggregation: "none",
      },
      {
        key: "org.count",
        label: "Количество организаций",
        type: "computed",
        sqlExpression: "org.id",
        requiredJoins: ["organizations"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count_distinct",
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 6. Посещаемость
  // ────────────────────────────────────────────────
  {
    key: "attendance",
    label: "Посещаемость",
    icon: "clipboard-check",
    fields: [
      {
        key: "attendance.status",
        label: "Статус отметки",
        type: "enum",
        sqlExpression: "ams.status",
        requiredJoins: [
          "study_groups",
          "schedule_events",
          "attendance_marking_status",
        ],
        allowedAggregations: ["none", "count"],
        defaultAggregation: "none",
        enumValues: [
          "pending",
          "in_progress",
          "on_time",
          "late",
          "overdue",
          "approved",
        ],
      },
      {
        key: "attendance.marked_count",
        label: "Отмечено студентов",
        type: "number",
        sqlExpression: "ams.marked_count",
        requiredJoins: [
          "study_groups",
          "schedule_events",
          "attendance_marking_status",
        ],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
      {
        key: "attendance.students_count",
        label: "Всего студентов на занятии",
        type: "number",
        sqlExpression: "ams.students_count",
        requiredJoins: [
          "study_groups",
          "schedule_events",
          "attendance_marking_status",
        ],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "avg",
      },
      {
        key: "attendance.percent",
        label: "% посещаемости",
        type: "computed",
        sqlExpression:
          "ROUND(COALESCE(ams.marked_count, 0) / NULLIF(ams.students_count, 0) * 100, 1)",
        requiredJoins: [
          "study_groups",
          "schedule_events",
          "attendance_marking_status",
        ],
        allowedAggregations: ["avg", "min", "max"],
        defaultAggregation: "avg",
      },
      {
        key: "attendance.marked_percentage",
        label: "Процент отмеченных (%)",
        type: "computed",
        sqlExpression:
          "ROUND(COALESCE(ams.marked_count, 0) / NULLIF(ams.students_count, 0) * 100, 1)",
        requiredJoins: ["attendance_marking_status"],
        allowedAggregations: ["avg", "min", "max"],
        defaultAggregation: "avg",
      },
      {
        key: "attendance.event_count",
        label: "Количество занятий",
        type: "computed",
        sqlExpression: "se.id",
        requiredJoins: ["schedule_events"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count_distinct",
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 7. Расписание
  // ────────────────────────────────────────────────
  {
    key: "schedule",
    label: "Расписание",
    icon: "calendar",
    fields: [
      {
        key: "event.title",
        label: "Название занятия",
        type: "text",
        sqlExpression: "se.title",
        requiredJoins: ["schedule_events"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "event.event_type",
        label: "Тип занятия",
        type: "enum",
        sqlExpression: "se.event_type",
        requiredJoins: ["schedule_events"],
        allowedAggregations: ["none", "count"],
        defaultAggregation: "none",
        enumValues: ["theory", "practice", "assessment", "other"],
      },
      {
        key: "event.start_time",
        label: "Дата занятия",
        type: "datetime",
        sqlExpression: "se.start_time",
        requiredJoins: ["schedule_events"],
        allowedAggregations: ["none", "min", "max", "count"],
        defaultAggregation: "none",
        isDateField: true,
      },
      {
        key: "event.duration_hours",
        label: "Длительность занятия (ч)",
        type: "computed",
        sqlExpression:
          "ROUND(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 60.0, 1)",
        requiredJoins: ["schedule_events"],
        allowedAggregations: ["sum", "avg", "min", "max"],
        defaultAggregation: "sum",
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 8. Оценки / Тестирование
  // ────────────────────────────────────────────────
  {
    key: "grades",
    label: "Оценки и тестирование",
    icon: "chart-bar",
    fields: [
      {
        key: "grade.score_percent",
        label: "Результат теста (%)",
        type: "number",
        sqlExpression: "ts.score_percent",
        requiredJoins: ["test_sessions"],
        allowedAggregations: ["avg", "min", "max"],
        defaultAggregation: "avg",
      },
      {
        key: "grade.passed",
        label: "Сдал тест (да/нет)",
        type: "boolean",
        sqlExpression: "ts.passed",
        requiredJoins: ["test_sessions"],
        allowedAggregations: ["count"],
        defaultAggregation: "count",
      },
      {
        key: "grade.grade",
        label: "Оценка",
        type: "number",
        sqlExpression: "ts.grade",
        requiredJoins: ["test_sessions"],
        allowedAggregations: ["avg", "min", "max"],
        defaultAggregation: "avg",
      },
      {
        key: "grade.attempts",
        label: "Количество попыток",
        type: "number",
        sqlExpression: "ts.attempt_number",
        requiredJoins: ["test_sessions"],
        allowedAggregations: ["avg", "max", "sum"],
        defaultAggregation: "avg",
      },
      {
        key: "grade.sessions_count",
        label: "Количество тестирований",
        type: "computed",
        sqlExpression: "ts.id",
        requiredJoins: ["test_sessions"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count",
      },
    ],
  },

  // ────────────────────────────────────────────────
  // 9. Выданные сертификаты
  // ────────────────────────────────────────────────
  {
    key: "certificates",
    label: "Выданные сертификаты",
    icon: "certificate",
    fields: [
      {
        key: "cert.certificate_number",
        label: "Номер сертификата",
        type: "text",
        sqlExpression: "ic.certificate_number",
        requiredJoins: ["issued_certificates"],
        allowedAggregations: ["none", "list", "count_distinct"],
        defaultAggregation: "none",
      },
      {
        key: "cert.count",
        label: "Количество сертификатов",
        type: "computed",
        sqlExpression: "ic.id",
        requiredJoins: ["issued_certificates"],
        allowedAggregations: ["count", "count_distinct"],
        defaultAggregation: "count_distinct",
      },
      {
        key: "cert.issue_date",
        label: "Дата выдачи сертификата",
        type: "date",
        sqlExpression: "ic.issue_date",
        requiredJoins: ["issued_certificates"],
        allowedAggregations: ["none", "min", "max", "count"],
        defaultAggregation: "none",
        isDateField: true,
      },
      {
        key: "cert.expiry_date",
        label: "Дата истечения сертификата",
        type: "date",
        sqlExpression: "ic.expiry_date",
        requiredJoins: ["issued_certificates"],
        allowedAggregations: ["none", "min", "max"],
        defaultAggregation: "none",
        isDateField: true,
      },
      {
        key: "cert.import_source",
        label: "Источник сертификата",
        type: "enum",
        sqlExpression: "ic.import_source",
        requiredJoins: ["issued_certificates"],
        allowedAggregations: ["none", "count"],
        defaultAggregation: "none",
        enumValues: ["manual", "ai_scan", "excel", "group_journal"],
      },
    ],
  },
];

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Быстрый lookup всех полей по key — для валидации на сервере
 */
const FIELD_MAP = new Map<string, FieldDefinition>(
  ENTITY_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f])),
);

export function getFieldDefinition(key: string): FieldDefinition | undefined {
  return FIELD_MAP.get(key);
}

export function isValidFieldKey(key: string): boolean {
  return FIELD_MAP.has(key);
}

export function getAllFieldKeys(): string[] {
  return Array.from(FIELD_MAP.keys());
}

/**
 * Генерирует SQL-выражение для агрегации поля
 */
export function buildAggregatedExpression(
  field: FieldDefinition,
  aggregation: AggregationType,
  alias: string,
): string {
  const expr = field.sqlExpression;

  switch (aggregation) {
    case "count":
      return `COUNT(${expr}) AS \`${alias}\``;
    case "count_distinct":
      return `COUNT(DISTINCT ${expr}) AS \`${alias}\``;
    case "sum":
      return `COALESCE(SUM(${expr}), 0) AS \`${alias}\``;
    case "avg":
      return `ROUND(AVG(${expr}), 2) AS \`${alias}\``;
    case "min":
      return `MIN(${expr}) AS \`${alias}\``;
    case "max":
      return `MAX(${expr}) AS \`${alias}\``;
    case "list":
      return `GROUP_CONCAT(DISTINCT ${expr} ORDER BY ${expr} SEPARATOR ', ') AS \`${alias}\``;
    case "none":
    default:
      return `${expr} AS \`${alias}\``;
  }
}

/**
 * Генерирует SQL-выражение для временной шкалы
 */
export function buildTimeScaleExpression(
  dateFieldSql: string,
  scale: TimeScale,
  alias: string,
): string {
  switch (scale) {
    case "year":
      return `YEAR(${dateFieldSql}) AS \`${alias}\``;
    case "quarter":
      return `CONCAT(YEAR(${dateFieldSql}), '-Q', QUARTER(${dateFieldSql})) AS \`${alias}\``;
    case "month":
      return `DATE_FORMAT(${dateFieldSql}, '%Y-%m') AS \`${alias}\``;
    case "week":
      return `YEARWEEK(${dateFieldSql}, 1) AS \`${alias}\``;
    case "day":
      return `DATE_FORMAT(${dateFieldSql}, '%d.%m.%Y') AS \`${alias}\``;
  }
}

export const TIME_SCALE_LABELS: Record<TimeScale, string> = {
  year: "По годам",
  quarter: "По кварталам",
  month: "По месяцам",
  week: "По неделям",
  day: "По дням",
};
