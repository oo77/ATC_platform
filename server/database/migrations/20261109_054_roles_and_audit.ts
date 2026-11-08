import type { PoolConnection } from "mysql2/promise";
import { ROLE_PERMISSIONS } from "../../types/permissions";

/**
 * Миграция: гибкие роли и журнал аудита
 * Дата: 2026-11-09
 *
 * 1. roles / role_permissions — роли стали данными: админ создаёт роль и отмечает права.
 *    users.role_id — назначенная роль. users.role (ENUM) остаётся «профилем кабинета»
 *    (ADMIN / MANAGER / TEACHER / STUDENT): какой дашборд и меню показывать.
 *    Права берутся ТОЛЬКО из роли (role_permissions).
 * 2. Системные роли создаются из текущего ROLE_PERMISSIONS 1:1 — поведение не меняется.
 *    ADMIN — системная роль, всегда имеет все права (в т.ч. появившиеся позже).
 * 3. audit_events — журнал аудита: кто (с ролью на момент действия), что, над чем,
 *    какие поля изменились (было → стало), результат, IP, источник, id запроса.
 *    Старая activity_logs остаётся для чтения истории.
 */

export const description = "Гибкие роли (roles, role_permissions, users.role_id) и журнал аудита (audit_events)";

const SYSTEM_ROLES = [
  { id: "role_admin", code: "ADMIN", name: "Администратор", description: "Полный доступ ко всем функциям. Системная роль.", baseProfile: "ADMIN", isSystem: 1 },
  { id: "role_manager", code: "MANAGER", name: "Модератор", description: "Управление учебным процессом и данными.", baseProfile: "MANAGER", isSystem: 0 },
  { id: "role_teacher", code: "TEACHER", name: "Преподаватель", description: "Свои группы, журнал, оценки, тесты.", baseProfile: "TEACHER", isSystem: 0 },
  { id: "role_student", code: "STUDENT", name: "Слушатель", description: "Своё расписание, тесты, сертификаты.", baseProfile: "STUDENT", isSystem: 0 },
] as const;

async function columnExists(c: PoolConnection, table: string, column: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return (rows as any[]).length > 0;
}

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: roles_and_audit");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id            VARCHAR(191) NOT NULL PRIMARY KEY,
      code          VARCHAR(64)  NOT NULL UNIQUE,
      name          VARCHAR(191) NOT NULL,
      description   TEXT NULL,
      base_profile  ENUM('ADMIN','MANAGER','TEACHER','STUDENT') NOT NULL DEFAULT 'MANAGER',
      is_system     TINYINT(1) NOT NULL DEFAULT 0,
      created_by    VARCHAR(191) NULL,
      created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id     VARCHAR(191) NOT NULL,
      permission  VARCHAR(100) NOT NULL,
      PRIMARY KEY (role_id, permission),
      CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists(connection, "users", "role_id"))) {
    await connection.query(`ALTER TABLE users ADD COLUMN role_id VARCHAR(191) NULL AFTER role, ADD INDEX idx_users_role_id (role_id)`);
  }

  for (const r of SYSTEM_ROLES) {
    await connection.query(
      `INSERT IGNORE INTO roles (id, code, name, description, base_profile, is_system) VALUES (?, ?, ?, ?, ?, ?)`,
      [r.id, r.code, r.name, r.description, r.baseProfile, r.isSystem],
    );
    // ADMIN получает все права динамически в коде — строки для него не храним
    if (r.code === "ADMIN") continue;
    const perms = (ROLE_PERMISSIONS as Record<string, string[]>)[r.code] || [];
    for (const p of perms) {
      await connection.query(`INSERT IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)`, [r.id, p]);
    }
  }

  await connection.query(`
    UPDATE users SET role_id = CONCAT('role_', LOWER(role)) WHERE role_id IS NULL
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      occurred_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      request_id      CHAR(36) NULL,
      actor_user_id   VARCHAR(191) NULL,
      actor_name      VARCHAR(191) NULL,
      actor_role_id   VARCHAR(191) NULL,
      actor_role_name VARCHAR(191) NULL,
      source          VARCHAR(20) NOT NULL DEFAULT 'web',
      action          VARCHAR(100) NOT NULL,
      category        VARCHAR(32) NOT NULL DEFAULT 'data',
      entity_type     VARCHAR(64) NULL,
      entity_id       VARCHAR(191) NULL,
      entity_label    VARCHAR(255) NULL,
      outcome         VARCHAR(16) NOT NULL DEFAULT 'success',
      summary         VARCHAR(500) NOT NULL,
      changes         JSON NULL,
      metadata        JSON NULL,
      ip_address      VARCHAR(45) NULL,
      user_agent      VARCHAR(500) NULL,
      http_method     VARCHAR(10) NULL,
      http_path       VARCHAR(500) NULL,
      http_status     SMALLINT NULL,
      INDEX idx_audit_time (occurred_at),
      INDEX idx_audit_actor (actor_user_id, occurred_at),
      INDEX idx_audit_entity (entity_type, entity_id, occurred_at),
      INDEX idx_audit_action (action),
      INDEX idx_audit_category (category, occurred_at),
      INDEX idx_audit_request (request_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("✅ Migration roles_and_audit completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`DROP TABLE IF EXISTS audit_events`);
  if (await columnExists(connection, "users", "role_id")) {
    await connection.query(`ALTER TABLE users DROP INDEX idx_users_role_id, DROP COLUMN role_id`);
  }
  await connection.query(`DROP TABLE IF EXISTS role_permissions`);
  await connection.query(`DROP TABLE IF EXISTS roles`);
};
