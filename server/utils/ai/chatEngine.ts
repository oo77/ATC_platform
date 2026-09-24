import OpenAI from "openai";
import { executeQuery } from "../db";
import { aiSettingsRepository } from "../../repositories/aiSettingsRepository";
import { storage } from "../storage";
import ExcelJS from "exceljs";
import PizZip from "pizzip";
import fs from "fs";
import type {
  AgentStep,
  ChatEngineResponse,
  ChatHistoryMessage,
  ReportArtifact,
  UserContext,
} from "./chatTypes";
import {
  executeSafeSql,
  rowsToCompactText,
  buildArtifactFromRows,
  summarizeArtifact,
  findStudents,
  findCertificates,
  certificatesArtifact,
  searchFiles,
} from "./chatTools";
import { tryFastPath } from "./chatFastPath";

export type {
  AgentStep,
  SummaryMetric,
  ColumnDef,
  CertificateItem,
  StudentCard,
  ReportArtifact,
  ChatEngineResponse,
  UserContext,
  ChatHistoryMessage,
} from "./chatTypes";

/** Запрос остановлен пользователем */
export class ChatAbortedError extends Error {
  constructor() {
    super("Запрос остановлен пользователем");
    this.name = "ChatAbortedError";
  }
}

/** Событие прогресса для потоковой (SSE) выдачи в интерфейс */
export type ChatProgressEvent =
  | { type: "status"; text: string }
  | { type: "step"; step: AgentStep };

// ============================================================================
// СИСТЕМНЫЙ ПРОМПТ: компактная и ТОЧНАЯ схема БД (сверена с information_schema).
// Неверная схема была главной причиной медленных ответов: модель писала SQL к
// несуществующим таблицам и тратила лишние шаги на исправление ошибок.
// ============================================================================

const SCHEMA = `students(id, full_name, pinfl, organization /*текст*/, organization_id, department, position, birth_date, photo_base64 /*не выбирать*/, created_at)
organizations(id, code, name, name_ru, name_uz, inn, contact_person, contact_phone, is_active)
courses(id, name, name_uz, short_name, code, course_type ENUM('КПП','КПК'), total_hours, certificate_validity_months, is_active, is_archived)
disciplines(id, course_id, name, short_name, hours, theory_hours, practice_hours, assessment_hours, order_index)
instructors(id, full_name, email, phone, hire_date, max_hours, is_active)
discipline_instructors(discipline_id, instructor_id, is_primary)
study_groups(id, code /*номер группы*/, course_id, start_date, end_date, classroom, is_active, is_archived)  -- статуса нет: активна = start_date<=CURDATE()<=end_date; завершена = end_date<CURDATE()
study_group_students(id, group_id, student_id, enrolled_at)
schedule_events(id, group_id, discipline_id, instructor_id, title, start_time, end_time, academic_hours, event_type ENUM('theory','practice','assessment','other'))
attendance(id, student_id, schedule_event_id, hours_attended, max_hours)
grades(id, student_id, schedule_event_id, grade)
final_grades(id, student_id, group_id, discipline_id, final_grade, attendance_percent, status ENUM('in_progress','passed','failed','not_allowed'))
issued_certificates(id, certificate_number, student_id, group_id, course_name, course_code, course_hours, group_code, issue_date, expiry_date, status ENUM('issued','revoked'), source_type, pdf_file_url)
training_requests(id, organization_id, total_students_count, status ENUM('pending','approved','rejected','in_progress','completed'), contract_status, payment_status, created_at)
test_sessions(id, student_id, assignment_id, status, score_percent, passed, grade, is_preview, started_at, completed_at)
files(id, uuid, filename, category, extension, size_bytes, group_id, created_at, deleted_at)
books(id, title, author, category, published_year, language, is_published, deleted_at)  -- библиотека
users(id, role ENUM('ADMIN','MANAGER','TEACHER','STUDENT'), name, email)`;

