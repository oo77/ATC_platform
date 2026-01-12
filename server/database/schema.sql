-- ============================================================
-- ATC Platform - Полная схема базы данных
-- Версия: 1.0 (Консолидированная)
-- Дата: 2025-12-24
-- ============================================================

-- ============================================================
-- 1. USERS - Пользователи системы
-- ============================================================
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
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_pinfl (pinfl)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. ORGANIZATIONS - Организации
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(191) PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Уникальный код организации',
  name VARCHAR(255) NOT NULL COMMENT 'Полное название организации',
  short_name VARCHAR(100) COMMENT 'Краткое название',
  contact_phone VARCHAR(20) COMMENT 'Контактный телефон',
  contact_email VARCHAR(100) COMMENT 'Контактный email',
  address TEXT COMMENT 'Адрес организации',
  description TEXT COMMENT 'Описание организации',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  students_count INT NOT NULL DEFAULT 0 COMMENT 'Кэшированное количество слушателей',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active),
  FULLTEXT INDEX ft_search (name, short_name, address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. STUDENTS - Слушатели
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NULL COMMENT 'Связь с таблицей users для авторизации',
  full_name VARCHAR(255) NOT NULL,
  pinfl VARCHAR(14) NOT NULL UNIQUE,
  organization VARCHAR(255) NOT NULL COMMENT 'Текстовое название организации (legacy)',
  organization_id VARCHAR(191) NULL COMMENT 'Ссылка на таблицу organizations',
  department VARCHAR(255),
  position VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_pinfl (pinfl),
  INDEX idx_full_name (full_name),
  INDEX idx_organization (organization),
  INDEX idx_organization_id (organization_id),
  INDEX idx_position (position),
  INDEX idx_user_id (user_id),
  FULLTEXT INDEX ft_search (full_name, organization, position),
  
  CONSTRAINT fk_students_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. CERTIFICATES - Сертификаты
-- ============================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. INSTRUCTORS - Инструкторы/Преподаватели
-- ============================================================
CREATE TABLE IF NOT EXISTS instructors (
  id VARCHAR(191) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  hire_date DATE COMMENT 'Дата приема на работу',
  contract_info TEXT COMMENT 'Данные о трудовом договоре',
  max_hours INT DEFAULT 0 COMMENT 'Максимальные часы для отчетности',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_full_name (full_name),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active),
  FULLTEXT INDEX ft_instructor_search (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. CERTIFICATE_TEMPLATES - Шаблоны сертификатов
-- ============================================================
CREATE TABLE IF NOT EXISTS certificate_templates (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_file_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. COURSES - Учебные программы
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(10) NOT NULL COMMENT 'Короткое название',
  code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Код курса',
  description TEXT,
  total_hours INT NOT NULL DEFAULT 0 COMMENT 'Общее количество академических часов',
  certificate_template_id VARCHAR(191),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_name (name),
  INDEX idx_short_name (short_name),
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_certificate_template (certificate_template_id),
  FULLTEXT INDEX ft_course_search (name, short_name, description),
  
  CONSTRAINT fk_courses_certificate_template 
    FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. DISCIPLINES - Дисциплины
-- ============================================================
CREATE TABLE IF NOT EXISTS disciplines (
  id VARCHAR(191) PRIMARY KEY,
  course_id VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hours INT NOT NULL DEFAULT 0 COMMENT 'Общее количество часов (авто-вычисляемое)',
  theory_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы теории',
  practice_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы практики',
  assessment_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы проверки знаний',
  order_index INT NOT NULL DEFAULT 0 COMMENT 'Порядок отображения',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_course_id (course_id),
  INDEX idx_name (name),
  INDEX idx_order (order_index),
  
  CONSTRAINT fk_disciplines_course 
    FOREIGN KEY (course_id) REFERENCES courses(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT chk_theory_hours_positive CHECK (theory_hours >= 0),
  CONSTRAINT chk_practice_hours_positive CHECK (practice_hours >= 0),
  CONSTRAINT chk_assessment_hours_positive CHECK (assessment_hours >= 0),
  CONSTRAINT chk_total_hours_positive CHECK ((theory_hours + practice_hours + assessment_hours) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Триггеры для авто-вычисления hours
DELIMITER //
CREATE TRIGGER disciplines_calculate_hours_insert
BEFORE INSERT ON disciplines
FOR EACH ROW
BEGIN
  SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
END//

CREATE TRIGGER disciplines_calculate_hours_update
BEFORE UPDATE ON disciplines
FOR EACH ROW
BEGIN
  SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
END//
DELIMITER ;

-- ============================================================
-- 9. DISCIPLINE_INSTRUCTORS - Связь дисциплин и инструкторов
-- ============================================================
CREATE TABLE IF NOT EXISTS discipline_instructors (
  id VARCHAR(191) PRIMARY KEY,
  discipline_id VARCHAR(191) NOT NULL,
  instructor_id VARCHAR(191) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Основной инструктор',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_discipline_id (discipline_id),
  INDEX idx_instructor_id (instructor_id),
  UNIQUE INDEX idx_discipline_instructor (discipline_id, instructor_id),
  
  CONSTRAINT fk_di_discipline 
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_di_instructor 
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. FOLDERS - Папки файлового менеджера
-- ============================================================
CREATE TABLE IF NOT EXISTS folders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id INT UNSIGNED NULL,
  path VARCHAR(1024) NOT NULL,
  user_id VARCHAR(36) NULL,
  password_hash VARCHAR(255) NULL COMMENT 'Хеш пароля для защиты папки',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_parent_id (parent_id),
  INDEX idx_path (path(255)),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. FILES - Файлы
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE COMMENT 'Публичный UUID',
  filename VARCHAR(255) NOT NULL COMMENT 'Оригинальное имя файла',
  stored_name VARCHAR(255) NOT NULL COMMENT 'Имя файла на диске',
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  extension VARCHAR(10) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  full_path VARCHAR(1000) NOT NULL,
  category ENUM(
    'profile', 'certificate_template', 'certificate_generated',
    'course_material', 'course_media', 'course_cover',
    'group_gallery', 'group_file', 'assignment', 'other'
  ) NOT NULL,
  folder_id INT UNSIGNED NULL,
  user_id VARCHAR(36) NULL,
  course_id INT UNSIGNED NULL,
  group_id INT UNSIGNED NULL,
  assignment_id INT UNSIGNED NULL,
  metadata JSON NULL,
  is_public BOOLEAN DEFAULT FALSE,
  access_level ENUM('public', 'authenticated', 'owner', 'admin') DEFAULT 'authenticated',
  uploaded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_uuid (uuid),
  INDEX idx_category (category),
  INDEX idx_folder_id (folder_id),
  INDEX idx_user_id (user_id),
  INDEX idx_course_id (course_id),
  INDEX idx_group_id (group_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ACTIVITY_LOGS - Журнал действий
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT') NOT NULL,
  entity_type ENUM(
    'USER', 'STUDENT', 'CERTIFICATE', 'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE',
    'COURSE', 'DISCIPLINE', 'INSTRUCTOR', 'FILE', 'FOLDER', 'SCHEDULE',
    'GROUP', 'CLASSROOM', 'ORGANIZATION', 'REPRESENTATIVE', 'ATTENDANCE', 'GRADE', 'SYSTEM'
  ) NOT NULL,
  entity_id VARCHAR(191) NULL,
  entity_name VARCHAR(255) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_entity_type (entity_type),
  INDEX idx_entity_id (entity_id),
  INDEX idx_created_at (created_at),
  INDEX idx_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. STUDY_GROUPS - Учебные группы
-- ============================================================
CREATE TABLE IF NOT EXISTS study_groups (
  id VARCHAR(191) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Код группы',
  course_id VARCHAR(191) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  classroom VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_code (code),
  INDEX idx_course_id (course_id),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_is_active (is_active),
  INDEX idx_dates (start_date, end_date),
  
  CONSTRAINT fk_study_groups_course 
    FOREIGN KEY (course_id) REFERENCES courses(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. STUDY_GROUP_STUDENTS - Связь групп и слушателей
-- ============================================================
CREATE TABLE IF NOT EXISTS study_group_students (
  id VARCHAR(191) PRIMARY KEY,
  group_id VARCHAR(191) NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_group_id (group_id),
  INDEX idx_student_id (student_id),
  UNIQUE INDEX idx_group_student (group_id, student_id),
  
  CONSTRAINT fk_sgs_group 
    FOREIGN KEY (group_id) REFERENCES study_groups(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sgs_student 
    FOREIGN KEY (student_id) REFERENCES students(id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. CLASSROOMS - Аудитории
-- ============================================================
CREATE TABLE IF NOT EXISTS classrooms (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  capacity INT DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. SCHEDULE_EVENTS - События расписания
-- ============================================================
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
  is_all_day BOOLEAN DEFAULT FALSE,
  color VARCHAR(20) DEFAULT 'primary',
  event_type ENUM('theory', 'practice', 'assessment', 'other') DEFAULT 'theory',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  notes TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_group_id (group_id),
  INDEX idx_discipline_id (discipline_id),
  INDEX idx_instructor_id (instructor_id),
  INDEX idx_classroom_id (classroom_id),
  INDEX idx_start_time (start_time),
  INDEX idx_end_time (end_time),
  INDEX idx_date_range (start_time, end_time),
  INDEX idx_event_type (event_type),
  
  CONSTRAINT fk_schedule_group 
    FOREIGN KEY (group_id) REFERENCES study_groups(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_schedule_discipline 
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_schedule_instructor 
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_schedule_classroom 
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_schedule_dates CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. SCHEDULE_PERIODS - Настройки академических часов
-- ============================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. SCHEDULE_SETTINGS - Общие настройки расписания
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. ORGANIZATION_REPRESENTATIVES - Представители организаций
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_representatives (
  id VARCHAR(191) PRIMARY KEY,
  organization_id VARCHAR(191) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  telegram_chat_id BIGINT UNIQUE,
  telegram_username VARCHAR(100),
  status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
  access_groups JSON,
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
  INDEX idx_phone (phone),
  FULLTEXT INDEX ft_search (full_name, phone),
  
  CONSTRAINT fk_representatives_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_representatives_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. TELEGRAM_BOT_SESSIONS - Сессии Telegram-бота
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
  id VARCHAR(191) PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  state VARCHAR(50) NOT NULL DEFAULT 'idle',
  data JSON,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_chat_id (chat_id),
  INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
