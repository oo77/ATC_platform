/**
 * Report Builder — Query Builder
 *
 * Исправлена критическая ошибка порядка JOIN-ов (Topological Sort).
 * Добавлена автоматическая группировка для агрегированных отчетов.
 */

import {
  JOIN_DEFINITIONS,
  getFieldDefinition,
  isValidFieldKey,
  buildAggregatedExpression,
  buildTimeScaleExpression,
  type AggregationType,
  type JoinKey,
  type TimeScale,
} from "./fieldRegistry";

export interface ColumnConfig {
  field_key: string;
  label: string;
  aggregation: AggregationType;
  show_in_total?: boolean;
}

export interface GroupingItem {
  type: "field" | "time_scale";
  field_key?: string;
  time_scale?: TimeScale;
  date_field_key?: string;
  label: string;
}

export interface ReportConfig {
  columns: ColumnConfig[];
  groupings: GroupingItem[];
  filters: any;
  primary_entity?: JoinKey;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export function buildReportQuery(config: ReportConfig) {
  const {
    columns,
    groupings,
    filters,
    primary_entity,
    sort_field,
    sort_direction,
    limit = 100,
    offset = 0,
  } = config;

  // 1. ОПРЕДЕЛЯЕМ КОРЕНЬ И ГРАФ JOIN
  let rootKey: JoinKey = primary_entity || "study_groups";

  if (!primary_entity) {
    const firstKey = groupings[0]?.field_key || columns[0]?.field_key;
    if (firstKey) {
      if (firstKey.startsWith("student.")) rootKey = "students";
      else if (firstKey.startsWith("course.")) rootKey = "courses";
      else if (firstKey.startsWith("org.")) rootKey = "organizations";
      else if (firstKey.startsWith("cert.")) rootKey = "issued_certificates";
    }
  }

  const requiredJoins = new Set<JoinKey>([rootKey]);

  const ensurePath = (to: JoinKey) => {
    if (to === rootKey || requiredJoins.has(to)) return;

    // 1. Добавляем текущую таблицу
    requiredJoins.add(to);

    // 2. Рекурсивно добавляем требования из реестра (по направлению к центру)
    const def = JOIN_DEFINITIONS[to];
    if (def?.requires) {
      def.requires.forEach(ensurePath);
    }

    // 3. Дополнительная логика для "обратных" и специфических путей
    const isHumanRoot =
      rootKey === "students" ||
      rootKey === "organizations" ||
      rootKey === "issued_certificates";
    const isCourseRoot = rootKey === "courses";

    if (isHumanRoot && (to === "study_groups" || to === "courses")) {
      ensurePath("study_group_students");
      ensurePath("study_groups");
    }
    if (isCourseRoot && (to === "students" || to === "organizations")) {
      ensurePath("study_groups");
      ensurePath("study_group_students");
    }

    // Если корень - Группа, и идем к Студенту
    if (
      rootKey === "study_groups" &&
      (to === "students" || to === "organizations")
    ) {
      ensurePath("study_group_students");
    }
  };

  const allFieldKeys = [
    ...columns.map((c) => c.field_key),
    ...groupings.map((g) => g.field_key || g.date_field_key),
  ];
  allFieldKeys.forEach((key) => {
    if (key) getFieldDefinition(key)?.requiredJoins.forEach(ensurePath);
  });

  // Зависимости от фильтров
  if (filters.course_ids?.length) ensurePath("study_groups");
  if (filters.org_ids?.length) ensurePath("students");
  if (filters.group_ids?.length) ensurePath("study_groups");
  if (filters.instructor_ids?.length) {
    ensurePath("instructors");
  }

  const dateFilterField = filters.date_field || "group.start_date";
  if (filters.date_from || filters.date_to) {
    getFieldDefinition(dateFilterField)?.requiredJoins.forEach(ensurePath);
  }

  // 2. СТРОИМ ПОРЯДОК JOIN (ВАЖНО!)
  // Таблицы должны идти в порядке распространения данных: Courses -> Groups -> SGS -> Students
  const ALL_TABLES: JoinKey[] = [
    "courses",
    "disciplines",
    "discipline_instructors",
    "instructors",
    "study_groups",
    "study_group_students",
    "students",
    "organizations",
    "issued_certificates",
    "schedule_events",
    "attendance_marking_status",
    "test_assignments",
    "test_sessions",
  ];

  let ORDER: JoinKey[] = [];
  if (rootKey === "courses") {
    ORDER = [...ALL_TABLES];
  } else if (
    rootKey === "students" ||
    rootKey === "organizations" ||
    rootKey === "issued_certificates"
  ) {
    ORDER = [
      "students",
      "organizations",
      "issued_certificates",
      "study_group_students",
      "study_groups",
      "courses",
      "disciplines",
      "discipline_instructors",
      "instructors",
      "schedule_events",
      "attendance_marking_status",
      "test_assignments",
      "test_sessions",
    ];
  } else {
    ORDER = [...ALL_TABLES];
  }

  const joinOrder = [rootKey];
  ORDER.forEach((k) => {
    if (requiredJoins.has(k) && k !== rootKey) joinOrder.push(k);
  });

  // 3. SELECT / GROUP BY
  const selectParts: string[] = [];
  const groupByParts: string[] = [];
  const columnLabels: string[] = [];

  // Группировки (явные)
  groupings.forEach((grp) => {
    if (grp.type === "field" && grp.field_key) {
      const def = getFieldDefinition(grp.field_key)!;
      selectParts.push(`${def.sqlExpression} AS \`${grp.label}\``);
      groupByParts.push(def.sqlExpression);
      columnLabels.push(grp.label);
    } else if (
      grp.type === "time_scale" &&
      grp.date_field_key &&
      grp.time_scale
    ) {
      const def = getFieldDefinition(grp.date_field_key)!;
      const expr = buildTimeScaleExpression(
        def.sqlExpression,
        grp.time_scale as any,
        grp.label,
      );
      selectParts.push(expr);
      groupByParts.push(
        buildTimeScaleExpression(
          def.sqlExpression,
          grp.time_scale as any,
          "tmp",
        ).split(" AS ")[0],
      );
      columnLabels.push(grp.label);
    }
  });

  // Колонки
  const autoGroupByParts: string[] = [];
  const hasAgg = columns.some((c) => c.aggregation && c.aggregation !== "none");

  columns.forEach((col) => {
    const def = getFieldDefinition(col.field_key)!;
    const isAgg = col.aggregation && col.aggregation !== "none";
    const expr = buildAggregatedExpression(def, col.aggregation, col.label);
    selectParts.push(expr);
    columnLabels.push(col.label);

    // Если есть агрегация, всё неагрегированное должно уйти в GROUP BY
    if (hasAgg && !isAgg) {
      autoGroupByParts.push(def.sqlExpression);
    }
  });

  // 4. JOIN CLAUSES
  const joinClauses: string[] = [];
  joinOrder.forEach((jk) => {
    if (jk === rootKey) return;
    const def = JOIN_DEFINITIONS[jk];
    let cond = def.condition;

    // АДАПТАЦИЯ УСЛОВИЙ (Направление связей)
    if (rootKey === "courses") {
      if (jk === "study_groups") cond = "sg.course_id = c.id";
      if (jk === "study_group_students") cond = "sgs.group_id = sg.id";
      if (jk === "students") cond = "s.id = sgs.student_id";
      if (jk === "organizations") cond = "org.id = s.organization_id";
    } else if (rootKey === "students") {
      if (jk === "organizations") cond = "org.id = s.organization_id";
      if (jk === "study_group_students") cond = "sgs.student_id = s.id";
      if (jk === "study_groups") cond = "sg.id = sgs.group_id";
      if (jk === "courses") cond = "c.id = sg.course_id";
    } else if (rootKey === "organizations") {
      if (jk === "students") cond = "s.organization_id = org.id";
      if (jk === "study_group_students") cond = "sgs.student_id = s.id";
      if (jk === "study_groups") cond = "sg.id = sgs.group_id";
    } else if (rootKey === "issued_certificates") {
      if (jk === "students") cond = "s.id = ic.student_id";
      if (jk === "study_group_students") cond = "sgs.student_id = s.id";
      if (jk === "study_groups")
        cond = "sg.id = ic.group_id OR sg.id = sgs.group_id";
    }

    joinClauses.push(`${def.type} JOIN ${def.table} ${def.alias} ON ${cond}`);
  });

  // 5. ПОСТРОЕНИЕ SQL
  const params: any[] = [];
  const whereParts: string[] = [];
  if (filters.course_ids?.length) {
    whereParts.push(
      `sg.course_id IN (${filters.course_ids.map(() => "?").join(",")})`,
    );
    params.push(...filters.course_ids);
  }
  if (filters.org_ids?.length) {
    whereParts.push(
      `s.organization_id IN (${filters.org_ids.map(() => "?").join(",")})`,
    );
    params.push(...filters.org_ids);
  }
  if (filters.group_ids?.length) {
    whereParts.push(`sg.id IN (${filters.group_ids.map(() => "?").join(",")})`);
    params.push(...filters.group_ids);
  }
  if (filters.instructor_ids?.length) {
    whereParts.push(
      `i.id IN (${filters.instructor_ids.map(() => "?").join(",")})`,
    );
    params.push(...filters.instructor_ids);
  }

  // Фильтры по датам
  const dateFieldKey = filters.date_field || "group.start_date";
  const dateFieldDef = getFieldDefinition(dateFieldKey);
  if (dateFieldDef && (filters.date_from || filters.date_to)) {
    if (filters.date_from) {
      whereParts.push(`${dateFieldDef.sqlExpression} >= ?`);
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      whereParts.push(`${dateFieldDef.sqlExpression} <= ?`);
      params.push(filters.date_to);
    }
  }

  const finalGroupBy = [...new Set([...groupByParts, ...autoGroupByParts])];
  const needsDistinct =
    finalGroupBy.length === 0 && !hasAgg && joinOrder.length > 1;

  const sql = [
    `${needsDistinct ? "SELECT DISTINCT" : "SELECT"} ${selectParts.join(", ")}`,
    `FROM ${JOIN_DEFINITIONS[rootKey].table} ${JOIN_DEFINITIONS[rootKey].alias}`,
    ...joinClauses,
    whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "",
    finalGroupBy.length > 0 ? `GROUP BY ${finalGroupBy.join(", ")}` : "",
    sort_field && columnLabels.includes(sort_field)
      ? `ORDER BY \`${sort_field}\` ${sort_direction === "desc" ? "DESC" : "ASC"}`
      : "",
    `LIMIT ? OFFSET ?`,
  ]
    .filter(Boolean)
    .join("\n");

  params.push(limit, offset);
  return { sql, params, columnLabels };
}

export function buildCountQuery(config: any) {
  const res = buildReportQuery({ ...config, limit: 1000000, offset: 0 });
  const sqlWithoutLimit = res.sql
    .split("\n")
    .filter((l) => !l.startsWith("LIMIT"))
    .join("\n");
  return {
    sql: `SELECT COUNT(*) AS total FROM (\n${sqlWithoutLimit}\n) AS __cnt`,
    params: res.params.slice(0, -2),
    columnLabels: ["total"],
  };
}

export function buildExportQuery(config: any) {
  return buildReportQuery({ ...config, limit: 100000, offset: 0 });
}
