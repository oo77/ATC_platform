import { testConnection } from '../utils/db';
import { runMigrations } from './migrator';

/**
 * Инициализация базы данных
 * Использует систему миграций для создания таблиц и начальных данных
 */
export async function initializeDatabase() {
  console.log('🔄 Initializing database...');

  try {
    // Проверка подключения
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Применение всех миграций
    await runMigrations();

    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Устаревшая функция - используйте систему миграций
 * @deprecated Используйте `npm run db:rollback:all` вместо этого
 */
export async function resetDatabase() {
  console.warn('⚠️  resetDatabase() is deprecated. Use migration system instead:');
  console.warn('   npm run db:rollback:all');
  throw new Error('Use migration system for database reset');
}
