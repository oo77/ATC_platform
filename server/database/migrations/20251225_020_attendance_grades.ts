/**
 * Миграция 020: Посещаемость и оценки
 * Создаёт таблицы attendance, grades, final_grades
 */

import type { PoolConnection } from 'mysql2/promise';

export const description = 'Создание таблиц для системы посещаемости и оценок';

export async function up(connection: PoolConnection): Promise<void> {
  console.log('  Creating attendance table...');
  
  // Таблица посещаемости
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
      schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID занятия из расписания',
      hours_attended DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT 'Посещённые академические часы',
      max_hours DECIMAL(3,1) NOT NULL COMMENT 'Максимальные часы занятия (для расчёта %)',
      notes TEXT COMMENT 'Примечания (причина отсутствия и т.д.)',
      marked_by VARCHAR(191) COMMENT 'Кто отметил',
      marked_at DATETIME(3) COMMENT 'Когда отметил',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_attendance_student_event (student_id, schedule_event_id),
      INDEX idx_attendance_schedule_event_id (schedule_event_id),
      INDEX idx_attendance_marked_by (marked_by),
      
      CONSTRAINT fk_attendance_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_marked_by 
        FOREIGN KEY (marked_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('  Creating grades table...');
  
  // Таблица оценок
  await connection.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
      schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID занятия (assessment)',
      grade INT NOT NULL COMMENT 'Оценка (0-100)',
      notes TEXT COMMENT 'Комментарий к оценке',
      graded_by VARCHAR(191) COMMENT 'Кто выставил оценку',
      graded_at DATETIME(3) COMMENT 'Когда выставлена',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_grades_student_event (student_id, schedule_event_id),
      INDEX idx_grades_schedule_event_id (schedule_event_id),
      INDEX idx_grades_graded_by (graded_by),
      INDEX idx_grades_grade (grade),
      
      CONSTRAINT fk_grades_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_graded_by 
        FOREIGN KEY (graded_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('  Creating final_grades table...');
  
  // Таблица итоговых оценок
  await connection.query(`
    CREATE TABLE IF NOT EXISTS final_grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL COMMENT 'ID слушателя',
      group_id VARCHAR(191) NOT NULL COMMENT 'ID группы',
      discipline_id VARCHAR(191) NOT NULL COMMENT 'ID дисциплины',
      final_grade INT COMMENT 'Итоговая оценка (0-100)',
      attendance_percent DECIMAL(5,2) COMMENT 'Процент посещаемости',
      status ENUM('in_progress', 'passed', 'failed', 'not_allowed') NOT NULL DEFAULT 'in_progress' 
        COMMENT 'Статус: в процессе, сдал, не сдал, не допущен',
      notes TEXT COMMENT 'Примечания',
      graded_by VARCHAR(191) COMMENT 'Кто выставил итоговую оценку',
      graded_at DATETIME(3) COMMENT 'Когда выставлена',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_final_grades_student_group_discipline (student_id, group_id, discipline_id),
      INDEX idx_final_grades_group_discipline (group_id, discipline_id),
      INDEX idx_final_grades_status (status),
      INDEX idx_final_grades_graded_by (graded_by),
      
      CONSTRAINT fk_final_grades_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_graded_by 
        FOREIGN KEY (graded_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('  Updating activity_logs entity_type enum...');
  
  // Обновляем ENUM для activity_logs
  try {
    await connection.query(`
      ALTER TABLE activity_logs 
      MODIFY COLUMN entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE'
      ) NOT NULL
    `);
  } catch (error: any) {
    // Если ENUM уже обновлён - игнорируем
    if (!error.message?.includes('Duplicate')) {
      console.log('  Note: activity_logs entity_type enum may already be updated');
    }
  }
  
  console.log('  ✅ Attendance and grades tables created');
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log('  Dropping attendance and grades tables...');
  
  await connection.query('DROP TABLE IF EXISTS final_grades');
  await connection.query('DROP TABLE IF EXISTS grades');
  await connection.query('DROP TABLE IF EXISTS attendance');
  
  console.log('  ✅ Tables dropped');
}
