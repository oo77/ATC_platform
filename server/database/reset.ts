#!/usr/bin/env node

/**
 * Полный сброс и инициализация базы данных
 * 
 * Этот скрипт:
 * 1. Откатывает все миграции (очищает БД)
 * 2. Применяет все миграции заново
 * 3. Создаёт администратора по умолчанию
 * 
 * Использование:
 *   npm run db:reset
 */

import { rollbackAllMigrations, runMigrations } from './migrator';
import { runSeeds } from './seed';

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  try {
    // Шаг 1: Откат всех миграций
    console.log('📦 Step 1/3: Rolling back all migrations...');
    await rollbackAllMigrations();
    console.log('✅ Rollback completed\n');

    // Шаг 2: Применение миграций
    console.log('📦 Step 2/3: Running migrations...');
    await runMigrations();
    console.log('✅ Migrations completed\n');

    // Шаг 3: Создание начальных данных
    console.log('📦 Step 3/3: Seeding database...');
    await runSeeds();
    console.log('✅ Seeding completed\n');

    console.log('✅ Database reset completed successfully!');
    console.log('\n📝 Default admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  ВАЖНО: Смените пароль после первого входа!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
