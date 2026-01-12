import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Объединение таблиц сертификатов
 * Дата: 2025-12-29
 * Описание: 
 * - Мигрирует данные из старой таблицы `certificates` в `issued_certificates`
 * - Добавляет поле `legacy_id` в `issued_certificates` для отслеживания мигрированных записей
 * - Удаляет устаревшую таблицу `certificates`
 * 
 * После миграции вся система сертификатов работает через единую таблицу `issued_certificates`
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: unify_certificates');

  // 1. Проверяем существование обеих таблиц
  const [tables] = await connection.query<any[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME IN ('certificates', 'issued_certificates')`
  );
  
  const tableNames = tables.map((t: any) => t.TABLE_NAME);
  console.log(`📋 Found tables: ${tableNames.join(', ')}`);

  if (!tableNames.includes('certificates')) {
    console.log('ℹ️  Table "certificates" does not exist, skipping migration');
    return;
  }

  if (!tableNames.includes('issued_certificates')) {
    console.log('⚠️  Table "issued_certificates" does not exist. Creating it first...');
    // Эта ситуация не должна возникать, если миграции выполняются по порядку
    throw new Error('issued_certificates table must exist before this migration');
  }

  // 2. Добавляем поле legacy_id для отслеживания мигрированных записей
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(191) NULL 
      COMMENT 'ID из старой таблицы certificates (для отслеживания миграции)'
    `);
    console.log('✅ Added legacy_id column to issued_certificates');
  } catch (err) {
    console.log('ℹ️  legacy_id column may already exist');
  }

  // 3. Получаем количество записей для миграции
  const [countResult] = await connection.query<any[]>(
    'SELECT COUNT(*) as total FROM certificates'
  );
  const totalRecords = countResult[0].total;
  console.log(`📊 Found ${totalRecords} records to migrate from certificates`);

  if (totalRecords === 0) {
    console.log('ℹ️  No records to migrate');
  } else {
    // 4. Мигрируем данные
    // Нужно сопоставить данные:
    // - student_id -> student_id
    // - course_name -> сохраняем в variables_data
    // - certificate_number -> certificate_number
    // - issue_date -> issue_date
    // - file_url -> pdf_file_url
    // - expiry_date -> expiry_date
    // - Для group_id и template_id используем специальные placeholder'ы

    // Создаём placeholder шаблон для мигрированных сертификатов если его нет
    const [existingTemplate] = await connection.query<any[]>(
      `SELECT id FROM certificate_templates WHERE name = 'Мигрированный (legacy)' LIMIT 1`
    );
    
    let legacyTemplateId: string;
    if (existingTemplate.length === 0) {
      legacyTemplateId = crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      
      await connection.query(`
        INSERT INTO certificate_templates (id, name, description, is_active, created_at, updated_at)
        VALUES (?, 'Мигрированный (legacy)', 'Шаблон для сертификатов, мигрированных из старой системы', FALSE, NOW(3), NOW(3))
      `, [legacyTemplateId]);
      console.log('✅ Created legacy certificate template');
    } else {
      legacyTemplateId = existingTemplate[0].id;
    }

    // Создаём placeholder группу для мигрированных сертификатов
    const [existingGroup] = await connection.query<any[]>(
      `SELECT id FROM study_groups WHERE code = 'LEGACY-MIGRATION' LIMIT 1`
    );
    
    let legacyGroupId: string;
    if (existingGroup.length === 0) {
      // Сначала нужно создать курс-заглушку
      const [existingCourse] = await connection.query<any[]>(
        `SELECT id FROM courses WHERE code = 'LEGACY' LIMIT 1`
      );
      
      let legacyCourseId: string;
      if (existingCourse.length === 0) {
        legacyCourseId = crypto.randomUUID ? crypto.randomUUID() : 
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          });
        
        await connection.query(`
          INSERT INTO courses (id, name, short_name, code, description, total_hours, is_active, created_at, updated_at)
          VALUES (?, 'Мигрированные курсы', 'LEGCY', 'LEGACY', 'Курсы из старой системы сертификатов', 0, FALSE, NOW(3), NOW(3))
        `, [legacyCourseId]);
        console.log('✅ Created legacy course');
      } else {
        legacyCourseId = existingCourse[0].id;
      }

      legacyGroupId = crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      
      await connection.query(`
        INSERT INTO study_groups (id, code, course_id, start_date, end_date, description, is_active, created_at, updated_at)
        VALUES (?, 'LEGACY-MIGRATION', ?, '2000-01-01', '2099-12-31', 'Группа для мигрированных сертификатов', FALSE, NOW(3), NOW(3))
      `, [legacyGroupId, legacyCourseId]);
      console.log('✅ Created legacy study group');
    } else {
      legacyGroupId = existingGroup[0].id;
    }

    // 5. Мигрируем записи
    const [certificates] = await connection.query<any[]>('SELECT * FROM certificates');
    
    let migrated = 0;
    let skipped = 0;
    
    for (const cert of certificates) {
      // Проверяем, не был ли уже мигрирован
      const [existing] = await connection.query<any[]>(
        `SELECT id FROM issued_certificates WHERE legacy_id = ? OR certificate_number = ? LIMIT 1`,
        [cert.id, cert.certificate_number]
      );
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      const newId = crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      
      const variablesData = JSON.stringify({
        courseName: cert.course_name,
        legacyMigration: true,
        originalId: cert.id
      });
      
      await connection.query(`
        INSERT INTO issued_certificates (
          id, group_id, student_id, template_id, certificate_number,
          issue_date, pdf_file_url, status, variables_data, 
          expiry_date, legacy_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?)
      `, [
        newId,
        legacyGroupId,
        cert.student_id,
        legacyTemplateId,
        cert.certificate_number,
        cert.issue_date,
        cert.file_url,
        variablesData,
        cert.expiry_date,
        cert.id, // legacy_id
        cert.created_at || new Date(),
        cert.updated_at || new Date()
      ]);
      
      migrated++;
    }
    
    console.log(`✅ Migrated ${migrated} certificates, skipped ${skipped} (already exist)`);
  }

  // 6. Удаляем старую таблицу
  console.log('🗑️  Dropping old certificates table...');
  await connection.query('DROP TABLE IF EXISTS certificates');
  console.log('✅ Dropped certificates table');

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: unify_certificates');

  // 1. Воссоздаём таблицу certificates
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      issue_date DATE NOT NULL,
      certificate_number VARCHAR(100) NOT NULL,
      file_url VARCHAR(500),
      expiry_date DATE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_issue_date (issue_date),
      INDEX idx_expiry_date (expiry_date),
      
      CONSTRAINT fk_certificates_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Recreated certificates table');

  // 2. Восстанавливаем данные из issued_certificates (только legacy)
  const [legacyCerts] = await connection.query<any[]>(
    `SELECT * FROM issued_certificates WHERE legacy_id IS NOT NULL`
  );

  for (const cert of legacyCerts) {
    let courseName = 'Unknown Course';
    try {
      const varsData = JSON.parse(cert.variables_data || '{}');
      courseName = varsData.courseName || courseName;
    } catch {}
    
    await connection.query(`
      INSERT INTO certificates (id, student_id, course_name, issue_date, certificate_number, file_url, expiry_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cert.legacy_id,
      cert.student_id,
      courseName,
      cert.issue_date,
      cert.certificate_number,
      cert.pdf_file_url,
      cert.expiry_date,
      cert.created_at,
      cert.updated_at
    ]);
  }
  console.log(`✅ Restored ${legacyCerts.length} records to certificates table`);

  // 3. Удаляем legacy записи из issued_certificates
  await connection.query(`DELETE FROM issued_certificates WHERE legacy_id IS NOT NULL`);
  console.log('✅ Removed legacy records from issued_certificates');

  // 4. Удаляем колонку legacy_id
  try {
    await connection.query(`ALTER TABLE issued_certificates DROP COLUMN legacy_id`);
  } catch {}

  // 5. Удаляем placeholder записи
  await connection.query(`DELETE FROM study_groups WHERE code = 'LEGACY-MIGRATION'`);
  await connection.query(`DELETE FROM courses WHERE code = 'LEGACY'`);
  await connection.query(`DELETE FROM certificate_templates WHERE name = 'Мигрированный (legacy)'`);

  console.log('✅ Rollback completed');
};

export const description = 'Объединение таблиц certificates и issued_certificates в единую систему';
