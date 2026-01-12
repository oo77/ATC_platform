import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { JwtPayload, User, UserPublic } from '../types/auth';

/**
 * Утилиты для аутентификации и авторизации
 */

// Константы
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
const SALT_ROUNDS = 10;

/**
 * Хеширование пароля
 * @param password - Пароль в открытом виде
 * @returns Хешированный пароль
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверка пароля
 * @param password - Пароль в открытом виде
 * @param hash - Хешированный пароль
 * @returns true если пароль совпадает
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Генерация JWT токена
 * @param payload - Данные для токена
 * @returns JWT токен
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  });
}

/**
 * Генерация refresh токена
 * @param payload - Данные для токена
 * @returns Refresh токен
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as string,
  });
}

/**
 * Верификация JWT токена
 * @param token - JWT токен
 * @returns Payload токена или null если токен невалидный
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Верификация refresh токена
 * @param token - Refresh токен
 * @returns Payload токена или null если токен невалидный
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Извлечение токена из заголовка Authorization
 * @param authHeader - Заголовок Authorization
 * @returns Токен или null
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Преобразование User в UserPublic (удаление пароля)
 * @param user - Пользователь с паролем
 * @returns Публичные данные пользователя
 */
export function toPublicUser(user: User): UserPublic {
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

/**
 * Создание payload для JWT токена из пользователя
 * @param user - Пользователь
 * @returns Payload для токена
 */
export function createTokenPayload(user: User): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}
