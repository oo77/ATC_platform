// Скрипт для создания базы данных и таблиц
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function setupDatabase() {
  let connection;
  
  try {
    // Подключаемся к MySQL без указания базы данных
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Подключение к MySQL установлено');

    // Читаем SQL файл
    const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('📄 Выполняем SQL скрипт...');

    // Выполняем SQL скрипт
    await connection.query(schema);

    console.log('✅ База данных создана успешно!');
    
    // Теперь добавляем сотрудника Atabayev
    await connection.query('USE certificate_db');
    
    // Проверяем, существует ли уже такой сотрудник
    const [existing] = await connection.execute(
      'SELECT * FROM employees WHERE last_name = ? AND first_name = ?',
      ['Atabayev', 'Ravshanbek']
    );

    if (existing.length > 0) {
      console.log('⚠️ Сотрудник Atabayev Ravshanbek уже существует');
      console.log('Данные:', existing[0]);
    } else {
      // Добавляем сотрудника
      const [result] = await connection.execute(
        `INSERT INTO employees (first_name, last_name, middle_name, position, department, email, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'Ravshanbek',
          'Atabayev',
          null,
          'Passenger Handling Services Specialist',
          'Passenger Services',
          'atabayev.r@uzbekistan-airports.uz',
          '+998901234572'
        ]
      );

      console.log('✅ Сотрудник Atabayev Ravshanbek добавлен!');
      console.log('ID:', result.insertId);
    }

    // Показываем всех сотрудников
    const [employees] = await connection.query('SELECT * FROM employees');
    console.log('\n📋 Всего сотрудников в базе:', employees.length);
    console.log('\nСписок сотрудников:');
    employees.forEach((emp) => {
      console.log(`  - ${emp.last_name} ${emp.first_name} (${emp.position})`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Соединение закрыто');
    }
  }
}

// Запускаем скрипт
setupDatabase()
  .then(() => {
    console.log('\n🎉 Настройка завершена успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
