import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: новые языки тестирования
 * Дата: 2026-11-09
 *
 * Добавляет в ENUM языков вопросов и сессий тестирования:
 *   uzlat  — Узбекский лат.
 *   kaakir — Каракалпакский кир.
 *   kaalat — Каракалпакский лат.
 *
 * Существующие значения (ru, uz, en) остаются как есть, данные не переносятся.
 * Новые значения дописываются В КОНЕЦ списка ENUM — порядок старых сохраняется,
 * поэтому изменение не трогает уже записанные строки.
 * test_templates.allowed_languages — JSON, менять схему не нужно.
 */

export const description =
  "Языки тестирования: Узбекский лат., Каракалпакский кир./лат. (ENUM questions/test_sessions)";

const NEW_ENUM = "ENUM('ru','uz','en','uzlat','kaakir','kaalat')";
const OLD_ENUM = "ENUM('ru','uz','en')";

export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(
    `ALTER TABLE questions MODIFY COLUMN language ${NEW_ENUM} NOT NULL DEFAULT 'ru'`,
  );
  await connection.query(
    `ALTER TABLE test_sessions MODIFY COLUMN language ${NEW_ENUM} NULL DEFAULT NULL`,
  );
  console.log("✅ Языки тестирования расширены: uzlat, kaakir, kaalat");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  // Откат возможен только если новые языки ещё нигде не использованы
  const [rows] = await connection.query<any[]>(
    `SELECT
       (SELECT COUNT(*) FROM questions WHERE language IN ('uzlat','kaakir','kaalat')) AS q,
       (SELECT COUNT(*) FROM test_sessions WHERE language IN ('uzlat','kaakir','kaalat')) AS s`,
  );
  const used = Number(rows[0]?.q || 0) + Number(rows[0]?.s || 0);
  if (used > 0) {
    throw new Error(
      `Нельзя откатить: новые языки уже используются (${used} записей)`,
    );
  }

  await connection.query(
    `ALTER TABLE questions MODIFY COLUMN language ${OLD_ENUM} NOT NULL DEFAULT 'ru'`,
  );
  await connection.query(
    `ALTER TABLE test_sessions MODIFY COLUMN language ${OLD_ENUM} NULL DEFAULT NULL`,
  );
};
