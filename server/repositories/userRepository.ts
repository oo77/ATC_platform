/**
 * Репозиторий для работы с пользователями
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
  phone?: string | null;
  workplace?: string | null;
  position?: string | null;
  pinfl?: string | null;
  created_at: Date;
  updated_at: Date;
}

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
  phone: string | null;
  workplace: string | null;
  position: string | null;
  pinfl: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string; // Уже хэшированный пароль
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
  phone?: string;
  workplace?: string;
  position?: string;
  pinfl?: string;
}

/**
 * Генерация безопасного пароля
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';
  
  let password = '';
  
  // Гарантируем наличие каждого типа символов
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Добавляем остальные символы
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Перемешиваем пароль
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Хэширование пароля
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Проверка существования пользователя с указанным email
 */
export async function userEmailExists(email: string, excludeId?: string): Promise<boolean> {
  let query = 'SELECT id FROM users WHERE email = ?';
  const params: any[] = [email];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const rows = await executeQuery<UserRow[]>(query, params);
  return rows.length > 0;
}

/**
 * Получение пользователя по ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const rows = await executeQuery<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Получение пользователя по email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await executeQuery<UserRow[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Создание нового пользователя
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  const id = uuidv4();
  const now = new Date();
  
  await executeQuery(
    `INSERT INTO users (id, email, password_hash, name, role, phone, workplace, position, pinfl, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.email,
      data.password,
      data.name,
      data.role,
      data.phone || null,
      data.workplace || null,
      data.position || null,
      data.pinfl || null,
      now,
      now,
    ]
  );
  
  return {
    id,
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role,
    phone: data.phone || null,
    workplace: data.workplace || null,
    position: data.position || null,
    pinfl: data.pinfl || null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Обновление пароля пользователя
 */
export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  await executeQuery(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    [hashedPassword, new Date(), userId]
  );
}

/**
 * Обновление данных пользователя
 */
export async function updateUser(
  id: string, 
  data: Partial<Omit<CreateUserInput, 'password' | 'email'>>
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.role !== undefined) {
    fields.push('role = ?');
    values.push(data.role);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone || null);
  }
  if (data.workplace !== undefined) {
    fields.push('workplace = ?');
    values.push(data.workplace || null);
  }
  if (data.position !== undefined) {
    fields.push('position = ?');
    values.push(data.position || null);
  }
  if (data.pinfl !== undefined) {
    fields.push('pinfl = ?');
    values.push(data.pinfl || null);
  }
  
  if (fields.length === 0) {
    return getUserById(id);
  }
  
  fields.push('updated_at = ?');
  values.push(new Date());
  values.push(id);
  
  await executeQuery(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  return getUserById(id);
}

/**
 * Удаление пользователя
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
