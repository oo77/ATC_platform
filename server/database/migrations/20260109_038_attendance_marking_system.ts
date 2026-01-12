/**
 * Миграция 038: Система допуска отметок посещаемости
 * Создаёт таблицы attendance_marking_status, attendance_marking_requests, attendance_settings
 */

import type { PoolConnection } from 'mysql2/promise';

export const description = 'Создание таблиц для системы допуска отметок посещаемости инструкторами';

export async function up(connection: PoolConnection): Promise<void> {
  console.log('  Creating attendance_marking_status table...');
  
  // Таблица статуса отметки занятий
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_marking_status (
      id VARCHAR(191) PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL UNIQUE COMMENT 'ID занятия',
      status ENUM('pending', 'in_progress', 'on_time', 'late', 'overdue', 'approved') 
        NOT NULL DEFAULT 'pending' COMMENT 'Статус отметки',
      marked_by VARCHAR(191) COMMENT 'ID пользователя, сделавшего отметку',
      marked_at DATETIME(3) COMMENT 'Когда была сделана отметка',
      deadline DATETIME(3) NOT NULL COMMENT 'Крайний срок отметки (24ч после занятия)',
      late_deadline DATETIME(3) NOT NULL COMMENT 'Крайний срок с опозданием (72ч)',
      late_reason TEXT COMMENT 'Причина опоздания с отметкой',
      approved_by VARCHAR(191) COMMENT 'Кто одобрил просроченную отметку',
      approved_at DATETIME(3) COMMENT 'Когда одобрена',
      students_count INT NOT NULL DEFAULT 0 COMMENT 'Количество студентов для отметки',
      marked_count INT NOT NULL DEFAULT 0 COMMENT 'Количество отмеченных студентов',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_ams_status (status),
      INDEX idx_ams_deadline (deadline),
      INDEX idx_ams_marked_by (marked_by),
      INDEX idx_ams_overdue (status, deadline),
      
      CONSTRAINT fk_ams_schedule_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_ams_marked_by 
        FOREIGN KEY (marked_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ams_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Статус отметки посещаемости для каждого занятия'
  `);
  
  console.log('  Creating attendance_marking_requests table...');
  
  // Таблица запросов на разрешение просроченной отметки
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_marking_requests (
      id VARCHAR(191) PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID занятия',
      instructor_id VARCHAR(191) NOT NULL COMMENT 'ID инструктора',
      reason TEXT NOT NULL COMMENT 'Причина опоздания с отметкой',
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(191) COMMENT 'Кто рассмотрел запрос',
      reviewed_at DATETIME(3) COMMENT 'Когда рассмотрен',
      review_comment TEXT COMMENT 'Комментарий к решению',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_amr_status (status),
      INDEX idx_amr_instructor (instructor_id),
      INDEX idx_amr_event (schedule_event_id),
      
      CONSTRAINT fk_amr_schedule_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_amr_instructor 
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_amr_reviewed_by 
        FOREIGN KEY (reviewed_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Запросы на разрешение просроченной отметки посещаемости'
  `);
  
  console.log('  Creating attendance_settings table...');
  
  // Таблица настроек системы отметок
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value VARCHAR(255) NOT NULL,
      description TEXT,
      updated_by VARCHAR(191),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_as_key (setting_key),
      
      CONSTRAINT fk_as_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Настройки системы отметок посещаемости'
  `);
  
  console.log('  Inserting default attendance settings...');
  
  // Начальные настройки
  await connection.query(`
    INSERT INTO attendance_settings (setting_key, setting_value, description) VALUES
    ('ATTENDANCE_MARK_DEADLINE_HOURS', '24', 'Часов после занятия для обычной отметки'),
    ('ATTENDANCE_EDIT_DEADLINE_HOURS', '72', 'Часов после занятия для редактирования (с опозданием)'),
    ('ATTENDANCE_LATE_MARK_ALLOWED', 'true', 'Разрешить опоздавшую отметку (24-72ч)'),
    ('ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE', 'true', 'Требовать одобрение администратора после 72ч'),
    ('ATTENDANCE_REMINDER_HOURS_BEFORE', '2', 'За сколько часов до дедлайна напоминать'),
    ('ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD', '48', 'После скольких часов без отметки уведомлять админа'),
    ('ATTENDANCE_AUTO_CREATE_STATUS', 'true', 'Автоматически создавать статус при создании занятия')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
  `);
  
  console.log('  Creating trigger for auto-creating marking status...');
  
  // Триггер для автоматического создания статуса при создании занятия
  try {
    await connection.query(`DROP TRIGGER IF EXISTS trg_schedule_event_after_insert`);
    await connection.query(`
      CREATE TRIGGER trg_schedule_event_after_insert
      AFTER INSERT ON schedule_events
      FOR EACH ROW
      BEGIN
        DECLARE deadline_hours INT DEFAULT 24;
        DECLARE late_deadline_hours INT DEFAULT 72;
        DECLARE students_cnt INT DEFAULT 0;
        
        -- Получаем настройки
        SELECT CAST(setting_value AS UNSIGNED) INTO deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_MARK_DEADLINE_HOURS';
        
        SELECT CAST(setting_value AS UNSIGNED) INTO late_deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_EDIT_DEADLINE_HOURS';
        
        -- Подсчитываем студентов в группе
        IF NEW.group_id IS NOT NULL THEN
          SELECT COUNT(*) INTO students_cnt 
          FROM study_group_students WHERE group_id = NEW.group_id;
        END IF;
        
        -- Создаём запись статуса
        INSERT INTO attendance_marking_status (
          id, 
          schedule_event_id, 
          status, 
          deadline, 
          late_deadline,
          students_count
        ) VALUES (
          UUID(),
          NEW.id,
          'pending',
          DATE_ADD(NEW.end_time, INTERVAL deadline_hours HOUR),
          DATE_ADD(NEW.end_time, INTERVAL late_deadline_hours HOUR),
          students_cnt
        );
      END
    `);
  } catch (error: any) {
    console.log('  Note: Trigger creation skipped (may already exist or not supported):', error.message);
  }
  
  console.log('  ✅ Attendance marking system tables created');
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log('  Dropping attendance marking system tables...');
  
  // Удаляем триггер
  try {
    await connection.query('DROP TRIGGER IF EXISTS trg_schedule_event_after_insert');
  } catch (error) {
    console.log('  Note: Trigger drop skipped');
  }
  
  await connection.query('DROP TABLE IF EXISTS attendance_marking_requests');
  await connection.query('DROP TABLE IF EXISTS attendance_marking_status');
  await connection.query('DROP TABLE IF EXISTS attendance_settings');
  
  console.log('  ✅ Tables dropped');
}
