/**
 * Система разрешений (Permissions) — серверная версия
 * 
 * Синхронизирована с types/permissions.ts
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
  STUDENTS_VIEW_OWN = 'students:view_own',
  STUDENTS_VIEW_ALL = 'students:view_all',
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
  INSTRUCTORS_HOURS = 'instructors:hours',

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
  GROUPS_VIEW_OWN = 'groups:view_own',
  GROUPS_VIEW_ALL = 'groups:view_all',
  GROUPS_CREATE = 'groups:create',
  GROUPS_UPDATE = 'groups:update',
  GROUPS_DELETE = 'groups:delete',
  GROUPS_MANAGE_STUDENTS = 'groups:manage_students',

  // ========== SCHEDULE ==========
  SCHEDULE_VIEW = 'schedule:view',
  SCHEDULE_VIEW_OWN = 'schedule:view_own',
  SCHEDULE_VIEW_ALL = 'schedule:view_all',
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
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,
    Permission.USERS_VIEW,
    Permission.STUDENTS_VIEW,
    Permission.STUDENTS_VIEW_ALL,
    Permission.STUDENTS_CREATE,
    Permission.STUDENTS_UPDATE,
    Permission.STUDENTS_IMPORT,
    Permission.STUDENTS_EXPORT,
    Permission.INSTRUCTORS_VIEW,
    Permission.INSTRUCTORS_CREATE,
    Permission.INSTRUCTORS_UPDATE,
    Permission.INSTRUCTORS_HOURS,
    Permission.ORGANIZATIONS_VIEW,
    Permission.ORGANIZATIONS_CREATE,
    Permission.ORGANIZATIONS_UPDATE,
    Permission.REPRESENTATIVES_VIEW,
    Permission.REPRESENTATIVES_APPROVE,
    Permission.REPRESENTATIVES_BLOCK,
    Permission.COURSES_VIEW,
    Permission.DISCIPLINES_VIEW,
    Permission.GROUPS_VIEW,
    Permission.GROUPS_VIEW_ALL,
    Permission.GROUPS_CREATE,
    Permission.GROUPS_UPDATE,
    Permission.GROUPS_MANAGE_STUDENTS,
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_ALL,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_UPDATE,
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.ATTENDANCE_EDIT,
    Permission.GRADES_VIEW,
    Permission.GRADES_MANAGE,
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_ISSUE,
    Permission.CERTIFICATES_DOWNLOAD,
    Permission.TEMPLATES_VIEW,
    Permission.FILES_VIEW,
    Permission.FILES_UPLOAD,
    Permission.SETTINGS_VIEW,
    Permission.LOGS_VIEW,
  ],

  [UserRole.TEACHER]: [
    Permission.DASHBOARD_VIEW,
    Permission.STUDENTS_VIEW,
    Permission.STUDENTS_VIEW_OWN,
    Permission.GROUPS_VIEW,
    Permission.GROUPS_VIEW_OWN,
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_OWN,
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MARK,
    Permission.GRADES_VIEW,
    Permission.GRADES_MANAGE,
    Permission.FILES_VIEW,
    Permission.COURSES_VIEW,
    Permission.DISCIPLINES_VIEW,
  ],

  [UserRole.STUDENT]: [
    Permission.DASHBOARD_VIEW,
    Permission.STUDENTS_VIEW_OWN,
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_VIEW_OWN,
    Permission.ATTENDANCE_VIEW,
    Permission.GRADES_VIEW,
    Permission.CERTIFICATES_VIEW,
    Permission.CERTIFICATES_VIEW_OWN,
    Permission.CERTIFICATES_DOWNLOAD,
  ],
}

// ========================================
// ТИПЫ ДЛЯ СЕРВЕРНОЙ ПРОВЕРКИ
// ========================================

export interface PermissionContext {
  userId: string
  role: UserRole
  instructorId?: string
  studentId?: string
}

export interface AccessCheckResult {
  allowed: boolean
  reason?: string
  requiresOwnerFilter?: boolean
}

/** Конфигурация разрешений для API endpoint */
export interface ApiPermissionConfig {
  /** Паттерн URL (например, '/api/users') */
  pattern: string
  /** HTTP метод */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*'
  /** Необходимые разрешения (AND) */
  requiredPermissions?: Permission[]
  /** Альтернативные разрешения (OR) */
  anyPermissions?: Permission[]
  /** Требуется ли проверка владельца ресурса */
  requiresOwnerCheck?: boolean
}

