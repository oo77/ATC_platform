import { runMigrations } from "../../database/migrator";

/**
 * Запуск миграций базы данных
 * POST /api/environment/migrate
 */
export default defineEventHandler(async (event) => {
  console.log("[ENVIRONMENT] Starting database migrations...");

  try {
    // Запускаем миграции
    await runMigrations();

    return {
      success: true,
      message: "Миграции выполнены успешно",
    };
  } catch (error: any) {
    console.error("[ENVIRONMENT] Migration failed:", error);

    throw createError({
      statusCode: 500,
      message: `Ошибка выполнения миграций: ${error.message}`,
      data: {
        stack: error.stack,
      },
    });
  }
});
