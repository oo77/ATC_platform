import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Fix AI Logs Foreign Key
 * Дата: 2026-02-06
 * Описание: Исправление внешнего ключа processed_by в таблице ai_certificate_processing_logs.
 *            Позволяет сохранять ID представителя, который не является системным пользователем (User).
 */

export const description = "Fix AI Logs Foreign Key for Representatives";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Fix AI Logs Foreign Key");

  // Проверяем существование ключа перед удалением
  // В MySQL имена внешних ключей уникальны в пределах базы (обычно), но лучше проверить
  try {
    await connection.query(`
      ALTER TABLE ai_certificate_processing_logs
      DROP FOREIGN KEY fk_ai_logs_user
    `);
    console.log("✅ Внешний ключ fk_ai_logs_user удален");
  } catch (error: any) {
    if (error.code === "ER_CANT_DROP_FIELD_OR_KEY") {
      console.log(
        "⚠️ Внешний ключ fk_ai_logs_user не найден, пропускаем удаление",
      );
    } else {
      throw error;
    }
  }

  // Делаем поле NULLable (опционально, но полезно) и убираем ограничение
  // Также добавляем поле representative_id для явной связи
  await connection.query(`
    ALTER TABLE ai_certificate_processing_logs
    MODIFY COLUMN processed_by VARCHAR(191) NULL COMMENT 'ID администратора или представителя',
    ADD COLUMN representative_id VARCHAR(191) NULL COMMENT 'ID представителя организации (если применимо)',
    ADD INDEX idx_representative_id (representative_id),
    ADD CONSTRAINT fk_ai_logs_representative
      FOREIGN KEY (representative_id) REFERENCES organization_representatives(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  `);

  console.log("✅ Таблица ai_certificate_processing_logs обновлена");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: Fix AI Logs Foreign Key");

  // Удаляем поле representative_id
  await connection.query(`
    ALTER TABLE ai_certificate_processing_logs
    DROP FOREIGN KEY fk_ai_logs_representative,
    DROP COLUMN representative_id
  `);

  // Возвращаем FK на users (ОСТОРОЖНО: Это упадет, если в таблице есть ID представителей)
  // Поэтому в down мы пытаемся вернуть FK, но если данные не соответствуют, придется очистить некорректные данные или пропустить

  try {
    // Удаляем записи с некорректными ID перед восстановлением ключа (жестко, но для dev ок)
    // Или просто оставляем без ключа в rollback, так как rollback должен быть безопасным.
    // Но по-хорошему rollback должен возвращать схему в исходное состояние.

    await connection.query(`
      ALTER TABLE ai_certificate_processing_logs
      MODIFY COLUMN processed_by VARCHAR(191) NOT NULL COMMENT 'ID администратора',
      ADD CONSTRAINT fk_ai_logs_user
        FOREIGN KEY (processed_by) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  } catch (e) {
    console.warn(
      "⚠️ Не удалось восстановить FK fk_ai_logs_user при откате (возможно есть некорректные данные):",
      e,
    );
  }
};
