/**
 * Система разрешений (Permissions)
 * 
 * Архитектура:
 * - УРОВЕНЬ 1: Роли (UserRole) — КТО
 * - УРОВЕНЬ 2: Разрешения (Permission) — ЧТО МОЖНО ДЕЛАТЬ
 * - УРОВЕНЬ 3: Маппинг (ROLE_PERMISSIONS) — Связь ролей с разрешениями
 */

import { UserRole } from './auth'

// ========================================
// УРОВЕНЬ 2: РАЗРЕШЕНИЯ (Permissions)
// ========================================

export enum Permission {
  // ========== DASHBOARD ==========
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_STATS = 'dashboard:stats',

  // ========== USERS ==========
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ROLES = 'users:manage_roles',

  // ========== STUDENTS ==========
  STUDENTS_VIEW = 'students:view',
  STUDENTS_VIEW_OWN = 'students:view_own',       // Только свои данные
  STUDENTS_VIEW_ALL = 'students:view_all',       // Все слушатели
  STUDENTS_CREATE = 'students:create',
  STUDENTS_UPDATE = 'students:update',
  STUDENTS_DELETE = 'students:delete',
  STUDENTS_IMPORT = 'students:import',
  STUDENTS_EXPORT = 'students:export',

  // ========== INSTRUCTORS ==========
  INSTRUCTORS_VIEW = 'instructors:view',
  INSTRUCTORS_CREATE = 'instructors:create',
  INSTRUCTORS_UPDATE = 'instructors:update',
  INSTRUCTORS_DELETE = 'instructors:delete',
  INSTRUCTORS_HOURS = 'instructors:hours',       // Просмотр часов

  // ========== ORGANIZATIONS ==========
  ORGANIZATIONS_VIEW = 'organizations:view',
  ORGANIZATIONS_CREATE = 'organizations:create',
  ORGANIZATIONS_UPDATE = 'organizations:update',
  ORGANIZATIONS_DELETE = 'organizations:delete',

  // ========== REPRESENTATIVES ==========
  REPRESENTATIVES_VIEW = 'representatives:view',
  REPRESENTATIVES_APPROVE = 'representatives:approve',
  REPRESENTATIVES_BLOCK = 'representatives:block',
  REPRESENTATIVES_MANAGE = 'representatives:manage',

  // ========== COURSES ==========
  COURSES_VIEW = 'courses:view',
  COURSES_CREATE = 'courses:create',
  COURSES_UPDATE = 'courses:update',
  COURSES_DELETE = 'courses:delete',

  // ========== DISCIPLINES ==========
  DISCIPLINES_VIEW = 'disciplines:view',
  DISCIPLINES_MANAGE = 'disciplines:manage',

  // ========== GROUPS ==========
  GROUPS_VIEW = 'groups:view',
  GROUPS_VIEW_OWN = 'groups:view_own',           // Свои группы (для инструктора)
  GROUPS_VIEW_ALL = 'groups:view_all',           // Все группы
  GROUPS_CREATE = 'groups:create',
  GROUPS_UPDATE = 'groups:update',
  GROUPS_DELETE = 'groups:delete',
  GROUPS_MANAGE_STUDENTS = 'groups:manage_students',

  // ========== SCHEDULE ==========
  SCHEDULE_VIEW = 'schedule:view',
  SCHEDULE_VIEW_OWN = 'schedule:view_own',       // Своё расписание
  SCHEDULE_VIEW_ALL = 'schedule:view_all',       // Все события
  SCHEDULE_CREATE = 'schedule:create',
  SCHEDULE_UPDATE = 'schedule:update',
  SCHEDULE_DELETE = 'schedule:delete',

  // ========== ATTENDANCE ==========
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_MARK = 'attendance:mark',
  ATTENDANCE_EDIT = 'attendance:edit',

  // ========== GRADES ==========
  GRADES_VIEW = 'grades:view',
  GRADES_MANAGE = 'grades:manage',

  // ========== CERTIFICATES ==========
  CERTIFICATES_VIEW = 'certificates:view',
  CERTIFICATES_VIEW_OWN = 'certificates:view_own',
  CERTIFICATES_ISSUE = 'certificates:issue',
  CERTIFICATES_REVOKE = 'certificates:revoke',
  CERTIFICATES_DOWNLOAD = 'certificates:download',

  // ========== CERTIFICATE TEMPLATES ==========
  TEMPLATES_VIEW = 'templates:view',
  TEMPLATES_CREATE = 'templates:create',
  TEMPLATES_UPDATE = 'templates:update',
  TEMPLATES_DELETE = 'templates:delete',

