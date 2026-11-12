/**
 * Report Builder — Query Builder
 *
 * Строит параметризованный SQL по конфигурации конструктора отчётов.
 *
 * Ключевые принципы:
 *  - В SQL попадают ТОЛЬКО выражения из реестра полей (fieldRegistry) и
 *    сгенерированные алиасы `c0`, `g0`… Пользовательские заголовки столбцов
 *    в SQL не попадают вообще — строки переименовываются уже после запроса.
 *  - JOIN-ы строятся поиском кратчайшего пути (BFS) по графу связей от
 *    базовой сущности, поэтому для любой базы подключаются только нужные
 *    таблицы и в правильном порядке (без лишних «размножающих» JOIN-ов).
 *  - Пагинация детерминирована (всегда есть ORDER BY).
 *  - Итоговая строка считается по ВСЕЙ выборке, а не по текущей странице.
 */

import {
  getFieldDefinition,
  buildAggregatedExpression,
  buildTimeScaleExpression,
  JOIN_DEFINITIONS,
  TIME_SCALE_LABELS,
  type AggregationType,
  type FieldDefinition,
  type JoinKey,
  type TimeScale,
} from "./fieldRegistry";

// ============================================================
// ТИПЫ
// ============================================================

export type TotalAggregation = "sum" | "avg" | "min" | "max" | "count";

export interface ColumnConfig {
  field_key: string;
  label: string;
  aggregation: AggregationType;
  show_in_total?: boolean | number;
  total_aggregation?: TotalAggregation;
}

export interface GroupingItem {
  type: "field" | "time_scale";
  field_key?: string;
  time_scale?: TimeScale;
  date_field_key?: string;
  label: string;
}

export type ConditionOp =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "empty"
  | "not_empty"
  | "is_true"
  | "is_false";

export interface ReportCondition {
  field_key: string;
  op: ConditionOp;
  value?: unknown;
  value2?: unknown;
}

export interface ReportFilters {
  course_ids?: string[];
  org_ids?: string[];
  group_ids?: string[];
  instructor_ids?: string[];
  date_field?: string;
  date_from?: string;
  date_to?: string;
  conditions?: ReportCondition[];
  /** Топ-N (хранится в фильтрах шаблона) */
  row_limit?: number | null;
  [key: string]: unknown;
}

export interface ReportConfig {
  columns: ColumnConfig[];
  groupings: GroupingItem[];
  filters: ReportFilters;
  primary_entity?: JoinKey | string;
  /** Заголовок столбца (или алиас c0/g0), по которому сортировать */
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  /** Ограничение «Топ-N» — максимальное число строк в отчёте */
  row_limit?: number | null;
  limit?: number;
  offset?: number;
}

export interface BuiltReport {
  sql: string;
  params: unknown[];
  countSql: string;
  countParams: unknown[];
  /** null — если ни один столбец не участвует в строке ИТОГО */
  totalsSql: string | null;
  totalsParams: unknown[];
  /** Итоговые (уникальные) заголовки столбцов в порядке вывода */
  columnLabels: string[];
  /** SQL-алиас → заголовок */
  aliasToLabel: Record<string, string>;
  /** Заголовки, значения которых надо привести к числу (DECIMAL приходит строкой) */
  numericLabels: string[];
  /** Предупреждения о возможных искажениях (дубли строк и т.п.) */
  warnings: string[];
  rootKey: JoinKey;
  joinOrder: JoinKey[];
}

export class ReportConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportConfigError";
  }
}

// ============================================================
// КОНСТАНТЫ
// ============================================================

export const ROOT_ENTITIES: JoinKey[] = [
  "study_groups",
  "students",
  "courses",
  "organizations",
  "issued_certificates",
];

const AGGREGATIONS: AggregationType[] = [
  "none",
  "count",
  "count_distinct",
  "sum",
  "avg",
  "min",
  "max",
  "list",
];
const TOTAL_AGGREGATIONS: TotalAggregation[] = [
  "sum",
  "avg",
  "min",
  "max",
  "count",
];
const TIME_SCALES = Object.keys(TIME_SCALE_LABELS) as TimeScale[];

const MAX_COLUMNS = 40;
const MAX_GROUPINGS = 6;
const MAX_CONDITIONS = 20;
const MAX_IN_VALUES = 1000;
export const MAX_EXPORT_ROWS = 100_000;

