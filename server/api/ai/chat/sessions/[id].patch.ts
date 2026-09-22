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

  const body = await readBody(event).catch(() => ({}));
  const title = String(body?.title || "").trim();

  if (!title) {
    throw createError({
      statusCode: 400,
      message: "Название сессии не может быть пустым",
    });
  }

  try {
    const result: any = await executeQuery(
      `UPDATE ai_chat_sessions
       SET title = ?, updated_at = NOW(3)
       WHERE id = ? AND user_id = ?`,
      [title, sessionId, user.id]
    );

    if (result.affectedRows === 0) {
      throw createError({
        statusCode: 404,
        message: "Сессия не найдена или нет прав на редактирование",
      });
    }

    return {
      success: true,
      data: { id: sessionId, title },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: `Ошибка обновления сессии: ${error.message}`,
    });
  }
});
