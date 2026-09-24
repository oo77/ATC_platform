import { getDbPool, executeQuery } from "../db";
import type {
  UserContext,
  CertificateItem,
  StudentCard,
  ReportArtifact,
  ColumnDef,
} from "./chatTypes";

// ============================================================================
// Инструменты ИИ-чата: быстрый SQL (кэш + таймаут), in-memory индекс ФИО
// слушателей, поиск слушателей/сертификатов одним запросом
// ============================================================================

const SQL_TIMEOUT_MS = 12_000;
const QUERY_CACHE_TTL_MS = 60_000;
const QUERY_CACHE_MAX = 200;
const NAME_INDEX_TTL_MS = 10 * 60_000;

// ----------------------------------------------------------------------------
// Транслитерация (кириллица / узбекская латиница → единая латиница)
// ----------------------------------------------------------------------------

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

export function normalizeName(raw: string): string {
  let out = "";
  for (const ch of String(raw || "").toLowerCase()) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  out = out.replace(/[ʻʼ'`’‘]/g, "");
  // Сближаем частые варианты латиницы: x/h, kh, dj/j
  out = out.replace(/kh/g, "x").replace(/dj/g, "j");
  out = out.replace(/[^a-z0-9\s]/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (b.startsWith(a) && a.length >= 3) return 0.92;
  const maxLen = Math.max(a.length, b.length);
  return maxLen ? 1 - levenshtein(a, b) / maxLen : 1;
}

// ----------------------------------------------------------------------------
// Выполнение SQL с таймаутом и коротким кэшем результатов
// ----------------------------------------------------------------------------

/** SUM()/AVG() возвращают DECIMAL строкой — для таблиц и графиков нужны числа */
function castDecimals(field: any, next: () => any) {
  if (field.type === "NEWDECIMAL" || field.type === "DECIMAL") {
    const v = field.string();
    return v === null ? null : Number(v);
  }
  return next();
}

const queryCache = new Map<string, { at: number; rows: any[] }>();

export async function runQuery<T = any>(
  sql: string,
  params: any[] = [],
  opts: { cache?: boolean } = {},
): Promise<T[]> {
  const key = opts.cache ? sql + "\u0001" + JSON.stringify(params) : "";
  if (key) {
    const hit = queryCache.get(key);
    if (hit && Date.now() - hit.at < QUERY_CACHE_TTL_MS) return hit.rows as T[];
  }

  const [rows] = await getDbPool().query({ sql, values: params, timeout: SQL_TIMEOUT_MS, typeCast: castDecimals });
  const result = (Array.isArray(rows) ? rows : []) as T[];

  if (key) {
    if (queryCache.size >= QUERY_CACHE_MAX) {
      const oldest = queryCache.keys().next().value;
      if (oldest !== undefined) queryCache.delete(oldest);
    }
    queryCache.set(key, { at: Date.now(), rows: result });
  }
  return result;
}

// ----------------------------------------------------------------------------
// Безопасный SQL-валидатор (read-only песочница)
// ----------------------------------------------------------------------------

const DANGEROUS_SQL = [
  /\bINSERT\b/i, /\bUPDATE\b/i, /\bDELETE\b/i, /\bDROP\b/i, /\bALTER\b/i,
  /\bTRUNCATE\b/i, /\bRENAME\b/i, /\bCREATE\b/i, /\bGRANT\b/i, /\bREVOKE\b/i,
  /\bEXEC(UTE)?\b/i, /\bINTO\s+(OUTFILE|DUMPFILE)\b/i, /\bLOAD_FILE\b/i,
  /\bSLEEP\s*\(/i, /\bBENCHMARK\s*\(/i, /\bFOR\s+UPDATE\b/i, /\bLOCK\b/i,
];

const FORBIDDEN_SQL = [
  /\bai_settings\b/i, /\bai_providers\b/i, /\bsystem_settings\b/i,
  /\bpassword_hash\b/i, /\btelegram_bot_sessions\b/i, /\bmysql\./i,
  /\binformation_schema\b/i, /\bperformance_schema\b/i,
];

export function validateSafeSql(
  rawSql: string,
  userContext: UserContext,
  maxRows = 500,
): { valid: boolean; error?: string; cleanSql: string } {
  let sql = String(rawSql || "").trim().replace(/;+\s*$/, "").trim();

  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) {
    return { valid: false, error: "Разрешены только SELECT-запросы.", cleanSql: "" };
  }
  if (sql.includes(";")) {
    return { valid: false, error: "Разрешён только один SQL-запрос.", cleanSql: "" };
  }
  if (DANGEROUS_SQL.some((re) => re.test(sql))) {
    return { valid: false, error: "Запрос содержит недопустимую команду.", cleanSql: "" };
  }
  if (FORBIDDEN_SQL.some((re) => re.test(sql))) {
    return { valid: false, error: "Доступ к системным таблицам и секретам запрещён.", cleanSql: "" };
  }

  // Изоляция организаций: без прав администратора запрос обязан фильтроваться по своей организации
  if (!userContext.canViewAll) {
    if (!userContext.organizationId || !sql.includes(userContext.organizationId)) {
      return {
        valid: false,
        error: `Запрос обязан содержать фильтр organization_id = '${userContext.organizationId ?? ""}'.`,
        cleanSql: "",
      };
    }
  }

  // Тяжёлые base64-поля никогда не читаем целиком
  sql = sql.replace(
    /(?<![(\w.])((?:[a-z_]+\.)?)photo_base64\b(?!\s*(IS\b|<>|!=|=))/gi,
    "(LENGTH($1photo_base64) > 0)",
  );

  if (!/\bLIMIT\s+\d+(\s*,\s*\d+)?\s*$/i.test(sql)) {
    sql += ` LIMIT ${maxRows}`;
  }

  return { valid: true, cleanSql: sql };
}

export async function executeSafeSql(
  sql: string,
  userContext: UserContext,
): Promise<{ success: boolean; rows: any[]; error?: string; sql: string; ms: number }> {
  const started = Date.now();
  const validation = validateSafeSql(sql, userContext);
  if (!validation.valid) {
    return { success: false, rows: [], error: validation.error, sql, ms: 0 };
  }
  try {
    const rows = await runQuery(validation.cleanSql, [], { cache: true });
    return { success: true, rows: rows.map(normalizeRow), sql: validation.cleanSql, ms: Date.now() - started };
  } catch (error: any) {
    const msg = /timeout/i.test(error?.message || "")
      ? `Запрос выполнялся дольше ${SQL_TIMEOUT_MS / 1000} с и был прерван. Упростите его (агрегаты, LIMIT).`
      : `Ошибка SQL: ${error.message}`;
    return { success: false, rows: [], error: msg, sql: validation.cleanSql, ms: Date.now() - started };
  }
}

/** Приводит значения MySQL к JSON-дружелюбному виду (Date → ISO-дата, Buffer → строка/число) */
export function normalizeRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
    else if (Buffer.isBuffer(v)) out[k] = v.length === 1 ? v[0] : v.toString("utf8");
    else if (typeof v === "bigint") out[k] = Number(v);
    else out[k] = v;
  }
  return out;
}

/** Компактное CSV-представление строк для передачи модели (экономит токены в разы по сравнению с JSON) */
export function rowsToCompactText(rows: any[], maxRows = 25): string {
  if (!rows.length) return "(0 строк)";
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(" | ")];
  for (const r of rows.slice(0, maxRows)) {
    lines.push(cols.map((c) => String(r[c] ?? "").slice(0, 60)).join(" | "));
  }
  if (rows.length > maxRows) lines.push(`... ещё ${rows.length - maxRows} строк`);
  return `${rows.length} строк:\n` + lines.join("\n");
}

// ----------------------------------------------------------------------------
// In-memory индекс ФИО слушателей (≈10k строк, загружается ~100 мс раз в 10 минут)
// ----------------------------------------------------------------------------

interface NameIndexEntry {
  id: string;
  fullName: string;
  pinfl: string;
  organizationId: string | null;
  norm: string;
  tokens: string[];
}

let nameIndex: { at: number; entries: NameIndexEntry[] } | null = null;
let nameIndexLoading: Promise<NameIndexEntry[]> | null = null;

async function getNameIndex(): Promise<NameIndexEntry[]> {
  if (nameIndex && Date.now() - nameIndex.at < NAME_INDEX_TTL_MS) return nameIndex.entries;
  if (!nameIndexLoading) {
    nameIndexLoading = runQuery<any>(
      "SELECT id, full_name, pinfl, organization_id FROM students",
    )
      .then((rows) => {
        const entries = rows.map((r) => {
          const norm = normalizeName(r.full_name);
          return {
            id: r.id,
            fullName: r.full_name,
            pinfl: r.pinfl || "",
            organizationId: r.organization_id,
            norm,
            tokens: norm.split(" ").filter(Boolean),
          };
        });
        nameIndex = { at: Date.now(), entries };
        return entries;
      })
      .finally(() => {
        nameIndexLoading = null;
      });
  }
  return nameIndexLoading;
}

/** Сбрасывает индекс (например, после импорта слушателей) */
export function invalidateStudentNameIndex() {
  nameIndex = null;
}

function scoreName(queryTokens: string[], entry: NameIndexEntry): number {
  // Каждый токен запроса ищет лучший токен ФИО; инициалы («А.») совпадают по первой букве
  let total = 0;
  for (const qt of queryTokens) {
    let best = 0;
    for (const et of entry.tokens) {
      const s = qt.length === 1 ? (et.startsWith(qt) ? 0.9 : 0) : tokenSimilarity(qt, et);
      if (s > best) best = s;
      if (best === 1) break;
    }
    total += best;
  }
  return total / queryTokens.length;
}

export async function matchStudentIds(
  query: string,
  userContext: UserContext,
  limit = 8,
): Promise<Array<{ id: string; confidence: number }>> {
  const entries = await getNameIndex();
  const scoped = userContext.canViewAll
    ? entries
    : entries.filter((e) => e.organizationId && e.organizationId === userContext.organizationId);

  const digits = query.replace(/\D/g, "");
  if (digits.length >= 6 && digits.length === query.replace(/\s/g, "").length) {
    return scoped
      .filter((e) => e.pinfl.includes(digits))
      .slice(0, limit)
      .map((e) => ({ id: e.id, confidence: e.pinfl === digits ? 100 : 90 }));
  }

  const qTokens = normalizeName(query).split(" ").filter(Boolean);
  if (!qTokens.length) return [];
  // Фамилия — самый длинный/первый токен: предфильтр по первой букве снижает объём вычислений
  const scored: Array<{ id: string; confidence: number }> = [];
  for (const e of scoped) {
    const s = scoreName(qTokens, e);
    if (s >= 0.72) scored.push({ id: e.id, confidence: Math.round(s * 100) });
  }
  scored.sort((a, b) => b.confidence - a.confidence);
  // Если есть точные совпадения — отбрасываем «шумные» варианты
  const top = scored[0]?.confidence ?? 0;
  return scored.filter((s) => s.confidence >= Math.min(top, 100) - 15).slice(0, limit);
}

// ----------------------------------------------------------------------------
// Поиск слушателей: карточки со сводкой по группам и сертификатам (3 запроса по индексам)
// ----------------------------------------------------------------------------

function mapCertificate(r: any): CertificateItem {
  return {
    id: r.id,
    certificateNumber: r.certificate_number,
    studentId: r.student_id,
    studentName: r.student_name,
    courseName: r.course_name || "—",
    issueDate: r.issue_date ? toIsoDate(r.issue_date) : undefined,
    expiryDate: r.expiry_date ? toIsoDate(r.expiry_date) : undefined,
    status: r.status,
    organization: r.organization_name || undefined,
    hasPdf: !!r.pdf_file_url,
  };
}

function toIsoDate(v: any): string {
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

export async function findStudents(
  query: string,
  userContext: UserContext,
  limit = 6,
): Promise<StudentCard[]> {
  const matches = await matchStudentIds(query, userContext, limit);
  if (!matches.length) return [];
  const ids = matches.map((m) => m.id);
  const placeholders = ids.map(() => "?").join(",");

  const [students, groups, certs] = await Promise.all([
    runQuery<any>(
      `SELECT s.id, s.full_name, s.pinfl, s.department, s.position, s.birth_date,
              COALESCE(o.name, s.organization) AS organization_name,
              (s.photo_base64 IS NOT NULL AND s.photo_base64 <> '') AS has_photo
       FROM students s
       LEFT JOIN organizations o ON o.id = s.organization_id
       WHERE s.id IN (${placeholders})`,
      ids,
    ),
    runQuery<any>(
      `SELECT sgs.student_id, g.id AS group_id, g.code, g.start_date, g.end_date, c.name AS course_name
       FROM study_group_students sgs
       JOIN study_groups g ON g.id = sgs.group_id
       LEFT JOIN courses c ON c.id = g.course_id
       WHERE sgs.student_id IN (${placeholders})
       ORDER BY g.start_date DESC`,
      ids,
    ),
    runQuery<any>(
      `SELECT ic.id, ic.certificate_number, ic.student_id, s.full_name AS student_name,
              COALESCE(ic.course_name, c.name) AS course_name, ic.issue_date, ic.expiry_date,
              ic.status, ic.pdf_file_url
       FROM issued_certificates ic
       JOIN students s ON s.id = ic.student_id
       LEFT JOIN study_groups g ON g.id = ic.group_id
       LEFT JOIN courses c ON c.id = g.course_id
       WHERE ic.student_id IN (${placeholders})
       ORDER BY ic.issue_date DESC`,
      ids,
    ),
  ]);

  const byId = new Map(students.map((s) => [s.id, s]));
  return matches
    .filter((m) => byId.has(m.id))
    .map((m) => {
      const s = byId.get(m.id);
      const sGroups = groups.filter((g) => g.student_id === m.id);
      const sCerts = certs.filter((c) => c.student_id === m.id).map(mapCertificate);
      const today = new Date().toISOString().slice(0, 10);
      return {
        id: s.id,
        fullName: s.full_name,
        pinfl: s.pinfl || "",
        organization: s.organization_name || "",
        department: s.department || "",
        position: s.position || "",
        birthDate: s.birth_date ? toIsoDate(s.birth_date) : undefined,
        hasPhoto: !!Number(s.has_photo),
        photoUrl: Number(s.has_photo) ? `/api/students/${s.id}/photo` : null,
        confidence: m.confidence,
        groups: sGroups.slice(0, 8).map((g) => ({
          id: g.group_id,
          code: g.code,
          courseName: g.course_name || "—",
          startDate: g.start_date ? toIsoDate(g.start_date) : undefined,
          endDate: g.end_date ? toIsoDate(g.end_date) : undefined,
          isActive: !!g.end_date && toIsoDate(g.end_date) >= today && (!g.start_date || toIsoDate(g.start_date) <= today),
        })),
        groupsCount: sGroups.length,
        certificates: sCerts,
        certificatesCount: sCerts.filter((c) => c.status === "issued").length,
      } satisfies StudentCard;
    });
}

// ----------------------------------------------------------------------------
// Поиск сертификатов по слушателю / номеру / курсу / организации / периоду
// ----------------------------------------------------------------------------

export interface CertificateFilter {
  student?: string;
  number?: string;
  course?: string;
  organization?: string;
  status?: "issued" | "revoked";
  dateFrom?: string;
  dateTo?: string;
  expiringWithinDays?: number;
  limit?: number;
}

export async function findCertificates(
  filter: CertificateFilter,
  userContext: UserContext,
): Promise<CertificateItem[]> {
  const where: string[] = [];
  const params: any[] = [];

  if (filter.student) {
    const matches = await matchStudentIds(filter.student, userContext, 20);
    if (!matches.length) return [];
    where.push(`ic.student_id IN (${matches.map(() => "?").join(",")})`);
    params.push(...matches.map((m) => m.id));
  }
  if (filter.number) {
    where.push("ic.certificate_number LIKE ?");
    params.push(`%${filter.number.trim()}%`);
  }
  if (filter.course) {
    where.push("(ic.course_name LIKE ? OR c.name LIKE ? OR c.short_name = ? OR c.code = ?)");
    const q = filter.course.trim();
    params.push(`%${q}%`, `%${q}%`, q, q);
  }
  if (filter.organization) {
    where.push("(o.name LIKE ? OR o.code = ? OR s.organization LIKE ?)");
    const q = filter.organization.trim();
    params.push(`%${q}%`, q, `%${q}%`);
  }
  if (filter.status) {
    where.push("ic.status = ?");
    params.push(filter.status);
  }
  if (filter.dateFrom) {
    where.push("ic.issue_date >= ?");
    params.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    where.push("ic.issue_date <= ?");
    params.push(filter.dateTo);
  }
  if (filter.expiringWithinDays) {
    where.push("ic.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)");
    params.push(Math.min(Number(filter.expiringWithinDays) || 30, 3650));
  }
  if (!userContext.canViewAll) {
    where.push("s.organization_id = ?");
    params.push(userContext.organizationId || "__none__");
  }

  const limit = Math.min(Math.max(Number(filter.limit) || 200, 1), 500);
  const rows = await runQuery<any>(
    `SELECT ic.id, ic.certificate_number, ic.student_id, s.full_name AS student_name,
            COALESCE(ic.course_name, c.name) AS course_name, ic.issue_date, ic.expiry_date,
            ic.status, ic.pdf_file_url, COALESCE(o.name, s.organization) AS organization_name
     FROM issued_certificates ic
     JOIN students s ON s.id = ic.student_id
     LEFT JOIN organizations o ON o.id = s.organization_id
     LEFT JOIN study_groups g ON g.id = ic.group_id
     LEFT JOIN courses c ON c.id = g.course_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY ic.issue_date DESC
     LIMIT ${limit}`,
    params,
    { cache: true },
  );
  return rows.map(mapCertificate);
}

// ----------------------------------------------------------------------------
// Файлы
// ----------------------------------------------------------------------------

export async function searchFiles(params: { query?: string; category?: string; limit?: number }) {
  const { query = "", category = "", limit = 15 } = params || {};
  let sql = `SELECT uuid, filename, category, extension, size_bytes, created_at
             FROM files WHERE deleted_at IS NULL`;
  const p: any[] = [];
  if (query) {
    sql += " AND (filename LIKE ? OR original_filename LIKE ?)";
    p.push(`%${query}%`, `%${query}%`);
  }
  if (category) {
    sql += " AND category = ?";
    p.push(category);
  }
  sql += ` ORDER BY created_at DESC LIMIT ${Math.min(Number(limit) || 15, 50)}`;
  const rows = await executeQuery<any[]>(sql, p);
  return rows.map((f) => ({
    uuid: f.uuid,
    filename: f.filename,
    category: f.category,
    extension: f.extension,
    size_kb: Math.round((f.size_bytes || 0) / 1024),
    created_at: f.created_at ? toIsoDate(f.created_at) : null,
  }));
}

// ----------------------------------------------------------------------------
// Построение артефактов (Canvas) на сервере — модель больше не «перепечатывает» строки
// ----------------------------------------------------------------------------

const KNOWN_LABELS: Record<string, string> = {
  full_name: "ФИО", student_name: "Слушатель", name: "Название", organization: "Организация",
  organization_name: "Организация", course_name: "Курс", course: "Курс", code: "Код",
  group_code: "Группа", students_count: "Слушателей", count: "Количество", total: "Всего",
  certificates_count: "Сертификатов", groups_count: "Групп", start_date: "Начало",
  end_date: "Окончание", issue_date: "Дата выдачи", expiry_date: "Действует до",
  certificate_number: "№ сертификата", status: "Статус", pinfl: "ПИНФЛ", position: "Должность",
  department: "Подразделение", instructor_name: "Инструктор", month: "Месяц", year: "Год",
  total_hours: "Часов", hours: "Часов", avg_grade: "Средний балл", percent: "%",
};

function humanizeKey(key: string): string {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function detectType(rows: any[], key: string): ColumnDef["type"] {
  let numeric = 0;
  let dates = 0;
  let seen = 0;
  for (const r of rows.slice(0, 50)) {
    const v = r[key];
    if (v === null || v === undefined || v === "") continue;
    seen++;
    if (typeof v === "number") numeric++;
    else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) dates++;
  }
  if (!seen) return "text";
  if (numeric === seen && !/(_id|^id|pinfl|year|code)$/i.test(key)) return "number";
  if (dates === seen) return "date";
  return "text";
}

export function buildArtifactFromRows(
  rows: any[],
  spec: {
    title?: string;
    description?: string;
    columns?: Record<string, string> | ColumnDef[];
    chart?: { type?: string; x?: string; y?: string | string[]; title?: string } | null;
  } = {},
): ReportArtifact {
  const keys = rows.length ? Object.keys(rows[0]).filter((k) => !/^(id|.*_id|uuid)$/i.test(k) || Object.keys(rows[0]).length <= 2) : [];

  const labelMap: Record<string, string> = {};
  if (Array.isArray(spec.columns)) {
    for (const c of spec.columns) if (c?.key) labelMap[c.key] = c.label;
  } else if (spec.columns && typeof spec.columns === "object") {
    Object.assign(labelMap, spec.columns);
  }

  const columns: ColumnDef[] = keys.map((key) => ({
    key,
    label: labelMap[key] || humanizeKey(key),
    type: detectType(rows, key),
  }));

  const numericCols = columns.filter((c) => c.type === "number");
  const labelCol = columns.find((c) => c.type === "text") || columns.find((c) => c.type === "date");

  let chartSuggestion: ReportArtifact["chartSuggestion"] = undefined;
  if (spec.chart !== null && numericCols.length && labelCol && rows.length > 1) {
    const yKeys = spec.chart?.y
      ? (Array.isArray(spec.chart.y) ? spec.chart.y : [spec.chart.y]).filter((k) => numericCols.some((c) => c.key === k))
      : [];
    const xKey = spec.chart?.x && columns.some((c) => c.key === spec.chart!.x) ? spec.chart.x : labelCol.key;
    const isTime = columns.find((c) => c.key === xKey)?.type === "date" || /month|year|date|period/i.test(xKey);
    const type = (["bar", "hbar", "line", "area", "doughnut", "pie"] as const).find((t) => t === spec.chart?.type)
      || (isTime ? "line" : rows.length <= 6 && numericCols.length === 1 ? "doughnut" : rows.length > 8 ? "hbar" : "bar");
    chartSuggestion = {
      type,
      xKey,
      yKey: yKeys[0] || numericCols[0]!.key,
      yKeys: yKeys.length ? yKeys : numericCols.slice(0, 3).map((c) => c.key),
      title: spec.chart?.title || spec.title,
    };
  }

  const summaryMetrics: ReportArtifact["summaryMetrics"] = [{ label: "Записей", value: rows.length }];
  if (numericCols.length && rows.length > 1) {
    const col = numericCols.find((c) => c.key === chartSuggestion?.yKey) || numericCols[0]!;
    const total = rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
    if (!/avg|percent|rate|средн/i.test(col.key + col.label)) {
      summaryMetrics.push({ label: `Всего: ${col.label}`, value: Math.round(total * 100) / 100 });
    }
    const max = rows.reduce((m, r) => (Number(r[col.key]) > Number(m[col.key]) ? r : m), rows[0]);
    if (labelCol) summaryMetrics.push({ label: "Максимум", value: `${max[labelCol.key]} (${max[col.key]})` });
  }

  return {
    title: spec.title || "Результат запроса",
    description: spec.description,
    columns,
    rows,
    summaryMetrics,
    chartSuggestion,
  };
}

/** Детерминированные выводы по таблице — мгновенно и без второго вызова LLM */
export function summarizeArtifact(artifact: ReportArtifact): string {
  const { rows, columns, chartSuggestion } = artifact;
  if (!rows.length) return "По запросу **ничего не найдено**. Попробуйте изменить условия.";
  const fmt = (n: number) => n.toLocaleString("ru-RU");
  const lines: string[] = [];
  const yKey = chartSuggestion?.yKey;
  const xKey = chartSuggestion?.xKey;
  const yCol = columns.find((c) => c.key === yKey);

  if (rows.length === 1 && columns.length <= 4) {
    lines.push(columns.map((c) => `**${c.label}:** ${formatValue(rows[0][c.key])}`).join("  \n"));
    return lines.join("\n");
  }

  lines.push(`Найдено **${fmt(rows.length)}** ${plural(rows.length, "запись", "записи", "записей")}.`);
  if (yKey && xKey && yCol) {
    const total = rows.reduce((s, r) => s + (Number(r[yKey]) || 0), 0);
    const sorted = [...rows].sort((a, b) => (Number(b[yKey]) || 0) - (Number(a[yKey]) || 0));
    const isAdditive = !/avg|percent|rate|средн/i.test(yKey + yCol.label);
    if (isAdditive && total > 0) lines.push(`Итого «${yCol.label}»: **${fmt(total)}**.`);
    lines.push("", "**Основные выводы:**");
    sorted.slice(0, 3).forEach((r, i) => {
      const v = Number(r[yKey]) || 0;
      const share = isAdditive && total > 0 ? ` (${Math.round((v / total) * 1000) / 10}%)` : "";
      lines.push(`${i + 1}. **${String(r[xKey] ?? "—").trim()}** — ${fmt(v)}${share}`);
    });
    if (sorted.length > 4) {
      const last = sorted[sorted.length - 1];
      lines.push(`- Наименьшее значение: ${String(last[xKey] ?? "—").trim()} — ${fmt(Number(last[yKey]) || 0)}`);
    }
  }
  return lines.join("\n");
}

function formatValue(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString("ru-RU");
  return String(v);
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function certificatesArtifact(certs: CertificateItem[], title: string): ReportArtifact {
  return {
    title,
    description: "Реестр выданных сертификатов",
    columns: [
      { key: "certificateNumber", label: "№ сертификата", type: "text" },
      { key: "studentName", label: "Слушатель", type: "text" },
      { key: "courseName", label: "Курс", type: "text" },
      { key: "organization", label: "Организация", type: "text" },
      { key: "issueDate", label: "Дата выдачи", type: "date" },
      { key: "expiryDate", label: "Действует до", type: "date" },
      { key: "statusLabel", label: "Статус", type: "text" },
    ],
    rows: certs.map((c) => ({ ...c, statusLabel: c.status === "revoked" ? "Отозван" : "Выдан" })),
    summaryMetrics: [
      { label: "Сертификатов", value: certs.length },
      { label: "Действующих", value: certs.filter((c) => c.status !== "revoked").length },
      { label: "Слушателей", value: new Set(certs.map((c) => c.studentId)).size },
    ],
    certificates: certs,
  };
}
