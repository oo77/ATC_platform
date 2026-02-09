/**
 * Проверка структуры таблицы certificate_templates
 */

import { executeQuery } from "./server/utils/db";

async function checkTableStructure() {
  try {
    console.log("🔍 Проверка структуры таблицы certificate_templates...\n");

    const columns = await executeQuery<any[]>(
      "SHOW COLUMNS FROM certificate_templates",
    );

    console.log("Колонки таблицы certificate_templates:");
    console.table(
      columns.map((col) => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Key: col.Key,
        Default: col.Default,
        Extra: col.Extra,
      })),
    );

    // Проверяем наличие нужных колонок
    const hasNumberFormat = columns.some(
      (col) => col.Field === "number_format",
    );
    const hasLastNumber = columns.some((col) => col.Field === "last_number");

    console.log("\n✅ Результаты проверки:");
    console.log(
      `  - number_format: ${hasNumberFormat ? "✓ Есть" : "✗ Отсутствует"}`,
    );
    console.log(
      `  - last_number: ${hasLastNumber ? "✓ Есть" : "✗ Отсутствует"}`,
    );

    if (hasNumberFormat && hasLastNumber) {
      console.log("\n🎉 Все необходимые колонки присутствуют!");
    } else {
      console.log("\n⚠️  Некоторые колонки отсутствуют. Запустите миграцию.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

checkTableStructure();
