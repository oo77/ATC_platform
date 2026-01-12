/**
 * Утилиты для проверки разрешений на сервере
 */

import { H3Event, createError, getHeader } from 'h3'
import { UserRole, type JwtPayload } from '../types/auth'
import {
  Permission,
  ROLE_PERMISSIONS,
  PermissionContext,
  AccessCheckResult,
  ApiPermissionConfig,
  API_PERMISSIONS,
} from '../types/permissions'
import { executeQuery } from './db'
import { verifyToken } from './auth'

// ========================================
// ОСНОВНЫЕ ФУНКЦИИ ПРОВЕРКИ
// ========================================

/**
 * Проверяет, есть ли у роли указанное разрешение
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions?.includes(permission) ?? false
}

/**
 * Проверяет, есть ли у роли все указанные разрешения (AND)
 */
export function roleHasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => roleHasPermission(role, p))
}

/**
 * Проверяет, есть ли у роли хотя бы одно из указанных разрешений (OR)
 */
export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => roleHasPermission(role, p))
}

/**
 * Получает все разрешения для роли
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// ========================================
// ПОЛУЧЕНИЕ КОНТЕКСТА ПОЛЬЗОВАТЕЛЯ
// ========================================

/**
 * Извлекает данные пользователя из event.context или из токена
 */
