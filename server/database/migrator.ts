import { getDbPool, testConnection } from "../utils/db";
import type { PoolConnection } from "mysql2/promise";

// ============================================================================
// СТАТИЧЕСКИЕ ИМПОРТЫ МИГРАЦИЙ
// ============================================================================
// При добавлении новой миграции:
// 1. Создайте файл миграции в ./migrations/
// 2. Добавьте import ниже
// 3. Добавьте в MIGRATIONS_REGISTRY

import * as initialSchema from "./migrations/20251224_001_initial_schema";
import * as testingSystem from "./migrations/20260104_002_testing_system";
import * as attendanceSystem from "./migrations/20260109_003_attendance_system";
import * as studentPortal from "./migrations/20260110_004_student_portal";
import * as scheduleTemplates from "./migrations/20260123_005_schedule_templates";
import * as librarySystem from "./migrations/20260128_006_library_system";
import * as aiCertificateImport from "./migrations/20260203_007_ai_certificate_import";
import * as fixIssuedCertificatesSchema from "./migrations/20260203_008_fix_issued_certificates_schema";
import * as ensureDocxFileUrl from "./migrations/20260203_009_ensure_docx_file_url";
import * as addUserIdToStudents from "./migrations/20260203_010_add_user_id_to_students";
import * as aiSettings from "./migrations/20260203_011_ai_settings";

/**
 * ============================================================================
 * СИСТЕМА МИГРАЦИЙ СО СТАТИЧЕСКИМ РЕЕСТРОМ (Вариант C)
 * ============================================================================
 *
 * Преимущества:
 * ✅ Никаких проблем с путями — работает на 100% ОС
 * ✅ Нет динамических import() — TypeScript видит всё
 * ✅ Максимальная производительность — импорты на этапе компиляции
 * ✅ Tree-shaking работает корректно
 *
 * При добавлении новой миграции:
 * 1. Создайте файл миграции в ./migrations/
 * 2. Добавьте статический import выше
 * 3. Добавьте запись в MIGRATIONS_REGISTRY ниже
 * ============================================================================
 */

// ============================================================================
// ИНТЕРФЕЙС МИГРАЦИИ
// ============================================================================

interface Migration {
  name: string;
  up: (connection: PoolConnection) => Promise<void>;
  down: (connection: PoolConnection) => Promise<void>;
  description?: string;
}

// ============================================================================
// РЕЕСТР МИГРАЦИЙ (статический)
// ============================================================================

const MIGRATIONS_REGISTRY: Migration[] = [
  // ============================================================
  // Миграция 001: Начальная консолидированная схема
  // Объединяет все core-модули и базовую структуру
  // ============================================================
  {
    name: "20251224_001_initial_schema",
    up: initialSchema.up,
    down: initialSchema.down,
    description: initialSchema.description,
  },
  // ============================================================
  // Миграция 002: Система тестирования
  // ============================================================
  {
    name: "20260104_002_testing_system",
    up: testingSystem.up,
    down: testingSystem.down,
    description: testingSystem.description,
  },
  // ============================================================
  // Миграция 003: Система посещаемости (отметки, триггеры)
  // ============================================================
  {
    name: "20260109_003_attendance_system",
    up: attendanceSystem.up,
    down: attendanceSystem.down,
    description: attendanceSystem.description,
  },
  // ============================================================
  // Миграция 004: Портал студента (Настройки, Поддержка, Уведомления)
  // ============================================================
  {
    name: "20260110_004_student_portal",
    up: studentPortal.up,
    down: studentPortal.down,
    description: studentPortal.description,
  },
  // ============================================================
  // Миграция 005: Шаблоны расписания
  // ============================================================
  {
    name: "20260123_005_schedule_templates",
    up: scheduleTemplates.up,
    down: scheduleTemplates.down,
    description: scheduleTemplates.description,
  },
  // ============================================================
  // Миграция 006: Библиотека
  // ============================================================
  {
    name: "20260128_006_library_system",
    up: librarySystem.up,
    down: librarySystem.down,
    description: librarySystem.description,
  },
  // ============================================================
  // Миграция 007: AI-импорт сертификатов
  // ============================================================
  {
    name: "20260203_007_ai_certificate_import",
    up: aiCertificateImport.up,
    down: aiCertificateImport.down,
    description: aiCertificateImport.description,
  },
  // ============================================================
  // Миграция 008: Исправление схемы сертификатов
  // ============================================================
  {
    name: "20260203_008_fix_issued_certificates_schema",
    up: fixIssuedCertificatesSchema.up,
    down: fixIssuedCertificatesSchema.down,
    description: fixIssuedCertificatesSchema.description,
  },
  // ============================================================
  // Миграция 009: Ensure docx_file_url
  // ============================================================
  {
    name: "20260203_009_ensure_docx_file_url",
    up: ensureDocxFileUrl.up,
    down: ensureDocxFileUrl.down,
    description: ensureDocxFileUrl.description,
  },
  // ============================================================
  // Миграция 010: Add user_id to students table
  // ============================================================
  {
    name: "20260203_010_add_user_id_to_students",
    up: addUserIdToStudents.up,
    down: addUserIdToStudents.down,
    description: addUserIdToStudents.description,
  },
  // ============================================================
  // Миграция 011: Система настроек AI
  // ============================================================
  {
    name: "20260203_011_ai_settings",
    up: aiSettings.up,
    down: aiSettings.down,
    description: aiSettings.description,
  },
  // ============================================================
  // Новые миграции добавлять ниже
  // ============================================================
];

