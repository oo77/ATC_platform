import { getDbPool, testConnection } from '../utils/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Скрипт для создания администратора
 * Использование: npx tsx server/database/seed-admin.ts
 */

async function seedAdmin() {
  console.log('🔄 Creating admin user...');

  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      // Проверяем, существует ли админ
      const [rows] = await connection.query<any[]>(
        'SELECT id, email, name, role FROM users WHERE email = ?',
        ['admin@atc.uz']
      );

      if (rows && rows.length > 0) {
        console.log('✅ Администратор уже существует:');
        console.log('   ID:', rows[0].id);
        console.log('   Email:', rows[0].email);
        console.log('   Имя:', rows[0].name);
        console.log('   Роль:', rows[0].role);
      } else {
        // Создаём администратора
        const adminId = randomUUID();
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await connection.query(
          `INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
           VALUES (?, 'ADMIN', 'Администратор', 'admin@atc.uz', ?, NOW(3), NOW(3))`,
          [adminId, hashedPassword]
        );

        console.log('✅ Администратор создан!');
        console.log('   Email: admin@atc.uz');
        console.log('   Пароль: admin123');
        console.log('   ID:', adminId);
      }
    } finally {
      connection.release();
    }

    // Закрываем пул
    await pool.end();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedAdmin();
