import mysql from 'mysql2/promise';

// Создание пула подключений к MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'certificate_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  characterEncoding: 'utf8mb4',
  supportBigNumbers: true,
  bigNumberStrings: false,
  timezone: '+00:00'
});

/**
 * Проверка подключения к базе данных
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    
    // Явно устанавливаем кодировку для подключения
    await connection.query("SET NAMES 'utf8mb4'");
    await connection.query("SET CHARACTER SET utf8mb4");
    await connection.query("SET character_set_connection=utf8mb4");
    
    console.log('✅ MySQL подключена успешно');
    console.log(`📊 База данных: ${process.env.DB_NAME || 'certificate_db'}`);
    console.log('🔤 Кодировка: utf8mb4');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error);
    return false;
  }
}

/**
 * Вспомогательная функция для преобразования snake_case в camelCase
 */
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  
  return obj;
}

/**
 * Вспомогательная функция для преобразования camelCase в snake_case
 */
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  
  return obj;
}

export default pool;