// ============================================================================
// МАППИНГ СТАРЫХ МИГРАЦИЙ НА КОНСОЛИДИРОВАННУЮ
// ============================================================================
// Если в БД есть записи о старых миграциях, они считаются частью
// консолидированной и не будут применены повторно.

const LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED = [
  // Original legacy
  "20251215_001_create_users_table",
  "20251215_002_seed_admin_user",
  "20251216_003_create_students_tables",
  "20251216_004_create_courses_tables",
  "20251217_005_update_instructors_table",
  "20251218_add_discipline_hours_breakdown",
  "20251218_007_create_files_table",
  "20251218_008_add_folders_support",
  "20251219_009_add_folder_password",
  "20251219_009_create_activity_logs_table",
  "20251222_010_create_study_groups_tables",
  "20251222_011_create_schedule_events_table",
  "20251224_012_fix_schedule_event_type",
  "20251224_013_create_organizations_table",
  "20251224_014_create_representatives_table",
  "20251224_015_create_telegram_sessions_table",
  "20251224_016_create_schedule_settings_table",
  "20251224_001_consolidated_schema",

  // Deleted in Feb 2026 consolidation
  "20251225_020_attendance_grades",
  "20251226_021_certificate_templates_extended",
  "20251226_022_certificate_visual_editor",
  "20251229_023_certificate_validity_and_permissions",
  "20251229_024_telegram_bot_requests",
  "20251229_025_unify_certificates",
  "20251230_026_user_entity_links",
  "20260103_027_activity_log_enum_expansion",
  "20260103_027_activity_log_view_action",
  "20260104_028_testing_system",
  "20260105_029_test_preview_mode",
  "20260105_030_preview_sessions_nullable_assignment",
  "20260105_031_preview_sessions_nullable_student",
  "20260105_032_multilang_questions",
  "20260106_033_grades_from_test",
  "20260106_034_certificate_standalone",
  "20260108_035_student_portal_tables",
  "20260108_036_student_notifications",
  "20260109_037_activity_log_action_types",
  "20260109_038_attendance_marking_system",
  "20260109_039_fix_attendance_trigger",
  "20260109_040_backfill_marking_status",
  "20260113_041_retake_system",
  "20260113_042_retake_linked_events",
  "20260113_043_schedule_events_allowed_students",
  "20260113_044_add_user_relations",
  "20260113_045_link_existing_users",
  "20260114_046_group_archive_system",
  "20260114_047_extend_files_for_groups",
  "20260114_048_course_archive_system",
  "20260115_051_add_user_search_indexes",
  "20260115_052_link_users_by_email",
  "20260121_001_add_academic_hour_setting",
  "20260121_002_add_duration_minutes",
  "20260122_001_add_academic_hours",
  "20260122_002_fix_files_group_id_type",
  "20260123_001_schedule_templates",
  "20260128_002_fix_missing_allowed_student_ids",
  "20260128_003_library_system",
];

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Создание таблицы для отслеживания миграций
 */