/** Поля-счётчики (выражение — id записи): условия по ним бессмысленны */
export function isCounterField(def: Pick<FieldDefinition, "type" | "allowedAggregations">): boolean {
  return (
    def.type === "computed" &&
    def.allowedAggregations.every((a) => a === "count" || a === "count_distinct")
  );
}

/** Операторы условий, доступные для конкретного поля */
export function conditionOpsFor(def: Pick<FieldDefinition, "type" | "allowedAggregations">): ConditionOp[] {
  if (isCounterField(def)) return [];
  return CONDITION_OPS_BY_TYPE[def.type] ?? CONDITION_OPS_BY_TYPE.text!;
}

/** Допустимые операторы условий по типу поля */
export const CONDITION_OPS_BY_TYPE: Record<string, ConditionOp[]> = {
  text: ["contains", "not_contains", "eq", "neq", "starts_with", "empty", "not_empty"],
  enum: ["eq", "neq", "contains", "empty", "not_empty"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "empty", "not_empty"],
  computed: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "empty", "not_empty"],
  date: ["eq", "gt", "gte", "lt", "lte", "between", "empty", "not_empty"],
  datetime: ["eq", "gt", "gte", "lt", "lte", "between", "empty", "not_empty"],
  boolean: ["is_true", "is_false", "empty", "not_empty"],
};

// ============================================================
// ГРАФ СВЯЗЕЙ ДЛЯ JOIN-ОВ
// ============================================================

interface Edge {
  a: JoinKey;
  b: JoinKey;
  on: string;
  /** Ребро доступно только при указанной базовой сущности */
  onlyForRoot?: JoinKey;
}

const EDGES: Edge[] = [
  { a: "courses", b: "study_groups", on: "sg.course_id = c.id" },
  { a: "courses", b: "disciplines", on: "d.course_id = c.id" },
  { a: "disciplines", b: "discipline_instructors", on: "di.discipline_id = d.id" },
  { a: "discipline_instructors", b: "instructors", on: "i.id = di.instructor_id" },
  { a: "study_groups", b: "study_group_students", on: "sgs.group_id = sg.id" },
  { a: "study_group_students", b: "students", on: "s.id = sgs.student_id" },
  { a: "students", b: "organizations", on: "org.id = s.organization_id" },
  { a: "study_groups", b: "schedule_events", on: "se.group_id = sg.id" },
  { a: "schedule_events", b: "classrooms", on: "cr.id = se.classroom_id" },
  { a: "schedule_events", b: "event_instructors", on: "ei.id = se.instructor_id" },
  { a: "schedule_events", b: "attendance_marking_status", on: "ams.schedule_event_id = se.id" },
  { a: "study_groups", b: "test_assignments", on: "ta.group_id = sg.id" },
  { a: "test_assignments", b: "test_sessions", on: "ts.assignment_id = ta.id" },
  { a: "students", b: "issued_certificates", on: "ic.student_id = s.id" },
  // Для отчёта «от сертификатов» группа берётся прямо из сертификата
  {
    a: "issued_certificates",
    b: "study_groups",
    on: "sg.id = ic.group_id",
    onlyForRoot: "issued_certificates",
  },
];

/**
 * Дополнительные условия согласованности: если в запросе есть обе таблицы,
 * к ON-условию таблицы `on` добавляется `cond`. Таблица `on` всегда
 * присоединяется после `with` (см. LATE_JOINS).
 */
const CONSISTENCY: { on: JoinKey; with: JoinKey; cond: string }[] = [
  // Сертификат — именно за эту группу (импортированные без группы тоже показываем)
  {
    on: "issued_certificates",
    with: "study_groups",
    cond: "(ic.group_id = sg.id OR ic.group_id IS NULL)",
  },
  // Попытка теста — именно этого слушателя
  { on: "test_sessions", with: "students", cond: "ts.student_id = s.id" },
];

/** Таблицы, которые присоединяются последними, чтобы условия согласованности ссылались на уже подключённые */
const LATE_JOINS: JoinKey[] = ["issued_certificates", "test_sessions"];

