import OpenAI from "openai";
import { executeQuery } from "../db";
import { aiSettingsRepository } from "../../repositories/aiSettingsRepository";
import { storage } from "../storage";
import ExcelJS from "exceljs";
import PizZip from "pizzip";
import fs from "fs";
import path from "path";

// ============================================================================
// ИНТЕРФЕЙСЫ И ТИПЫ
// ============================================================================

export interface AgentStep {
  step: number;
  thought: string;
  action: string;
  input?: any;
  output?: any;
}

export interface SummaryMetric {
  label: string;
  value: string | number;
  change?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
}

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate?: string;
  status?: string;
}

export interface ReportArtifact {
  title: string;
  description?: string;
  columns: ColumnDef[];
  rows: Record<string, any>[];
  summaryMetrics?: SummaryMetric[];
  certificates?: CertificateItem[];
  chartSuggestion?: {
    type?: "bar" | "doughnut" | "line";
    xKey?: string;
    yKey?: string;
    title?: string;
  };
}

export interface ChatEngineResponse {
  reply: string;
  steps: AgentStep[];
  artifact: ReportArtifact | null;
  certificates?: CertificateItem[] | null;
  sqlExecuted: string | null;
}

export interface UserContext {
  userId: string;
  name?: string;
  role: string;
  organizationId?: string | null;
  organizationName?: string | null;
  canViewAll: boolean;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  sqlExecuted?: string;
}

// ============================================================================
// ТРАНСЛИТЕРАЦИЯ ДЛЯ ПОИСКА СЛУШАТЕЛЕЙ (КИРИЛЛИЦА <-> УЗБЕКСКАЯ ЛАТИНИЦА)
// ============================================================================

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