// ========================================
// КОНФИГУРАЦИЯ API PERMISSIONS
// ========================================

export const API_PERMISSIONS: ApiPermissionConfig[] = [
  // Users
  { pattern: '/api/users', method: 'GET', requiredPermissions: [Permission.USERS_VIEW] },
  { pattern: '/api/users', method: 'POST', requiredPermissions: [Permission.USERS_CREATE] },
  { pattern: '/api/users/*', method: 'PUT', requiredPermissions: [Permission.USERS_UPDATE] },
  { pattern: '/api/users/*', method: 'PATCH', requiredPermissions: [Permission.USERS_UPDATE] },
  { pattern: '/api/users/*', method: 'DELETE', requiredPermissions: [Permission.USERS_DELETE] },

  // Students
  { pattern: '/api/students', method: 'GET', anyPermissions: [Permission.STUDENTS_VIEW_ALL, Permission.STUDENTS_VIEW_OWN] },
  { pattern: '/api/students', method: 'POST', requiredPermissions: [Permission.STUDENTS_CREATE] },
  { pattern: '/api/students/*', method: 'GET', anyPermissions: [Permission.STUDENTS_VIEW_ALL, Permission.STUDENTS_VIEW_OWN], requiresOwnerCheck: true },
  { pattern: '/api/students/*', method: 'PUT', requiredPermissions: [Permission.STUDENTS_UPDATE] },
  { pattern: '/api/students/*', method: 'PATCH', requiredPermissions: [Permission.STUDENTS_UPDATE] },
  { pattern: '/api/students/*', method: 'DELETE', requiredPermissions: [Permission.STUDENTS_DELETE] },
  { pattern: '/api/students/import', method: 'POST', requiredPermissions: [Permission.STUDENTS_IMPORT] },

  // Instructors
  { pattern: '/api/instructors', method: 'GET', requiredPermissions: [Permission.INSTRUCTORS_VIEW] },
  { pattern: '/api/instructors', method: 'POST', requiredPermissions: [Permission.INSTRUCTORS_CREATE] },
  { pattern: '/api/instructors/*', method: 'GET', requiredPermissions: [Permission.INSTRUCTORS_VIEW], requiresOwnerCheck: true },
  { pattern: '/api/instructors/*', method: 'PUT', requiredPermissions: [Permission.INSTRUCTORS_UPDATE] },
  { pattern: '/api/instructors/*', method: 'PATCH', requiredPermissions: [Permission.INSTRUCTORS_UPDATE] },
  { pattern: '/api/instructors/*', method: 'DELETE', requiredPermissions: [Permission.INSTRUCTORS_DELETE] },

  // Organizations
  { pattern: '/api/organizations', method: 'GET', requiredPermissions: [Permission.ORGANIZATIONS_VIEW] },
  { pattern: '/api/organizations', method: 'POST', requiredPermissions: [Permission.ORGANIZATIONS_CREATE] },
  { pattern: '/api/organizations/*', method: 'PUT', requiredPermissions: [Permission.ORGANIZATIONS_UPDATE] },
  { pattern: '/api/organizations/*', method: 'PATCH', requiredPermissions: [Permission.ORGANIZATIONS_UPDATE] },
  { pattern: '/api/organizations/*', method: 'DELETE', requiredPermissions: [Permission.ORGANIZATIONS_DELETE] },

  // Representatives
  { pattern: '/api/representatives', method: 'GET', requiredPermissions: [Permission.REPRESENTATIVES_VIEW] },
  { pattern: '/api/representatives/*/approve', method: 'POST', requiredPermissions: [Permission.REPRESENTATIVES_APPROVE] },
  { pattern: '/api/representatives/*/block', method: 'POST', requiredPermissions: [Permission.REPRESENTATIVES_BLOCK] },
  { pattern: '/api/representatives/*', method: 'DELETE', requiredPermissions: [Permission.REPRESENTATIVES_MANAGE] },

  // Courses
  { pattern: '/api/courses', method: 'GET', requiredPermissions: [Permission.COURSES_VIEW] },
  { pattern: '/api/courses', method: 'POST', requiredPermissions: [Permission.COURSES_CREATE] },
  { pattern: '/api/courses/*', method: 'PUT', requiredPermissions: [Permission.COURSES_UPDATE] },
  { pattern: '/api/courses/*', method: 'PATCH', requiredPermissions: [Permission.COURSES_UPDATE] },
  { pattern: '/api/courses/*', method: 'DELETE', requiredPermissions: [Permission.COURSES_DELETE] },

  // Groups
  { pattern: '/api/groups', method: 'GET', anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN] },
  { pattern: '/api/groups', method: 'POST', requiredPermissions: [Permission.GROUPS_CREATE] },
  { pattern: '/api/groups/*', method: 'GET', anyPermissions: [Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN], requiresOwnerCheck: true },
  { pattern: '/api/groups/*', method: 'PUT', requiredPermissions: [Permission.GROUPS_UPDATE] },
  { pattern: '/api/groups/*', method: 'PATCH', requiredPermissions: [Permission.GROUPS_UPDATE] },
  { pattern: '/api/groups/*', method: 'DELETE', requiredPermissions: [Permission.GROUPS_DELETE] },
  { pattern: '/api/groups/*/students', method: '*', requiredPermissions: [Permission.GROUPS_MANAGE_STUDENTS] },

  // Schedule
  { pattern: '/api/schedule', method: 'GET', anyPermissions: [Permission.SCHEDULE_VIEW_ALL, Permission.SCHEDULE_VIEW_OWN] },
  { pattern: '/api/schedule', method: 'POST', requiredPermissions: [Permission.SCHEDULE_CREATE] },
  { pattern: '/api/schedule/*', method: 'PUT', requiredPermissions: [Permission.SCHEDULE_UPDATE] },
  { pattern: '/api/schedule/*', method: 'PATCH', requiredPermissions: [Permission.SCHEDULE_UPDATE] },
  { pattern: '/api/schedule/*', method: 'DELETE', requiredPermissions: [Permission.SCHEDULE_DELETE] },

  // Attendance
  { pattern: '/api/attendance', method: 'GET', requiredPermissions: [Permission.ATTENDANCE_VIEW] },
  { pattern: '/api/attendance', method: 'POST', anyPermissions: [Permission.ATTENDANCE_MARK, Permission.ATTENDANCE_EDIT] },
  { pattern: '/api/attendance/*', method: 'PUT', requiredPermissions: [Permission.ATTENDANCE_EDIT] },

  // Grades
  { pattern: '/api/grades', method: 'GET', requiredPermissions: [Permission.GRADES_VIEW] },
  { pattern: '/api/grades', method: '*', requiredPermissions: [Permission.GRADES_MANAGE] },

  // Certificates
  { pattern: '/api/certificates', method: 'GET', anyPermissions: [Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_VIEW_OWN] },
  { pattern: '/api/certificates/issue/*', method: 'POST', requiredPermissions: [Permission.CERTIFICATES_ISSUE] },
  { pattern: '/api/certificates/*/revoke', method: 'POST', requiredPermissions: [Permission.CERTIFICATES_REVOKE] },
  { pattern: '/api/certificates/download/*', method: 'GET', requiredPermissions: [Permission.CERTIFICATES_DOWNLOAD] },

  // Certificate Templates
  { pattern: '/api/certificates/templates', method: 'GET', requiredPermissions: [Permission.TEMPLATES_VIEW] },
  { pattern: '/api/certificates/templates', method: 'POST', requiredPermissions: [Permission.TEMPLATES_CREATE] },
  { pattern: '/api/certificates/templates/*', method: 'PUT', requiredPermissions: [Permission.TEMPLATES_UPDATE] },
  { pattern: '/api/certificates/templates/*', method: 'PATCH', requiredPermissions: [Permission.TEMPLATES_UPDATE] },
  { pattern: '/api/certificates/templates/*', method: 'DELETE', requiredPermissions: [Permission.TEMPLATES_DELETE] },

  // Files
  { pattern: '/api/files', method: 'GET', requiredPermissions: [Permission.FILES_VIEW] },
  { pattern: '/api/files/upload', method: 'POST', requiredPermissions: [Permission.FILES_UPLOAD] },
  { pattern: '/api/files/*', method: 'DELETE', requiredPermissions: [Permission.FILES_DELETE] },

  // Settings
  { pattern: '/api/settings', method: 'GET', requiredPermissions: [Permission.SETTINGS_VIEW] },
  { pattern: '/api/settings', method: '*', requiredPermissions: [Permission.SETTINGS_MANAGE] },

  // Activity Logs
  { pattern: '/api/logs', method: 'GET', requiredPermissions: [Permission.LOGS_VIEW] },
]
