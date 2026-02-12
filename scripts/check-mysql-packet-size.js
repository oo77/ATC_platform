/**
 * Скрипт для проверки и установки max_allowed_packet в MySQL
 * Запустите: node scripts/check-mysql-packet-size.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkAndSetMaxPacket() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "atc_test",
  });

  try {
    console.log("🔍 Проверка текущего значения max_allowed_packet...\n");

    // Проверяем текущее значение
    const [rows] = await connection.query(
      'SHOW VARIABLES LIKE "max_allowed_packet"',
    );
    const currentValue = rows[0].Value;
    const currentMB = Math.round(parseInt(currentValue) / 1024 / 1024);

    console.log(`Текущее значение: ${currentValue} байт (${currentMB} MB)`);

    const targetValue = 67108864; // 64MB
    const targetMB = 64;

    if (parseInt(currentValue) < targetValue) {
      console.log(`\n⚠️  Значение меньше рекомендуемого (${targetMB} MB)`);
      console.log("\n📝 Для увеличения лимита выполните одно из действий:\n");
      console.log("1. Временно (до перезапуска MySQL):");
      console.log(`   SET GLOBAL max_allowed_packet=${targetValue};\n`);
      console.log("2. Постоянно (добавьте в my.ini или my.cnf):");
      console.log("   [mysqld]");
      console.log(`   max_allowed_packet=${targetMB}M\n`);
      console.log("   Затем перезапустите MySQL сервер.\n");

      // Пытаемся установить временно
      try {
        await connection.query(`SET GLOBAL max_allowed_packet=${targetValue}`);
        console.log(
          `✅ Успешно установлено временное значение: ${targetMB} MB`,
        );
        console.log("⚠️  Это изменение будет действовать до перезапуска MySQL");
        console.log(
          "   Для постоянного изменения отредактируйте конфигурацию MySQL\n",
        );
      } catch (error) {
        console.log(
          `❌ Не удалось установить значение автоматически: ${error.message}`,
        );
        console.log("   Установите вручную с правами администратора\n");
      }
    } else {
      console.log(`\n✅ Значение достаточно большое (>= ${targetMB} MB)`);
    }

    // Проверяем также для текущей сессии
    const [sessionRows] = await connection.query(
      "SELECT @@max_allowed_packet as value",
    );
    const sessionValue = sessionRows[0].value;
    const sessionMB = Math.round(parseInt(sessionValue) / 1024 / 1024);
    console.log(
      `\nЗначение для текущей сессии: ${sessionValue} байт (${sessionMB} MB)`,
    );
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await connection.end();
  }
}

checkAndSetMaxPacket().catch(console.error);
