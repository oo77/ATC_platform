/**
 * Общие типы и хелперы конструктора отчётов (клиент).
 */
import { latinToCyrillic } from "../../shared/utils/latinToCyrillic";

// ── Типы ──────────────────────────────────────────────────────────────
export interface FieldMeta {
  key: string;
  label: string;
  type: string;
  allowedAggregations: string[];
  defaultAggregation: string;
  isDateField: boolean;
  enumValues: string[];
  requiredJoins?: string[];
  conditionOps?: string[];
}

export interface EntityGroupMeta {
  key: string;
  label: string;
  icon: string;
  fields: FieldMeta[];
}

export interface ColumnConfig {
  field_key: string;
  label: string;
  aggregation: string;
  show_in_total: boolean;
  total_aggregation: string;
  width: number;
  align: string;
}

export interface GroupingItem {
  type: "field" | "time_scale";
  field_key?: string;
  time_scale?: string;
  date_field_key?: string;
  label: string;
}

export interface ReportCondition {
  field_key: string;
  op: string;
  value?: string | number | null;
  value2?: string | number | null;
}

export interface ReportFilters {
  date_field?: string;
  date_from?: string;
  date_to?: string;
  course_ids?: string[];
  org_ids?: string[];
  group_ids?: string[];
  instructor_ids?: string[];
  conditions?: ReportCondition[];
  row_limit?: number | null;
}

export type RootEntity =
  | "study_groups"
  | "students"
  | "courses"
  | "organizations"
  | "issued_certificates";

// ── Справочники подписей ──────────────────────────────────────────────
export const ROOTS: { key: RootEntity; label: string; hint: string }[] = [
  { key: "study_groups", label: "Группы", hint: "Строка отчёта — учебная группа" },
  { key: "students", label: "Слушатели", hint: "Строка — слушатель (включая не записанных в группы)" },
  { key: "courses", label: "Курсы", hint: "Строка — учебная программа (включая курсы без групп)" },
  { key: "organizations", label: "Организации", hint: "Строка — организация (включая без слушателей)" },
  { key: "issued_certificates", label: "Сертификаты", hint: "Строка — выданный сертификат" },
];

export const AGG_LABELS: Record<string, string> = {
  none: "Как есть",
  count: "Количество",
  count_distinct: "Уникальных",
  sum: "Сумма",
  avg: "Среднее",
  min: "Минимум",
  max: "Максимум",
  list: "Список",
};

export const TOTAL_AGG_LABELS: Record<string, string> = {
  sum: "Сумма",
  avg: "Среднее",
  count: "Кол-во",
  min: "Мин.",
  max: "Макс.",
};

export const TIME_SCALE_LABELS: Record<string, string> = {
  day: "Дни",
  week: "Недели",
  month: "Месяцы",
  quarter: "Кварталы",
  year: "Годы",
};

export const OP_LABELS: Record<string, string> = {
  eq: "равно",
  neq: "не равно",
  contains: "содержит",
  not_contains: "не содержит",
  starts_with: "начинается с",
  gt: "больше",
  gte: "не меньше",
  lt: "меньше",
  lte: "не больше",
  between: "между",
  empty: "пусто",
  not_empty: "заполнено",
  is_true: "да",
  is_false: "нет",
};

export const VALUELESS_OPS = ["empty", "not_empty", "is_true", "is_false"];

export const DATE_FIELD_OPTIONS = [
  { key: "group.start_date", label: "Дата начала группы" },
  { key: "group.end_date", label: "Дата окончания группы" },
  { key: "cert.issue_date", label: "Дата выдачи сертификата" },
  { key: "event.start_time", label: "Дата занятия" },
  { key: "student.created_at", label: "Дата регистрации слушателя" },
];

export const FIELD_TYPE_BADGE: Record<string, string> = {
  text: "Aa",
  enum: "≡",
  number: "#",
  computed: "ƒ",
  date: "дт",
  datetime: "дт",
  boolean: "✓",
};

// ── Поиск ─────────────────────────────────────────────────────────────
/** Нижний регистр, ё→е, схлопывание пробелов */
export function normalizeSearch(s: string | null | undefined): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}.%#]+/gu, " ")
    .trim();
}

/**
 * Готовит поисковый запрос: токены в исходном виде и в транслитерации
 * (пользователь может набрать «guruh» или «slushatel» латиницей).
 */
export function buildMatcher(query: string): ((haystack: string) => boolean) | null {
  const q = normalizeSearch(query);
  if (!q) return null;
  const variants = [q];
  const cyr = normalizeSearch(latinToCyrillic(query));
  if (cyr && cyr !== q) variants.push(cyr);
  const tokenSets = variants.map((v) => v.split(" ").filter(Boolean));
  return (haystack: string) => {
    const h = normalizeSearch(haystack);
    return tokenSets.some((tokens) => tokens.every((t) => h.includes(t)));
  };
}

/** Разбивает текст на части для подсветки совпадения */
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[] {
  const q = normalizeSearch(query);
  if (!q) return [{ text, hit: false }];
  const tokens = q.split(" ").filter((t) => t.length > 0);
  const lower = text.toLowerCase().replace(/ё/g, "е");
  const marks = new Array(text.length).fill(false);
  for (const t of tokens) {
    let from = 0;
    let idx: number;
    while ((idx = lower.indexOf(t, from)) !== -1) {
      for (let i = idx; i < idx + t.length; i++) marks[i] = true;
      from = idx + t.length;
    }
  }
  const parts: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === marks[i]) last.text += text[i];
    else parts.push({ text: text[i]!, hit: marks[i] });
  }
  return parts;
}

