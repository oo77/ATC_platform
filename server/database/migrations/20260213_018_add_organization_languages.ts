import type { PoolConnection } from "mysql2/promise";

export const description =
  "Добавление трехъязычных названий для организаций и удаление краткого названия";

export async function up(connection: PoolConnection): Promise<void> {
  // Добавляем новые колонки
  await connection.query(`
    ALTER TABLE organizations
    ADD COLUMN name_uz VARCHAR(255) NULL AFTER name,
    ADD COLUMN name_en VARCHAR(255) NULL AFTER name_uz,
    ADD COLUMN name_ru VARCHAR(255) NULL AFTER name_en;
  `);

  // Копируем существующее название в name_ru (как наиболее вероятное для текущих данных)
  // Это опционально, но полезно для миграции
  await connection.query(`
    UPDATE organizations SET name_ru = name WHERE name IS NOT NULL;
  `);

  // Удаляем колонку short_name
  // Сначала нужно проверить, существует ли она, чтобы не упасть, хотя ALTER TABLE DROP COLUMN обычно ок
  // Но лучше просто DROP, так как мы знаем схему
  await connection.query(`
    ALTER TABLE organizations DROP COLUMN short_name;
  `);
}

export async function down(connection: PoolConnection): Promise<void> {
  // Восстанавливаем short_name
  await connection.query(`
    ALTER TABLE organizations ADD COLUMN short_name VARCHAR(100) NULL AFTER name;
  `);

  // Удаляем новые колонки
  await connection.query(`
    ALTER TABLE organizations
    DROP COLUMN name_uz,
    DROP COLUMN name_en,
    DROP COLUMN name_ru;
  `);
}