function buildSystemPrompt(userContext: UserContext, effort: string): string {
  const scope = userContext.canViewAll
    ? "Доступ: все организации (администратор)."
    : `Доступ ТОЛЬКО к организации '${userContext.organizationId}' (${userContext.organizationName || "своя"}). В КАЖДОМ SQL обязателен фильтр students.organization_id = '${userContext.organizationId}' (или organization_id той же таблицы). Иначе запрос будет отклонён.`;

  return `Ты — ИИ-аналитик учебного центра ATC Platform (авиационный учебный центр). Отвечай по-русски (или на языке вопроса), кратко и по делу. ${scope}
Сегодня: ${new Date().toISOString().slice(0, 10)}. СУБД: MariaDB/MySQL.

СХЕМА:
${SCHEMA}
Связи: students.organization_id→organizations.id; study_groups.course_id→courses.id; study_group_students(group_id,student_id); issued_certificates.student_id→students.id, .group_id→study_groups.id.

Ответ — СТРОГО один JSON-объект без markdown-обёртки. Действия:
1) {"action":"report","sql":"SELECT ...","title":"...","columns":{"col":"Заголовок"},"chart":{"type":"bar|hbar|line|area|doughnut|pie","x":"col","y":"col"},"reply":"1 предложение-вступление"}
   — ГЛАВНОЕ действие для любых выборок, списков, статистики. Сервер сам выполнит SQL, построит таблицу, график и выводы. НЕ переписывай строки данных.
2) {"action":"query","sql":"SELECT ..."} — если нужно сначала посмотреть данные, чтобы ответить словами (одно число, уточнение id). Вернётся компактная выборка.
3) {"action":"find_students","query":"ФИО | фамилия | ПИНФЛ"} — поиск слушателя (нечёткий, кириллица/латиница). Показывает карточки со сертификатами и группами.
4) {"action":"find_certificates","student":"ФИО?","number":"№?","course":"курс?","organization":"орг?","status":"issued|revoked?","dateFrom":"YYYY-MM-DD?","dateTo":"YYYY-MM-DD?","expiringWithinDays":30?}
   — поиск сертификатов с кнопками скачивания PDF/ZIP. Используй его для ЛЮБЫХ вопросов про конкретные сертификаты.
5) {"action":"search_files","query":"...","category":"..."} / {"action":"read_file","fileUuid":"..."}
6) {"action":"answer","reply":"текст в markdown"} — финальный текстовый ответ (приветствие, пояснение, ответ по ранее показанным данным, число из query).

ПРАВИЛА:
- Стремись ответить за ОДИН шаг: сразу "report", "find_students" или "find_certificates".
- SQL: только SELECT; используй алиасы-колонки на английском snake_case; агрегируй (COUNT/SUM/GROUP BY) вместо выгрузки сырых строк; LIMIT ≤ 500; не выбирай id-колонки, если они не нужны.
- Для графика: x — текстовая/датовая колонка, y — числовая. Временные ряды — line, доли (≤6 категорий) — doughnut, длинные подписи — hbar.
- Вопрос по уже показанной таблице или общий вопрос — сразу "answer" без SQL.
- В "reply" используй markdown: **жирный**, списки "- ".${effort === "high" ? "" : "\n- Не пиши поле thought."}`;
}

// ============================================================================
// AI-клиент (кэшируется: без запроса к БД и расшифровки ключа на каждое сообщение)
// ============================================================================

const CLIENT_TTL_MS = 5 * 60_000;
const clientCache = new Map<string, { at: number; value: { client: OpenAI; model: string; settingId: string | null } }>();
const noReasoningParam = new Set<string>();

async function getAIClient(targetSettingId?: string, overrideModel?: string) {
  const cacheKey = `${targetSettingId || "default"}|${overrideModel || ""}`;
  const hit = clientCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CLIENT_TTL_MS) return hit.value;

  let value: { client: OpenAI; model: string; settingId: string | null } | null = null;
  try {
    let dbSettings: any = null;
    if (targetSettingId && targetSettingId !== "env_default") {
      dbSettings = await aiSettingsRepository.getById(targetSettingId);
    }
    if (!dbSettings) dbSettings = await aiSettingsRepository.getDefault();
    if (dbSettings && dbSettings.isActive) {
      const decryptedKey = await aiSettingsRepository.getDecryptedApiKey(dbSettings.id);
      if (decryptedKey) {
        value = {
          client: new OpenAI({ apiKey: decryptedKey, baseURL: dbSettings.baseUrl || undefined, timeout: 60_000, maxRetries: 1 }),
          model: overrideModel || dbSettings.textModel || "gpt-4o-mini",
          settingId: dbSettings.id,
        };
      }
    }
  } catch (err: any) {
    console.warn("⚠️ AI Settings из БД недоступны, переключаемся на .env:", err.message);
  }

  if (!value) {
    const useOpenRouter = process.env.USE_OPENROUTER === "true";
    value = {
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "dummy_key",
        baseURL: useOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
        timeout: 60_000,
        maxRetries: 1,
      }),
      model: overrideModel || process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
      settingId: null,
    };
  }
  clientCache.set(cacheKey, { at: Date.now(), value });
  return value;
}

