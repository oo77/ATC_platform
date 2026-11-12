import { describe, it, expect } from "vitest";
import {
  buildReportQuery,
  mapReportRows,
  planJoins,
  ReportConfigError,
  sanitizeLabel,
} from "../../../server/utils/reports/queryBuilder";

const col = (field_key: string, label: string, aggregation: any = "none", extra: any = {}) => ({
  field_key,
  label,
  aggregation,
  ...extra,
});

describe("planJoins", () => {
  it("от группы к организации идёт через слушателей", () => {
    const plan = planJoins("study_groups", ["organizations"]);
    expect(plan.map((p) => p.key)).toEqual(["study_group_students", "students", "organizations"]);
  });

  it("от организации к слушателям не тянет группы", () => {
    const plan = planJoins("organizations", ["students"]);
    expect(plan.map((p) => p.key)).toEqual(["students"]);
  });

  it("от сертификатов к группе — напрямую через ic.group_id", () => {
    const plan = planJoins("issued_certificates", ["study_groups", "students"]);
    expect(plan.map((p) => p.key).sort()).toEqual(["students", "study_groups"]);
    expect(plan.find((p) => p.key === "study_groups")!.on).toBe("sg.id = ic.group_id");
  });

  it("сертификат согласуется с группой, если в запросе есть обе таблицы", () => {
    const plan = planJoins("students", ["issued_certificates", "study_groups"]);
    const keys = plan.map((p) => p.key);
    expect(keys.indexOf("study_groups")).toBeLessThan(keys.indexOf("issued_certificates"));
    expect(plan.find((p) => p.key === "issued_certificates")!.on).toContain("ic.group_id = sg.id");
  });

  it("попытки тестов привязываются к слушателю", () => {
    const plan = planJoins("study_groups", ["test_sessions", "students"]);
    expect(plan.find((p) => p.key === "test_sessions")!.on).toContain("ts.student_id = s.id");
  });
});

describe("buildReportQuery", () => {
  it("не пропускает пользовательские заголовки в SQL", () => {
    const evil = "x` FROM users; DROP TABLE users; -- ";
    const b = buildReportQuery({
      columns: [col("course.name", evil)],
      groupings: [],
      filters: {},
    });
    expect(b.sql).not.toContain("DROP");
    expect(b.sql).toContain("AS `c0`");
    expect(b.columnLabels[0]).not.toContain("`");
  });

  it("делает заголовки уникальными", () => {
    const b = buildReportQuery({
      columns: [col("course.name", "Имя"), col("group.code", "Имя")],
      groupings: [],
      filters: {},
    });
    expect(b.columnLabels).toEqual(["Имя", "Имя (2)"]);
  });

  it("неизвестное поле — ошибка конфигурации, а не 500", () => {
    expect(() =>
      buildReportQuery({ columns: [col("nope.field", "x")], groupings: [], filters: {} }),
    ).toThrow(ReportConfigError);
  });

  it("недопустимая агрегация заменяется на агрегацию по умолчанию", () => {
    const b = buildReportQuery({
      columns: [col("course.name", "Курс", "sum")],
      groupings: [],
      filters: {},
    });
    expect(b.sql).not.toContain("SUM(");
  });

  it("дата «по» включает весь день", () => {
    const b = buildReportQuery({
      columns: [col("group.code", "Группа")],
      groupings: [],
      filters: { date_field: "event.start_time", date_from: "2026-01-01", date_to: "2026-01-31" },
    });
    expect(b.sql).toContain("se.start_time < DATE_ADD(?, INTERVAL 1 DAY)");
    expect(b.params).toContain("2026-01-31");
  });

  it("условие «содержит» экранирует LIKE-символы и параметризуется", () => {
    const b = buildReportQuery({
      columns: [col("student.full_name", "ФИО")],
      groupings: [],
      filters: { conditions: [{ field_key: "student.full_name", op: "contains", value: "50%_x" }] },
      primary_entity: "students",
    });
    expect(b.sql).toContain("s.full_name LIKE ?");
    expect(b.params[0]).toBe("%50\\%\\_x%");
  });

  it("всегда есть ORDER BY для стабильной пагинации", () => {
    const b = buildReportQuery({
      columns: [col("student.count", "Слушателей", "count_distinct")],
      groupings: [{ type: "time_scale", date_field_key: "group.start_date", time_scale: "month", label: "Месяц" }],
      filters: {},
    });
    expect(b.sql).toMatch(/ORDER BY `g0` ASC/);
    expect(b.sql).toContain("DATE_FORMAT(sg.start_date, '%Y-%m')");
  });

  it("Топ-N ограничивает страницу и количество", () => {
    const b = buildReportQuery({
      columns: [col("org.name", "Орг"), col("student.count", "Слушателей", "count_distinct")],
      groupings: [],
      filters: {},
      primary_entity: "organizations",
      sort_field: "Слушателей",
      sort_direction: "desc",
      row_limit: 10,
      limit: 50,
      offset: 0,
    });
    expect(b.sql).toMatch(/ORDER BY `c1` DESC/);
    expect(b.params.slice(-2)).toEqual([10, 0]);
    expect(b.countSql).toContain("LEAST(COUNT(*), ?)");
  });

  it("итоги считаются по всей выборке отдельным запросом", () => {
    const b = buildReportQuery({
      columns: [
        col("course.name", "Курс"),
        col("student.count", "Слушателей", "count_distinct", { show_in_total: true, total_aggregation: "sum" }),
      ],
      groupings: [],
      filters: {},
      primary_entity: "courses",
    });
    expect(b.totalsSql).toContain("SUM(t.`c1`)");
    expect(b.totalsSql).not.toContain("LIMIT");
  });

  it("предупреждает о перемножении ветвей", () => {
    const b = buildReportQuery({
      columns: [
        col("group.code", "Группа"),
        col("student.count", "Слушателей", "count"),
        col("attendance.event_count", "Занятий", "count"),
      ],
      groupings: [],
      filters: {},
    });
    expect(b.warnings.length).toBe(1);
  });
});

describe("mapReportRows", () => {
  it("переименовывает алиасы и приводит DECIMAL-строки к числам", () => {
    const rows = mapReportRows([{ c0: "Курс", c1: "12.50" }], {
      aliasToLabel: { c0: "Курс", c1: "Среднее" },
      numericLabels: ["Среднее"],
    });
    expect(rows).toEqual([{ Курс: "Курс", Среднее: 12.5 }]);
  });
});

describe("sanitizeLabel", () => {
  it("убирает обратные кавычки и управляющие символы", () => {
    expect(sanitizeLabel("a`b\nc", "x")).toBe("abc");
    expect(sanitizeLabel("   ", "fallback")).toBe("fallback");
  });
});
