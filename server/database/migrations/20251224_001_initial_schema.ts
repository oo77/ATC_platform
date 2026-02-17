import type { PoolConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

/**
 * Initial Schema Migration: ATC Platform Database
 * Date: 2025-12-24
 * Description: Complete base schema including all core modules.
 *              Consolidated from previous migrations up to 2026-02-02.
 *
 * Core Modules:
 * 1. Users & Auth (users, activity_logs)
 * 2. Organizations (organizations, organization_representatives)
 * 3. Students & Instructors (students, instructors, study_groups, etc)
 * 4. Education (courses, disciplines, schedule, attendance, grades)
 * 5. Certificates (issued_certificates, certificate_templates)
 * 6. File System (folders, files)
 * 7. System (archives, logs, bot sessions)
 */

export const description = "Initial Consolidated Schema";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("!!! DEBUG: I AM RUNNING MODIFIED INITIAL SCHEMA !!!");
  console.log("🔄 Running Initial Schema Migration...");

  // ============================================================
  // 1. USERS & AUTH
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      role ENUM('ADMIN', 'MANAGER', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(191) NOT NULL,
      phone VARCHAR(191),
      workplace VARCHAR(191),
      position VARCHAR(191),
      pinfl VARCHAR(14),
      
      student_id VARCHAR(191) NULL COMMENT 'Link to student record',
      instructor_id VARCHAR(191) NULL COMMENT 'Link to instructor record',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_email (email),
      INDEX idx_name (name),
      INDEX idx_role (role),
      INDEX idx_pinfl (pinfl),
      INDEX idx_student_id (student_id),
      INDEX idx_instructor_id (instructor_id),
      FULLTEXT INDEX ft_search_user (name, email, phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "users" created');

  // ============================================================
  // 2. ORGANIZATIONS
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      contact_phone VARCHAR(20),
      contact_email VARCHAR(100),
      address TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      students_count INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_code (code),
      INDEX idx_name (name),
      INDEX idx_is_active (is_active),
      FULLTEXT INDEX ft_search (name, short_name, address)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "organizations" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS organization_representatives (
      id VARCHAR(191) PRIMARY KEY,
      organization_id VARCHAR(191) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      telegram_chat_id BIGINT UNIQUE,
      telegram_username VARCHAR(100),
      status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
      access_groups JSON COMMENT 'JSON array of group IDs',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      last_activity_at DATETIME(3),
      approved_by VARCHAR(191),
      approved_at DATETIME(3),
      blocked_reason TEXT,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_organization_id (organization_id),
      INDEX idx_telegram_chat_id (telegram_chat_id),
      INDEX idx_status (status),
      CONSTRAINT fk_representatives_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_representatives_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "organization_representatives" created');

  // ============================================================
  // 3. STUDENTS & INSTRUCTORS
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      pinfl VARCHAR(14) NOT NULL UNIQUE,
      organization VARCHAR(255) NOT NULL COMMENT 'Legacy text name',
      organization_id VARCHAR(191) NULL,
      department VARCHAR(255),
      position VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_pinfl (pinfl),
      INDEX idx_full_name (full_name),
      INDEX idx_organization_id (organization_id),
      FULLTEXT INDEX ft_search (full_name, organization, position),
      CONSTRAINT fk_students_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "students" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS instructors (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      hire_date DATE,
      contract_info TEXT,
      max_hours INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_full_name (full_name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "instructors" created');

  // Add FKs to users table now that targets exist
  await connection.query(`
    ALTER TABLE users
    ADD CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT fk_users_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);

  // ============================================================
  // 4. CERTIFICATES (Updated to New System)
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      template_file_url VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "certificate_templates" created');

  // ============================================================
  // 5. COURSES & EDUCATION
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(10) NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE,
      description TEXT,
      total_hours INT NOT NULL DEFAULT 0,
      certificate_template_id VARCHAR(191),
      is_active BOOLEAN DEFAULT TRUE,
      
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      archived_at DATETIME(3) NULL,
      archived_by VARCHAR(191) NULL,
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_code (code),
      INDEX idx_archived (is_archived),
      CONSTRAINT fk_courses_certificate_template FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_courses_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "courses" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS disciplines (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hours INT NOT NULL DEFAULT 0,
      theory_hours INT NOT NULL DEFAULT 0,
      practice_hours INT NOT NULL DEFAULT 0,
      assessment_hours INT NOT NULL DEFAULT 0,
      order_index INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_course_id (course_id),
      CONSTRAINT fk_disciplines_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "disciplines" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_instructors (
      id VARCHAR(191) PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_discipline_instructor (discipline_id, instructor_id),
      CONSTRAINT fk_di_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_di_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "discipline_instructors" created');

  // Groups
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_groups (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      course_id VARCHAR(191) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      classroom VARCHAR(100),
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      archived_at DATETIME(3) NULL,
      archived_by VARCHAR(191) NULL,
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_dates (start_date, end_date),
      INDEX idx_archived (is_archived),
      CONSTRAINT fk_study_groups_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_study_groups_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "study_groups" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_group_students (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_group_student (group_id, student_id),
      CONSTRAINT fk_sgs_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_sgs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "study_group_students" created');

  // ============================================================
  // 6. SCHEDULE & ATTENDANCE
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      capacity INT DEFAULT 0,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      group_id VARCHAR(191),
      discipline_id VARCHAR(191),
      instructor_id VARCHAR(191),
      classroom_id VARCHAR(191),
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_minutes INT NULL COMMENT 'Duration in minutes',
      academic_hours INT NULL COMMENT 'Number of academic hours',
      original_event_id VARCHAR(191) NULL COMMENT 'Original event ID for retakes',
      
      is_all_day BOOLEAN DEFAULT FALSE,
      color VARCHAR(20) DEFAULT 'primary',
      event_type ENUM('theory', 'practice', 'assessment', 'other') DEFAULT 'theory',
      
      allowed_student_ids JSON NULL COMMENT 'List of allowed student IDs (e.g. for retakes)',
      
      is_recurring BOOLEAN DEFAULT FALSE,
      recurrence_rule TEXT,
      notes TEXT,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_date_range (start_time, end_time),
      INDEX idx_original_event_id (original_event_id),
      CONSTRAINT fk_schedule_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_original FOREIGN KEY (original_event_id) REFERENCES schedule_events(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "schedule_events" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      schedule_event_id VARCHAR(191) NOT NULL,
      hours_attended DECIMAL(3,1) NOT NULL DEFAULT 0,
      max_hours DECIMAL(3,1) NOT NULL,
      notes TEXT,
      marked_by VARCHAR(191),
      marked_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_attendance_student_event (student_id, schedule_event_id),
      CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "attendance" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      schedule_event_id VARCHAR(191) NOT NULL,
      grade INT NOT NULL,
      notes TEXT,
      graded_by VARCHAR(191),
      graded_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_grades_student_event (student_id, schedule_event_id),
      CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_graded_by FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "grades" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS final_grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      group_id VARCHAR(191) NOT NULL,
      discipline_id VARCHAR(191) NOT NULL,
      final_grade INT,
      attendance_percent DECIMAL(5,2),
      status ENUM('in_progress', 'passed', 'failed', 'not_allowed') NOT NULL DEFAULT 'in_progress',
      notes TEXT,
      graded_by VARCHAR(191),
      graded_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_final_grades_student_group_discipline (student_id, group_id, discipline_id),
      CONSTRAINT fk_final_grades_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "final_grades" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_periods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      period_number INT NOT NULL,
      start_time VARCHAR(5) NOT NULL,
      end_time VARCHAR(5) NOT NULL,
      is_after_break BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_period_number (period_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "schedule_periods" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "schedule_settings" created');

  // ============================================================
  // 7. ISSUED CERTIFICATES (Standalone System)
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Optional links (can be null for standalone)
      group_id VARCHAR(191) NULL,
      template_id VARCHAR(191) NULL,
      
      student_id VARCHAR(191) NOT NULL,
      certificate_number VARCHAR(100) NOT NULL,
      issue_date DATE NOT NULL,
      expiry_date DATE,
      
      -- Standalone Fields
      course_name VARCHAR(255) NULL,
      course_code VARCHAR(50) NULL,
      course_hours INT NULL,
      group_code VARCHAR(50) NULL,
      group_start_date DATE NULL,
      group_end_date DATE NULL,
      source_type ENUM('group_journal', 'manual', 'import') NOT NULL DEFAULT 'group_journal',
      
      pdf_file_url VARCHAR(500),
      status ENUM('issued', 'revoked') DEFAULT 'issued',
      
      variables_data JSON NULL COMMENT 'Snapshot of data at time of issue',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_source_type (source_type),
      INDEX idx_student_source (student_id, source_type),
      
      CONSTRAINT fk_issued_cert_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "issued_certificates" created');

  // ============================================================
  // 8. FILE SYSTEM
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      parent_id INT UNSIGNED NULL,
      path VARCHAR(1024) NOT NULL,
      user_id VARCHAR(36) NULL,
      password_hash VARCHAR(255) NULL,
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_parent_id (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "folders" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) NOT NULL UNIQUE,
      filename VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes INT UNSIGNED NOT NULL,
      extension VARCHAR(10) NOT NULL,
      storage_path VARCHAR(500) NOT NULL,
      full_path VARCHAR(1000) NOT NULL,
      
      category ENUM('profile', 'certificate_template', 'certificate_generated', 'course_material', 'course_media', 'course_cover', 'group_gallery', 'group_file', 'group_report', 'assignment', 'other') NOT NULL,
      
      folder_id INT UNSIGNED NULL,
      user_id VARCHAR(36) NULL,
      course_id INT UNSIGNED NULL,
      group_id VARCHAR(191) NULL,
      assignment_id INT UNSIGNED NULL,
      
      metadata JSON NULL,
      is_public BOOLEAN DEFAULT FALSE,
      access_level ENUM('public', 'authenticated', 'owner', 'admin') DEFAULT 'authenticated',
      uploaded_by VARCHAR(36) NOT NULL,
      uploaded_by_user VARCHAR(191) NULL COMMENT 'FK to users table',
      uploaded_at_time DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_uuid (uuid),
      INDEX idx_folder_id (folder_id),
      INDEX idx_group_id (group_id),
      INDEX idx_files_group_category (group_id, category),
      CONSTRAINT fk_files_uploaded_by_user FOREIGN KEY (uploaded_by_user) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "files" created');

  // ============================================================
  // 9. LOGS & SYSTEM
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'VIEW', 'DOWNLOAD', 'UPLOAD') NOT NULL,
      entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE', 'LIBRARY_BOOK', 'TEST'
      ) NOT NULL,
      entity_id VARCHAR(191) NULL,
      entity_name VARCHAR(255) NULL,
      details JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "activity_logs" created');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
      id VARCHAR(191) PRIMARY KEY,
      chat_id BIGINT NOT NULL UNIQUE,
      state VARCHAR(50) NOT NULL DEFAULT 'idle',
      data JSON,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "telegram_bot_sessions" created');

  // ============================================================
  // SEED DATA (Admin)
  // ============================================================
  console.log("🌱 Seeding initial data...");

  const [existingAdmin] = await connection.query<any[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    ["admin@atc.uz"],
  );

  if (!existingAdmin || existingAdmin.length === 0) {
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = randomUUID();

    await connection.query(
      `INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
       VALUES (?, 'ADMIN', 'Администратор', 'admin@atc.uz', ?, NOW(3), NOW(3))`,
      [adminId, hashedPassword],
    );
    console.log("✅ Default admin user created");
  }

  // Academic Hours
  const [existingPeriods] = await connection.query<any[]>(
    "SELECT COUNT(*) as count FROM schedule_periods",
  );

  if (existingPeriods[0].count === 0) {
    await connection.query(`
      INSERT INTO schedule_periods (period_number, start_time, end_time, is_after_break) VALUES
      (1, '09:00', '09:40', FALSE),
      (2, '09:40', '10:20', FALSE),
      (3, '10:30', '11:10', FALSE),
      (4, '11:10', '11:50', FALSE),
      (5, '12:00', '12:40', TRUE),
      (6, '12:40', '13:20', FALSE),
      (7, '14:00', '14:40', TRUE),
      (8, '14:40', '15:20', FALSE),
      (9, '15:30', '16:10', FALSE),
      (10, '16:10', '16:50', FALSE)
    `);
    console.log("✅ Default schedule periods created");
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Initial Schema Migration...");

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  const tables = [
    "users",
    "organizations",
    "organization_representatives",
    "students",
    "instructors",
    "certificate_templates",
    "courses",
    "disciplines",
    "discipline_instructors",
    "study_groups",
    "study_group_students",
    "classrooms",
    "schedule_events",
    "attendance",
    "grades",
    "final_grades",
    "schedule_periods",
    "schedule_settings",
    "issued_certificates",
    "folders",
    "files",
    "activity_logs",
    "telegram_bot_sessions",
  ];

  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
    console.log(`🗑️  Dropped table ${table}`);
  }

  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("✅ Initial Schema rolled back");
};
