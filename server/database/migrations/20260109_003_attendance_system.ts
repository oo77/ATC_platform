import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 003: Attendance Marking System
 * Date: 2026-01-09
 * Description: Creates tables for tracking instructor attendance marking compliance.
 *              Adds triggers for auto-generating marking status.
 */

export const description = "Attendance Marking System & Triggers";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Attendance Marking System");

  // 1. attendance_marking_status
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_marking_status (
      id VARCHAR(191) PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL UNIQUE,
      status ENUM('pending', 'in_progress', 'on_time', 'late', 'overdue', 'approved') NOT NULL DEFAULT 'pending',
      marked_by VARCHAR(191),
      marked_at DATETIME(3),
      deadline DATETIME(3) NOT NULL,
      late_deadline DATETIME(3) NOT NULL,
      late_reason TEXT,
      approved_by VARCHAR(191),
      approved_at DATETIME(3),
      students_count INT NOT NULL DEFAULT 0,
      marked_count INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_ams_status (status),
      CONSTRAINT fk_ams_schedule_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_ams_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ams_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. attendance_marking_requests
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_marking_requests (
      id VARCHAR(191) PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(191),
      reviewed_at DATETIME(3),
      review_comment TEXT,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_amr_schedule_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_amr_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_amr_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. attendance_settings
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value VARCHAR(255) NOT NULL,
      description TEXT,
      updated_by VARCHAR(191),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_as_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Initial Settings
  await connection.query(`
    INSERT INTO attendance_settings (setting_key, setting_value, description) VALUES
    ('ATTENDANCE_MARK_DEADLINE_HOURS', '24', 'Hours after event for standard marking'),
    ('ATTENDANCE_EDIT_DEADLINE_HOURS', '72', 'Hours after event for late marking'),
    ('ATTENDANCE_LATE_MARK_ALLOWED', 'true', 'Allow late marking (24-72h)'),
    ('ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE', 'true', 'Require admin approval after 72h'),
    ('ATTENDANCE_REMINDER_HOURS_BEFORE', '2', 'Reminder hours before deadline'),
    ('ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD', '48', 'Notify admin after N hours un-marked'),
    ('ATTENDANCE_AUTO_CREATE_STATUS', 'true', 'Auto-create status on event creation')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
  `);

  // 4. Trigger
  try {
    await connection.query(
      `DROP TRIGGER IF EXISTS trg_schedule_event_after_insert`,
    );
    await connection.query(`
      CREATE TRIGGER trg_schedule_event_after_insert
      AFTER INSERT ON schedule_events
      FOR EACH ROW
      BEGIN
        DECLARE deadline_hours INT DEFAULT 24;
        DECLARE late_deadline_hours INT DEFAULT 72;
        DECLARE students_cnt INT DEFAULT 0;
        
        -- Get settings
        SELECT CAST(setting_value AS UNSIGNED) INTO deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_MARK_DEADLINE_HOURS' LIMIT 1;
        
        SELECT CAST(setting_value AS UNSIGNED) INTO late_deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_EDIT_DEADLINE_HOURS' LIMIT 1;
        
        -- Count students (using study_group_students)
        IF NEW.group_id IS NOT NULL THEN
          SELECT COUNT(*) INTO students_cnt 
          FROM study_group_students WHERE group_id = NEW.group_id;
        END IF;
        
        -- Create status record
        INSERT INTO attendance_marking_status (
          id, schedule_event_id, status, deadline, late_deadline, students_count
        ) VALUES (
          UUID(), NEW.id, 'pending',
          DATE_ADD(NEW.end_time, INTERVAL IFNULL(deadline_hours, 24) HOUR),
          DATE_ADD(NEW.end_time, INTERVAL IFNULL(late_deadline_hours, 72) HOUR),
          students_cnt
        );
      END
    `);
    console.log("✅ Trigger trg_schedule_event_after_insert created");
  } catch (error: any) {
    console.log("⚠️ Trigger creation warning:", error.message);
  }

  console.log("✅ Attendance Marking System tables created");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Attendance Marking System");
  await connection.query(
    "DROP TRIGGER IF EXISTS trg_schedule_event_after_insert",
  );
  await connection.query("DROP TABLE IF EXISTS attendance_marking_requests");
  await connection.query("DROP TABLE IF EXISTS attendance_marking_status");
  await connection.query("DROP TABLE IF EXISTS attendance_settings");
};
