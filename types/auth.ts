/**
 * Общие типы для аутентификации (доступны на клиенте и сервере)
 */

// Роли пользователей в системе
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

// Публичные данные пользователя (без пароля)
export interface UserPublic {
  id: string
  role: UserRole
  name: string
  email: string
  phone?: string | null
  workplace?: string | null
  position?: string | null
  pinfl?: string | null
  created_at: Date
  updated_at: Date
}

// Данные для регистрации
export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  workplace?: string
  position?: string
  pinfl?: string
  role?: UserRole
}

// Данные для входа
export interface LoginData {
  email: string
  password: string
}

// Ответ при успешной аутентификации
export interface AuthResponse {
  success: boolean
  user: UserPublic
  token: string
  refreshToken?: string
}

// Ответ при ошибке
export interface ErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}
