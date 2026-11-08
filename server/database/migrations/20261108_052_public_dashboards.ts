import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: публичные дашборды
 * Дата: 2026-11-08
 *
 * Дашборд — набор виджетов, доступный по публичной ссылке /d/<token>
 * (экран в холле, ТВ, презентация для заказчика). Настройки ссылки:
 * активность, пароль, срок действия; счётчик просмотров.
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: public_dashboards');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS public_dashboards (
      id             CHAR(36)      NOT NULL DEFAULT (UUID()),
      title          VARCHAR(200)  NOT NULL,
      description    VARCHAR(1000) NULL,
      token          VARCHAR(64)   NOT NULL COMMENT 'Секрет публичной ссылки',
      widgets        JSON          NOT NULL COMMENT 'Список виджетов (тип, размер, опции)',
      settings       JSON          NOT NULL COMMENT 'Оформление и поведение',
      is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
      password_hash  VARCHAR(255)  NULL COMMENT 'bcrypt; NULL — без пароля',
      expires_at     DATETIME      NULL COMMENT 'NULL — бессрочно',
      view_count     INT UNSIGNED  NOT NULL DEFAULT 0,
      last_viewed_at DATETIME(3)   NULL,
      created_by     VARCHAR(191)  NULL,
      created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_public_dashboards_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Публичные дашборды по ссылке'
  `);

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`DROP TABLE IF EXISTS public_dashboards`);
};

export const description = 'Публичные дашборды: виджеты и настройки публичной ссылки';
