/**
 * Migration: Add search indexes for users table
 * Добавляет индексы для оптимизации поиска пользователей по имени и ПИНФЛ
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "Add search indexes on users.name and users.pinfl for optimized search";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("🔄 Adding search indexes to users table...");

  // Проверяем существование индекса на name
  const [nameIndexExists] = await connection.query<any>(`
    SELECT COUNT(*) as count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'idx_users_name'
  `);

  if (nameIndexExists[0].count === 0) {
    await connection.query(`
      CREATE INDEX idx_users_name ON users(name)
    `);
    console.log("✅ Created index idx_users_name");
  } else {
    console.log("⏭️  Index idx_users_name already exists");
  }

  // Проверяем существование индекса на pinfl
  const [pinflIndexExists] = await connection.query<any>(`
    SELECT COUNT(*) as count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'idx_users_pinfl'
  `);

  if (pinflIndexExists[0].count === 0) {
    await connection.query(`
      CREATE INDEX idx_users_pinfl ON users(pinfl)
    `);
    console.log("✅ Created index idx_users_pinfl");
  } else {
    console.log("⏭️  Index idx_users_pinfl already exists");
  }

  // Проверяем существование индекса на email (для будущего расширения поиска)
  const [emailIndexExists] = await connection.query<any>(`
    SELECT COUNT(*) as count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'idx_users_email'
  `);

  if (emailIndexExists[0].count === 0) {
    await connection.query(`
      CREATE INDEX idx_users_email ON users(email)
    `);
    console.log("✅ Created index idx_users_email");
  } else {
    console.log("⏭️  Index idx_users_email already exists");
  }

  console.log("✅ Search indexes added successfully");
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("🔄 Removing search indexes from users table...");

  // Удаляем индексы
  await connection.query(`DROP INDEX IF EXISTS idx_users_name ON users`);
  console.log("✅ Dropped index idx_users_name");

  await connection.query(`DROP INDEX IF EXISTS idx_users_pinfl ON users`);
  console.log("✅ Dropped index idx_users_pinfl");

  await connection.query(`DROP INDEX IF EXISTS idx_users_email ON users`);
  console.log("✅ Dropped index idx_users_email");

  console.log("✅ Search indexes removed successfully");
}