function getAuthUserFromEvent(event: H3Event): JwtPayload | null {
  // Сначала пробуем получить из context (установлено в auth middleware)
  if (event.context.user) {
    return {
      userId: event.context.user.id,
      email: event.context.user.email,
      role: event.context.user.role as UserRole,
    }
  }

  // Если нет в context — пробуем извлечь из токена напрямую
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

/**
 * Получает полный контекст разрешений для пользователя
 * Включает связанные сущности (instructor/student)
 */
export async function getPermissionContext(event: H3Event): Promise<PermissionContext | null> {
  const user = getAuthUserFromEvent(event)
  if (!user) return null

  const context: PermissionContext = {
    userId: user.userId,
    role: user.role as UserRole,
  }

  // Если TEACHER — получаем instructor_id
  if (user.role === UserRole.TEACHER) {
    const instructor = await getInstructorByUserId(user.userId)
    if (instructor) {
      context.instructorId = instructor.id
    }
  }

  // Если STUDENT — получаем student_id
  if (user.role === UserRole.STUDENT) {
    const student = await getStudentByUserId(user.userId)
    if (student) {
      context.studentId = student.id
    }
  }

  return context
}

// ========================================
// СВЯЗИ USERS ↔ INSTRUCTORS/STUDENTS
// ========================================

/**
 * Получает инструктора по user_id
 */
export async function getInstructorByUserId(userId: string): Promise<{ id: string; fullName: string } | null> {
  try {
    console.log(`[Permissions] getInstructorByUserId called with userId: ${userId}`)

    const rows = await executeQuery<any[]>(
      'SELECT id, full_name as fullName FROM instructors WHERE user_id = ? LIMIT 1',
      [userId]
    )

    console.log(`[Permissions] Query result type:`, typeof rows)
    console.log(`[Permissions] Query result is array:`, Array.isArray(rows))
    console.log(`[Permissions] Query result:`, rows)
    console.log(`[Permissions] Query result length:`, rows?.length)

    if (rows && rows.length > 0) {
      console.log(`[Permissions] Found instructor: ${rows[0].fullName} (ID: ${rows[0].id})`)
      return rows[0]
    } else {
      console.log(`[Permissions] No instructor found for user_id: ${userId}`)
      return null
    }
  } catch (error) {
    console.error('[Permissions] Error getting instructor by user_id:', error)
    return null
  }
}

/**
 * Получает студента по user_id
 */
export async function getStudentByUserId(userId: string): Promise<{ id: string; fullName: string } | null> {
  try {
    const rows = await executeQuery<any[]>(
      'SELECT id, full_name as fullName FROM students WHERE user_id = ? LIMIT 1',
      [userId]
    )
    return rows[0] || null
  } catch (error) {
    console.error('[Permissions] Error getting student by user_id:', error)
    return null
  }
}

// ========================================
// ФИЛЬТРАЦИЯ ДАННЫХ ПО РОЛИ
// ========================================

/**
 * Получает группы преподавателя через:
 * 1. schedule_events - события расписания, где инструктор назначен
 * 2. discipline_instructors -> disciplines -> study_groups - группы через учебные программы
 */
export async function getTeacherGroups(instructorId: string): Promise<string[]> {
  try {
    // Получаем группы из двух источников:
    // 1. Напрямую из расписания (schedule_events)
    // 2. Через привязку к дисциплинам учебных программ групп
    const rows = await executeQuery<any[]>(
      `SELECT DISTINCT group_id FROM (
        -- Группы из расписания
        SELECT group_id FROM schedule_events WHERE instructor_id = ? AND group_id IS NOT NULL
        UNION
        -- Группы через дисциплины программ
        SELECT sg.id as group_id
        FROM study_groups sg
        JOIN disciplines d ON d.course_id = sg.course_id
        JOIN discipline_instructors di ON di.discipline_id = d.id
        WHERE di.instructor_id = ?
      ) AS teacher_groups`,
      [instructorId, instructorId]
    )

    const groupIds = rows.map((r: { group_id: string }) => r.group_id).filter(Boolean)
    console.log(`[Permissions] getTeacherGroups for ${instructorId}: found ${groupIds.length} groups`)

    return groupIds
  } catch (error) {
    console.error('[Permissions] Error getting teacher groups:', error)
    return []
  }
}

/**
 * Получает группы студента
 */
export async function getStudentGroups(studentId: string): Promise<string[]> {
  try {
    const rows = await executeQuery<any[]>(
      'SELECT group_id FROM study_group_students WHERE student_id = ?',
      [studentId]
    )
    return rows.map((r: { group_id: string }) => r.group_id)
  } catch (error) {
    console.error('[Permissions] Error getting student groups:', error)
    return []
  }
}

/**
 * Проверяет, имеет ли пользователь доступ к группе
 */
export async function canAccessGroup(context: PermissionContext, groupId: string): Promise<boolean> {
  // ADMIN и MANAGER имеют доступ ко всем группам
  if (context.role === UserRole.ADMIN || context.role === UserRole.MANAGER) {
    return true
  }

  // TEACHER — проверяем через schedule_events
  if (context.role === UserRole.TEACHER && context.instructorId) {
    const teacherGroups = await getTeacherGroups(context.instructorId)
    return teacherGroups.includes(groupId)
  }

  // STUDENT — проверяем через study_group_students
  if (context.role === UserRole.STUDENT && context.studentId) {
    const studentGroups = await getStudentGroups(context.studentId)
    return studentGroups.includes(groupId)
  }

  return false
}

/**
 * Проверяет, имеет ли пользователь доступ к студенту
 */
export async function canAccessStudent(context: PermissionContext, studentId: string): Promise<boolean> {
  // ADMIN и MANAGER имеют доступ ко всем студентам
  if (context.role === UserRole.ADMIN || context.role === UserRole.MANAGER) {
    return true
  }

  // TEACHER — проверяем, входит ли студент в одну из его групп
  if (context.role === UserRole.TEACHER && context.instructorId) {
    const teacherGroups = await getTeacherGroups(context.instructorId)
    if (teacherGroups.length === 0) return false

    // Проверяем, есть ли студент в этих группах
    const [rows] = await executeQuery<any[]>(
      `SELECT 1 FROM study_group_students 
       WHERE student_id = ? AND group_id IN (${teacherGroups.map(() => '?').join(',')})
       LIMIT 1`,
      [studentId, ...teacherGroups]
    )
    return rows.length > 0
  }

  // STUDENT — может видеть только себя
  if (context.role === UserRole.STUDENT) {
    return context.studentId === studentId
  }

  return false
}

// ========================================
// MIDDLEWARE-ХЕЛПЕРЫ
// ========================================

/**
 * Требует только авторизацию (без проверки разрешений)
 */
export async function requireAuth(event: H3Event): Promise<PermissionContext> {
  const context = await getPermissionContext(event)

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Требуется авторизация',
    })
  }

  return context
}

/**
 * Требует указанное разрешение (бросает ошибку если нет доступа)
 */
export async function requirePermission(event: H3Event, permission: Permission): Promise<PermissionContext> {
  const context = await getPermissionContext(event)

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Требуется авторизация',
    })
  }

  if (!roleHasPermission(context.role, permission)) {
    console.warn(`[Permissions] Access denied: user ${context.userId} (${context.role}) lacks permission ${permission}`)
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `Недостаточно прав. Требуется: ${permission}`,
    })
  }

  return context
}

/**
 * Требует хотя бы одно из указанных разрешений
 */
export async function requireAnyPermission(event: H3Event, permissions: Permission[]): Promise<PermissionContext> {
  const context = await getPermissionContext(event)

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Требуется авторизация',
    })
  }

  if (!roleHasAnyPermission(context.role, permissions)) {
    console.warn(`[Permissions] Access denied: user ${context.userId} (${context.role}) lacks any of [${permissions.join(', ')}]`)
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `Недостаточно прав. Требуется одно из: ${permissions.join(', ')}`,
    })
  }

  return context
}

