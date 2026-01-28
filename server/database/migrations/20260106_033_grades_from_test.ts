/**
 * Миграция 033: Поддержка оценок из тестов
 * Добавляет поля для отслеживания автоматических оценок из тестов
 * и возможности отметить изменённые оценки
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "Добавление полей для оценок из тестов и отслеживания изменений";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("  Adding test-related fields to grades table...");

  // Добавляем поле is_from_test - оценка автоматически выставлена из теста
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD COLUMN is_from_test BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Оценка автоматически выставлена из теста'
        AFTER grade
      `);
    console.log("  ✅ Added column: is_from_test");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("  ⚠️ Column grades.is_from_test already exists. Skipping.");
    } else {
      throw e;
    }
  }

  // Добавляем поле test_session_id - ссылка на сессию теста
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD COLUMN test_session_id VARCHAR(191) NULL 
        COMMENT 'ID сессии теста (если оценка из теста)'
        AFTER is_from_test
      `);
    console.log("  ✅ Added column: test_session_id");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log(
        "  ⚠️ Column grades.test_session_id already exists. Skipping.",
      );
    } else {
      throw e;
    }
  }

  // Добавляем поле original_grade - исходная оценка (до изменения)
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD COLUMN original_grade INT NULL 
        COMMENT 'Исходная оценка из теста (до изменения инструктором)'
        AFTER test_session_id
      `);
    console.log("  ✅ Added column: original_grade");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log(
        "  ⚠️ Column grades.original_grade already exists. Skipping.",
      );
    } else {
      throw e;
    }
  }

  // Добавляем поле is_modified - оценка была изменена инструктором
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD COLUMN is_modified BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Оценка была изменена инструктором вручную'
        AFTER original_grade
      `);
    console.log("  ✅ Added column: is_modified");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("  ⚠️ Column grades.is_modified already exists. Skipping.");
    } else {
      throw e;
    }
  }

  // Добавляем поле modified_by - кто изменил оценку
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD COLUMN modified_by VARCHAR(191) NULL 
        COMMENT 'Кто изменил оценку'
        AFTER is_modified
      `);
    console.log("  ✅ Added column: modified_by");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("  ⚠️ Column grades.modified_by already exists. Skipping.");
    } else {
      throw e;
    }
  }

  // Добавляем поле modified_at - когда изменена
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD COLUMN modified_at DATETIME(3) NULL 
        COMMENT 'Когда была изменена оценка'
        AFTER modified_by
      `);
    console.log("  ✅ Added column: modified_at");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("  ⚠️ Column grades.modified_at already exists. Skipping.");
    } else {
      throw e;
    }
  }

  // Добавляем индекс для поиска оценок из тестов
  try {
    await connection.query(`
        CREATE INDEX idx_grades_from_test ON grades(is_from_test)
      `);
    console.log("  ✅ Added index: idx_grades_from_test");
  } catch (e: any) {
    if (e.code === "ER_DUP_KEYNAME") {
      console.log("  ⚠️ Index idx_grades_from_test already exists. Skipping.");
    } else {
      console.warn(
        "  ⚠️ Warning creating index idx_grades_from_test:",
        e.message,
      );
    }
  }

  // Добавляем индекс для поиска изменённых оценок
  try {
    await connection.query(`
        CREATE INDEX idx_grades_modified ON grades(is_modified)
      `);
    console.log("  ✅ Added index: idx_grades_modified");
  } catch (e: any) {
    if (e.code === "ER_DUP_KEYNAME") {
      console.log("  ⚠️ Index idx_grades_modified already exists. Skipping.");
    } else {
      console.warn(
        "  ⚠️ Warning creating index idx_grades_modified:",
        e.message,
      );
    }
  }

  // Добавляем FK на test_sessions
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD CONSTRAINT fk_grades_test_session
        FOREIGN KEY (test_session_id) REFERENCES test_sessions(id)
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
    console.log("  ✅ Added FK: fk_grades_test_session");
  } catch (e: any) {
    if (e.code === "ER_DUP_KEYNAME" || e.code === "ER_DUP_KEY") {
      console.log("  ⚠️ FK fk_grades_test_session already exists. Skipping.");
    } else {
      // Sometimes MySQL throws weird errors if index exists but constraint name differs, or vice versa
      // We'll log warning but proceed safely if possible or rethrow if critical
      if (e.message.includes("Duplicate")) {
        console.log(
          "  ⚠️ Duplicate constraint or key for fk_grades_test_session. Skipping.",
        );
      } else {
        console.warn(
          "  ⚠️ Warning adding FK fk_grades_test_session:",
          e.message,
        );
      }
    }
  }

  // Добавляем FK на users для modified_by
  try {
    await connection.query(`
        ALTER TABLE grades
        ADD CONSTRAINT fk_grades_modified_by
        FOREIGN KEY (modified_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
    console.log("  ✅ Added FK: fk_grades_modified_by");
  } catch (e: any) {
    if (e.code === "ER_DUP_KEYNAME" || e.code === "ER_DUP_KEY") {
      console.log("  ⚠️ FK fk_grades_modified_by already exists. Skipping.");
    } else {
      if (e.message.includes("Duplicate")) {
        console.log(
          "  ⚠️ Duplicate constraint or key for fk_grades_modified_by. Skipping.",
        );
      } else {
        console.warn(
          "  ⚠️ Warning adding FK fk_grades_modified_by:",
          e.message,
        );
      }
    }
  }

  console.log("  ✅ Migration 033 completed: grades from test support added");
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("  Removing test-related fields from grades table...");

  // Удаляем FK
  try {
    await connection.query(
      "ALTER TABLE grades DROP FOREIGN KEY fk_grades_modified_by",
    );
  } catch (e) {
    console.log("  Note: FK fk_grades_modified_by may not exist");
  }

  try {
    await connection.query(
      "ALTER TABLE grades DROP FOREIGN KEY fk_grades_test_session",
    );
  } catch (e) {
    console.log("  Note: FK fk_grades_test_session may not exist");
  }

  // Удаляем индексы
  try {
    await connection.query("DROP INDEX idx_grades_modified ON grades");
  } catch (e) {
    console.log("  Note: Index idx_grades_modified may not exist");
  }

  try {
    await connection.query("DROP INDEX idx_grades_from_test ON grades");
  } catch (e) {
    console.log("  Note: Index idx_grades_from_test may not exist");
  }

  // Удаляем колонки
  await connection.query(
    "ALTER TABLE grades DROP COLUMN IF EXISTS modified_at",
  );
  await connection.query(
    "ALTER TABLE grades DROP COLUMN IF EXISTS modified_by",
  );
  await connection.query(
    "ALTER TABLE grades DROP COLUMN IF EXISTS is_modified",
  );
  await connection.query(
    "ALTER TABLE grades DROP COLUMN IF EXISTS original_grade",
  );
  await connection.query(
    "ALTER TABLE grades DROP COLUMN IF EXISTS test_session_id",
  );
  await connection.query(
    "ALTER TABLE grades DROP COLUMN IF EXISTS is_from_test",
  );

  console.log("  ✅ Migration 033 rolled back");
}
