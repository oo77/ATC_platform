import { executeQuery } from "../../../../utils/db";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: "Требуется авторизация",
    });
  }

  const sessionId = getRouterParam(event, "id");
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: "ID сессии не указан",
    });
  }

  try {
    // Проверка доступа к сессии
    const sessions = await executeQuery<any[]>(
      `SELECT id, title, created_at, updated_at
       FROM ai_chat_sessions
       WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );

    if (!sessions.length) {
      throw createError({
        statusCode: 404,
        message: "Сессия не найдена",
      });
    }

    const session = sessions[0];

    // Загрузка сообщений
    const messages = await executeQuery<any[]>(
      `SELECT id, session_id, role, content, steps, artifact, sql_executed, created_at
       FROM ai_chat_messages
       WHERE session_id = ?
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return {
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        },
        messages: messages.map((m) => ({
          id: m.id,
          sessionId: m.session_id,
          role: m.role,
          content: m.content,
          steps: typeof m.steps === "string" ? JSON.parse(m.steps) : m.steps,
          artifact: typeof m.artifact === "string" ? JSON.parse(m.artifact) : m.artifact,
          sqlExecuted: m.sql_executed,
          createdAt: m.created_at,
        })),
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: `Ошибка загрузки сообщений сессии: ${error.message}`,
    });
  }
});