/** «Ветви», порождающие размножение строк относительно группы */
const FANOUT_BRANCHES: Record<string, { label: string; tables: JoinKey[] }> = {
  students: {
    label: "Слушатели",
    tables: ["study_group_students", "students", "organizations", "issued_certificates"],
  },
  schedule: {
    label: "Расписание / посещаемость",
    tables: ["schedule_events", "classrooms", "event_instructors", "attendance_marking_status"],
  },
  tests: { label: "Тестирование", tables: ["test_assignments", "test_sessions"] },
  disciplines: {
    label: "Дисциплины / инструкторы",
    tables: ["disciplines", "discipline_instructors", "instructors"],
  },
};

function neighbours(node: JoinKey, root: JoinKey): { next: JoinKey; on: string }[] {
  const out: { next: JoinKey; on: string }[] = [];
  for (const e of EDGES) {
    if (e.onlyForRoot && e.onlyForRoot !== root) continue;
    if (e.a === node) out.push({ next: e.b, on: e.on });
    else if (e.b === node) out.push({ next: e.a, on: e.on });
  }
  return out;
}

function distanceFrom(root: JoinKey, target: JoinKey): number {
  if (root === target) return 0;
  const seen = new Set<JoinKey>([root]);
  let frontier: JoinKey[] = [root];
  let dist = 0;
  while (frontier.length) {
    dist++;
    const next: JoinKey[] = [];
    for (const n of frontier) {
      for (const { next: m } of neighbours(n, root)) {
        if (seen.has(m)) continue;
        if (m === target) return dist;
        seen.add(m);
        next.push(m);
      }
    }
    frontier = next;
  }
  return Infinity;
}

/**
 * Строит упорядоченный список JOIN-ов от корня ко всем нужным таблицам.
 * Каждая новая таблица присоединяется к уже подключённой кратчайшим путём.
 */
export function planJoins(
  root: JoinKey,
  targets: Iterable<JoinKey>,
): { key: JoinKey; on: string }[] {
  const joined = new Set<JoinKey>([root]);
  const plan: { key: JoinKey; on: string }[] = [];

  const ordered = [...new Set(targets)]
    .filter((t) => t !== root)
    .map((t) => ({
      t,
      late: LATE_JOINS.includes(t) ? 1 : 0,
      d: distanceFrom(root, t),
    }))
    .sort((x, y) => x.late - y.late || x.d - y.d);

  for (const { t, d } of ordered) {
    if (joined.has(t)) continue;
    if (!Number.isFinite(d)) {
      throw new ReportConfigError(
        `Нет связи между «${root}» и «${t}» — выберите другую базовую сущность`,
      );
    }
    // Многоисточниковый BFS от всех уже подключённых таблиц
    const prev = new Map<JoinKey, { from: JoinKey; on: string }>();
    const queue: JoinKey[] = [...joined];
    const seen = new Set<JoinKey>(joined);
    while (queue.length && !seen.has(t)) {
      const n = queue.shift()!;
      for (const { next, on } of neighbours(n, root)) {
        if (seen.has(next)) continue;
        seen.add(next);
        prev.set(next, { from: n, on });
        queue.push(next);
      }
    }
    const path: { key: JoinKey; on: string }[] = [];
    let cur: JoinKey | undefined = t;
    while (cur && !joined.has(cur)) {
      const step = prev.get(cur);
      if (!step) break;
      path.unshift({ key: cur, on: step.on });
      cur = step.from;
    }
    for (const step of path) {
      joined.add(step.key);
      plan.push(step);
    }
  }

  // Условия согласованности
  const position = new Map<JoinKey, number>([[root, -1]]);
  plan.forEach((p, i) => position.set(p.key, i));
  for (const c of CONSISTENCY) {
    const iOn = position.get(c.on);
    const iWith = position.get(c.with);
    if (iOn === undefined || iWith === undefined || iOn < 0) continue;
    if (iWith < iOn) plan[iOn]!.on = `${plan[iOn]!.on} AND ${c.cond}`;
  }

  return plan;
}

// ============================================================
// НОРМАЛИЗАЦИЯ / ВАЛИДАЦИЯ КОНФИГУРАЦИИ
// ============================================================

function requireField(key: unknown, ctx: string): FieldDefinition {
  const def = typeof key === "string" ? getFieldDefinition(key) : undefined;
  if (!def) throw new ReportConfigError(`Недопустимое поле (${ctx}): ${String(key)}`);
  return def;
}

