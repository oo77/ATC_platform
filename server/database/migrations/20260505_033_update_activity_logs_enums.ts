import type { PoolConnection } from "mysql2/promise";

export const description = "Update activity_logs enums to match current types";

export const up = async (connection: PoolConnection): Promise<void> => {
  // Update action_type enum
  await connection.query(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM(
      'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 
      'IMPORT', 'EXPORT', 'APPROVE', 'REJECT', 'BLOCK', 'UNBLOCK', 
      'REVOKE', 'ISSUE', 'RESET_PASSWORD', 'ASSIGN', 'UNASSIGN', 
      'ARCHIVE', 'RESTORE', 'UPLOAD', 'DOWNLOAD'
    ) NOT NULL
  `);

  // Update entity_type enum
  await connection.query(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM(
      'USER', 'STUDENT', 'CERTIFICATE', 'CERTIFICATE_TEMPLATE', 
      'CERTIFICATE_TEMPLATE_BACKGROUND', 'CERTIFICATE_TEMPLATE_IMAGE', 
      'ISSUED_CERTIFICATE', 'COURSE', 'DISCIPLINE', 'INSTRUCTOR', 
      'FILE', 'FOLDER', 'SCHEDULE', 'GROUP', 'CLASSROOM', 
      'ORGANIZATION', 'REPRESENTATIVE', 'ATTENDANCE', 'GRADE', 
      'SYSTEM', 'GROUP_REPORT', 'TRAINING_REQUEST'
    ) NOT NULL
  `);

  // Add indexes for better search performance
  await connection.query(`
    ALTER TABLE activity_logs 
    ADD INDEX IF NOT EXISTS idx_entity_type (entity_type),
    ADD INDEX IF NOT EXISTS idx_created_at (created_at)
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  // Revert action_type enum to initial state
  await connection.query(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM(
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'VIEW', 'DOWNLOAD', 'UPLOAD'
    ) NOT NULL
  `);

  // Revert entity_type enum to initial state
  await connection.query(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM(
      'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
      'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
      'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE', 'LIBRARY_BOOK', 'TEST'
    ) NOT NULL
  `);
};
