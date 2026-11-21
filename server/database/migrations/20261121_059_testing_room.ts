import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: класс тестирования (компьютеры по IP и рассадка слушателей).
 * Дата: 2026-11-21
 *
 * testing_workstations — компьютеры класса: статический IP в локальной сети
 *   и понятное название («Компьютер 1»). Компьютер узнаётся по IP, с которого
 *   браузер подключился к платформе по WebSocket.
 * testing_seats — посадка слушателя за компьютер на конкретный тест.
 *   Пока посадка в статусе pending, компьютеру отправляется одноразовый билет
 *   (в БД хранится только его SHA-256); по билету компьютер сам входит
 *   под слушателем и открывает тест.
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS testing_workstations (
      id VARCHAR(191) PRIMARY KEY,
      number INT NOT NULL COMMENT 'Номер компьютера в классе',
      name VARCHAR(100) NOT NULL,
      ip_address VARCHAR(64) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_tw_ip (ip_address),
      INDEX idx_tw_number (number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS testing_seats (
      id VARCHAR(191) PRIMARY KEY,
      workstation_id VARCHAR(191) NOT NULL,
      assignment_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      language VARCHAR(10) NOT NULL,
      status ENUM('pending','claimed','released','cancelled') NOT NULL DEFAULT 'pending',
      ticket_hash CHAR(64) NULL,
      ticket_expires_at DATETIME(3) NULL,
      session_id VARCHAR(191) NULL,
      assigned_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      claimed_at DATETIME(3) NULL,
      released_at DATETIME(3) NULL,

      INDEX idx_ts_workstation_status (workstation_id, status),
      INDEX idx_ts_assignment (assignment_id),
      INDEX idx_ts_student (student_id),
      UNIQUE KEY uq_ts_ticket (ticket_hash),

      CONSTRAINT fk_tseat_workstation FOREIGN KEY (workstation_id) REFERENCES testing_workstations(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_tseat_assignment FOREIGN KEY (assignment_id) REFERENCES test_assignments(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_tseat_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_tseat_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query('DROP TABLE IF EXISTS testing_seats');
  await connection.query('DROP TABLE IF EXISTS testing_workstations');
};

export const description = 'testing_workstations / testing_seats: класс тестирования, вход в тест по компьютеру';