  // ========== FILES ==========
  FILES_VIEW = 'files:view',
  FILES_UPLOAD = 'files:upload',
  FILES_DELETE = 'files:delete',
  FILES_MANAGE = 'files:manage',

  // ========== SETTINGS ==========
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',

  // ========== ACTIVITY LOGS ==========
  LOGS_VIEW = 'logs:view',
}

// ========================================
// УРОВЕНЬ 3: МАППИНГ РОЛЕЙ НА РАЗРЕШЕНИЯ
// ========================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // =========================================================
  // ADMIN — Полный доступ ко всему
  // =========================================================
  [UserRole.ADMIN]: Object.values(Permission),

  // =========================================================
  // MANAGER — Управление контентом
  // =========================================================
  [UserRole.MANAGER]: [
    // Dashboard
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,

    // Users (ограниченно — только просмотр)
    Permission.USERS_VIEW,

    // Students
    Permission.STUDENTS_VIEW,
    Permission.STUDENTS_VIEW_ALL,
    Permission.STUDENTS_CREATE,
    Permission.STUDENTS_UPDATE,
    Permission.STUDENTS_IMPORT,
    Permission.STUDENTS_EXPORT,
    // НЕ может удалять слушателей

    // Instructors
    Permission.INSTRUCTORS_VIEW,
    Permission.INSTRUCTORS_CREATE,   // Может создавать инструкторов
    Permission.INSTRUCTORS_UPDATE,   // Может редактировать инструкторов
    Permission.INSTRUCTORS_HOURS,
    // НЕ может удалять инструкторов

    // Organizations
    Permission.ORGANIZATIONS_VIEW,
    Permission.ORGANIZATIONS_CREATE,
    Permission.ORGANIZATIONS_UPDATE,
    // НЕ может удалять

    // Representatives
    Permission.REPRESENTATIVES_VIEW,
    Permission.REPRESENTATIVES_APPROVE,
    Permission.REPRESENTATIVES_BLOCK,
    // НЕ может полностью управлять (удалять)

    // Courses (только просмотр)
    Permission.COURSES_VIEW,

    // Disciplines (только просмотр)
    Permission.DISCIPLINES_VIEW,

    // Groups
    Permission.GROUPS_VIEW,
    Permission.GROUPS_VIEW_ALL,
    Permission.GROUPS_CREATE,
    Permission.GROUPS_UPDATE,
    Permission.GROUPS_MANAGE_STUDENTS,
    // НЕ может удалять группы

    // Schedule
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_ALL,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_UPDATE,
    // НЕ может удалять события

    // Attendance
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.ATTENDANCE_EDIT,

    // Grades
    Permission.GRADES_VIEW,
    Permission.GRADES_MANAGE,

    // Certificates
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_ISSUE,
    Permission.CERTIFICATES_DOWNLOAD,
    // НЕ может отзывать сертификаты

    // Templates (только просмотр)
    Permission.TEMPLATES_VIEW,

    // Files
    Permission.FILES_VIEW,
    Permission.FILES_UPLOAD,
    // НЕ может удалять/управлять

    // Settings (только просмотр)
    Permission.SETTINGS_VIEW,

    // Logs
    Permission.LOGS_VIEW,
  ],

  // =========================================================
  // TEACHER — Преподаватель
  // =========================================================
  [UserRole.TEACHER]: [
    // Dashboard
    Permission.DASHBOARD_VIEW,

    // Students (только просмотр своих групп)
    Permission.STUDENTS_VIEW,
    Permission.STUDENTS_VIEW_OWN, // Только слушатели из своих групп

    // Groups (свои группы)
    Permission.GROUPS_VIEW,
    Permission.GROUPS_VIEW_OWN,

    // Schedule (своё расписание)
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_OWN,

    // Attendance (для своих групп)
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,

    // Grades (для своих групп)
    Permission.GRADES_VIEW,
    Permission.GRADES_MANAGE,

    // Files (только просмотр)
    Permission.FILES_VIEW,

    // Courses (только просмотр)
    Permission.COURSES_VIEW,
    Permission.DISCIPLINES_VIEW,

    // Settings (просмотр настроек профиля/темы)
    Permission.SETTINGS_VIEW,
  ],

  // =========================================================
  // STUDENT — Слушатель
  // =========================================================
  [UserRole.STUDENT]: [
    // Dashboard (минимальный)
    Permission.DASHBOARD_VIEW,

    // Свои данные
    Permission.STUDENTS_VIEW_OWN,

    // Schedule (своё)
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_OWN,

    // Attendance (только просмотр своего)
    Permission.ATTENDANCE_VIEW,

    // Grades (только просмотр своих)
    Permission.GRADES_VIEW,

    // Certificates (свои)
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_VIEW_OWN,
    Permission.CERTIFICATES_DOWNLOAD,

    // Settings (просмотр настроек профиля/темы)
    Permission.SETTINGS_VIEW,
  ],
}

