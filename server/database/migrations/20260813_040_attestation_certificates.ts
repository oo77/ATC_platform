import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Сертификаты по итогам аттестации
 * Дата: 2026-08-13
 * Описание:
 *   - attestation_groups.certificate_template_id — шаблон сертификата,
 *     назначенный группе (используется для автоматической выдачи при
 *     решении комиссии "Сдал")
 *   - issued_certificates расширяется полями instructor_id /
 *     attestation_group_id и категорией source_type = 'attestation',
 *     чтобы переиспользовать существующую систему выдачи/нумерации/
 *     верификации сертификатов для инструкторов, а не создавать отдельную
 */

export const description = "Attestation certificate issuance";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Attestation certificates");

  await connection.query(`
    ALTER TABLE attestation_groups
    ADD COLUMN certificate_template_id VARCHAR(191) NULL AFTER test_template_id,
    ADD CONSTRAINT fk_attestation_groups_certificate_template
      FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL
  `);

  await connection.query(`
    ALTER TABLE issued_certificates
    MODIFY COLUMN student_id VARCHAR(191) NULL,
    ADD COLUMN instructor_id VARCHAR(191) NULL AFTER student_id,
    ADD COLUMN attestation_group_id VARCHAR(191) NULL AFTER group_id,
    MODIFY COLUMN source_type ENUM('group_journal', 'manual', 'import', 'attestation') NOT NULL DEFAULT 'group_journal'
  `);

  await connection.query(`
    ALTER TABLE issued_certificates
    ADD CONSTRAINT fk_issued_cert_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_issued_cert_attestation_group FOREIGN KEY (attestation_group_id) REFERENCES attestation_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD INDEX idx_instructor_id (instructor_id),
    ADD INDEX idx_attestation_group_id (attestation_group_id)
  `);

  console.log("✅ Attestation certificates migration completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: Attestation certificates");

  await connection.query(`
    ALTER TABLE issued_certificates
    DROP FOREIGN KEY fk_issued_cert_instructor,
    DROP FOREIGN KEY fk_issued_cert_attestation_group,
    DROP INDEX idx_instructor_id,
    DROP INDEX idx_attestation_group_id,
    DROP COLUMN instructor_id,
    DROP COLUMN attestation_group_id,
    MODIFY COLUMN source_type ENUM('group_journal', 'manual', 'import') NOT NULL DEFAULT 'group_journal',
    MODIFY COLUMN student_id VARCHAR(191) NOT NULL
  `);

  await connection.query(`
    ALTER TABLE attestation_groups
    DROP FOREIGN KEY fk_attestation_groups_certificate_template,
    DROP COLUMN certificate_template_id
  `);

  console.log("✅ Rollback completed successfully");
};
