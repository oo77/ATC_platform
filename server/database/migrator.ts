import { getDbPool, testConnection } from '../utils/db';
import type { PoolConnection } from 'mysql2/promise';

// ============================================================================
// СТАТИЧЕСКИЕ ИМПОРТЫ МИГРАЦИЙ
// ============================================================================
// При добавлении новой миграции:
// 1. Создайте файл миграции в ./migrations/
// 2. Добавьте import ниже
// 3. Добавьте в MIGRATIONS_REGISTRY

import * as consolidatedSchema from './migrations/20251224_001_consolidated_schema';
import * as attendanceGrades from './migrations/20251225_020_attendance_grades';
import * as certificateTemplatesExtended from './migrations/20251226_021_certificate_templates_extended';
import * as certificateVisualEditor from './migrations/20251226_022_certificate_visual_editor';
import * as certificateValidityAndPermissions from './migrations/20251229_023_certificate_validity_and_permissions';
import * as telegramBotRequests from './migrations/20251229_024_telegram_bot_requests';
import * as unifyCertificates from './migrations/20251229_025_unify_certificates';
import * as userEntityLinks from './migrations/20251230_026_user_entity_links';
import * as activityLogEnumExpansion from './migrations/20260103_027_activity_log_view_action';
import * as testingSystem from './migrations/20260104_028_testing_system';
import * as testPreviewMode from './migrations/20260105_029_test_preview_mode';
import * as previewSessionsNullableAssignment from './migrations/20260105_030_preview_sessions_nullable_assignment';
import * as previewSessionsNullableStudent from './migrations/20260105_031_preview_sessions_nullable_student';
import * as multilangQuestions from './migrations/20260105_032_multilang_questions';
import * as gradesFromTest from './migrations/20260106_033_grades_from_test';
import * as certificateStandalone from './migrations/20260106_034_certificate_standalone';
import * as studentPortalTables from './migrations/20260108_035_student_portal_tables';
import * as studentNotifications from './migrations/20260108_036_student_notifications';
import * as activityLogActionTypes from './migrations/20260109_037_activity_log_action_types';
import * as attendanceMarkingSystem from './migrations/20260109_038_attendance_marking_system';
import * as fixAttendanceTrigger from './migrations/20260109_039_fix_attendance_trigger';

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
  // Консолидированная миграция - полная схема БД
  // Объединяет все предыдущие миграции в одну актуальную
  // ============================================================
  {
    name: '20251224_001_consolidated_schema',
    up: consolidatedSchema.up,
    down: consolidatedSchema.down,
    description: consolidatedSchema.description,
  },
  // ============================================================
  // Миграция 020: Посещаемость и оценки
  // ============================================================
  {
    name: '20251225_020_attendance_grades',
    up: attendanceGrades.up,
    down: attendanceGrades.down,
    description: attendanceGrades.description,
  },
  // ============================================================
  // Миграция 021: Расширение шаблонов сертификатов
  // ============================================================
  {
    name: '20251226_021_certificate_templates_extended',
    up: certificateTemplatesExtended.up,
    down: certificateTemplatesExtended.down,
    description: certificateTemplatesExtended.description,
  },
  // ============================================================
  // Миграция 022: Визуальный редактор сертификатов
  // ============================================================
  {
    name: '20251226_022_certificate_visual_editor',
    up: certificateVisualEditor.up,
    down: certificateVisualEditor.down,
    description: certificateVisualEditor.description,
  },
  // ============================================================
  // Миграция 023: Срок действия сертификатов и разрешения представителей
  // ============================================================
  {
    name: '20251229_023_certificate_validity_and_permissions',
    up: certificateValidityAndPermissions.up,
    down: certificateValidityAndPermissions.down,
    description: certificateValidityAndPermissions.description,
  },
  // ============================================================
  // Миграция 024: Журнал запросов Telegram-бота
  // ============================================================
  {
    name: '20251229_024_telegram_bot_requests',
    up: telegramBotRequests.up,
    down: telegramBotRequests.down,
    description: telegramBotRequests.description,
  },
  // ============================================================
  // Миграция 025: Объединение таблиц сертификатов
  // ============================================================
  {
    name: '20251229_025_unify_certificates',
    up: unifyCertificates.up,
    down: unifyCertificates.down,
    description: unifyCertificates.description,
  },
  // ============================================================
  // Миграция 026: Связь Users с Students/Instructors для системы разрешений
  // ============================================================
  {
    name: '20251230_026_user_entity_links',
    up: userEntityLinks.up,
    down: userEntityLinks.down,
    description: userEntityLinks.description,
  },
  // ============================================================
  // Миграция 027: Расширение ENUM для activity_logs
  // ============================================================
  {
    name: '20260103_027_activity_log_enum_expansion',
    up: activityLogEnumExpansion.up,
    down: activityLogEnumExpansion.down,
    description: activityLogEnumExpansion.description,
  },
  // ============================================================
  // Миграция 028: Система тестирования студентов
  // ============================================================
  {
    name: '20260104_028_testing_system',
    up: testingSystem.up,
    down: testingSystem.down,
    description: testingSystem.description,
  },
  // ============================================================
  // Миграция 029: Режим предпросмотра тестов
  // ============================================================
  {
    name: '20260105_029_test_preview_mode',
    up: testPreviewMode.up,
    down: testPreviewMode.down,
    description: testPreviewMode.name,
  },
  // ============================================================
  // Миграция 030: Nullable assignment_id для preview-сессий
  // ============================================================
  {
    name: '20260105_030_preview_sessions_nullable_assignment',
    up: previewSessionsNullableAssignment.up,
    down: previewSessionsNullableAssignment.down,
    description: previewSessionsNullableAssignment.name,
  },
  // ============================================================
  // Миграция 031: Nullable student_id для preview-сессий
  // ============================================================
  {
    name: '20260105_031_preview_sessions_nullable_student',
    up: previewSessionsNullableStudent.up,
    down: previewSessionsNullableStudent.down,
    description: previewSessionsNullableStudent.name,
  },
  // ============================================================
  // Миграция 032: Многоязычная поддержка вопросов
  // ============================================================
  {
    name: '20260105_032_multilang_questions',
    up: multilangQuestions.up,
    down: multilangQuestions.down,
    description: multilangQuestions.description,
  },
  // ============================================================
  // Миграция 033: Поддержка оценок из тестов
  // ============================================================
  {
    name: '20260106_033_grades_from_test',
    up: gradesFromTest.up,
    down: gradesFromTest.down,
    description: gradesFromTest.description,
  },
  // ============================================================
  // Миграция 034: Поддержка standalone сертификатов (импорт, ручное добавление)
  // ============================================================
  {
    name: '20260106_034_certificate_standalone',
    up: certificateStandalone.up,
    down: certificateStandalone.down,
    description: certificateStandalone.description,
  },
  // ============================================================
  // Миграция 035: Портал студента (Настройки и Поддержка)
  // ============================================================
  {
    name: '20260108_035_student_portal_tables',
    up: studentPortalTables.up,
    down: studentPortalTables.down,
    description: 'User settings and support tickets tables',
  },
  // ============================================================
  // Миграция 036: Уведомления студентов
  // ============================================================
  {
    name: '20260108_036_student_notifications',
    up: studentNotifications.up,
    down: studentNotifications.down,
    description: studentNotifications.description,
  },
  // ============================================================
  // Миграция 037: Расширение action_type ENUM для activity_logs
  // ============================================================
  {
    name: '20260109_037_activity_log_action_types',
    up: activityLogActionTypes.up,
    down: activityLogActionTypes.down,
    description: activityLogActionTypes.description,
  },
  // ============================================================
  // Миграция 038: Система допуска отметок посещаемости инструкторами
  // ============================================================
  {
    name: '20260109_038_attendance_marking_system',
    up: attendanceMarkingSystem.up,
    down: attendanceMarkingSystem.down,
    description: attendanceMarkingSystem.description,
  },
  // ============================================================
  // Миграция 039: Исправление триггера посещаемости
  // ============================================================
  {
    name: '20260109_039_fix_attendance_trigger',
    up: fixAttendanceTrigger.up,
    down: fixAttendanceTrigger.down,
    description: fixAttendanceTrigger.description,
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
  '20251215_001_create_users_table',
  '20251215_002_seed_admin_user',
  '20251216_003_create_students_tables',
  '20251216_004_create_courses_tables',
  '20251217_005_update_instructors_table',
  '20251218_add_discipline_hours_breakdown',
  '20251218_007_create_files_table',
  '20251218_008_add_folders_support',
  '20251219_009_add_folder_password',
  '20251219_009_create_activity_logs_table',
  '20251222_010_create_study_groups_tables',
  '20251222_011_create_schedule_events_table',
  '20251224_012_fix_schedule_event_type',
  '20251224_013_create_organizations_table',
  '20251224_014_create_representatives_table',
  '20251224_015_create_telegram_sessions_table',
  '20251224_016_create_schedule_settings_table',
];

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Создание таблицы для отслеживания миграций
 */