/**
 * Требует все указанные разрешения
 */
export async function requireAllPermissions(event: H3Event, permissions: Permission[]): Promise<PermissionContext> {
  const context = await getPermissionContext(event)

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Требуется авторизация',
    })
  }

  if (!roleHasAllPermissions(context.role, permissions)) {
    const missing = permissions.filter(p => !roleHasPermission(context.role, p))
    console.warn(`[Permissions] Access denied: user ${context.userId} (${context.role}) lacks permissions [${missing.join(', ')}]`)
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `Недостаточно прав. Отсутствуют: ${missing.join(', ')}`,
    })
  }

  return context
}

/**
 * Требует доступ к группе (с учётом роли)
 */
export async function requireGroupAccess(event: H3Event, groupId: string): Promise<PermissionContext> {
  const context = await getPermissionContext(event)

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Требуется авторизация',
    })
  }

  const hasAccess = await canAccessGroup(context, groupId)
  if (!hasAccess) {
    console.warn(`[Permissions] Access denied: user ${context.userId} cannot access group ${groupId}`)
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Нет доступа к данной группе',
    })
  }

  return context
}

/**
 * Требует доступ к студенту (с учётом роли)
 */
export async function requireStudentAccess(event: H3Event, studentId: string): Promise<PermissionContext> {
  const context = await getPermissionContext(event)

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Требуется авторизация',
    })
  }

  const hasAccess = await canAccessStudent(context, studentId)
  if (!hasAccess) {
    console.warn(`[Permissions] Access denied: user ${context.userId} cannot access student ${studentId}`)
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Нет доступа к данным студента',
    })
  }

  return context
}

// ========================================
// ПРОВЕРКА API КОНФИГУРАЦИИ
// ========================================

/**
 * Проверяет URL и метод на соответствие паттерну
 */
export function matchApiPattern(url: string, method: string, config: ApiPermissionConfig): boolean {
  // Проверяем метод
  if (config.method !== '*' && config.method !== method.toUpperCase()) {
    return false
  }

  // Проверяем URL по паттерну
  const patternParts = config.pattern.split('/')
  const urlParts = url.split('?')[0].split('/') // Убираем query params

  if (patternParts.length !== urlParts.length) {
    return false
  }

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === '*') {
      continue // Wildcard — любое значение
    }
    if (patternParts[i] !== urlParts[i]) {
      return false
    }
  }

  return true
}

/**
 * Находит конфигурацию разрешений для API endpoint
 */
export function findApiPermissionConfig(url: string, method: string): ApiPermissionConfig | null {
  for (const config of API_PERMISSIONS) {
    if (matchApiPattern(url, method, config)) {
      return config
    }
  }
  return null
}

/**
 * Проверяет доступ к API endpoint на основе конфигурации
 */
export async function checkApiAccess(event: H3Event): Promise<AccessCheckResult> {
  const url = event.path || ''
  const method = event.method || 'GET'

  // Находим конфигурацию для этого endpoint
  const config = findApiPermissionConfig(url, method)

  // Если конфигурация не найдена — разрешаем доступ (может быть публичный endpoint)
  if (!config) {
    return { allowed: true }
  }

  // Получаем контекст пользователя
  const context = await getPermissionContext(event)
  if (!context) {
    return { allowed: false, reason: 'Требуется авторизация' }
  }

  // Проверяем разрешения
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    if (!roleHasAllPermissions(context.role, config.requiredPermissions)) {
      return {
        allowed: false,
        reason: `Недостаточно прав. Требуется: ${config.requiredPermissions.join(', ')}`
      }
    }
  }

  if (config.anyPermissions && config.anyPermissions.length > 0) {
    if (!roleHasAnyPermission(context.role, config.anyPermissions)) {
      return {
        allowed: false,
        reason: `Недостаточно прав. Требуется одно из: ${config.anyPermissions.join(', ')}`
      }
    }
  }

  return {
    allowed: true,
    requiresOwnerFilter: config.requiresOwnerCheck
  }
}

// ========================================
// ЭКСПОРТ ТИПОВ
// ========================================

// Runtime-значения (enum и const)
export { Permission, ROLE_PERMISSIONS }

// TypeScript типы (интерфейсы) — реэкспорт через type для корректной работы Rollup
export type { PermissionContext, AccessCheckResult, ApiPermissionConfig }
