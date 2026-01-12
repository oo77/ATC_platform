import type { PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Консолидированная миграция: Полная схема базы данных ATC Platform
 * Дата: 2025-12-24
 * Описание: Объединённая миграция всех таблиц с актуальной структурой.
 *           Включает все изменения из предыдущих миграций.
 * 
 * Таблицы (в порядке создания с учётом зависимостей):
 * 1. users - Пользователи системы
 * 2. students - Слушатели
 * 3. certificates - Сертификаты слушателей
 * 4. instructors - Инструкторы/преподаватели
 * 5. certificate_templates - Шаблоны сертификатов
 * 6. courses - Учебные программы
 * 7. disciplines - Дисциплины курсов
 * 8. discipline_instructors - Связь дисциплин и инструкторов
 * 9. folders - Папки файлового менеджера
 * 10. files - Файлы
 * 11. activity_logs - Журнал действий
 * 12. study_groups - Учебные группы
 * 13. study_group_students - Связь групп и слушателей
 * 14. classrooms - Аудитории
 * 15. schedule_events - События расписания
 * 16. schedule_periods - Настройки академических часов
 * 17. schedule_settings - Общие настройки расписания
 * 18. organizations - Организации
 * 19. organization_representatives - Представители организаций
 * 20. telegram_bot_sessions - Сессии Telegram-бота
 */

export const description = 'Консолидированная миграция: полная схема базы данных';

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running consolidated migration: Full database schema');

  // ============================================================
  // 1. USERS - Пользователи системы
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
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_pinfl (pinfl)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "users" created');

  // ============================================================
  // 2. ORGANIZATIONS - Организации (до students, т.к. students ссылается)
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Уникальный код организации (нормализованное название)',
      name VARCHAR(255) NOT NULL COMMENT 'Полное название организации',
      short_name VARCHAR(100) COMMENT 'Краткое название',
      contact_phone VARCHAR(20) COMMENT 'Контактный телефон',
      contact_email VARCHAR(100) COMMENT 'Контактный email',
      address TEXT COMMENT 'Адрес организации',
      description TEXT COMMENT 'Описание организации',
      is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Активна ли организация',
      students_count INT NOT NULL DEFAULT 0 COMMENT 'Кэшированное количество слушателей',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_code (code),
      INDEX idx_name (name),
      INDEX idx_is_active (is_active),
      FULLTEXT INDEX ft_search (name, short_name, address)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "organizations" created');

  // ============================================================
  // 3. STUDENTS - Слушатели (с organization_id)
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(191) PRIMARY KEY,
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
      FULLTEXT INDEX ft_search (full_name, organization, position),
      
      CONSTRAINT fk_students_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "students" created');

  // ============================================================
  // 4. CERTIFICATES - Сертификаты
  // ============================================================
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
  console.log('✅ Table "certificates" created');

  // ============================================================
  // 5. INSTRUCTORS - Инструкторы (с обновлённой структурой)
  // ============================================================
  await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "instructors" created');

  // ============================================================
  // 6. CERTIFICATE_TEMPLATES - Шаблоны сертификатов
  // ============================================================
  await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "certificate_templates" created');

  // ============================================================
  // 7. COURSES - Учебные программы
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(10) NOT NULL COMMENT 'Короткое название из 4-5 заглавных букв',
      code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Код курса, например 2400001',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "courses" created');

  // ============================================================
  // 8. DISCIPLINES - Дисциплины (с разбивкой часов)
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS disciplines (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hours INT NOT NULL DEFAULT 0 COMMENT 'Общее количество академических часов (авто-вычисляемое)',
      theory_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы теоретического обучения',
      practice_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы практического обучения',
      assessment_hours INT NOT NULL DEFAULT 0 COMMENT 'Часы проверки знаний',
      order_index INT NOT NULL DEFAULT 0 COMMENT 'Порядок отображения в курсе',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "disciplines" created');

  // Триггеры для автоматического вычисления hours
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_insert`);
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_update`);
  
  await connection.query(`
    CREATE TRIGGER disciplines_calculate_hours_insert
    BEFORE INSERT ON disciplines
    FOR EACH ROW
    BEGIN
      SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
    END
  `);
  
  await connection.query(`
    CREATE TRIGGER disciplines_calculate_hours_update
    BEFORE UPDATE ON disciplines
    FOR EACH ROW
    BEGIN
      SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
    END
  `);
  console.log('✅ Triggers for disciplines.hours auto-calculation created');

  // ============================================================
  // 9. DISCIPLINE_INSTRUCTORS - Связь дисциплин и инструкторов
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_instructors (
      id VARCHAR(191) PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE COMMENT 'Основной инструктор дисциплины',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "discipline_instructors" created');

  // ============================================================
  // 10. FOLDERS - Папки файлового менеджера
  // ============================================================
  await connection.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "folders" created');

  // ============================================================
  // 11. FILES - Файлы
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      
      uuid CHAR(36) NOT NULL UNIQUE COMMENT 'Публичный UUID для доступа к файлу',
      filename VARCHAR(255) NOT NULL COMMENT 'Оригинальное имя файла',
      stored_name VARCHAR(255) NOT NULL COMMENT 'Имя файла на диске (с хешем)',
      
      mime_type VARCHAR(100) NOT NULL COMMENT 'MIME тип файла',
      size_bytes INT UNSIGNED NOT NULL COMMENT 'Размер файла в байтах',
      extension VARCHAR(10) NOT NULL COMMENT 'Расширение файла',
      
      storage_path VARCHAR(500) NOT NULL COMMENT 'Относительный путь к директории',
      full_path VARCHAR(1000) NOT NULL COMMENT 'Полный путь к файлу',
      
      category ENUM(
        'profile',
        'certificate_template',
        'certificate_generated',
        'course_material',
        'course_media',
        'course_cover',
        'group_gallery',
        'group_file',
        'assignment',
        'other'
      ) NOT NULL COMMENT 'Категория файла',
      
      folder_id INT UNSIGNED NULL COMMENT 'Ссылка на папку',
      
      user_id VARCHAR(36) NULL COMMENT 'UUID пользователя',
      course_id INT UNSIGNED NULL COMMENT 'Связь с курсом',
      group_id INT UNSIGNED NULL COMMENT 'Связь с группой',
      assignment_id INT UNSIGNED NULL COMMENT 'Связь с заданием',
      
      metadata JSON NULL COMMENT 'Дополнительные метаданные',
      
      is_public BOOLEAN DEFAULT FALSE COMMENT 'Публичный доступ',
      access_level ENUM('public', 'authenticated', 'owner', 'admin') DEFAULT 'authenticated',
      
      uploaded_by VARCHAR(36) NOT NULL COMMENT 'UUID пользователя кто загрузил',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "files" created');

  // ============================================================
  // 12. ACTIVITY_LOGS - Журнал действий пользователей
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL COMMENT 'ID пользователя, выполнившего действие',
      
      action_type ENUM(
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'IMPORT',
        'EXPORT'
      ) NOT NULL COMMENT 'Тип действия',
      
      entity_type ENUM(
        'USER',
        'STUDENT',
        'CERTIFICATE',
        'COURSE',
        'DISCIPLINE',
        'INSTRUCTOR',
        'FILE',
        'FOLDER',
        'SYSTEM'
      ) NOT NULL COMMENT 'Тип сущности',
      
      entity_id VARCHAR(191) NULL COMMENT 'ID сущности, над которой выполнено действие',
      entity_name VARCHAR(255) NULL COMMENT 'Название сущности для отображения',
      
      details JSON NULL COMMENT 'Дополнительные данные о действии',
      
      ip_address VARCHAR(45) NULL COMMENT 'IP адрес пользователя',
      user_agent TEXT NULL COMMENT 'User Agent браузера',
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата и время действия',
      
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type),
      INDEX idx_entity_type (entity_type),
      INDEX idx_entity_id (entity_id),
      INDEX idx_created_at (created_at),
      INDEX idx_user_created (user_id, created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "activity_logs" created');

  // ============================================================
  // 13. STUDY_GROUPS - Учебные группы
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_groups (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Уникальный код группы, например АПАК-20',
      course_id VARCHAR(191) NOT NULL COMMENT 'ID учебной программы',
      start_date DATE NOT NULL COMMENT 'Дата начала обучения',
      end_date DATE NOT NULL COMMENT 'Дата окончания обучения',
      classroom VARCHAR(100) COMMENT 'Аудитория',
      description TEXT COMMENT 'Описание группы',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "study_groups" created');

  // ============================================================
  // 14. STUDY_GROUP_STUDENTS - Связь групп и слушателей
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_group_students (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL COMMENT 'ID учебной группы',
      student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
      enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Дата зачисления в группу',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "study_group_students" created');

  // ============================================================
  // 15. CLASSROOMS - Аудитории
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Название аудитории, например "101" или "Конференц-зал"',
      capacity INT DEFAULT 0 COMMENT 'Вместимость аудитории',
      description TEXT COMMENT 'Описание аудитории',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "classrooms" created');

  // ============================================================
  // 16. SCHEDULE_EVENTS - События расписания (с исправленным event_type)
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL COMMENT 'Название занятия',
      description TEXT COMMENT 'Описание занятия',
      group_id VARCHAR(191) COMMENT 'ID учебной группы',
      discipline_id VARCHAR(191) COMMENT 'ID дисциплины (опционально)',
      instructor_id VARCHAR(191) COMMENT 'ID инструктора',
      classroom_id VARCHAR(191) COMMENT 'ID аудитории',
      start_time DATETIME NOT NULL COMMENT 'Дата и время начала',
      end_time DATETIME NOT NULL COMMENT 'Дата и время окончания',
      is_all_day BOOLEAN DEFAULT FALSE COMMENT 'Событие на весь день',
      color VARCHAR(20) DEFAULT 'primary' COMMENT 'Цвет события: primary, success, warning, danger',
      event_type ENUM('theory', 'practice', 'assessment', 'other') DEFAULT 'theory' 
        COMMENT 'Тип занятия: theory (теория), practice (практика), assessment (проверка знаний), other (другое)',
      is_recurring BOOLEAN DEFAULT FALSE COMMENT 'Повторяющееся событие',
      recurrence_rule TEXT COMMENT 'Правило повторения (iCal RRULE)',
      notes TEXT COMMENT 'Дополнительные заметки',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "schedule_events" created');

  // ============================================================
  // 17. SCHEDULE_PERIODS - Настройки академических часов
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_periods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      period_number INT NOT NULL COMMENT 'Номер пары (1-12)',
      start_time VARCHAR(5) NOT NULL COMMENT 'Время начала (HH:MM)',
      end_time VARCHAR(5) NOT NULL COMMENT 'Время окончания (HH:MM)',
      is_after_break BOOLEAN DEFAULT FALSE COMMENT 'Следует ли после большого перерыва',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_period_number (period_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "schedule_periods" created');

  // ============================================================
  // 18. SCHEDULE_SETTINGS - Общие настройки расписания
  // ============================================================
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
  // 19. ORGANIZATION_REPRESENTATIVES - Представители организаций
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organization_representatives (
      id VARCHAR(191) PRIMARY KEY,
      organization_id VARCHAR(191) NOT NULL COMMENT 'Ссылка на организацию',
      full_name VARCHAR(255) NOT NULL COMMENT 'ФИО представителя',
      phone VARCHAR(20) NOT NULL COMMENT 'Номер телефона',
      telegram_chat_id BIGINT UNIQUE COMMENT 'Telegram Chat ID',
      telegram_username VARCHAR(100) COMMENT 'Username в Telegram',
      status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending' COMMENT 'Статус доступа',
      access_groups JSON COMMENT 'JSON массив ID групп для доступа (null = все группы организации)',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Получать уведомления',
      last_activity_at DATETIME(3) COMMENT 'Последняя активность в боте',
      approved_by VARCHAR(191) COMMENT 'Кто одобрил заявку',
      approved_at DATETIME(3) COMMENT 'Когда одобрили',
      blocked_reason TEXT COMMENT 'Причина блокировки',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "organization_representatives" created');

  // ============================================================
  // 20. TELEGRAM_BOT_SESSIONS - Сессии Telegram-бота
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
      id VARCHAR(191) PRIMARY KEY,
      chat_id BIGINT NOT NULL UNIQUE COMMENT 'Telegram Chat ID',
      state VARCHAR(50) NOT NULL DEFAULT 'idle' COMMENT 'Текущее состояние FSM',
      data JSON COMMENT 'Данные сессии (временные данные регистрации и т.д.)',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_chat_id (chat_id),
      INDEX idx_state (state)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "telegram_bot_sessions" created');

  // ============================================================
  // SEED DATA - Начальные данные
  // ============================================================
  console.log('🌱 Seeding initial data...');

  // Администратор по умолчанию
  const [existingAdmin] = await connection.query<any[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    ['admin@atc.uz']
  );

  if (!existingAdmin || existingAdmin.length === 0) {
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = randomUUID();

    await connection.query(
      `INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
       VALUES (?, 'ADMIN', 'Администратор', 'admin@atc.uz', ?, NOW(3), NOW(3))`,
      [adminId, hashedPassword]
    );
    console.log('✅ Default admin user created (admin@atc.uz / admin123)');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Шаблоны сертификатов
  const [existingTemplates] = await connection.query<any[]>(
    'SELECT COUNT(*) as count FROM certificate_templates'
  );
  
  if (existingTemplates[0].count === 0) {
    const templates = [
      { id: randomUUID(), name: 'Стандартный сертификат', description: 'Базовый шаблон сертификата о прохождении курса' },
      { id: randomUUID(), name: 'Сертификат с отличием', description: 'Шаблон для студентов, окончивших курс с отличием' },
      { id: randomUUID(), name: 'Сертификат повышения квалификации', description: 'Официальный шаблон для курсов повышения квалификации' }
    ];

    for (const template of templates) {
      await connection.query(
        `INSERT INTO certificate_templates (id, name, description) VALUES (?, ?, ?)`,
        [template.id, template.name, template.description]
      );
    }
    console.log('✅ Certificate templates created');
  }

  // Системные папки
  const [existingFolders] = await connection.query<any[]>(
    'SELECT COUNT(*) as count FROM folders WHERE is_system = TRUE'
  );

  if (existingFolders[0].count === 0) {
    const systemFolders = [
      { name: 'Курсы', path: '/Курсы' },
      { name: 'Сертификаты', path: '/Сертификаты' },
      { name: 'Профили', path: '/Профили' },
      { name: 'Группы', path: '/Группы' },
      { name: 'Прочее', path: '/Прочее' },
    ];

    for (const folder of systemFolders) {
      await connection.query(
        `INSERT INTO folders (uuid, name, parent_id, path, is_system) VALUES (?, ?, NULL, ?, TRUE)`,
        [randomUUID(), folder.name, folder.path]
      );
    }
    console.log('✅ System folders created');
  }

  // Аудитории
  const [existingClassrooms] = await connection.query<any[]>(
    'SELECT COUNT(*) as count FROM classrooms'
  );

  if (existingClassrooms[0].count === 0) {
    const classrooms = [
      { id: randomUUID(), name: '101', capacity: 30, description: 'Учебная аудитория' },
      { id: randomUUID(), name: '102', capacity: 25, description: 'Учебная аудитория' },
      { id: randomUUID(), name: '201', capacity: 40, description: 'Лекционный зал' },
      { id: randomUUID(), name: '202', capacity: 20, description: 'Компьютерный класс' },
      { id: randomUUID(), name: 'Конференц-зал', capacity: 100, description: 'Большой конференц-зал' },
    ];

    for (const classroom of classrooms) {
      await connection.query(
        `INSERT INTO classrooms (id, name, capacity, description) VALUES (?, ?, ?, ?)`,
        [classroom.id, classroom.name, classroom.capacity, classroom.description]
      );
    }
    console.log('✅ Classrooms created');
  }

  // Академические часы
  const [existingPeriods] = await connection.query<any[]>(
    'SELECT COUNT(*) as count FROM schedule_periods'
  );

  if (existingPeriods[0].count === 0) {
    await connection.query(`
      INSERT INTO schedule_periods (period_number, start_time, end_time, is_after_break) VALUES
      (1, '09:00', '09:40', FALSE),
      (2, '09:40', '10:20', FALSE),
      (3, '10:30', '11:10', FALSE),
      (4, '11:10', '11:50', FALSE),
      (5, '12:00', '12:40', FALSE),
      (6, '12:40', '13:20', FALSE),
      (7, '14:00', '14:40', TRUE),
      (8, '14:40', '15:20', FALSE),
      (9, '15:30', '16:10', FALSE),
      (10, '16:10', '16:50', FALSE),
      (11, '17:00', '17:40', FALSE),
      (12, '17:40', '18:20', FALSE)
    `);
    console.log('✅ Schedule periods created');
  }

  // Настройки расписания
  const [existingSettings] = await connection.query<any[]>(
    'SELECT COUNT(*) as count FROM schedule_settings'
  );

  if (existingSettings[0].count === 0) {
    await connection.query(`
      INSERT INTO schedule_settings (setting_key, setting_value, description) VALUES
      ('lunch_break_start', '13:20', 'Начало большого перерыва'),
      ('lunch_break_end', '14:00', 'Конец большого перерыва'),
      ('period_duration_minutes', '40', 'Длительность одного академического часа в минутах'),
      ('short_break_minutes', '10', 'Длительность короткого перерыва в минутах'),
      ('snap_to_periods', 'true', 'Привязка событий к академическим часам'),
      ('show_period_numbers', 'true', 'Показывать номера пар в календаре')
    `);
    console.log('✅ Schedule settings created');
  }

  console.log('');
  console.log('🎉 Consolidated migration completed successfully!');
  console.log('📊 Created 20 tables with all indexes, constraints, and seed data');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back consolidated migration...');

  // Удаляем триггеры
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_insert`);
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_update`);

  // Удаляем таблицы в обратном порядке (из-за foreign keys)
  const tables = [
    'telegram_bot_sessions',
    'organization_representatives',
    'schedule_settings',
    'schedule_periods',
    'schedule_events',
    'classrooms',
    'study_group_students',
    'study_groups',
    'activity_logs',
    'files',
    'folders',
    'discipline_instructors',
    'disciplines',
    'courses',
    'certificate_templates',
    'instructors',
    'certificates',
    'students',
    'organizations',
    'users',
  ];

  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
    console.log(`✅ Table "${table}" dropped`);
  }

  console.log('🎉 Rollback completed');
};