/** Сбросить кэш клиентов (после изменения AI-настроек) */
export function invalidateAiClientCache() {
  clientCache.clear();
}

/**
 * «Думающие» модели (Gemini 2.5+/3.x, o-серия, gpt-5, reasoner) по умолчанию тратят секунды
 * на скрытые рассуждения. Для SQL-агента это не нужно — снижаем глубину рассуждений.
 */
function reasoningEffortFor(model: string, effort: string): "low" | "medium" | "high" | undefined {
  const m = model.toLowerCase();
  if (noReasoningParam.has(m)) return undefined;
  const isThinking = /gemini-(2\.5|[3-9])|\bo[1-9]|gpt-5|reason|thinking/.test(m);
  if (!isThinking) return undefined;
  return effort === "high" ? "medium" : "low";
}

async function callModel(
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  opts: { effort: string; json: boolean; maxTokens?: number; signal?: AbortSignal },
) {
  const reasoning = reasoningEffortFor(model, opts.effort);
  const body: any = {
    model,
    messages,
    temperature: 0.1,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    ...(opts.maxTokens && !reasoning ? { max_tokens: opts.maxTokens } : {}),
    ...(reasoning ? { reasoning_effort: reasoning } : {}),
  };
  try {
    return await client.chat.completions.create(body, { signal: opts.signal });
  } catch (err: any) {
    // Провайдер не поддерживает reasoning_effort / temperature — повторяем без них и запоминаем
    if (reasoning && err?.status === 400) {
      noReasoningParam.add(model.toLowerCase());
      delete body.reasoning_effort;
      return await client.chat.completions.create(body, { signal: opts.signal });
    }
    throw err;
  }
}

function parseModelJson(raw: string): any {
  const text = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fallthrough */
      }
    }
    return { action: "answer", reply: text };
  }
}

// ============================================================================
// Чтение файлов
// ============================================================================

async function readFileContentTool(params: { fileUuid?: string; filename?: string }): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    let fileRecord: any = null;
    if (params.fileUuid) {
      const rows = await executeQuery<any[]>(
        "SELECT uuid, filename, extension, size_bytes, category FROM files WHERE uuid = ? AND deleted_at IS NULL LIMIT 1",
        [params.fileUuid],
      );
      fileRecord = rows[0];
    } else if (params.filename) {
      const rows = await executeQuery<any[]>(
        "SELECT uuid, filename, extension, size_bytes, category FROM files WHERE filename LIKE ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1",
        [`%${params.filename}%`],
      );
      fileRecord = rows[0];
    }
    if (!fileRecord) return { success: false, error: "Файл не найден в реестре файлов" };

    const ext = (fileRecord.extension || "").toLowerCase().replace(".", "");
    const diskPath = (storage as any).getFilePath?.(fileRecord.uuid);
    if (!diskPath || !fs.existsSync(diskPath)) {
      return { success: false, error: `Файл ${fileRecord.filename} отсутствует на диске хранилища` };
    }

    if (["txt", "json", "csv", "md", "log"].includes(ext)) {
      const text = fs.readFileSync(diskPath, "utf-8");
      return { success: true, content: text.slice(0, 8000) + (text.length > 8000 ? "\n... (текст обрезан)" : "") };
    }

    if (ext === "xlsx" || ext === "xls") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(diskPath);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return { success: true, content: "Excel-файл пуст (нет листов)" };
      const rows: string[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 40) {
          const values = Array.isArray(row.values)
            ? row.values.slice(1).map((v) => String(v ?? "")).join(" | ")
            : String(row.values ?? "");
          rows.push(`${rowNumber}: ${values}`);
        }
      });
      return { success: true, content: `Лист "${worksheet.name}" (строк: ${worksheet.rowCount}):\n` + rows.join("\n") };
    }

    if (ext === "docx") {
      const zip = new PizZip(fs.readFileSync(diskPath, "binary"));
      const docXml = zip.file("word/document.xml")?.asText();
      if (docXml) {
        const text = docXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return { success: true, content: text.slice(0, 6000) + (text.length > 6000 ? "\n... (документ обрезан)" : "") };
      }
    }

    return {
      success: true,
      content: `Файл "${fileRecord.filename}", размер: ${fileRecord.size_bytes} байт, категория: ${fileRecord.category}. Доступны только метаданные.`,
    };
  } catch (err: any) {
    return { success: false, error: `Ошибка чтения файла: ${err.message}` };
  }
}