async function createMigrationsTable(
  connection: PoolConnection,
): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_executed_at (executed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * Получение списка выполненных миграций
 */
async function getExecutedMigrations(
  connection: PoolConnection,
): Promise<string[]> {
  const [rows] = await connection.query<any[]>(
    "SELECT name FROM migrations ORDER BY executed_at ASC",
  );
  return rows.map((row) => row.name);
}

/**
 * Запись выполненной миграции
 */
async function recordMigration(
  connection: PoolConnection,
  name: string,
  description?: string,
): Promise<void> {
  await connection.query(
    "INSERT INTO migrations (name, description) VALUES (?, ?)",
    [name, description || null],
  );
}

/**
 * Удаление записи о миграции
 */
async function removeMigrationRecord(
  connection: PoolConnection,
  name: string,
): Promise<void> {
  await connection.query("DELETE FROM migrations WHERE name = ?", [name]);
}

/**
 * Загрузка всех миграций из статического реестра
 */
function loadMigrations(): Migration[] {
  console.log(
    `📋 Loaded ${MIGRATIONS_REGISTRY.length} migrations from static registry`,
  );
  return MIGRATIONS_REGISTRY;
}

/**
 * Проверка, были ли применены старые миграции
 * Если да — консолидированная миграция уже неявно применена
 */
function hasLegacyMigrationsApplied(executedMigrations: string[]): boolean {
  return executedMigrations.some((m) =>
    LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED.includes(m),
  );
}

/**
 * Очистка записей о старых миграциях и добавление записи о консолидированной
 */
async function consolidateMigrationRecords(
  connection: PoolConnection,
): Promise<void> {
  console.log("🔄 Consolidating old migration records...");

  // Удаляем записи о старых миграциях
  if (LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED.length > 0) {
    // Use standard delete loop or optimize with IN clause if list isn't too huge.
    // Given ~20-30 items, loop is fine safe-wise, or single query.
    // Let's do a loop to be safe against huge query limits, though for 30 items IN is better.
    // But let's stick to simple loop as per original code style.
    for (const legacyMigration of LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED) {
      await connection.query("DELETE FROM migrations WHERE name = ?", [
        legacyMigration,
      ]);
    }
  }

  // Добавляем запись о консолидированной миграции
  await connection.query(
    `INSERT IGNORE INTO migrations (name, description) VALUES (?, ?)`,
    ["20251224_001_initial_schema", initialSchema.description],
  );

  console.log("✅ Migration records consolidated");
}

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ МИГРАЦИЙ
// ============================================================================

/**
 * Применение всех непримененных миграций
 */
export async function runMigrations(): Promise<void> {
  console.log("🔄 Starting database migrations...");

  try {
    // Проверка подключения
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to database");
    }

    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      // Создание таблицы миграций
      await createMigrationsTable(connection);

      // Получение выполненных миграций
      let executedMigrations = await getExecutedMigrations(connection);
      console.log(`ℹ️  Found ${executedMigrations.length} executed migrations`);

      // Проверяем, есть ли старые миграции в БД
      if (hasLegacyMigrationsApplied(executedMigrations)) {
        console.log("ℹ️  Legacy migrations detected, consolidating records...");
        await consolidateMigrationRecords(connection);
        // Обновляем список выполненных миграций
        executedMigrations = await getExecutedMigrations(connection);
      }

      // Загрузка всех миграций
      const allMigrations = loadMigrations();
      console.log(`ℹ️  Found ${allMigrations.length} migration files`);

      // Фильтрация непримененных миграций
      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration.name),
      );

      if (pendingMigrations.length === 0) {
        console.log("✅ All migrations are up to date");
        return;
      }

      console.log(
        `🔄 Running ${pendingMigrations.length} pending migrations...`,
      );

      // Применение миграций
      for (const migration of pendingMigrations) {
        console.log(`\n📦 Migration: ${migration.name}`);
        if (migration.description) {
          console.log(`   ${migration.description}`);
        }

        await connection.beginTransaction();

        try {
          await migration.up(connection);
          await recordMigration(
            connection,
            migration.name,
            migration.description,
          );
          await connection.commit();
          console.log(`✅ Migration ${migration.name} completed`);
        } catch (error) {
          await connection.rollback();
          console.error(`❌ Migration ${migration.name} failed:`, error);
          throw error;
        }
      }

      console.log("\n✅ All migrations completed successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Migration process failed:", error);
    throw error;
  }
}

