import { useDatabase } from "../../utils/useDatabase";

/**
 * Проверка статуса подключения к базе данных
 * GET /api/environment/check-db
 */
export default defineEventHandler(async (event) => {
  try {
    const db = useDatabase();

    // Простой тестовый запрос
    const connection = await db.getConnection();
    try {
      await connection.execute("SELECT 1 as test");
    } finally {
      connection.release();
    }

    return {
      connected: true,
      message: "База данных подключена успешно",
    };
  } catch (error: any) {
    console.error("[ENVIRONMENT] Database check failed:", error);

    return {
      connected: false,
      error: error.code || "UNKNOWN_ERROR",
      message: error.message || "Неизвестная ошибка подключения",
    };
  }
});