/** Убирает управляющие символы/обратные кавычки и обрезает заголовок */
export function sanitizeLabel(raw: unknown, fallback: string): string {
  const s = String(raw ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[`\\\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return s || fallback;
}

function uniqueLabel(label: string, used: Set<string>): string {
  let out = label;
  let n = 2;
  while (used.has(out.toLowerCase())) out = `${label} (${n++})`;
  used.add(out.toLowerCase());
  return out;
}

function toIdList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === "string" || typeof x === "number")
    .map(String)
    .slice(0, MAX_IN_VALUES);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(v: unknown): v is string {
  return typeof v === "string" && DATE_RE.test(v);
}

function resolveRoot(config: ReportConfig): JoinKey {
  const pe = config.primary_entity as JoinKey | undefined;
  if (pe && ROOT_ENTITIES.includes(pe)) return pe;
  const firstKey =
    config.groupings[0]?.field_key ||
    config.groupings[0]?.date_field_key ||
    config.columns[0]?.field_key;
  if (firstKey?.startsWith("student.")) return "students";
  if (firstKey?.startsWith("course.")) return "courses";
  if (firstKey?.startsWith("org.")) return "organizations";
  if (firstKey?.startsWith("cert.")) return "issued_certificates";
  return "study_groups";
}

function isNumericResult(def: FieldDefinition, agg: AggregationType): boolean {
  if (agg === "count" || agg === "count_distinct" || agg === "sum" || agg === "avg") return true;
  if (agg === "list") return false;
  return def.type === "number" || def.type === "computed";
}

// ============================================================
// УСЛОВИЯ (WHERE по значениям полей)
// ============================================================

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function buildCondition(
  cond: ReportCondition,
  params: unknown[],
): { sql: string; joins: JoinKey[] } {
  const def = requireField(cond?.field_key, "условие");
  const allowed = conditionOpsFor(def);
  if (!allowed.includes(cond.op)) {
    throw new ReportConfigError(`Оператор «${cond.op}» недоступен для поля «${def.label}»`);
  }
  const expr = def.sqlExpression;
  const isDate = def.type === "date" || def.type === "datetime";
  const isNum = def.type === "number" || def.type === "computed";

  const val = (v: unknown): unknown => {
    if (v === null || v === undefined || v === "") {
      throw new ReportConfigError(`Укажите значение условия для поля «${def.label}»`);
    }
    if (isNum) {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        throw new ReportConfigError(`Значение для «${def.label}» должно быть числом`);
      }
      return n;
    }
    if (isDate) {
      if (!isDateOnly(v)) {
        throw new ReportConfigError(`Дата для «${def.label}» должна быть в формате ГГГГ-ММ-ДД`);
      }
      return v;
    }
    return String(v).slice(0, 255);
  };

  // Для дат сравниваем по календарному дню (datetime включительно до конца дня)
  const dayExpr = isDate ? `DATE(${expr})` : expr;

  let sql: string;
  switch (cond.op) {
    case "eq":
      sql = `${dayExpr} = ?`;
      params.push(val(cond.value));
      break;
    case "neq":
      sql = `(${dayExpr} <> ? OR ${expr} IS NULL)`;
      params.push(val(cond.value));
      break;
    case "gt":
      sql = `${dayExpr} > ?`;
      params.push(val(cond.value));
      break;
    case "gte":
      sql = `${dayExpr} >= ?`;
      params.push(val(cond.value));
      break;
    case "lt":
      sql = `${dayExpr} < ?`;
      params.push(val(cond.value));
      break;
    case "lte":
      sql = `${dayExpr} <= ?`;
      params.push(val(cond.value));
      break;
    case "between":
      sql = `${dayExpr} BETWEEN ? AND ?`;
      params.push(val(cond.value), val(cond.value2));
      break;
    case "contains":
      sql = `${expr} LIKE ?`;
      params.push(`%${escapeLike(String(val(cond.value)))}%`);
      break;
    case "not_contains":
      sql = `(${expr} NOT LIKE ? OR ${expr} IS NULL)`;
      params.push(`%${escapeLike(String(val(cond.value)))}%`);
      break;
    case "starts_with":
      sql = `${expr} LIKE ?`;
      params.push(`${escapeLike(String(val(cond.value)))}%`);
      break;
    case "empty":
      sql = isNum || isDate || def.type === "boolean"
        ? `${expr} IS NULL`
        : `(${expr} IS NULL OR ${expr} = '')`;
      break;
    case "not_empty":
      sql = isNum || isDate || def.type === "boolean"
        ? `${expr} IS NOT NULL`
        : `(${expr} IS NOT NULL AND ${expr} <> '')`;
      break;
    case "is_true":
      sql = `${expr} = 1`;
      break;
    case "is_false":
      sql = `${expr} = 0`;
      break;
    default:
      throw new ReportConfigError(`Неизвестный оператор условия`);
  }
  return { sql, joins: def.requiredJoins };
}

// ============================================================
// ПОСТРОЕНИЕ ЗАПРОСА
// ============================================================

export function buildReportQuery(config: ReportConfig): BuiltReport {
  const columnsIn = Array.isArray(config.columns) ? config.columns : [];
  const groupingsIn = Array.isArray(config.groupings) ? config.groupings : [];
  const filters: ReportFilters =
    config.filters && typeof config.filters === "object" ? config.filters : {};

  if (columnsIn.length === 0 && groupingsIn.length === 0) {
    throw new ReportConfigError("Выберите хотя бы одно поле или группировку");
  }
  if (columnsIn.length > MAX_COLUMNS) {
    throw new ReportConfigError(`Слишком много столбцов (максимум ${MAX_COLUMNS})`);
  }
  if (groupingsIn.length > MAX_GROUPINGS) {
    throw new ReportConfigError(`Слишком много уровней группировки (максимум ${MAX_GROUPINGS})`);
  }

  const rootKey = resolveRoot({ ...config, columns: columnsIn, groupings: groupingsIn });
  const required = new Set<JoinKey>();
  const usedLabels = new Set<string>();
  const warnings: string[] = [];

  const selectParts: string[] = [];
  const groupByParts: string[] = [];
  const columnLabels: string[] = [];
  const aliasToLabel: Record<string, string> = {};
  const numericLabels: string[] = [];
  const groupAliases: string[] = [];
  const totalParts: string[] = [];

  // ── Группировки ──────────────────────────────────────────
  groupingsIn.forEach((grp, i) => {
    const alias = `g${i}`;
    let expr: string;
    let label: string;
    if (grp?.type === "time_scale") {
      const def = requireField(grp.date_field_key, "временная шкала");
      if (!def.isDateField) {
        throw new ReportConfigError(`Поле «${def.label}» не является датой`);
      }
      const scale = grp.time_scale as TimeScale;
      if (!TIME_SCALES.includes(scale)) {
        throw new ReportConfigError(`Недопустимая временная шкала: ${String(scale)}`);
      }
      expr = buildTimeScaleExpression(def.sqlExpression, scale);
      label = sanitizeLabel(grp.label, `${def.label} (${TIME_SCALE_LABELS[scale]})`);
      def.requiredJoins.forEach((j) => required.add(j));
      if (scale === "year") numericLabels.push(label);
    } else {
      const def = requireField(grp?.field_key, "группировка");
      expr = def.sqlExpression;
      label = sanitizeLabel(grp.label, def.label);
      def.requiredJoins.forEach((j) => required.add(j));
    }
    label = uniqueLabel(label, usedLabels);
    selectParts.push(`${expr} AS \`${alias}\``);
    groupByParts.push(expr);
    groupAliases.push(alias);
    columnLabels.push(label);
    aliasToLabel[alias] = label;
  });

  // ── Столбцы ──────────────────────────────────────────────
  const normCols = columnsIn.map((col) => {
    const def = requireField(col?.field_key, "столбец");
    let agg = (AGGREGATIONS.includes(col.aggregation) ? col.aggregation : def.defaultAggregation) as AggregationType;
    if (!def.allowedAggregations.includes(agg)) agg = def.defaultAggregation;
    return { col, def, agg };
  });

  const hasAgg = normCols.some((c) => c.agg !== "none");
  const autoGroupBy: string[] = [];

  normCols.forEach(({ col, def, agg }, i) => {
    const alias = `c${i}`;
    const label = uniqueLabel(sanitizeLabel(col.label, def.label), usedLabels);
    def.requiredJoins.forEach((j) => required.add(j));
    selectParts.push(buildAggregatedExpression(def, agg, alias));
    columnLabels.push(label);
    aliasToLabel[alias] = label;
    if (isNumericResult(def, agg) && def.type !== "date" && def.type !== "datetime") {
      numericLabels.push(label);
    }
    if (hasAgg && agg === "none") autoGroupBy.push(def.sqlExpression);

    if (col.show_in_total) {
      const t = (TOTAL_AGGREGATIONS.includes(col.total_aggregation as TotalAggregation)
        ? col.total_aggregation
        : "sum") as TotalAggregation;
      const fn = t === "count" ? "COUNT" : t.toUpperCase();
      totalParts.push(
        t === "avg"
          ? `ROUND(AVG(t.\`${alias}\`), 2) AS \`${alias}\``
          : `${fn}(t.\`${alias}\`) AS \`${alias}\``,
      );
    }
  });

  // ── Фильтры ──────────────────────────────────────────────
  const whereParts: string[] = [];
  const params: unknown[] = [];

  const inFilter = (ids: string[], expr: string, joins: JoinKey[]) => {
    if (!ids.length) return;
    joins.forEach((j) => required.add(j));
    whereParts.push(`${expr} IN (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  };
  inFilter(toIdList(filters.course_ids), "sg.course_id", ["study_groups"]);
  inFilter(toIdList(filters.group_ids), "sg.id", ["study_groups"]);
  inFilter(toIdList(filters.org_ids), "s.organization_id", ["students"]);
  inFilter(toIdList(filters.instructor_ids), "i.id", ["instructors"]);

  if (filters.date_from || filters.date_to) {
    const dateDef = requireField(filters.date_field || "group.start_date", "фильтр по дате");
    if (!dateDef.isDateField) {
      throw new ReportConfigError(`Поле «${dateDef.label}» не является датой`);
    }
    dateDef.requiredJoins.forEach((j) => required.add(j));
    if (filters.date_from) {
      if (!isDateOnly(filters.date_from)) throw new ReportConfigError("Некорректная дата «с»");
      whereParts.push(`${dateDef.sqlExpression} >= ?`);
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      if (!isDateOnly(filters.date_to)) throw new ReportConfigError("Некорректная дата «по»");
      // Включительно: для DATETIME «по 31.01» должно включать весь день 31.01
      whereParts.push(`${dateDef.sqlExpression} < DATE_ADD(?, INTERVAL 1 DAY)`);
      params.push(filters.date_to);
    }
    if (
      filters.date_from &&
      filters.date_to &&
      String(filters.date_from) > String(filters.date_to)
    ) {
      throw new ReportConfigError("Дата «с» позже даты «по»");
    }
  }

  const conditions = Array.isArray(filters.conditions) ? filters.conditions : [];
  if (conditions.length > MAX_CONDITIONS) {
    throw new ReportConfigError(`Слишком много условий (максимум ${MAX_CONDITIONS})`);
  }
  for (const cond of conditions) {
    const built = buildCondition(cond, params);
    built.joins.forEach((j) => required.add(j));
    whereParts.push(built.sql);
  }

  // ── JOIN-ы ───────────────────────────────────────────────
  // requiredJoins из реестра перечисляют и промежуточные таблицы — для BFS
  // достаточно конечных, промежуточные он найдёт сам.
  const plan = planJoins(rootKey, required);
  const joinOrder: JoinKey[] = [rootKey, ...plan.map((p) => p.key)];
  const joinClauses = plan.map((p) => {
    const def = JOIN_DEFINITIONS[p.key];
    return `LEFT JOIN ${def.table} ${def.alias} ON ${p.on}`;
  });

  // ── Предупреждение о размножении строк ───────────────────
  const activeBranches = Object.values(FANOUT_BRANCHES).filter((b) =>
    b.tables.some((t) => joinOrder.includes(t) && t !== rootKey),
  );
  const additive = normCols.some((c) => c.agg === "sum" || c.agg === "avg" || c.agg === "count");
  if (activeBranches.length >= 2 && additive) {
    warnings.push(
      `Поля из независимых ветвей (${activeBranches.map((b) => b.label).join(" + ")}) ` +
        `перемножают строки: SUM/AVG/COUNT могут быть завышены. Для подсчётов используйте COUNT DISTINCT.`,
    );
  }

  // ── Сборка ───────────────────────────────────────────────
  const finalGroupBy = [...new Set([...groupByParts, ...autoGroupBy])];
  const isAggregated = finalGroupBy.length > 0 || hasAgg;
  const distinct = !isAggregated && joinOrder.length > 1;

  const allAliases = Object.keys(aliasToLabel);
  let sortAlias: string | undefined;
  if (config.sort_field) {
    sortAlias = allAliases.includes(config.sort_field)
      ? config.sort_field
      : allAliases.find((a) => aliasToLabel[a] === config.sort_field);
  }
  const dir = config.sort_direction === "desc" ? "DESC" : "ASC";
  // Детерминированный порядок: выбранная сортировка, затем уровни группировки, затем все столбцы
  const orderAliases = [
    ...(sortAlias ? [sortAlias] : []),
    ...groupAliases,
    ...allAliases,
  ].filter((a, i, arr) => arr.indexOf(a) === i);
  const orderBy = `ORDER BY ${orderAliases
    .map((a) => `\`${a}\` ${a === sortAlias ? dir : "ASC"}`)
    .join(", ")}`;

  const root = JOIN_DEFINITIONS[rootKey];
  const baseLines = [
    `${distinct ? "SELECT DISTINCT" : "SELECT"} ${selectParts.join(", ")}`,
    `FROM ${root.table} ${root.alias}`,
    ...joinClauses,
    whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "",
    finalGroupBy.length ? `GROUP BY ${finalGroupBy.join(", ")}` : "",
  ].filter(Boolean);
  const baseSql = baseLines.join("\n");

  const rawRowLimit = config.row_limit ?? filters.row_limit;
  const rowLimit =
    rawRowLimit && Number(rawRowLimit) > 0
      ? Math.min(Math.floor(Number(rawRowLimit)), MAX_EXPORT_ROWS)
      : null;

  const limit = Math.max(0, Math.floor(Number(config.limit ?? 100)));
  const offset = Math.max(0, Math.floor(Number(config.offset ?? 0)));
  const effectiveLimit = rowLimit !== null ? Math.max(0, Math.min(limit, rowLimit - offset)) : limit;

  const sql = `${baseSql}\n${orderBy}\nLIMIT ? OFFSET ?`;
  const pageParams = [...params, effectiveLimit, offset];

  const countSql = rowLimit !== null
    ? `SELECT LEAST(COUNT(*), ?) AS total FROM (\n${baseSql}\n) AS __cnt`
    : `SELECT COUNT(*) AS total FROM (\n${baseSql}\n) AS __cnt`;
  const countParams = rowLimit !== null ? [rowLimit, ...params] : [...params];

  // Итоги — по всей выборке (с учётом Топ-N)
  let totalsSql: string | null = null;
  let totalsParams: unknown[] = [];
  if (totalParts.length) {
    const inner = rowLimit !== null ? `${baseSql}\n${orderBy}\nLIMIT ?` : baseSql;
    totalsSql = `SELECT ${totalParts.join(", ")} FROM (\n${inner}\n) AS t`;
    totalsParams = rowLimit !== null ? [...params, rowLimit] : [...params];
  }

  return {
    sql,
    params: pageParams,
    countSql,
    countParams,
    totalsSql,
    totalsParams,
    columnLabels,
    aliasToLabel,
    numericLabels,
    warnings,
    rootKey,
    joinOrder,
  };
}

/**
 * Переименовывает алиасы c0/g0 в заголовки и приводит числовые значения
 * (MySQL отдаёт DECIMAL/SUM строкой).
 */
export function mapReportRows(
  rows: Record<string, unknown>[],
  built: Pick<BuiltReport, "aliasToLabel" | "numericLabels">,
): Record<string, unknown>[] {
  const numeric = new Set(built.numericLabels);
  const entries = Object.entries(built.aliasToLabel);
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [alias, label] of entries) {
      let v = row[alias];
      if (numeric.has(label) && typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        if (Number.isFinite(n)) v = n;
      }
      out[label] = v ?? null;
    }
    return out;
  });
}

/** Конфиг для выгрузки: без пагинации, с жёстким потолком строк */
export function buildExportQuery(config: ReportConfig): BuiltReport {
  return buildReportQuery({ ...config, limit: MAX_EXPORT_ROWS, offset: 0 });
}
