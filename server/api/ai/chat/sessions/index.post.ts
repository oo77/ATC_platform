import { executeQuery } from "../../../../utils/db";
import { v4 as uuidv4 } from "uuid";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user?.id) {
    throw createError({
      statusCode: 401,
      message: "Требуется авторизация",
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const title = (body?.title || "Новый диалог").trim();
  const sessionId = uuidv4();

  try {
    await executeQuery(
      `INSERT INTO ai_chat_sessions (id, user_id, title)
       VALUES (?, ?, ?)`,
      [sessionId, user.id, title]
    );

    return {
      success: true,
      data: {
        id: sessionId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Ошибка создания сессии: ${error.message}`,
    });
  }
});
