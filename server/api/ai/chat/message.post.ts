import { executeQuery } from "../../../utils/db";
import {
  processAiChatMessage,
  type UserContext,
  type ChatProgressEvent,
  type ReportArtifact,
} from "../../../utils/ai/chatEngine";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/ai/chat/message
 * Обычный JSON-ответ, либо SSE-поток (Accept: text/event-stream) с событиями
 * status / step / result / error — интерфейс показывает прогресс сразу.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) {
    throw createError({ statusCode: 401, message: "Требуется авторизация для доступа к ИИ-чату" });
  }

  const body = await readBody(event).catch(() => ({}));
  const rawMessage = String(body?.message || "").trim();
  let sessionId = body?.sessionId ? String(body.sessionId).trim() : null;
  const fileAttachmentUuid = body?.fileAttachmentUuid ? String(body.fileAttachmentUuid).trim() : undefined;
  const isStream = Boolean(getHeader(event, "accept")?.includes("text/event-stream"));

  if (!rawMessage) {
    throw createError({ statusCode: 400, message: "Текст запроса обязателен для заполнения" });
  }

  const sendEvent = (name: string, data: any) => {
    if (!isStream) return;
    try {
      event.node.res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
      (event.node.res as any).flush?.();
    } catch {
      /* клиент отключился */
    }
  };

  if (isStream) {
    setResponseHeader(event, "Content-Type", "text/event-stream");
    setResponseHeader(event, "Cache-Control", "no-cache, no-transform");
    setResponseHeader(event, "Connection", "keep-alive");
    setResponseHeader(event, "X-Accel-Buffering", "no");
    event.node.res.flushHeaders?.();
  }

  // Клиент нажал «Стоп» или закрыл вкладку — прерываем вызовы модели и не сохраняем ответ
  const abort = new AbortController();
  event.node.res.on("close", () => {
    if (!event.node.res.writableEnded) abort.abort();
  });

  try {
    // 1. Сессия + контекст пользователя — параллельно
    let sessionTitle = "Новый диалог";
    const isNewSession = !sessionId;

    const [sessions, userRows] = await Promise.all([
      sessionId
        ? executeQuery<any[]>(`SELECT id, title FROM ai_chat_sessions WHERE id = ? AND user_id = ?`, [sessionId, user.id])
        : Promise.resolve(null),
      executeQuery<any[]>(
        `SELECT u.id, u.name, s.organization_id, o.name AS org_name
         FROM users u
         LEFT JOIN students s ON s.user_id = u.id
         LEFT JOIN organizations o ON s.organization_id = o.id
         WHERE u.id = ? LIMIT 1`,
        [user.id],
      ),
    ]);

    if (sessionId) {
      if (!sessions?.length) throw createError({ statusCode: 404, message: "Сессия диалога не найдена" });
      sessionTitle = sessions[0].title;
    } else {
      sessionId = uuidv4();
      sessionTitle = rawMessage.slice(0, 45).replace(/[\n\r]+/g, " ") + (rawMessage.length > 45 ? "..." : "");
      await executeQuery(`INSERT INTO ai_chat_sessions (id, user_id, title) VALUES (?, ?, ?)`, [sessionId, user.id, sessionTitle]);
    }

    const userInfo = userRows[0] || {};
    const userContext: UserContext = {
      userId: user.id,
      name: userInfo.name || user.name || undefined,
      role: user.role,
      organizationId: userInfo.organization_id || null,
      organizationName: userInfo.org_name || null,
      canViewAll: ["ADMIN", "MANAGER"].includes(user.role),
    };

    // 2. История (без нового сообщения) и сохранение сообщения пользователя — параллельно
    const userMessageId = uuidv4();
    const [prevMessages] = await Promise.all([
      isNewSession
        ? Promise.resolve([] as any[])
        : executeQuery<any[]>(
            `SELECT role, content, sql_executed, artifact
             FROM (SELECT role, content, sql_executed, artifact, created_at
                   FROM ai_chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 8) t
             ORDER BY created_at ASC`,
            [sessionId],
          ),
      executeQuery(`INSERT INTO ai_chat_messages (id, session_id, role, content) VALUES (?, ?, 'user', ?)`, [
        userMessageId,
        sessionId,
        rawMessage,
      ]),
    ]);

    const history = prevMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      sqlExecuted: m.sql_executed,
    }));

    // Последняя показанная таблица — чтобы отвечать на уточнения без повторного SQL
    let lastArtifact: ReportArtifact | null = null;
    const lastAssistant = [...prevMessages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant?.artifact) {
      try {
        lastArtifact = typeof lastAssistant.artifact === "string" ? JSON.parse(lastAssistant.artifact) : lastAssistant.artifact;
      } catch {
        lastArtifact = null;
      }
    }

    const requestedEffort = (["low", "medium", "high"].includes(body?.effort) ? body.effort : "medium") as
      | "low"
      | "medium"
      | "high";

    sendEvent("session", { sessionId, sessionTitle, userMessageId });

    // 3. Агент
    const aiResponse = await processAiChatMessage({
      userMessage: rawMessage,
      userContext,
      history,
      lastArtifact,
      fileAttachmentUuid,
      settingId: body?.settingId ? String(body.settingId).trim() : undefined,
      modelOverride: body?.model ? String(body.model).trim() : undefined,
      effort: requestedEffort,
      signal: abort.signal,
      onProgress: (e: ChatProgressEvent) => sendEvent(e.type, e.type === "status" ? { message: e.text } : e.step),
    });

    if (abort.signal.aborted) {
      console.log(`[AI chat] запрос остановлен пользователем (session ${sessionId})`);
      return;
    }

    // Сертификаты и карточки слушателей храним внутри artifact, чтобы они восстанавливались из истории
    const artifactToStore = aiResponse.artifact
      ? {
          ...aiResponse.artifact,
          certificates: aiResponse.artifact.certificates || aiResponse.certificates || undefined,
          students: aiResponse.artifact.students || aiResponse.students || undefined,
        }
      : null;

    const assistantMessageId = uuidv4();
    const now = new Date().toISOString();
    const result = {
      sessionId,
      sessionTitle,
      userMessage: { id: userMessageId, sessionId, role: "user", content: rawMessage, createdAt: now },
      assistantMessage: {
        id: assistantMessageId,
        sessionId,
        role: "assistant",
        content: aiResponse.reply,
        steps: aiResponse.steps,
        artifact: artifactToStore,
        certificates: aiResponse.certificates || artifactToStore?.certificates || null,
        students: aiResponse.students || artifactToStore?.students || null,
        sqlExecuted: aiResponse.sqlExecuted,
        meta: aiResponse.meta,
        createdAt: now,
      },
    };

    // Отдаём результат до записи в БД — пользователь не ждёт INSERT/UPDATE
    sendEvent("result", result);

    const persist = Promise.all([
      executeQuery(
        `INSERT INTO ai_chat_messages (id, session_id, role, content, steps, artifact, sql_executed)
         VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
        [
          assistantMessageId,
          sessionId,
          aiResponse.reply,
          aiResponse.steps?.length ? JSON.stringify(aiResponse.steps) : null,
          artifactToStore ? JSON.stringify(artifactToStore) : null,
          aiResponse.sqlExecuted || null,
        ],
      ),
      executeQuery(`UPDATE ai_chat_sessions SET updated_at = NOW(3) WHERE id = ?`, [sessionId]),
    ]);

    if (isStream) {
      await persist.catch((e) => console.error("[AI chat] persist failed:", e.message));
      event.node.res.end();
      return;
    }

    await persist;
    return { success: true, data: result };
  } catch (error: any) {
    if (abort.signal.aborted) {
      if (!event.node.res.writableEnded) event.node.res.end();
      return;
    }
    const message = error.statusCode ? error.message : `Ошибка обработки сообщения ИИ: ${error.message}`;
    if (isStream) {
      sendEvent("error", { message });
      event.node.res.end();
      return;
    }
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message });
  }
});