// ============================================================================
// ГЛАВНЫЙ ЦИКЛ
// ============================================================================

export async function processAiChatMessage(params: {
  userMessage: string;
  userContext: UserContext;
  history?: ChatHistoryMessage[];
  lastArtifact?: ReportArtifact | null;
  fileAttachmentUuid?: string;
  settingId?: string;
  modelOverride?: string;
  effort?: "low" | "medium" | "high";
  onProgress?: (e: ChatProgressEvent) => void;
  /** Отмена пользователем (клиент закрыл соединение / нажал «Стоп») */
  signal?: AbortSignal;
}): Promise<ChatEngineResponse> {
  const started = Date.now();
  const {
    userMessage,
    userContext,
    history = [],
    lastArtifact,
    fileAttachmentUuid,
    settingId: requestedSettingId,
    modelOverride,
    effort = "medium",
    onProgress,
    signal,
  } = params;
  const throwIfAborted = () => {
    if (signal?.aborted) throw new ChatAbortedError();
  };
  const emit = (e: ChatProgressEvent) => {
    try {
      onProgress?.(e);
    } catch {
      /* клиент мог отключиться */
    }
  };

  // --- 1. Быстрый путь без LLM ---
  if (!fileAttachmentUuid) {
    try {
      const fast = await tryFastPath(userMessage, userContext);
      if (fast) {
        fast.steps.forEach((s) => emit({ type: "step", step: s }));
        return { ...fast, meta: { durationMs: Date.now() - started, llmCalls: 0, fastPath: true } };
      }
    } catch (err: any) {
      console.warn("[AI chat] fast path failed, fallback to LLM:", err.message);
    }
  }

  // --- 2. ReAct-агент ---
  emit({ type: "status", text: "Анализирую вопрос…" });
  const { client, model, settingId } = await getAIClient(requestedSettingId, modelOverride);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(userContext, effort) },
  ];
  for (const h of history.slice(-6)) {
    const content = h.content.length > 700 ? h.content.slice(0, 700) + "…" : h.content;
    messages.push({ role: h.role, content: h.sqlExecuted ? `${content}\n[SQL: ${h.sqlExecuted.slice(0, 400)}]` : content });
  }

  let prompt = userMessage;
  if (lastArtifact?.rows?.length) {
    prompt = `[Ранее показанная таблица «${lastArtifact.title}»]\n${rowsToCompactText(lastArtifact.rows, 15)}\n\n[Вопрос]: ${userMessage}`;
  }
  if (fileAttachmentUuid) {
    emit({ type: "status", text: "Читаю прикреплённый файл…" });
    const fileInfo = await readFileContentTool({ fileUuid: fileAttachmentUuid });
    if (fileInfo.success && fileInfo.content) prompt += `\n\n[Прикреплённый файл]:\n${fileInfo.content}`;
  }
  messages.push({ role: "user", content: prompt });

  const steps: AgentStep[] = [];
  let lastExecutedSql: string | null = null;
  let llmCalls = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  const MAX_ITERATIONS = effort === "low" ? 3 : effort === "high" ? 7 : 4;

  const finish = async (res: Omit<ChatEngineResponse, "meta" | "steps">): Promise<ChatEngineResponse> => {
    if (settingId && (promptTokens || completionTokens)) {
      aiSettingsRepository
        .logTokenUsage({
          settingId,
          operationType: "text",
          model,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          costUsd: 0,
          userId: userContext.userId,
          status: "success",
        })
        .catch((e: any) => console.error("Ошибка логирования токенов AI:", e?.message));
    }
    return { ...res, steps, meta: { durationMs: Date.now() - started, llmCalls, fastPath: false, model } };
  };

  const pushStep = (s: Omit<AgentStep, "step">) => {
    const full = { step: steps.length + 1, ...s };
    steps.push(full);
    emit({ type: "step", step: full });
  };

  const feedBack = (parsed: any, result: string) => {
    messages.push({ role: "assistant", content: JSON.stringify(parsed) });
    messages.push({ role: "user", content: result });
  };

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    throwIfAborted();
    const isLast = iteration === MAX_ITERATIONS;
    if (isLast && iteration > 1) {
      messages.push({ role: "user", content: "Это последний шаг: верни action \"report\" или \"answer\"." });
    }

    const completion = await callModel(client, model, messages, { effort, json: true, maxTokens: 1500, signal });
    llmCalls++;
    promptTokens += completion.usage?.prompt_tokens || 0;
    completionTokens += completion.usage?.completion_tokens || 0;

    const parsed = parseModelJson(completion.choices[0]?.message?.content || "{}");
    const action = String(parsed.action || "answer");
    const thought = String(parsed.thought || "");
    const input = parsed.actionInput && typeof parsed.actionInput === "object" ? { ...parsed, ...parsed.actionInput } : parsed;

    // --- Финальный текстовый ответ (совместимость со старым final_answer) ---
    if (action === "answer" || action === "final_answer") {
      const artifact: ReportArtifact | null = parsed.artifact?.rows?.length ? parsed.artifact : null;
      return finish({
        reply: String(input.reply || "Готово."),
        artifact,
        certificates: parsed.certificates || artifact?.certificates || null,
        sqlExecuted: lastExecutedSql,
      });
    }

    // --- Отчёт: SQL → таблица/график/выводы строит сервер ---
    if (action === "report" || action === "execute_sql" || action === "query") {
      const sql = String(input.sql || "");
      emit({ type: "status", text: "Выполняю запрос к базе данных…" });
      const res = await executeSafeSql(sql, userContext);
      lastExecutedSql = res.sql || sql;
      pushStep({
        thought: thought || (action === "report" ? String(input.title || "Формирую отчёт") : "Смотрю данные"),
        action: action === "query" ? "execute_sql" : action,
        input: { sql: res.sql || sql },
        output: res.success ? { rowCount: res.rows.length, ms: res.ms } : { error: res.error },
        ms: res.ms,
      });

      if (!res.success) {
        feedBack(parsed, `[Ошибка SQL]: ${res.error}\nИсправь запрос (сверься со СХЕМОЙ) и повтори.`);
        continue;
      }

      if (action === "query" || action === "execute_sql") {
        // Маленький результат при execute_sql можно показать отчётом сразу, если модель не просила «только посмотреть»
        feedBack(parsed, `[Результат]: ${rowsToCompactText(res.rows, 30)}`);
        continue;
      }

      const artifact = buildArtifactFromRows(res.rows, {
        title: input.title,
        description: input.description,
        columns: input.columns,
        chart: input.chart,
      });
      const intro = String(input.reply || "").trim();
      let reply = (intro ? intro + "\n\n" : "") + summarizeArtifact(artifact);

      if (effort === "high" && res.rows.length > 1) {
        emit({ type: "status", text: "Формулирую аналитические выводы…" });
        try {
          const insight = await callModel(
            client,
            model,
            [
              { role: "system", content: "Ты аналитик учебного центра. Дай 3–5 кратких выводов по данным в markdown (списком, **жирным** ключевые цифры). Без вступлений." },
              { role: "user", content: `Вопрос: ${userMessage}\nДанные «${artifact.title}»:\n${rowsToCompactText(res.rows, 40)}` },
            ],
            { effort, json: false, maxTokens: 500, signal },
          );
          llmCalls++;
          promptTokens += insight.usage?.prompt_tokens || 0;
          completionTokens += insight.usage?.completion_tokens || 0;
          const text = insight.choices[0]?.message?.content?.trim();
          if (text) reply = (intro ? intro + "\n\n" : "") + text;
        } catch (e: any) {
          console.warn("[AI chat] insights failed:", e.message);
        }
      }

      return finish({ reply, artifact: res.rows.length ? artifact : null, sqlExecuted: lastExecutedSql });
    }

    // --- Слушатели ---
    if (action === "find_students" || action === "resolve_students_by_names") {
      const queries: string[] = Array.isArray(input.names) ? input.names : [String(input.query || input.name || "")];
      emit({ type: "status", text: "Ищу слушателей…" });
      const t0 = Date.now();
      const found = (await Promise.all(queries.filter(Boolean).slice(0, 20).map((q) => findStudents(q, userContext, queries.length > 1 ? 3 : 6)))).flat();
      const unique = [...new Map(found.map((s) => [s.id, s])).values()];
      pushStep({ thought, action: "find_students", input: { query: queries }, output: { found: unique.length }, ms: Date.now() - t0 });

      const certs = unique.flatMap((s) => s.certificates);
      const reply = unique.length
        ? String(input.reply || "") ||
          (unique.length === 1
            ? `Найден слушатель **${unique[0]!.fullName}** — ${unique[0]!.organization || "организация не указана"}, групп: **${unique[0]!.groupsCount}**, сертификатов: **${unique[0]!.certificatesCount}**.`
            : `Найдено **${unique.length}** слушателей по запросу.`)
        : `Слушатели по запросу «${queries.join(", ")}» **не найдены**. Проверьте написание ФИО или укажите ПИНФЛ.`;
      return finish({
        reply,
        artifact: unique.length
          ? {
              title: "Найденные слушатели",
              columns: [
                { key: "fullName", label: "ФИО", type: "text" },
                { key: "pinfl", label: "ПИНФЛ", type: "text" },
                { key: "organization", label: "Организация", type: "text" },
                { key: "position", label: "Должность", type: "text" },
                { key: "groupsCount", label: "Групп", type: "number" },
                { key: "certificatesCount", label: "Сертификатов", type: "number" },
              ],
              rows: unique.map(({ certificates, groups, ...rest }) => rest),
              students: unique,
              certificates: certs.length ? certs : undefined,
            }
          : null,
        students: unique,
        certificates: certs.length ? certs : null,
        sqlExecuted: lastExecutedSql,
      });
    }

    // --- Сертификаты ---
    if (action === "find_certificates") {
      emit({ type: "status", text: "Ищу сертификаты…" });
      const t0 = Date.now();
      const filter = {
        student: input.student || undefined,
        number: input.number || undefined,
        course: input.course || undefined,
        organization: input.organization || undefined,
        status: input.status === "issued" || input.status === "revoked" ? input.status : undefined,
        dateFrom: input.dateFrom || undefined,
        dateTo: input.dateTo || undefined,
        expiringWithinDays: input.expiringWithinDays ? Number(input.expiringWithinDays) : undefined,
      };
      const certs = await findCertificates(filter, userContext);
      pushStep({ thought, action, input: filter, output: { found: certs.length }, ms: Date.now() - t0 });
      return finish({
        reply: certs.length
          ? (String(input.reply || "").trim() || `Найдено **${certs.length}** сертификатов.`) +
            (certs.length > 1 ? "\n\nМожно скачать каждый PDF отдельно или все одним **ZIP-архивом**." : "")
          : "Сертификаты по заданным условиям **не найдены**.",
        artifact: certs.length ? certificatesArtifact(certs, String(input.title || "Найденные сертификаты")) : null,
        certificates: certs,
        sqlExecuted: lastExecutedSql,
      });
    }

    // --- Файлы ---
    if (action === "search_files") {
      emit({ type: "status", text: "Ищу файлы…" });
      const files = await searchFiles(input);
      pushStep({ thought, action, input: { query: input.query, category: input.category }, output: { found: files.length } });
      feedBack(parsed, `[Файлы]: ${rowsToCompactText(files, 30)}`);
      continue;
    }
    if (action === "read_file" || action === "read_file_content") {
      emit({ type: "status", text: "Читаю файл…" });
      const readResult = await readFileContentTool(input);
      pushStep({
        thought,
        action: "read_file",
        input: { fileUuid: input.fileUuid, filename: input.filename },
        output: readResult.success ? { length: readResult.content?.length } : { error: readResult.error },
      });
      feedBack(parsed, `[Содержимое файла]: ${JSON.stringify(readResult)}`);
      continue;
    }

    // Неизвестное действие — просим модель выбрать из списка
    feedBack(parsed, `Неизвестное действие "${action}". Используй: report, query, find_students, find_certificates, search_files, read_file, answer.`);
  }

  return finish({
    reply: "Не удалось получить ответ за отведённое число шагов. Уточните, пожалуйста, вопрос или выберите Effort: High.",
    artifact: null,
    sqlExecuted: lastExecutedSql,
  });
}
