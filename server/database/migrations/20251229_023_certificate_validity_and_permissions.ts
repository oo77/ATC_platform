import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Срок действия сертификатов и разрешения представителей
 * Дата: 2025-12-29
 * Описание: 
 * - Добавляет поле certificate_validity_months в courses для указания срока действия сертификатов
 * - Добавляет поле expiry_date в issued_certificates для хранения срока действия
 * - Добавляет поле permissions в organization_representatives для управления доступом к функционалу
 * - Добавляет entity_type CERTIFICATE_DATABASE для логирования
 */

export const description = 'Срок действия сертификатов и разрешения представителей';

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: certificate_validity_and_permissions');

  // ============================================================
  // 1. Добавляем срок действия сертификатов в courses
  // ============================================================
  await connection.query(`
    ALTER TABLE courses 
    ADD COLUMN IF NOT EXISTS certificate_validity_months INT DEFAULT NULL 
    COMMENT 'Срок действия сертификата в месяцах (NULL = бессрочный)'
  `);
  console.log('✅ Added certificate_validity_months to courses');

  // ============================================================
  // 2. Добавляем дату окончания действия в issued_certificates
  // ============================================================
  await connection.query(`
    ALTER TABLE issued_certificates 
    ADD COLUMN IF NOT EXISTS expiry_date DATE NULL 
    COMMENT 'Дата окончания действия сертификата (NULL = бессрочный)',
    ADD COLUMN IF NOT EXISTS is_sent_via_telegram BOOLEAN DEFAULT FALSE 
    COMMENT 'Был ли отправлен через Telegram',
    ADD COLUMN IF NOT EXISTS sent_at DATETIME(3) NULL 
    COMMENT 'Дата и время отправки через Telegram',
    ADD INDEX IF NOT EXISTS idx_expiry_date (expiry_date)
  `);
  console.log('✅ Added expiry_date, is_sent_via_telegram, sent_at to issued_certificates');

  // ============================================================
  // 3. Добавляем разрешения для представителей
  // ============================================================
  await connection.query(`
    ALTER TABLE organization_representatives 
    ADD COLUMN IF NOT EXISTS permissions JSON 
    COMMENT 'Разрешения: {can_view_students: bool, can_view_schedule: bool, can_view_certificates: bool, can_request_certificates: bool}',
    ADD COLUMN IF NOT EXISTS can_receive_notifications BOOLEAN DEFAULT TRUE 
    COMMENT 'Может получать уведомления о слушателях'
  `);
  console.log('✅ Added permissions, can_receive_notifications to organization_representatives');

  // Обновляем существующие записи с дефолтными разрешениями
  await connection.query(`
    UPDATE organization_representatives 
    SET permissions = JSON_OBJECT(
      'can_view_students', TRUE,
      'can_view_schedule', TRUE,
      'can_view_certificates', TRUE,
      'can_request_certificates', TRUE
    )
    WHERE permissions IS NULL
  `);
  console.log('✅ Set default permissions for existing representatives');

  // ============================================================
  // 4. Расширяем entity_type для activity_logs
  // ============================================================
  try {
    await connection.query(`
      ALTER TABLE activity_logs 
      MODIFY COLUMN entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE',
        'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE', 'CERTIFICATE_DATABASE'
      ) NOT NULL
    `);
    console.log('✅ Added CERTIFICATE_DATABASE entity type to activity_logs');
  } catch (error) {
    console.log('ℹ️  entity_type already has the required values or modification skipped');
  }

  // ============================================================
  // 5. Вычисляем expiry_date для существующих сертификатов
  // ============================================================
  await connection.query(`
    UPDATE issued_certificates ic
    JOIN study_groups g ON ic.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    SET ic.expiry_date = DATE_ADD(ic.issue_date, INTERVAL COALESCE(c.certificate_validity_months, 60) MONTH)
    WHERE ic.expiry_date IS NULL AND c.certificate_validity_months IS NOT NULL
  `);
  console.log('✅ Calculated expiry_date for existing certificates based on course settings');

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: certificate_validity_and_permissions');

  // Удаляем колонки из issued_certificates
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      DROP COLUMN IF EXISTS expiry_date,
      DROP COLUMN IF EXISTS is_sent_via_telegram,
      DROP COLUMN IF EXISTS sent_at
    `);
  } catch (error) {
    console.log('ℹ️  Columns may not exist in issued_certificates');
  }

  // Удаляем колонку из courses
  try {
    await connection.query(`
      ALTER TABLE courses 
      DROP COLUMN IF EXISTS certificate_validity_months
    `);
  } catch (error) {
    console.log('ℹ️  Column may not exist in courses');
  }

  // Удаляем колонки из organization_representatives
  try {
    await connection.query(`
      ALTER TABLE organization_representatives 
      DROP COLUMN IF EXISTS permissions,
      DROP COLUMN IF EXISTS can_receive_notifications
    `);
  } catch (error) {
    console.log('ℹ️  Columns may not exist in organization_representatives');
  }

  console.log('✅ Rollback completed successfully');
};