function normalizeText(raw: string): string {
  let out = "";
  for (const ch of String(raw || "").toLowerCase()) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  out = out.replace(/[ʻʼ'`’‘]/g, "");
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

function calcSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ============================================================================
// БЕЗОПАСНЫЙ SQL ВАЛИДАТОР (READ-ONLY ПЕСОЧНИЦА)
// ============================================================================

export function validateSafeSql(
  rawSql: string,
  userContext: UserContext
): { valid: boolean; error?: string; cleanSql: string } {
  let sql = String(rawSql || "").trim();

  // Удаляем завершающую точку с запятой
  sql = sql.replace(/;+\s*$/, "").trim();

  // Разрешаем только SELECT или WITH ... SELECT
  const isSelect = /^\s*(SELECT|WITH)\b/i.test(sql);
  if (!isSelect) {
    return {
      valid: false,
      error: "Запрещены любые модифицирующие запросы. Разрешены только SELECT.",
      cleanSql: "",
    };
  }

  // Запрет опасных деструктивных команд
  const dangerousKeywords = [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
    /\bRENAME\b/i,
    /\bCREATE\b/i,
    /\bREPLACE\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i,
    /\bINTO\s+OUTFILE\b/i,
    /\bINTO\s+DUMPFILE\b/i,
    /\bLOAD_FILE\b/i,
  ];

  for (const kw of dangerousKeywords) {
    if (kw.test(sql)) {
      return {
        valid: false,
        error: "Запрос содержит недопустимую или опасную команду модификации данных.",
        cleanSql: "",
      };
    }
  }

  // Запрет доступа к системным секретам и паролям
  const forbiddenTables = [
    /\bai_settings\b/i,
    /\bai_providers\b/i,
    /\bsystem_settings\b/i,
    /\bpassword_hash\b/i,
  ];

  for (const ft of forbiddenTables) {
    if (ft.test(sql)) {
      return {
        valid: false,
        error: "Доступ к секретным системным конфигурациям или хешам паролей строго запрещен политикой безопасности.",
        cleanSql: "",
      };
    }
  }

  // Запрет прямого чтения тяжелого поля photo_base64
  if (/\bphoto_base64\b/i.test(sql) && !/\b(IS\s+NOT\s+NULL|IS\s+NULL|LENGTH|COUNT)\b/i.test(sql)) {
    // Заменяем прямое чтение photo_base64 на проверку наличия
    sql = sql.replace(/\bphoto_base64\b/gi, "(photo_base64 IS NOT NULL AND photo_base64 != '') AS has_photo");
  }

  // Ограничение LIMIT
  if (!/\bLIMIT\b/i.test(sql)) {
    sql += " LIMIT 100";
  }

  return { valid: true, cleanSql: sql };
}

// ============================================================================
// СИСТЕМНЫЙ ПРОМПТ СО СХЕМОЙ БАЗЫ ДАННЫХ ATC PLATFORM
// ============================================================================

function buildSystemPrompt(userContext: UserContext): string {
  const orgNotice = userContext.canViewAll
    ? "У тебя ПОЛНЫЙ доступ ко всем организациям, курсам и слушателям платформы (права Администратора)."
    : `ВНИМАНИЕ: Пользователь привязан к организации ID: "${userContext.organizationId}" (${userContext.organizationName || "Своя организация"}).
       Во ВСЕХ SQL-запросах к таблицам со связью с организацией (students, training_requests, groups и т.д.) ты ОБЯЗАН добавлять условие:
       organization_id = '${userContext.organizationId}'. Доступ к чужим организациям СТРОГО ЗАПРЕЩЕН.`;

  return `Ты — ведущий ИИ-Аналитик и Архитектор данных системы ATC Platform (Авиационный Учебный Центр).
Твоя цель — помогать сотрудникам учебного центра: анализировать данные, строить SQL-выборки, отвечать на вопросы, инспектировать учебные файлы и формировать интерактивные отчеты (артефакты).

${orgNotice}

=== СХЕМА БАЗЫ ДАННЫХ (MySQL) ===
1. students (id, pinfl, full_name, organization, organization_id, department, position, birth_date, has_photo)
   - Слушатели курсов. ФИО в основном на узбекской латинице или кириллице (например, JUMABAYEV ANVAR).
   - ВАЖНО ПРО ФОТО: поле photo_base64 хранит фотографии. ЗАПРЕЩЕНО извлекать само base64. Для проверки наличия используй (photo_base64 IS NOT NULL).
   - Чтобы сослаться на фото слушателя, используй URL: /api/students/:id/photo
2. organizations (id, code, inn, name, name_uz, name_ru, contact_phone, contact_person, address, is_active, students_count)
   - Авиакомпании, аэропорты, филиалы и сторонние организации.
3. courses (id, name, name_uz, short_name, code, description, total_hours, course_type, is_active)
   - Учебные программы и курсы (например, Авиационная безопасность, Переподготовка).
4. disciplines (id, course_id, name, short_name, hours, theory_hours, practice_hours, assessment_hours, order_index)
   - Дисциплины (предметы) внутри курса.
5. instructors (id, full_name, email, phone, hire_date, max_hours, is_active)
   - Преподаватели / Инструкторы учебного центра.
6. groups (id, name, course_id, instructor_id, start_date, end_date, status, max_students)
   - Учебные группы. status: 'planning', 'in_progress', 'completed', 'cancelled'.
7. group_students (id, group_id, student_id, status)
   - Слушатели, зачисленные в конкретную группу.
8. issued_certificates (id, certificate_number, student_id, group_id, issue_date, status, pdf_file_url, docx_file_url)
   - Выданные официальные сертификаты слушателям.
   - status: 'issued', 'revoked'.
   - ВАЖНО: При запросе сертификатов ВСЕГДА делай JOIN с таблицей students (s.full_name) и courses (c.name) и выбирай ic.id, ic.certificate_number, s.full_name as student_name, c.name as course_name, ic.issue_date!
   - В ответе action: "final_answer" обязательно заполняй поле "certificates": [ { "id": "...", "certificateNumber": "...", "studentName": "...", "courseName": "...", "issueDate": "..." } ], чтобы в интерфейсе появились кнопки скачивания PDF и единого архива ZIP!
9. files (id, uuid, filename, mime_type, size_bytes, extension, category, user_id, course_id, group_id, created_at)
   - Реестр загруженных файлов, приказов, учебных планов и методических материалов.
10. attendance (id, group_id, student_id, date, status)
    - Посещаемость занятий (status: 'present', 'absent', 'late', 'excused').
11. training_requests (id, organization_id, course_id, requested_slots, status, created_at)
    - Заявки организаций на обучение своих сотрудников.
12. library_books (id, title, author, year, category, is_available)
    - Библиотечный фонд учебного центра.

=== ДОСТУПНЫЕ ИНСТРУМЕНТЫ (REACT АГЕНТ) ===
Ты работаешь в пошаговом цикле Reasoning + Action. На каждом шаге ты отправляешь СТРОГО один JSON-объект.

1. "execute_sql" — выполнить безопасный SELECT-запрос к MySQL:
{
  "thought": "Для ответа на вопрос подсчитаю количество завершенных групп за текущий год...",
  "action": "execute_sql",
  "actionInput": {
    "sql": "SELECT c.name AS course_name, COUNT(g.id) AS groups_count FROM groups g JOIN courses c ON g.course_id = c.id WHERE g.status = 'completed' GROUP BY c.name ORDER BY groups_count DESC LIMIT 20;"
  }
}

2. "resolve_students_by_names" — нечеткий поиск слушателей по списку ФИО или инициалов:
{
  "thought": "Пользователь прислал список фамилий. Ищу их в базе слушателей...",
  "action": "resolve_students_by_names",
  "actionInput": {
    "names": ["Каримов А.Б.", "Юсупов Шерзод"]
  }
}

3. "search_files" — поиск файлов в системе по названию или категории:
{
  "thought": "Ищу файлы по запросу 'учебный план'...",
  "action": "search_files",
  "actionInput": {
    "query": "план",
    "category": "program",
    "limit": 10
  }
}

4. "read_file_content" — прочитать содержимое текстового файла или выжимку Excel:
{
  "thought": "Читаю строки из загруженного Excel-файла с заявкой...",
  "action": "read_file_content",
  "actionInput": {
    "fileUuid": "abc-123-uuid",
    "filename": "список_слушателей.xlsx"
  }
}

5. "final_answer" — финальный ответ пользователю с текстом и опциональным артефактом:
{
  "thought": "Все данные собраны. Формирую подробный ответ и сводную таблицу для Canvas.",
  "action": "final_answer",
  "reply": "Твой подробный, вежливый и структурированный ответ на русском языке с выводами и аналитикой.",
  "artifact": {
    "title": "Сводка по учебным группам",
    "description": "Распределение групп по курсам и статусам",
    "summaryMetrics": [
      { "label": "Всего групп", "value": "24" },
      { "label": "Активных сейчас", "value": "6" }
    ],
    "columns": [
      { "key": "course_name", "label": "Курс", "type": "text" },
      { "key": "groups_count", "label": "Количество групп", "type": "number" }
    ],
    "rows": [
      { "course_name": "Авиационная безопасность", "groups_count": 12 },
      { "course_name": "Переподготовка диспетчеров", "groups_count": 8 }
    ],
    "chartSuggestion": {
      "type": "bar",
      "xKey": "course_name",
      "yKey": "groups_count",
      "title": "Количество групп по курсам"
    }
  }
}

=== ВАЖНЫЕ ПРАВИЛА ПОВЕДЕНИЯ ===
1. Если пользователь просто здоровается, задает теоретический вопрос или спрашивает о возможностях системы — СРАЗУ выдавай action: "final_answer" с artifact: null БЕЗ вызова SQL!
2. Если вопрос касается ранее выданной таблицы в диалоге ("кто на первом месте?", "посчитай сумму", "поясни вывод") — отвечай СРАЗУ из контекста БЕЗ повторных SQL-запросов!
3. Если формируешь выборку данных — всегда делай понятные заголовки колонок на русском языке в "artifact".
4. Всегда отвечай строго валидным JSON без лишнего обрамления Markdown, чтобы парсер мог обработать ответ.`;
}

// ============================================================================
// ПОЛУЧЕНИЕ AI КЛИЕНТА
// ============================================================================

async function getAIClient(
  targetSettingId?: string,
  overrideModel?: string
): Promise<{
  client: OpenAI;
  model: string;
  settingId: string | null;
}> {
  try {
    let dbSettings: any = null;
    if (targetSettingId && targetSettingId !== "env_default") {
      dbSettings = await aiSettingsRepository.getById(targetSettingId);
    }
    if (!dbSettings) {
      dbSettings = await aiSettingsRepository.getDefault();
    }
    if (dbSettings && dbSettings.isActive) {
      const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(dbSettings.id);
      if (decryptedKey) {
        const client = new OpenAI({
          apiKey: decryptedKey,
          baseURL: dbSettings.baseUrl || undefined,
        });
        return {
          client,
          model: overrideModel || dbSettings.textModel || "gpt-4o-mini",
          settingId: dbSettings.id,
        };
      }
    }
  } catch (err: any) {
    console.warn("⚠️ AI Settings из БД недоступны, переключаемся на .env:", err.message);
  }

  const apiKey = process.env.OPENAI_API_KEY || "";
  const useOpenRouter = process.env.USE_OPENROUTER === "true";
  const client = new OpenAI({
    apiKey: apiKey || "dummy_key",
    baseURL: useOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
  });

  return {
    client,
    model: overrideModel || process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
    settingId: null,
  };
}

// ============================================================================
// ИСПОЛНЕНИЕ ДЕЙСТВИЙ (TOOLS)
// ============================================================================

async function executeSqlTool(
  sql: string,
  userContext: UserContext
): Promise<{ success: boolean; data?: any[]; error?: string; rowCount?: number }> {
  const validation = validateSafeSql(sql, userContext);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const rows = await executeQuery<any[]>(validation.cleanSql);
    return {
      success: true,
      data: rows,
      rowCount: Array.isArray(rows) ? rows.length : 0,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка исполнения SQL в MySQL: ${error.message}`,
    };
  }
}

async function resolveStudentsTool(
  names: string[],
  userContext: UserContext
): Promise<any[]> {
  if (!Array.isArray(names) || !names.length) return [];

  const results: any[] = [];

  for (const rawName of names) {
    const norm = normalizeText(rawName);
    const tokens = norm.split(" ").filter((t) => t.length >= 2);
    if (!tokens.length) continue;

    const firstToken = tokens[0];
    let sql = `
      SELECT s.id, s.pinfl, s.full_name, s.position, s.department, o.name AS organization_name
      FROM students s
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE s.full_name LIKE ?
    `;
    const params: any[] = [`%${firstToken}%`];

    if (!userContext.canViewAll && userContext.organizationId) {
      sql += " AND s.organization_id = ?";
      params.push(userContext.organizationId);
    }

    sql += " LIMIT 10";

    const candidates = await executeQuery<any[]>(sql, params);
    const scored = candidates.map((c) => {
      const cNorm = normalizeText(c.full_name);
      const sim = calcSimilarity(norm, cNorm);
      return {
        ...c,
        confidence: Math.round(sim * 100),
      };
    });

    scored.sort((a, b) => b.confidence - a.confidence);

    results.push({
      query: rawName,
      matches: scored.slice(0, 3),
    });
  }

  return results;
}

async function searchFilesTool(
  params: { query?: string; category?: string; limit?: number },
  userContext: UserContext
): Promise<any[]> {
  const { query = "", category = "", limit = 10 } = params;

  let sql = `
    SELECT f.id, f.uuid, f.filename, f.mime_type, f.size_bytes, f.extension, f.category, f.created_at, f.metadata
    FROM files f
    WHERE f.deleted_at IS NULL
  `;
  const sqlParams: any[] = [];

  if (query) {
    sql += " AND f.filename LIKE ?";
    sqlParams.push(`%${query}%`);
  }

  if (category) {
    sql += " AND f.category = ?";
    sqlParams.push(category);
  }

  sql += " ORDER BY f.created_at DESC LIMIT ?";
  sqlParams.push(Math.min(limit, 30));

  try {
    const files = await executeQuery<any[]>(sql, sqlParams);
    return files.map((f) => ({
      uuid: f.uuid,
      filename: f.filename,
      category: f.category,
      extension: f.extension,
      sizeBytes: f.size_bytes,
      createdAt: f.created_at,
    }));
  } catch (err: any) {
    return [{ error: err.message }];
  }
}

async function readFileContentTool(
  params: { fileUuid?: string; filename?: string }
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    let fileRecord: any = null;

    if (params.fileUuid) {
      const rows = await executeQuery<any[]>(
        "SELECT * FROM files WHERE uuid = ? AND deleted_at IS NULL LIMIT 1",
        [params.fileUuid]
      );
      fileRecord = rows[0];
    } else if (params.filename) {
      const rows = await executeQuery<any[]>(
        "SELECT * FROM files WHERE filename LIKE ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1",
        [`%${params.filename}%`]
      );
      fileRecord = rows[0];
    }

    if (!fileRecord) {
      return { success: false, error: "Файл не найден в реестре файлов" };
    }

    const uuid = fileRecord.uuid;
    const ext = (fileRecord.extension || "").toLowerCase().replace(".", "");

    // Проверяем существование файла через LocalStorage
    const diskPath = (storage as any).getFilePath?.(uuid);
    if (!diskPath || !fs.existsSync(diskPath)) {
      return {
        success: false,
        error: `Файл ${fileRecord.filename} зарегистрирован в БД, но отсутствует на диске хранилища`,
      };
    }

    // Обработка текстовых файлов (.txt, .json, .csv, .md)
    if (["txt", "json", "csv", "md", "log"].includes(ext)) {
      const text = fs.readFileSync(diskPath, "utf-8");
      return {
        success: true,
        content: text.slice(0, 8000) + (text.length > 8000 ? "\n... (текст обрезан)" : ""),
      };
    }

    // Обработка Excel файлов (.xlsx, .xls)
    if (ext === "xlsx" || ext === "xls") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(diskPath);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return { success: true, content: "Excel-файл пуст (нет листов)" };
      }

      const rows: string[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 30) {
          const values = Array.isArray(row.values)
            ? row.values.slice(1).map((v) => String(v ?? "")).join(" | ")
            : String(row.values ?? "");
          rows.push(`Строка ${rowNumber}: ${values}`);
        }
      });

      return {
        success: true,
        content: `Лист "${worksheet.name}" (всего строк: ${worksheet.rowCount}):\n` + rows.join("\n"),
      };
    }

    // Обработка DOCX файлов
    if (ext === "docx") {
      const content = fs.readFileSync(diskPath, "binary");
      const zip = new PizZip(content);
      const docXml = zip.file("word/document.xml")?.asText();
      if (docXml) {
        const text = docXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return {
          success: true,
          content: text.slice(0, 6000) + (text.length > 6000 ? "\n... (документ обрезан)" : ""),
        };
      }
    }

    return {
      success: true,
      content: `Файл "${fileRecord.filename}", размер: ${fileRecord.size_bytes} байт, категория: ${fileRecord.category}. Для данного типа файла доступен просмотр метаданных.`,
    };
  } catch (err: any) {
    return { success: false, error: `Ошибка чтения файла: ${err.message}` };
  }
}

// ============================================================================
// ГЛАВНЫЙ REACT ЦИКЛ (AI CHAT ENGINE)
// ============================================================================

export async function processAiChatMessage(params: {
  userMessage: string;
  userContext: UserContext;
  history?: ChatHistoryMessage[];
  fileAttachmentUuid?: string;
  settingId?: string;
  modelOverride?: string;
  effort?: "low" | "medium" | "high";
}): Promise<ChatEngineResponse> {
  const { userMessage, userContext, history = [], fileAttachmentUuid, settingId: requestedSettingId, modelOverride, effort = "medium" } = params;
  const { client, model, settingId } = await getAIClient(requestedSettingId, modelOverride);
  const chosenModel = model;

  const systemPrompt = buildSystemPrompt(userContext);

  // Формируем историю диалога
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  // Добавляем последние 6 сообщений из истории для контекста
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    messages.push({
      role: h.role,
      content: h.sqlExecuted ? `${h.content}\n[Выполненный SQL: ${h.sqlExecuted}]` : h.content,
    });
  }

  // Если прикреплен файл, добавляем метаданные файла в запрос
  let fullPrompt = userMessage;
  if (fileAttachmentUuid) {
    const fileInfo = await readFileContentTool({ fileUuid: fileAttachmentUuid });
    if (fileInfo.success && fileInfo.content) {
      fullPrompt += `\n\n[Прикрепленный файл (содержимое)]:\n${fileInfo.content}`;
    }
  }

  messages.push({ role: "user", content: fullPrompt });

  const steps: AgentStep[] = [];
  let lastExecutedSql: string | null = null;
  const MAX_ITERATIONS = effort === "low" ? 2 : effort === "high" ? 8 : 4;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    const completion = await client.chat.completions.create({
      model: chosenModel,
      messages,
      temperature: effort === "high" ? 0.3 : 0.1,
      response_format: { type: "json_object" },
    });

    if (completion.usage) {
      totalPromptTokens += completion.usage.prompt_tokens || 0;
      totalCompletionTokens += completion.usage.completion_tokens || 0;
    }

    const rawResponse = completion.choices[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // Пытаемся извлечь JSON регуляркой
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = {
          action: "final_answer",
          reply: rawResponse,
          artifact: null,
        };
      }
    }

    const action = parsed.action || "final_answer";
    const thought = parsed.thought || "";
    const actionInput = parsed.actionInput || {};

    // 1. Финальный ответ
    if (action === "final_answer") {
      // Логируем использование токенов
      if (settingId && (totalPromptTokens > 0 || totalCompletionTokens > 0)) {
        try {
          const totalTokens = totalPromptTokens + totalCompletionTokens;
          await aiSettingsRepository.logTokenUsage({
            settingId,
            operationType: "text",
            model,
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens,
            costUsd: 0,
            userId: userContext.userId,
            status: "success",
          });
        } catch (logErr) {
          console.error("Ошибка логирования токенов AI:", logErr);
        }
      }

      const certs = parsed.certificates || parsed.artifact?.certificates || null;

      return {
        reply: parsed.reply || "Готово.",
        steps,
        artifact: parsed.artifact || null,
        certificates: certs,
        sqlExecuted: lastExecutedSql,
      };
    }

    // 2. Выполнение SQL
    if (action === "execute_sql") {
      const sqlToRun = actionInput.sql || "";
      lastExecutedSql = sqlToRun;

      const sqlResult = await executeSqlTool(sqlToRun, userContext);
      steps.push({
        step: iteration,
        thought,
        action,
        input: { sql: sqlToRun },
        output: sqlResult.success
          ? { rowCount: sqlResult.rowCount, sample: (sqlResult.data || []).slice(0, 5) }
          : { error: sqlResult.error },
      });

      // Передаем результат обратно агенту
      messages.push({
        role: "assistant",
        content: JSON.stringify(parsed),
      });
      messages.push({
        role: "user",
        content: `[Результат выполнения execute_sql]: ${JSON.stringify(sqlResult)}`,
      });
      continue;
    }

    // 3. Нечеткий поиск слушателей
    if (action === "resolve_students_by_names") {
      const names = actionInput.names || [];
      const resolveResult = await resolveStudentsTool(names, userContext);

      steps.push({
        step: iteration,
        thought,
        action,
        input: { names },
        output: resolveResult,
      });

      messages.push({
        role: "assistant",
        content: JSON.stringify(parsed),
      });
      messages.push({
        role: "user",
        content: `[Результат выполнения resolve_students_by_names]: ${JSON.stringify(resolveResult)}`,
      });
      continue;
    }

    // 4. Поиск файлов
    if (action === "search_files") {
      const filesResult = await searchFilesTool(actionInput, userContext);

      steps.push({
        step: iteration,
        thought,
        action,
        input: actionInput,
        output: filesResult,
      });

      messages.push({
        role: "assistant",
        content: JSON.stringify(parsed),
      });
      messages.push({
        role: "user",
        content: `[Результат выполнения search_files]: ${JSON.stringify(filesResult)}`,
      });
      continue;
    }

    // 5. Чтение файла
    if (action === "read_file_content") {
      const readResult = await readFileContentTool(actionInput);

      steps.push({
        step: iteration,
        thought,
        action,
        input: actionInput,
        output: readResult.success
          ? { length: readResult.content?.length, preview: readResult.content?.slice(0, 200) }
          : { error: readResult.error },
      });

      messages.push({
        role: "assistant",
        content: JSON.stringify(parsed),
      });
      messages.push({
        role: "user",
        content: `[Результат выполнения read_file_content]: ${JSON.stringify(readResult)}`,
      });
      continue;
    }

    // Неизвестное действие — принудительный final_answer
    break;
  }

  // Если превысили лимит шагов
  return {
    reply: "Запрос обработан, но превышено максимальное количество шагов рассуждения. Пожалуйста, уточните ваш вопрос.",
    steps,
    artifact: null,
    sqlExecuted: lastExecutedSql,
  };
}