async function createMigrationsTable(connection: PoolConnection): Promise<void> {
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
async function getExecutedMigrations(connection: PoolConnection): Promise<string[]> {
  const [rows] = await connection.query<any[]>(
    'SELECT name FROM migrations ORDER BY executed_at ASC'
  );
  return rows.map((row) => row.name);
}

/**
 * Запись выполненной миграции
 */
async function recordMigration(
  connection: PoolConnection,
  name: string,
  description?: string
): Promise<void> {
  await connection.query(
    'INSERT INTO migrations (name, description) VALUES (?, ?)',
    [name, description || null]
  );
}

/**
 * Удаление записи о миграции
 */
async function removeMigrationRecord(
  connection: PoolConnection,
  name: string
): Promise<void> {
  await connection.query('DELETE FROM migrations WHERE name = ?', [name]);
}

/**
 * Загрузка всех миграций из статического реестра
 */
function loadMigrations(): Migration[] {
  console.log(`📋 Loaded ${MIGRATIONS_REGISTRY.length} migrations from static registry`);
  return MIGRATIONS_REGISTRY;
}

/**
 * Проверка, были ли применены старые миграции
 * Если да — консолидированная миграция уже неявно применена
 */
function hasLegacyMigrationsApplied(executedMigrations: string[]): boolean {
  return executedMigrations.some(m => LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED.includes(m));
}

/**
 * Очистка записей о старых миграциях и добавление записи о консолидированной
 */
async function consolidateMigrationRecords(connection: PoolConnection): Promise<void> {
  console.log('🔄 Consolidating old migration records...');

  // Удаляем записи о старых миграциях
  for (const legacyMigration of LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED) {
    await connection.query('DELETE FROM migrations WHERE name = ?', [legacyMigration]);
  }

  // Добавляем запись о консолидированной миграции
  await connection.query(
    `INSERT IGNORE INTO migrations (name, description) VALUES (?, ?)`,
    ['20251224_001_consolidated_schema', consolidatedSchema.description]
  );

  console.log('✅ Migration records consolidated');
}

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ МИГРАЦИЙ
// ============================================================================

/**
 * Применение всех непримененных миграций
 */
export async function runMigrations(): Promise<void> {
  console.log('🔄 Starting database migrations...');

  try {
    // Проверка подключения
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
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
        console.log('ℹ️  Legacy migrations detected, consolidating records...');
        await consolidateMigrationRecords(connection);
        // Обновляем список выполненных миграций
        executedMigrations = await getExecutedMigrations(connection);
      }

      // Загрузка всех миграций
      const allMigrations = loadMigrations();
      console.log(`ℹ️  Found ${allMigrations.length} migration files`);

      // Фильтрация непримененных миграций
      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration.name)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations are up to date');
        return;
      }

      console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

      // Применение миграций
      for (const migration of pendingMigrations) {
        console.log(`\n📦 Migration: ${migration.name}`);
        if (migration.description) {
          console.log(`   ${migration.description}`);
        }

        await connection.beginTransaction();

        try {
          await migration.up(connection);
          await recordMigration(connection, migration.name, migration.description);
          await connection.commit();
          console.log(`✅ Migration ${migration.name} completed`);
        } catch (error) {
          await connection.rollback();
          console.error(`❌ Migration ${migration.name} failed:`, error);
          throw error;
        }
      }

      console.log('\n✅ All migrations completed successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    throw error;
  }
}

