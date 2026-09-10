import mysql from "mysql2/promise";

/**
 * Встроенный Aiven CA сертификат
 * Это публичный ключ (не секретный), поэтому его безопасно хранить в коде.
 * Срок действия: до 2035-10-28
 */
const AIVEN_CA_CERTIFICATE =
  "-----BEGIN CERTIFICATE-----\nMIIEUDCCArigAwIBAgIUTAG7gMPqpM+PfUHgMf9lLG4b+bEwDQYJKoZIhvcNAQEM\nBQAwQDE+MDwGA1UEAww1NDUyZWFmYzMtNDU4NC00Njg4LWI1NDAtODJiYWU4ZTE0\nZDc0IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMDMwMDcyNjUxWhcNMzUxMDI4MDcy\nNjUxWjBAMT4wPAYDVQQDDDU0NTJlYWZjMy00NTg0LTQ2ODgtYjU0MC04MmJhZThl\nMTRkNzQgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC\nAYoCggGBAKmKyGKzFAYjQJGdtlrtvXPuaZacnbjrde5BYQdU52IX5tJeWQ58N27o\npDbMrZhlOCvHd57K5Oxkp6V5alnI0/ekuTN8eoIYvjtNqtE72gIN6I808+nk1K/0\ntPxrvTURAFEvxyhf77JEIWOAz+OJ0fYfDmoIIp+IY5b0wp/sLhNO1u1m2+8tDglu\nbTSO4139nJo0D8ApafMpF5sQ5Vpci6wk9u6W3XpJ/+wJuJ5Oioe/mjEv/TKCkmzn\nwX4ALgiONVI3qxPV7RaynNY/SRpBX5kcuChrP/3+WZ9QsRwyPI530Kz2nZX10XVm\n5ik/tEVJAjf08yrhAjLxZ4paBt3Pcy9egNWIeA2ixMy49qu1QkDkCrw8t4K79oAC\nBy/bj5aVGbup2W+Q5hc83AQ2IhmWVWChnJI9dcg1l7T4AAqXJPBtp1AWGhHcldNH\n3Ao/aavgLE9kTcEWLO5P1izMKaYsqhpsQEx3lmWcLi4wPJn7F2f0pQ0Q5rJZ74Z6\nRNrZ80/c5wIDAQABo0IwQDAdBgNVHQ4EFgQUT+zOIhiQP49iiJ8dkJIeB0JY3JUw\nEgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD\nggGBACVlQGNrmSCfIaevjuMDqvdGB7NZYJM3Fkr4m7bAtDD0WYxgneH9HmcaWcpA\nCtzbv64vP/wBIMRKzj3DeglUIe1hwaXQq4mcNuoGt4TMHzktdZhisgxCdjYFVIcS\nqjbsK1XOPChn/WFmEqCN+FsTdXIi4CeQPSFKFOIVxM+UKRk/nx2DV2PDwN/pt3A/\nGq10ujVDZNTdQlBSLIf5b+qtIVQRJ66cHpIaTTWZvkw++0ULbA8dK0f7sdrd751A\nlK1uTg9e3TEeW7TTdKqsr/8F8VVrJDtKjJLSN7IbM4QmnzBC/QAkNnuPEaDwwmyj\n5XEdvDcAa+VfZXRXSjAi05fsgw5f94dqJlos2oEDmeEN4tx3y0VItPUXOZNbWg7r\nJPPGg3mrBuICcqd1h9OgyYo+siTwHITM/kL0fgLzNWHEyYQ5GLigzvXNw+WLlWsh\niLd4pScmXlOmyIbdtAhxRwmNLBDupx/C3H8pTGl0nFKA3P3Sb/Ftw53wewc51flt\nZ7dREA==\n-----END CERTIFICATE-----";

/**
 * Получить SSL конфигурацию для Aiven или других облачных провайдеров
 *
 * Поддерживает два варианта:
 * 1. DATABASE_SSL_CA - сертификат в переменной окружения (Base64 или PEM)
 * 2. Встроенный сертификат AIVEN_CA_CERTIFICATE (fallback для Netlify)
 */
function getSslConfig(): mysql.SslOptions | undefined {
  const sslEnabled = process.env.DATABASE_SSL === "true";

  if (!sslEnabled) {
    return undefined;
  }

  // Вариант 1: Сертификат напрямую в переменной окружения (для Netlify/Vercel)
  const caCertEnv = process.env.DATABASE_SSL_CA;
  if (caCertEnv) {
    console.log("🔒 SSL enabled with CA certificate from environment variable");

    try {
      let ca: Buffer;

      // Проверка на Base64 (если строка без пробелов и похожа на base64, и нет PEM заголовков)
      const isBase64 =
        !caCertEnv.includes("-----BEGIN CERTIFICATE-----") &&
        /^[A-Za-z0-9+/=]+$/.test(caCertEnv.replace(/\s/g, ""));

      if (isBase64) {
        console.log("📦 Detected Base64 encoded certificate");
        ca = Buffer.from(caCertEnv, "base64");
      } else {
        // Обычный PEM
        let cleanCert = caCertEnv.trim();
        if (cleanCert.startsWith('"') && cleanCert.endsWith('"'))
          cleanCert = cleanCert.slice(1, -1);
        if (cleanCert.startsWith("'") && cleanCert.endsWith("'"))
          cleanCert = cleanCert.slice(1, -1);

        cleanCert = cleanCert.replace(/\\n/g, "\n");

        if (!cleanCert.includes("-----BEGIN CERTIFICATE-----")) {
          console.warn(
            "⚠️ Invalid certificate format (missing headers). Fallback to non-verified SSL.",
          );
          return { rejectUnauthorized: false };
        }

        ca = Buffer.from(cleanCert, "utf-8");
      }

      console.log("🔒 CA certificate processed successfully. Size:", ca.length);
      return { ca, rejectUnauthorized: true };
    } catch (e: any) {
      console.error("❌ Error processing CA certificate:", e.message);
      return { rejectUnauthorized: false };
    }
  }

  // Вариант 2 (fallback): Встроенный сертификат Aiven (работает везде, включая Netlify)
  console.log("🔒 SSL enabled with built-in Aiven CA certificate");
  return {
    ca: Buffer.from(AIVEN_CA_CERTIFICATE, "utf-8"),
    rejectUnauthorized: true,
  };
}

// Конфигурация подключения к БД
const dbConfig: mysql.PoolOptions = {
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "atc",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: getSslConfig(),
  // Примечание: max_allowed_packet настраивается на сервере MySQL, а не в клиенте
  // Для работы с большими данными (шаблоны с изображениями) убедитесь, что на сервере установлено:
  // SET GLOBAL max_allowed_packet = 67108864; -- 64MB
};

// Создание пула подключений
let pool: mysql.Pool | null = null;

/**
 * Получить пул подключений к БД
 * Создает новый пул при первом вызове и переиспользует его в дальнейшем
 */
export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log("✅ MySQL connection pool created");
  }
  return pool;
}

/**
 * Выполнить SQL запрос
 * @param query - SQL запрос
 * @param params - Параметры запроса
 * @returns Результат запроса
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[],
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T;
  } finally {
    connection.release();
  }
}

/**
 * Выполнить несколько запросов в транзакции
 * @param callback - Функция с запросами
 * @returns Результат транзакции
 */
export async function executeTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Проверить подключение к БД
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getDbPool().getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}
