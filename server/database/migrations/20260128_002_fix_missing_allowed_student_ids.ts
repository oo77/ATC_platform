import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Исправление отсутствующей колонки allowed_student_ids
 * Дата: 2026-01-28
 * Описание: Восстановление поля allowed_student_ids в таблице test_assignments
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Running migration: 20260128_002_fix_missing_allowed_student_ids",
  );

  // Проверяем существование колонки перед добавлением
  const [rows] = await connection.query(`
    SHOW COLUMNS FROM test_assignments LIKE 'allowed_student_ids'
  `);

  if ((rows as any[]).length === 0) {
    await connection.query(`
        ALTER TABLE test_assignments 
        ADD COLUMN allowed_student_ids JSON NULL COMMENT 'Список ID студентов, допущенных к тесту (для пересдач)';
      `);
    console.log("  ✅ Added column: allowed_student_ids to test_assignments");
  } else {
    console.log(
      "  ℹ️ Column allowed_student_ids already exists in test_assignments",
    );
  }

  console.log(
    "✅ Migration 20260128_002_fix_missing_allowed_student_ids completed successfully",
  );
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Rolling back migration: 20260128_002_fix_missing_allowed_student_ids",
  );

  // При откате удаляем колонку, если она была добавлена
  // Но нужно быть осторожным, так как она может использоваться
  await connection.query(`
        ALTER TABLE test_assignments 
        DROP COLUMN allowed_student_ids;
    `);

  console.log(
    "✅ Rollback 20260128_002_fix_missing_allowed_student_ids completed successfully",
  );
};

export const description =
  "Восстановление отсутствующего поля allowed_student_ids в test_assignments";
