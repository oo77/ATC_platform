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
    const result: any = await executeQuery(
      `DELETE FROM ai_chat_sessions
       WHERE id = ? AND user_id = ?`,
      [sessionId, user.id]
    );

    if (result.affectedRows === 0) {
      throw createError({
        statusCode: 404,
        message: "Сессия не найдена",
      });
    }

    return {
      success: true,
      message: "Сессия успешно удалена",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: `Ошибка удаления сессии: ${error.message}`,
    });
  }
});
