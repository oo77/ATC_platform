/**
 * useCompatibilityCheck.ts
 *
 * Клиентская проверка совместимости выбранных полей конфигурации отчёта.
 *
 * Проблема: когда пользователь выбирает поля из независимых «ветвей» JOIN-графа
 * (например, schedule_events и students), SQL порождает декартово произведение,
 * результат которого может быть некорректным.
 *
 * Решение: группируем поля по «ветвям» JOIN-дерева.
 * Если активны несколько несовместимых ветвей — предупреждаем.
 *
 * Ветви (группы несовместимости):
 *   STUDENTS_BRANCH  : study_group_students → students → organizations → issued_certificates
 *   SCHEDULE_BRANCH  : schedule_events → attendance_marking_status
 *   TESTS_BRANCH     : test_assignments → test_sessions
 *
 * Если выбраны поля из 2+ ветвей одновременно — риск декартова произведения.
 * Поля из «базовых» join-ов (courses, disciplines, instructors) совместимы со всеми.
 */

export type JoinBranch = "students" | "schedule" | "tests" | "base";

// Маппинг requiredJoins → ветвь
const JOIN_BRANCH_MAP: Record<string, JoinBranch> = {
  study_group_students: "students",
  students: "students",
  organizations: "students",
  issued_certificates: "students",
  schedule_events: "schedule",
  attendance_marking_status: "schedule",
  test_assignments: "tests",
  test_sessions: "tests",
  // Базовые — нейтральные
  study_groups: "base",
  courses: "base",
  disciplines: "base",
  discipline_instructors: "base",
  instructors: "base",
};

const BRANCH_LABELS: Record<JoinBranch, string> = {
  students: "Слушатели / Организации / Сертификаты",
  schedule: "Расписание / Посещаемость",
  tests: "Тестирование / Оценки",
  base: "Базовые",
};

/**
 * Определяет ветвь JOIN-графа для набора requiredJoins конкретного поля.
 */
export function getFieldBranch(requiredJoins: string[]): JoinBranch {
  for (const join of requiredJoins) {
    const branch = JOIN_BRANCH_MAP[join];
    if (branch && branch !== "base") return branch;
  }
  return "base";
}

export interface CompatibilityWarning {
  type: "cross_branch";
  message: string;
  branches: JoinBranch[];
}

/**
 * Проверяет совместимость набора выбранных колонок.
 * Возвращает null если всё ок, или объект предупреждения.
 */
export function checkColumnsCompatibility(
  columns: Array<{ field_key: string; _requiredJoins?: string[] }>,
  entityGroups: Array<{
    fields: Array<{ key: string; requiredJoins?: string[] }>;
  }>,
): CompatibilityWarning | null {
  if (columns.length === 0) return null;

  // Строим карту field_key → requiredJoins из метаданных
  const fieldMeta = new Map<string, string[]>();
  for (const group of entityGroups) {
    for (const field of group.fields) {
      if (field.requiredJoins) {
        fieldMeta.set(field.key, field.requiredJoins);
      }
    }
  }

  const activeBranches = new Set<JoinBranch>();

  for (const col of columns) {
    const joins = col._requiredJoins ?? fieldMeta.get(col.field_key) ?? [];
    const branch = getFieldBranch(joins);
    if (branch !== "base") {
      activeBranches.add(branch);
    }
  }

  const incompatible = [...activeBranches].filter((b) => b !== "base");

  if (incompatible.length < 2) return null;

  const branchNames = incompatible.map((b) => BRANCH_LABELS[b]).join(" + ");

  return {
    type: "cross_branch",
    branches: incompatible,
    message: `⚠ Несовместимые источники данных: ${branchNames}. Объединение этих ветвей приводит к декартовому произведению строк — результат может содержать дублированные данные. Рекомендуется выбирать поля из одной ветви.`,
  };
}
