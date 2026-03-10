import type { PoolConnection } from "mysql2/promise";

export const description =
  "Training Requests System — заявки представителей на обучение сотрудников (заголовок + позиции)";

export async function up(connection: PoolConnection): Promise<void> {
  // ------------------------------------------------------------------
  // Таблица 1: Заголовок заявки
  // Одна заявка = один документ от представителя.
  // Внутри может быть несколько позиций (курс + группа + месяц).
  // ------------------------------------------------------------------
  await connection.query(`
    CREATE TABLE IF NOT EXISTS training_requests (
      id                VARCHAR(36)   NOT NULL PRIMARY KEY DEFAULT (UUID()),

      -- Кто подал заявку
      representative_id VARCHAR(36)   NOT NULL,
      organization_id   VARCHAR(36)   NOT NULL,

      -- Агрегированные счётчики (денормализация для быстрой аналитики)
      total_items_count   INT NOT NULL DEFAULT 0 COMMENT 'Кол-во позиций в заявке',
      total_students_count INT NOT NULL DEFAULT 0 COMMENT 'Итого уникальных слушателей',

      -- Статус заявки (единый на всю заявку)
      status            ENUM('pending','approved','rejected','in_progress','completed')
                        NOT NULL DEFAULT 'pending',

      -- Административные статусы (независимы от основного)
      contract_status   ENUM('not_signed','signed') NOT NULL DEFAULT 'not_signed',
      payment_status    ENUM('not_paid','paid')     NOT NULL DEFAULT 'not_paid',

      -- Коммуникация
      admin_comment     TEXT,

      -- Аудит
      created_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                        ON UPDATE CURRENT_TIMESTAMP(3),
      reviewed_at       DATETIME(3),
      reviewed_by       VARCHAR(36)   COMMENT 'FK -> users.id',

      INDEX idx_tr_representative  (representative_id),
      INDEX idx_tr_organization    (organization_id),
      INDEX idx_tr_status          (status),
      INDEX idx_tr_created_at      (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ------------------------------------------------------------------
  // Таблица 2: Позиции заявки
  // Каждая позиция = один курс + одна группа (список слушателей + месяц).
  // Одна заявка может содержать N позиций.
  //
  // Пример:
  //   Заявка #1:
  //     Позиция 1: курс "ИОТ", слушатели [A,B,C], месяц 2026-04
  //     Позиция 2: курс "ИОТ", слушатели [D,E],   месяц 2026-05
  //     Позиция 3: курс "ПК",  слушатели [A,F],   месяц 2026-04
  // ------------------------------------------------------------------
  await connection.query(`
    CREATE TABLE IF NOT EXISTS training_request_items (
      id              VARCHAR(36)   NOT NULL PRIMARY KEY DEFAULT (UUID()),
      request_id      VARCHAR(36)   NOT NULL COMMENT 'FK -> training_requests.id',

      -- Курс и период
      course_id       VARCHAR(36)   NOT NULL COMMENT 'FK -> courses.id',
      course_name     VARCHAR(500)  NOT NULL COMMENT 'Денормализованное название для истории',
      training_month  VARCHAR(7)    NOT NULL COMMENT 'Формат YYYY-MM, например 2026-04',

      -- Список слушателей (снимок на момент подачи)
      student_ids     JSON          NOT NULL COMMENT 'Массив UUID из таблицы students',
      students_count  INT           NOT NULL DEFAULT 0,

      -- Произвольное название группы от представителя (опционально)
      group_label     VARCHAR(255)  COMMENT 'Например: Группа 1, Бухгалтерия, и т.д.',

      -- Порядок отображения внутри заявки
      sort_order      INT           NOT NULL DEFAULT 0,

      created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

      INDEX idx_tri_request_id     (request_id),
      INDEX idx_tri_course_id      (course_id),
      INDEX idx_tri_training_month (training_month),

      CONSTRAINT fk_tri_request FOREIGN KEY (request_id)
        REFERENCES training_requests (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(connection: PoolConnection): Promise<void> {
  await connection.query(`DROP TABLE IF EXISTS training_request_items`);
  await connection.query(`DROP TABLE IF EXISTS training_requests`);
}