// ── Даты ──────────────────────────────────────────────────────────────
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const DATE_PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  {
    key: "this_month",
    label: "Этот месяц",
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(new Date(n.getFullYear(), n.getMonth() + 1, 0))];
    },
  },
  {
    key: "last_month",
    label: "Прошлый месяц",
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))];
    },
  },
  {
    key: "this_quarter",
    label: "Квартал",
    range: () => {
      const n = new Date();
      const q = Math.floor(n.getMonth() / 3) * 3;
      return [iso(new Date(n.getFullYear(), q, 1)), iso(new Date(n.getFullYear(), q + 3, 0))];
    },
  },
  {
    key: "this_year",
    label: "Этот год",
    range: () => {
      const y = new Date().getFullYear();
      return [`${y}-01-01`, `${y}-12-31`];
    },
  },
  {
    key: "last_year",
    label: "Прошлый год",
    range: () => {
      const y = new Date().getFullYear() - 1;
      return [`${y}-01-01`, `${y}-12-31`];
    },
  },
  {
    key: "last_30",
    label: "30 дней",
    range: () => {
      const n = new Date();
      const from = new Date(n);
      from.setDate(from.getDate() - 29);
      return [iso(from), iso(n)];
    },
  },
];

// ── Шаблоны быстрого старта ───────────────────────────────────────────
export interface ReportPreset {
  id: string;
  title: string;
  description: string;
  config: {
    name: string;
    primary_entity: RootEntity;
    columns: Omit<ColumnConfig, "width" | "align">[];
    groupings: GroupingItem[];
    filters: ReportFilters;
    sort_field: string;
    sort_direction: "asc" | "desc";
  };
}

const c = (
  field_key: string,
  label: string,
  aggregation = "none",
  total?: string,
): Omit<ColumnConfig, "width" | "align"> => ({
  field_key,
  label,
  aggregation,
  show_in_total: !!total,
  total_aggregation: total || "sum",
});

export const REPORT_PRESETS: ReportPreset[] = [
  {
    id: "students_by_org",
    title: "Слушатели по организациям",
    description: "Сколько людей обучено от каждой организации",
    config: {
      name: "Слушатели по организациям",
      primary_entity: "organizations",
      columns: [
        c("org.name", "Организация"),
        c("student.count", "Слушателей", "count_distinct", "sum"),
        c("group.count", "Групп", "count_distinct"),
      ],
      groupings: [],
      filters: {},
      sort_field: "Слушателей",
      sort_direction: "desc",
    },
  },
  {
    id: "groups_by_month",
    title: "Группы по месяцам",
    description: "Динамика запуска групп и числа слушателей",
    config: {
      name: "Группы по месяцам",
      primary_entity: "study_groups",
      columns: [
        c("group.count", "Групп", "count_distinct", "sum"),
        c("student.count", "Слушателей", "count_distinct", "sum"),
      ],
      groupings: [{ type: "time_scale", date_field_key: "group.start_date", time_scale: "month", label: "Месяц" }],
      filters: {},
      sort_field: "",
      sort_direction: "asc",
    },
  },
  {
    id: "certs_by_course",
    title: "Сертификаты по курсам",
    description: "Количество выданных сертификатов по программам",
    config: {
      name: "Сертификаты по курсам",
      primary_entity: "issued_certificates",
      columns: [
        c("course.name", "Курс"),
        c("cert.count", "Сертификатов", "count_distinct", "sum"),
      ],
      groupings: [],
      filters: { date_field: "cert.issue_date" },
      sort_field: "Сертификатов",
      sort_direction: "desc",
    },
  },
  {
    id: "test_results",
    title: "Успеваемость по курсам",
    description: "Средний балл и доля сдавших тесты",
    config: {
      name: "Успеваемость по курсам",
      primary_entity: "courses",
      columns: [
        c("course.name", "Курс"),
        c("grade.sessions_count", "Тестирований", "count", "sum"),
        c("grade.score_percent", "Средний результат, %", "avg"),
        c("grade.passed", "Сдали", "sum", "sum"),
      ],
      groupings: [],
      filters: {},
      sort_field: "",
      sort_direction: "asc",
    },
  },
  {
    id: "classroom_load",
    title: "Загрузка аудиторий",
    description: "Академические часы занятий по аудиториям",
    config: {
      name: "Загрузка аудиторий",
      primary_entity: "study_groups",
      columns: [
        c("event.classroom", "Аудитория"),
        c("attendance.event_count", "Занятий", "count_distinct", "sum"),
        c("event.duration_hours", "Ак. часов", "sum", "sum"),
      ],
      groupings: [],
      filters: {
        date_field: "event.start_time",
        conditions: [{ field_key: "event.classroom", op: "not_empty" }],
      },
      sort_field: "Ак. часов",
      sort_direction: "desc",
    },
  },
  {
    id: "attendance_by_group",
    title: "Посещаемость по группам",
    description: "Средний процент отмеченных на занятиях",
    config: {
      name: "Посещаемость по группам",
      primary_entity: "study_groups",
      columns: [
        c("group.code", "Группа"),
        c("course.short_name", "Курс"),
        c("attendance.event_count", "Занятий", "count_distinct", "sum"),
        c("attendance.percent", "Посещаемость, %", "avg", "avg"),
      ],
      groupings: [],
      filters: {},
      sort_field: "",
      sort_direction: "asc",
    },
  },
];

/** Сериализация для сравнения «изменилась ли конфигурация после формирования» */
export function configFingerprint(cfg: Record<string, unknown>): string {
  return JSON.stringify(cfg);
}

/** Табличные данные → TSV (для вставки в Excel/Google Sheets) */
export function toTsv(columns: string[], rows: Record<string, unknown>[]): string {
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    return String(v).replace(/[\t\r\n]+/g, " ");
  };
  return [columns.map(cell).join("\t"), ...rows.map((r) => columns.map((col) => cell(r[col])).join("\t"))].join("\n");
}
