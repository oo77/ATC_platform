import { executeQuery } from "../../../utils/db";
import { processAiChatMessage, type UserContext } from "../../../utils/ai/chatEngine";
import { v4 as uuidv4 } from "uuid";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: "Требуется авторизация для доступа к ИИ-чату",
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const rawMessage = String(body?.message || "").trim();
  let sessionId = body?.sessionId ? String(body.sessionId).trim() : null;
  const fileAttachmentUuid = body?.fileAttachmentUuid ? String(body.fileAttachmentUuid).trim() : undefined;

  // Валидация входных данных
  if (!rawMessage) {
    throw createError({
      statusCode: 400,
      message: "Текст запроса обязателен для заполнения",
    });
  }

  try {
    // 1. Определение или создание сессии
    let sessionTitle = "Новый диалог";
    let isNewSession = false;

    if (sessionId) {
      const sessions = await executeQuery<any[]>(
        `SELECT id, title FROM ai_chat_sessions WHERE id = ? AND user_id = ?`,
        [sessionId, user.id]
      );
      if (!sessions.length) {
        throw createError({
          statusCode: 404,
          message: "Сессия диалога не найдена",
        });
      }
      sessionTitle = sessions[0].title;
    } else {
      sessionId = uuidv4();
      isNewSession = true;
      // Генерируем краткий заголовок из первого сообщения
      sessionTitle = rawMessage.slice(0, 45).replace(/[\n\r]+/g, " ");
      if (rawMessage.length > 45) sessionTitle += "...";

      await executeQuery(
        `INSERT INTO ai_chat_sessions (id, user_id, title)
         VALUES (?, ?, ?)`,
        [sessionId, user.id, sessionTitle]
      );
    }

    // 2. Получение расширенного контекста пользователя (организация, роль)
    const userRows = await executeQuery<any[]>(
      `SELECT u.id, u.role, u.name, u.workplace, s.organization_id, o.name as org_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN organizations o ON s.organization_id = o.id
       WHERE u.id = ?`,
      [user.id]
    );

    const userInfo = userRows[0] || {};
    const isAdminOrManager = ["ADMIN", "MANAGER"].includes(user.role);

    const userContext: UserContext = {
      userId: user.id,
      name: userInfo.name || user.email,
      role: user.role,
      organizationId: userInfo.organization_id || null,
      organizationName: userInfo.org_name || null,
      canViewAll: isAdminOrManager,
    };

    // 3. Сохранение сообщения пользователя
    const userMessageId = uuidv4();
    await executeQuery(
      `INSERT INTO ai_chat_messages (id, session_id, role, content)
       VALUES (?, ?, 'user', ?)`,
      [userMessageId, sessionId, rawMessage]
    );

    // 4. Загрузка предыдущих сообщений диалога для контекста
    const prevMessages = await executeQuery<any[]>(
      `SELECT role, content, sql_executed
       FROM ai_chat_messages
       WHERE session_id = ? AND id != ?
       ORDER BY created_at ASC
       LIMIT 10`,
      [sessionId, userMessageId]
    );

    const history = prevMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      sqlExecuted: m.sql_executed,
    }));

    // 5. Вызов ReAct Chat Engine
    const aiResponse = await processAiChatMessage({
      userMessage: rawMessage,
      userContext,
      history,
      fileAttachmentUuid,
    });

    // 6. Сохранение ответа ассистента
    const assistantMessageId = uuidv4();
    await executeQuery(
      `INSERT INTO ai_chat_messages (id, session_id, role, content, steps, artifact, sql_executed)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
      [
        assistantMessageId,
        sessionId,
        aiResponse.reply,
        aiResponse.steps ? JSON.stringify(aiResponse.steps) : null,
        aiResponse.artifact ? JSON.stringify(aiResponse.artifact) : null,
        aiResponse.sqlExecuted || null,
      ]
    );

    // Обновление даты сессии
    await executeQuery(
      `UPDATE ai_chat_sessions SET updated_at = NOW(3) WHERE id = ?`,
      [sessionId]
    );

    return {
      success: true,
      data: {
        sessionId,
        sessionTitle,
        userMessage: {
          id: userMessageId,
          sessionId,
          role: "user",
          content: rawMessage,
          createdAt: new Date().toISOString(),
        },
        assistantMessage: {
          id: assistantMessageId,
          sessionId,
          role: "assistant",
          content: aiResponse.reply,
          steps: aiResponse.steps,
          artifact: aiResponse.artifact,
          sqlExecuted: aiResponse.sqlExecuted,
          createdAt: new Date().toISOString(),
        },
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: `Ошибка обработки сообщения ИИ: ${error.message}`,
    });
  }
});
