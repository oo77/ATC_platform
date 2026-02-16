import mysql from "mysql2/promise";

/**
 * Тестирование подключения к БД с новыми параметрами
 * POST /api/environment/test-connection
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("[ENVIRONMENT] Testing database connection...");

  // Валидация обязательных полей
  const requiredFields = [
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_NAME",
    "DATABASE_USER",
  ];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Обязательные поля не заполнены: ${missingFields.join(", ")}`,
    });
  }

  try {
    // Создаём тестовое подключение
    const connection = await mysql.createConnection({
      host: body.DATABASE_HOST,
      port: parseInt(body.DATABASE_PORT),
      user: body.DATABASE_USER,
      password: body.DATABASE_PASSWORD || "",
      database: body.DATABASE_NAME,
      connectTimeout: 10000, // 10 секунд таймаут
    });

    // Тестовый запрос
    const [rows] = await connection.execute(
      "SELECT 1 as test, DATABASE() as db_name, VERSION() as version",
    );

    await connection.end();

    console.log("[ENVIRONMENT] Database connection test successful");

    return {
      success: true,
      message: "Подключение к базе данных успешно!",
      details: {
        database: (rows as any)[0].db_name,
        version: (rows as any)[0].version,
      },
    };
  } catch (error: any) {
    console.error("[ENVIRONMENT] Database connection test failed:", error);

    // Человекочитаемые сообщения об ошибках
    let errorMessage = "Неизвестная ошибка подключения";

    switch (error.code) {
      case "ECONNREFUSED":
        errorMessage =
          "Не удалось подключиться к серверу БД. Проверьте хост и порт.";
        break;
      case "ER_ACCESS_DENIED_ERROR":
        errorMessage = "Неверный логин или пароль для доступа к БД.";
        break;
      case "ER_BAD_DB_ERROR":
        errorMessage =
          "База данных не существует. Создайте её через панель хостинга.";
        break;
      case "ETIMEDOUT":
      case "ENOTFOUND":
        errorMessage = "Не удалось найти сервер БД. Проверьте адрес хоста.";
        break;
      default:
        errorMessage = error.message;
    }

    throw createError({
      statusCode: 500,
      message: errorMessage,
      data: {
        code: error.code,
        sqlState: error.sqlState,
      },
    });
  }
});
