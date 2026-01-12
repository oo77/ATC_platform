import { getDbPool } from '../utils/db';
import bcrypt from 'bcryptjs';

/**
 * Создание администратора по умолчанию
 */
export async function seedAdmin() {
  console.log('🌱 Seeding admin user...');

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    // Проверяем, есть ли уже пользователи
    const [existingUsers] = await connection.query<any[]>(
      'SELECT COUNT(*) as count FROM users'
    );

    if (existingUsers[0].count > 0) {
      console.log('ℹ️  Users already exist, skipping admin seed');
      return;
    }

    // Создаём администратора
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(
      `INSERT INTO users (username, email, password, role, is_active) 
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@example.com', hashedPassword, 'admin', true]
    );

    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  ВАЖНО: Смените пароль после первого входа!');
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Запуск всех seed-функций
 */
export async function runSeeds() {
  console.log('🌱 Running database seeds...\n');

  try {
    await seedAdmin();
    console.log('\n✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

