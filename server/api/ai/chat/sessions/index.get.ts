import { executeQuery } from "../../../../utils/db";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: "Требуется авторизация",
    });
  }

  try {
    const sessions = await executeQuery<any[]>(
      `SELECT id, title, created_at, updated_at
       FROM ai_chat_sessions
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [user.id]
    );

    return {
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Ошибка получения сессий: ${error.message}`,
    });
  }
});
