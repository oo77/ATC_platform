/**
 * Миграция: Добавление связей user_id в таблицы students и instructors
 * 
 * Назначение:
 * - Связывание пользователей системы с их профилями студентов/инструкторов
 * - Необходимо для системы разрешений (RBAC)
 */

import { executeQuery } from '../../utils/db'

export const id = '20251230_026_user_entity_links'
export const description = 'Добавление user_id в таблицы students и instructors для системы разрешений'

export async function up(): Promise<void> {
  console.log('[Migration] Adding user_id to instructors and students tables...')

  // 1. Добавляем user_id в таблицу instructors
  try {
    await executeQuery(`
      ALTER TABLE instructors
      ADD COLUMN user_id VARCHAR(191) NULL AFTER id
    `)
    console.log('[Migration] Added user_id column to instructors')
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] Column user_id already exists in instructors, skipping...')
    } else {
      throw error
    }
  }

  // 2. Добавляем внешний ключ для instructors.user_id
  try {
    await executeQuery(`
      ALTER TABLE instructors
      ADD CONSTRAINT fk_instructors_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    `)
    console.log('[Migration] Added foreign key fk_instructors_user')
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
      console.log('[Migration] Foreign key fk_instructors_user already exists, skipping...')
    } else {
      throw error
    }
  }

  // 3. Добавляем уникальный индекс для instructors.user_id
  try {
    await executeQuery(`
      ALTER TABLE instructors
      ADD UNIQUE INDEX idx_instructors_user_id (user_id)
    `)
    console.log('[Migration] Added unique index idx_instructors_user_id')
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('[Migration] Index idx_instructors_user_id already exists, skipping...')
    } else {
      throw error
    }
  }

  // 4. Добавляем user_id в таблицу students
  try {
    await executeQuery(`
      ALTER TABLE students
      ADD COLUMN user_id VARCHAR(191) NULL AFTER id
    `)
    console.log('[Migration] Added user_id column to students')
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] Column user_id already exists in students, skipping...')
    } else {
      throw error
    }
  }

  // 5. Добавляем внешний ключ для students.user_id
  try {
    await executeQuery(`
      ALTER TABLE students
      ADD CONSTRAINT fk_students_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    `)
    console.log('[Migration] Added foreign key fk_students_user')
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
      console.log('[Migration] Foreign key fk_students_user already exists, skipping...')
    } else {
      throw error
    }
  }

  // 6. Добавляем уникальный индекс для students.user_id
  try {
    await executeQuery(`
      ALTER TABLE students
      ADD UNIQUE INDEX idx_students_user_id (user_id)
    `)
    console.log('[Migration] Added unique index idx_students_user_id')
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('[Migration] Index idx_students_user_id already exists, skipping...')
    } else {
      throw error
    }
  }

  console.log('[Migration] User entity links migration completed successfully!')
}

export async function down(): Promise<void> {
  console.log('[Migration] Reverting user entity links...')

  // Удаляем внешние ключи и колонки
  try {
    await executeQuery('ALTER TABLE instructors DROP FOREIGN KEY fk_instructors_user')
  } catch (error) {
    console.warn('[Migration] Could not drop fk_instructors_user')
  }

  try {
    await executeQuery('ALTER TABLE instructors DROP INDEX idx_instructors_user_id')
  } catch (error) {
    console.warn('[Migration] Could not drop idx_instructors_user_id')
  }

  try {
    await executeQuery('ALTER TABLE instructors DROP COLUMN user_id')
  } catch (error) {
    console.warn('[Migration] Could not drop user_id from instructors')
  }

  try {
    await executeQuery('ALTER TABLE students DROP FOREIGN KEY fk_students_user')
  } catch (error) {
    console.warn('[Migration] Could not drop fk_students_user')
  }

  try {
    await executeQuery('ALTER TABLE students DROP INDEX idx_students_user_id')
  } catch (error) {
    console.warn('[Migration] Could not drop idx_students_user_id')
  }

  try {
    await executeQuery('ALTER TABLE students DROP COLUMN user_id')
  } catch (error) {
    console.warn('[Migration] Could not drop user_id from students')
  }

  console.log('[Migration] Revert completed!')
}
