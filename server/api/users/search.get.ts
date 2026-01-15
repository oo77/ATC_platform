import { executeQuery } from "../../utils/db";
import { toPublicUser } from "../../utils/auth";
import type { User, UserPublic } from "../../types/auth";

/**
 * API endpoint для поиска пользователей
 * GET /api/users/search?q=query
 *
 * Query params:
 * - q: поисковый запрос (ФИО или ПИНФЛ)
 * - limit: максимальное количество результатов (по умолчанию 4)
 */
export default defineEventHandler(async (event) => {
  try {
    // Получаем текущего пользователя из контекста
    const currentUser = event.context.user;

    if (!currentUser) {
      console.error("❌ [User Search] Unauthorized access attempt");
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          success: false,
          message: "Требуется авторизация",
        },
      });
    }

    // Проверка прав доступа (только ADMIN и MANAGER)
    if (!["ADMIN", "MANAGER"].includes(currentUser.role)) {
      console.error(
        `❌ [User Search] Access denied for role: ${currentUser.role}`
      );
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          success: false,
          message: "Недостаточно прав для поиска пользователей",
        },
      });
    }

    // Получаем параметры запроса
    const query = getQuery(event);
    const searchQuery = ((query.q as string) || "").trim();
    const limit = parseInt((query.limit as string) || "4", 10);

    // Если запрос пустой, возвращаем пустой массив
    if (!searchQuery) {
      return {
        success: true,
        users: [],
      };
    }

    console.log(
      `🔍 [User Search] Query: "${searchQuery}", Limit: ${limit}, Role: ${currentUser.role}`
    );

    // Строим SQL запрос для поиска по ФИО и ПИНФЛ
    let sql = `
      SELECT * FROM users 
      WHERE (
        name LIKE ? OR 
        pinfl LIKE ?
      )
    `;
    const params: any[] = [`%${searchQuery}%`, `%${searchQuery}%`];

    // Ограничение доступа для MANAGER - не может видеть ADMIN
    if (currentUser.role === "MANAGER") {
      sql += " AND role != ?";
      params.push("ADMIN");
    }

    sql += " ORDER BY name ASC LIMIT ?";
    params.push(limit);

    // Выполняем запрос
    const users = await executeQuery<User[]>(sql, params);

    // Преобразуем в публичный формат
    const publicUsers: UserPublic[] = users.map(toPublicUser);

    console.log(
      `✅ [User Search] Found ${publicUsers.length} users for query "${searchQuery}"`
    );

    // Детальный лог для отладки
    if (publicUsers.length > 0) {
      console.log("[User Search] Sample result:", {
        id: publicUsers[0].id,
        name: publicUsers[0].name,
        role: publicUsers[0].role,
        studentId: publicUsers[0].studentId,
        instructorId: publicUsers[0].instructorId,
      });
    }

    return {
      success: true,
      users: publicUsers,
    };
  } catch (error: any) {
    console.error("❌ [User Search] Error:", error);

    // Если ошибка уже создана через createError, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    // Иначе создаем общую ошибку
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        message: "Ошибка при поиске пользователей",
      },
    });
  }
});