// ========================================
// ТИПЫ ДЛЯ ПРОВЕРКИ РАЗРЕШЕНИЙ
// ========================================

/** Контекст проверки разрешений (для фильтрации по владельцу) */
export interface PermissionContext {
  /** ID текущего пользователя */
  userId: string
  /** Роль текущего пользователя */
  role: UserRole
  /** ID связанного инструктора (если роль TEACHER) */
  instructorId?: string
  /** ID связанного студента (если роль STUDENT) */
  studentId?: string
}

/** Результат проверки доступа */
export interface AccessCheckResult {
  /** Разрешён ли доступ */
  allowed: boolean
  /** Причина отказа (если не разрешено) */
  reason?: string
  /** Требуется ли фильтрация по владельцу */
  requiresOwnerFilter?: boolean
}

/** Конфигурация разрешений для маршрута/API */
export interface RoutePermissionConfig {
  /** Путь или паттерн маршрута */
  path: string
  /** Необходимые разрешения (AND) */
  requiredPermissions?: Permission[]
  /** Альтернативные разрешения (OR) */
  anyPermissions?: Permission[]
  /** Разрешённые роли (если нужен доступ по роли напрямую) */
  allowedRoles?: UserRole[]
  /** Требуется ли проверка владельца ресурса */
  requiresOwnerCheck?: boolean
}

// ========================================
// КОНФИГУРАЦИЯ ДОСТУПА К СТРАНИЦАМ
// ========================================

export const PAGE_PERMISSIONS: RoutePermissionConfig[] = [
  // Публичные страницы (без проверки)
  { path: '/login', allowedRoles: [] },
  { path: '/register', allowedRoles: [] },

  // Dashboard
  { path: '/', requiredPermissions: [Permission.DASHBOARD_VIEW] },

  // Users
  { path: '/users', requiredPermissions: [Permission.USERS_VIEW] },
  { path: '/users/create', requiredPermissions: [Permission.USERS_CREATE] },

  // Programs (Courses)
  { path: '/programs', requiredPermissions: [Permission.COURSES_VIEW] },
  { path: '/programs/create', requiredPermissions: [Permission.COURSES_CREATE] },
  { path: '/programs/[id]', requiredPermissions: [Permission.COURSES_VIEW] },
  { path: '/programs/edit/[id]', requiredPermissions: [Permission.COURSES_UPDATE] },

  // Groups
  { path: '/groups', anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN] },
  { path: '/groups/create', requiredPermissions: [Permission.GROUPS_CREATE] },
  { path: '/groups/[id]', anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN], requiresOwnerCheck: true },
  { path: '/groups/journal/[id]', anyPermissions: [Permission.ATTENDANCE_VIEW, Permission.ATTENDANCE_MARK], requiresOwnerCheck: true },
  { path: '/groups/[id]/certificates', requiredPermissions: [Permission.CERTIFICATES_ISSUE] },

  // Schedule
  { path: '/schedule', anyPermissions: [Permission.SCHEDULE_VIEW_ALL, Permission.SCHEDULE_VIEW_OWN] },

  // Database (Students/Instructors)
  { path: '/database', requiredPermissions: [Permission.STUDENTS_VIEW_ALL] },
  { path: '/database/import', requiredPermissions: [Permission.STUDENTS_IMPORT] },
  { path: '/students/[id]', anyPermissions: [Permission.STUDENTS_VIEW_ALL, Permission.STUDENTS_VIEW_OWN], requiresOwnerCheck: true },
  { path: '/instructors/[id]', requiredPermissions: [Permission.INSTRUCTORS_VIEW], requiresOwnerCheck: true },

  // Files
  { path: '/files', requiredPermissions: [Permission.FILES_VIEW] },

  // Certificates
  { path: '/certificates/templates', requiredPermissions: [Permission.TEMPLATES_VIEW] },
  { path: '/certificates/templates/create', requiredPermissions: [Permission.TEMPLATES_CREATE] },
  { path: '/certificates/templates/[id]', requiredPermissions: [Permission.TEMPLATES_UPDATE] },
  { path: '/my-certificates', requiredPermissions: [Permission.CERTIFICATES_VIEW_OWN] },

  // Settings
  { path: '/settings', requiredPermissions: [Permission.SETTINGS_VIEW] },
]

// ========================================
// ХЕЛПЕРЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В КЛИЕНТЕ
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