/**
 * Откат последней миграции
 */
export async function rollbackMigration(): Promise<void> {
  console.log("🔄 Rolling back last migration...");

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      // Получение последней выполненной миграции
      const [rows] = await connection.query<any[]>(
        "SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1",
      );

      if (!rows || rows.length === 0) {
        console.log("ℹ️  No migrations to rollback");
        return;
      }

      const lastMigrationName = rows[0].name;
      console.log(`📦 Rolling back: ${lastMigrationName}`);

      // Загрузка миграции
      const allMigrations = loadMigrations();
      const migration = allMigrations.find((m) => m.name === lastMigrationName);

      if (!migration) {
        throw new Error(`Migration file not found: ${lastMigrationName}`);
      }

      await connection.beginTransaction();

      try {
        await migration.down(connection);
        await removeMigrationRecord(connection, lastMigrationName);
        await connection.commit();
        console.log(
          `✅ Migration ${lastMigrationName} rolled back successfully`,
        );
      } catch (error) {
        await connection.rollback();
        console.error(`❌ Rollback failed:`, error);
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Rollback process failed:", error);
    throw error;
  }
}

/**
 * Откат всех миграций
 */
export async function rollbackAllMigrations(): Promise<void> {
  console.log("⚠️  Rolling back ALL migrations...");

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const executedMigrations = await getExecutedMigrations(connection);

      if (executedMigrations.length === 0) {
        console.log("ℹ️  No migrations to rollback");
        return;
      }

      const allMigrations = loadMigrations();

      // Откат в обратном порядке
      for (let i = executedMigrations.length - 1; i >= 0; i--) {
        const migrationName = executedMigrations[i];
        const migration = allMigrations.find((m) => m.name === migrationName);

        if (!migration) {
          console.warn(
            `⚠️  Migration file not found: ${migrationName}, removing record...`,
          );
          await removeMigrationRecord(connection, migrationName);
          continue;
        }

        console.log(`\n📦 Rolling back: ${migrationName}`);

        await connection.beginTransaction();

        try {
          await migration.down(connection);
          await removeMigrationRecord(connection, migrationName);
          await connection.commit();
          console.log(`✅ Migration ${migrationName} rolled back`);
        } catch (error) {
          await connection.rollback();
          console.error(`❌ Rollback failed for ${migrationName}:`, error);
          throw error;
        }
      }

      console.log("\n✅ All migrations rolled back successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Rollback all process failed:", error);
    throw error;
  }
}

/**
 * Получение статуса миграций
 */
export async function getMigrationStatus(): Promise<void> {
  console.log("📊 Migration Status\n");

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await createMigrationsTable(connection);

      const executedMigrations = await getExecutedMigrations(connection);
      const allMigrations = loadMigrations();

      // Проверяем на старые миграции
      const hasLegacy = hasLegacyMigrationsApplied(executedMigrations);

      console.log(`Total migrations: ${allMigrations.length}`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(
        `Pending: ${allMigrations.length - executedMigrations.length}`,
      );

      if (hasLegacy) {
        console.log(
          "\n⚠️  Legacy migrations detected! Run migrations to consolidate.",
        );
      }

      console.log("\nExecuted Migrations:");
      executedMigrations.forEach((m) => console.log(` - ${m}`));

      console.log("\nPending Migrations:");
      allMigrations
        .filter((m) => !executedMigrations.includes(m.name))
        .forEach((m) => console.log(` - ${m.name}`));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Status check failed:", error);
  }
}