/**
 * Откат последней миграции
 */
export async function rollbackMigration(): Promise<void> {
  console.log('🔄 Rolling back last migration...');

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      // Получение последней выполненной миграции
      const [rows] = await connection.query<any[]>(
        'SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1'
      );

      if (!rows || rows.length === 0) {
        console.log('ℹ️  No migrations to rollback');
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
        console.log(`✅ Migration ${lastMigrationName} rolled back successfully`);
      } catch (error) {
        await connection.rollback();
        console.error(`❌ Rollback failed:`, error);
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Rollback process failed:', error);
    throw error;
  }
}

/**
 * Откат всех миграций
 */
export async function rollbackAllMigrations(): Promise<void> {
  console.log('⚠️  Rolling back ALL migrations...');

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      const executedMigrations = await getExecutedMigrations(connection);

      if (executedMigrations.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      const allMigrations = loadMigrations();

      // Откат в обратном порядке
      for (let i = executedMigrations.length - 1; i >= 0; i--) {
        const migrationName = executedMigrations[i];
        const migration = allMigrations.find((m) => m.name === migrationName);

        if (!migration) {
          console.warn(`⚠️  Migration file not found: ${migrationName}, removing record...`);
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

      console.log('\n✅ All migrations rolled back successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Rollback all process failed:', error);
    throw error;
  }
}

/**
 * Получение статуса миграций
 */
export async function getMigrationStatus(): Promise<void> {
  console.log('📊 Migration Status\n');

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
      console.log(`Pending: ${allMigrations.length - executedMigrations.length}`);

      if (hasLegacy) {
        console.log(`\n⚠️  Legacy migrations detected. Run migrations to consolidate.`);
      }

      console.log('\nMigrations:');
      for (const migration of allMigrations) {
        const status = executedMigrations.includes(migration.name) ? '✅' : '⏳';
        console.log(`${status} ${migration.name}`);
        if (migration.description) {
          console.log(`   ${migration.description}`);
        }
      }

      if (hasLegacy) {
        console.log('\nLegacy migrations in database (will be consolidated):');
        for (const legacyMigration of LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED) {
          if (executedMigrations.includes(legacyMigration)) {
            console.log(`  📦 ${legacyMigration}`);
          }
        }
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    throw error;
  }
}

/**
 * Сброс таблицы миграций (опасно! только для разработки)
 */
export async function resetMigrations(): Promise<void> {
  console.log('⚠️  Resetting migrations table...');

  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.query('DROP TABLE IF EXISTS migrations');
      console.log('✅ Migrations table dropped');

      await createMigrationsTable(connection);
      console.log('✅ Migrations table recreated');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  }
}
