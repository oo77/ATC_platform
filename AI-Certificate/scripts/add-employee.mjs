// Скрипт для добавления сотрудника Atabayev Ravshanbek в базу данных
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addEmployee() {
  let connection;
  
  try {
    // Подключаемся к базе данных
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'certificate_db',
    });

    console.log('✅ Подключение к базе данных установлено');

    // Проверяем, существует ли уже такой сотрудник
    const [existing] = await connection.execute(
      'SELECT * FROM employees WHERE last_name = ? AND first_name = ?',
      ['Atabayev', 'Ravshanbek']
    );

    if (existing.length > 0) {
      console.log('⚠️ Сотрудник Atabayev Ravshanbek уже существует в базе данных');
      console.log('Данные сотрудника:', existing[0]);
      return;
    }

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

    console.log('✅ Сотрудник успешно добавлен!');
    console.log('ID нового сотрудника:', result.insertId);

    // Проверяем добавление
    const [newEmployee] = await connection.execute(
      'SELECT * FROM employees WHERE id = ?',
      [result.insertId]
    );

    console.log('\n📋 Данные добавленного сотрудника:');
    console.log(newEmployee[0]);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Соединение с базой данных закрыто');
    }
  }
}

// Запускаем скрипт
addEmployee()
  .then(() => {
    console.log('\n🎉 Скрипт выполнен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });
