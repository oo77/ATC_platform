import type { PoolConnection } from "mysql2/promise";

export const description = "Add instructor categories to files table ENUM";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Updating files table category ENUM...");
  
  await connection.query(`
    ALTER TABLE files 
    MODIFY COLUMN category ENUM(
      'profile', 
      'certificate_template', 
      'certificate_generated', 
      'course_material', 
      'course_media', 
      'course_cover', 
      'group_gallery', 
      'group_file', 
      'group_report', 
      'assignment', 
      'instructor_diploma',
      'instructor_certificate',
      'instructor_photo',
      'instructor_additional',
      'other'
    ) NOT NULL
  `);
  
  console.log("✅ Files table category ENUM updated");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Reverting files table category ENUM...");
  
  // Note: We might have data with the new categories, so reverting might fail if not handled.
  // But for development, we can try to revert to original ENUM.
  await connection.query(`
    ALTER TABLE files 
    MODIFY COLUMN category ENUM(
      'profile', 
      'certificate_template', 
      'certificate_generated', 
      'course_material', 
      'course_media', 
      'course_cover', 
      'group_gallery', 
      'group_file', 
      'group_report', 
      'assignment', 
      'other'
    ) NOT NULL
  `);
};
