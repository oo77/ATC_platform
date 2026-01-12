/**
 * Composable для проверки разрешений на клиенте
 * 
 * Использование:
 * ```ts
 * const { hasPermission, hasAnyPermission, canView, canEdit, canDelete } = usePermissions()
 * 
 * if (hasPermission(Permission.USERS_CREATE)) {
 *   // показать кнопку создания пользователя
 * }
 * ```
 */

import { computed } from 'vue'
import { useAuth } from './useAuth'
import {
  Permission,
  ROLE_PERMISSIONS,
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  getRolePermissions,
} from '~/types/permissions'
import { UserRole } from '~/types/auth'

export function usePermissions() {
  const { user, isAuthenticated } = useAuth()

  /**
   * Текущая роль пользователя
   */
  const currentRole = computed<UserRole | null>(() => {
    if (!user.value) return null
    return user.value.role as UserRole
  })

  /**
   * Все разрешения текущего пользователя
   */
  const permissions = computed<Permission[]>(() => {
    if (!currentRole.value) return []
    return getRolePermissions(currentRole.value)
  })

  /**
   * Проверяет наличие конкретного разрешения
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!currentRole.value) return false
    return roleHasPermission(currentRole.value, permission)
  }

  /**
   * Проверяет наличие всех указанных разрешений (AND)
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (!currentRole.value) return false
    return roleHasAllPermissions(currentRole.value, requiredPermissions)
  }

  /**
   * Проверяет наличие хотя бы одного из указанных разрешений (OR)
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (!currentRole.value) return false
    return roleHasAnyPermission(currentRole.value, requiredPermissions)
  }

  /**
   * Проверяет, является ли пользователь администратором
   */
  const isAdmin = computed<boolean>(() => {
    return currentRole.value === UserRole.ADMIN
  })

  /**
   * Проверяет, является ли пользователь менеджером
   */
  const isManager = computed<boolean>(() => {
    return currentRole.value === UserRole.MANAGER
  })

  /**
   * Проверяет, является ли пользователь преподавателем
   */
  const isTeacher = computed<boolean>(() => {
    return currentRole.value === UserRole.TEACHER
  })

  /**
   * Проверяет, является ли пользователь студентом
   */
  const isStudent = computed<boolean>(() => {
    return currentRole.value === UserRole.STUDENT
  })

  /**
   * Проверяет, имеет ли пользователь административные права (ADMIN или MANAGER)
   */
  const isStaff = computed<boolean>(() => {
    return currentRole.value === UserRole.ADMIN || currentRole.value === UserRole.MANAGER
  })

  // ========================================
  // УДОБНЫЕ ШОРТКАТЫ ДЛЯ ЧАСТЫХ ПРОВЕРОК
  // ========================================

  // === USERS ===
  const canViewUsers = computed(() => hasPermission(Permission.USERS_VIEW))
  const canCreateUsers = computed(() => hasPermission(Permission.USERS_CREATE))
  const canEditUsers = computed(() => hasPermission(Permission.USERS_UPDATE))
  const canDeleteUsers = computed(() => hasPermission(Permission.USERS_DELETE))
  const canManageRoles = computed(() => hasPermission(Permission.USERS_MANAGE_ROLES))

  // === STUDENTS ===
  const canViewStudents = computed(() => hasAnyPermission([Permission.STUDENTS_VIEW_ALL, Permission.STUDENTS_VIEW_OWN]))
  const canViewAllStudents = computed(() => hasPermission(Permission.STUDENTS_VIEW_ALL))
  const canCreateStudents = computed(() => hasPermission(Permission.STUDENTS_CREATE))
  const canEditStudents = computed(() => hasPermission(Permission.STUDENTS_UPDATE))
  const canDeleteStudents = computed(() => hasPermission(Permission.STUDENTS_DELETE))
  const canImportStudents = computed(() => hasPermission(Permission.STUDENTS_IMPORT))
  const canExportStudents = computed(() => hasPermission(Permission.STUDENTS_EXPORT))

  // === INSTRUCTORS ===
  const canViewInstructors = computed(() => hasPermission(Permission.INSTRUCTORS_VIEW))
  const canCreateInstructors = computed(() => hasPermission(Permission.INSTRUCTORS_CREATE))
  const canEditInstructors = computed(() => hasPermission(Permission.INSTRUCTORS_UPDATE))
  const canDeleteInstructors = computed(() => hasPermission(Permission.INSTRUCTORS_DELETE))
  const canViewInstructorHours = computed(() => hasPermission(Permission.INSTRUCTORS_HOURS))

  // === ORGANIZATIONS ===
  const canViewOrganizations = computed(() => hasPermission(Permission.ORGANIZATIONS_VIEW))
  const canCreateOrganizations = computed(() => hasPermission(Permission.ORGANIZATIONS_CREATE))
  const canEditOrganizations = computed(() => hasPermission(Permission.ORGANIZATIONS_UPDATE))
  const canDeleteOrganizations = computed(() => hasPermission(Permission.ORGANIZATIONS_DELETE))

  // === REPRESENTATIVES ===
  const canViewRepresentatives = computed(() => hasPermission(Permission.REPRESENTATIVES_VIEW))
  const canApproveRepresentatives = computed(() => hasPermission(Permission.REPRESENTATIVES_APPROVE))
  const canBlockRepresentatives = computed(() => hasPermission(Permission.REPRESENTATIVES_BLOCK))
  const canManageRepresentatives = computed(() => hasPermission(Permission.REPRESENTATIVES_MANAGE))

  // === COURSES ===
  const canViewCourses = computed(() => hasPermission(Permission.COURSES_VIEW))
  const canCreateCourses = computed(() => hasPermission(Permission.COURSES_CREATE))
  const canEditCourses = computed(() => hasPermission(Permission.COURSES_UPDATE))
  const canDeleteCourses = computed(() => hasPermission(Permission.COURSES_DELETE))

  // === DISCIPLINES ===
  const canViewDisciplines = computed(() => hasPermission(Permission.DISCIPLINES_VIEW))
  const canManageDisciplines = computed(() => hasPermission(Permission.DISCIPLINES_MANAGE))

  // === GROUPS ===
  const canViewGroups = computed(() => hasAnyPermission([Permission.GROUPS_VIEW_ALL, Permission.GROUPS_VIEW_OWN]))
  const canViewAllGroups = computed(() => hasPermission(Permission.GROUPS_VIEW_ALL))
  const canCreateGroups = computed(() => hasPermission(Permission.GROUPS_CREATE))
  const canEditGroups = computed(() => hasPermission(Permission.GROUPS_UPDATE))
  const canDeleteGroups = computed(() => hasPermission(Permission.GROUPS_DELETE))
  const canManageGroupStudents = computed(() => hasPermission(Permission.GROUPS_MANAGE_STUDENTS))

  // === SCHEDULE ===
  const canViewSchedule = computed(() => hasAnyPermission([Permission.SCHEDULE_VIEW_ALL, Permission.SCHEDULE_VIEW_OWN]))
  const canViewAllSchedule = computed(() => hasPermission(Permission.SCHEDULE_VIEW_ALL))
  const canCreateSchedule = computed(() => hasPermission(Permission.SCHEDULE_CREATE))
  const canEditSchedule = computed(() => hasPermission(Permission.SCHEDULE_UPDATE))
  const canDeleteSchedule = computed(() => hasPermission(Permission.SCHEDULE_DELETE))

  // === ATTENDANCE ===
  const canViewAttendance = computed(() => hasPermission(Permission.ATTENDANCE_VIEW))
  const canMarkAttendance = computed(() => hasPermission(Permission.ATTENDANCE_MARK))
  const canEditAttendance = computed(() => hasPermission(Permission.ATTENDANCE_EDIT))

  // === GRADES ===
  const canViewGrades = computed(() => hasPermission(Permission.GRADES_VIEW))
  const canManageGrades = computed(() => hasPermission(Permission.GRADES_MANAGE))

  // === CERTIFICATES ===
  const canViewCertificates = computed(() => hasAnyPermission([Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_VIEW_OWN]))
  const canIssueCertificates = computed(() => hasPermission(Permission.CERTIFICATES_ISSUE))
  const canRevokeCertificates = computed(() => hasPermission(Permission.CERTIFICATES_REVOKE))
  const canDownloadCertificates = computed(() => hasPermission(Permission.CERTIFICATES_DOWNLOAD))

  // === TEMPLATES ===
  const canViewTemplates = computed(() => hasPermission(Permission.TEMPLATES_VIEW))
  const canCreateTemplates = computed(() => hasPermission(Permission.TEMPLATES_CREATE))
  const canEditTemplates = computed(() => hasPermission(Permission.TEMPLATES_UPDATE))
  const canDeleteTemplates = computed(() => hasPermission(Permission.TEMPLATES_DELETE))

  // === FILES ===
  const canViewFiles = computed(() => hasPermission(Permission.FILES_VIEW))
  const canUploadFiles = computed(() => hasPermission(Permission.FILES_UPLOAD))
  const canDeleteFiles = computed(() => hasPermission(Permission.FILES_DELETE))
  const canManageFiles = computed(() => hasPermission(Permission.FILES_MANAGE))

  // === SETTINGS ===
  const canViewSettings = computed(() => hasPermission(Permission.SETTINGS_VIEW))
  const canManageSettings = computed(() => hasPermission(Permission.SETTINGS_MANAGE))

  // === LOGS ===
  const canViewLogs = computed(() => hasPermission(Permission.LOGS_VIEW))

  // === TEST BANKS ===
  const canViewTestBanks = computed(() => hasPermission(Permission.TEST_BANKS_VIEW))
  const canManageTestBanks = computed(() => hasPermission(Permission.TEST_BANKS_MANAGE))

  // === TEST TEMPLATES ===
  const canViewTestTemplates = computed(() => hasPermission(Permission.TEST_TEMPLATES_VIEW))
  const canManageTestTemplates = computed(() => hasPermission(Permission.TEST_TEMPLATES_MANAGE))

  // === TESTS ===
  const canAssignTests = computed(() => hasPermission(Permission.TESTS_ASSIGN))
  const canTakeTests = computed(() => hasPermission(Permission.TESTS_TAKE))
  const canViewTestResults = computed(() => hasPermission(Permission.TESTS_VIEW_RESULTS))

  return {
    // Основные данные
    currentRole,
    permissions,
    isAuthenticated,

    // Проверки ролей
    isAdmin,
    isManager,
    isTeacher,
    isStudent,
    isStaff,

    // Основные функции проверки
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Шорткаты для Users
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManageRoles,

    // Шорткаты для Students
    canViewStudents,
    canViewAllStudents,
    canCreateStudents,
    canEditStudents,
    canDeleteStudents,
    canImportStudents,
    canExportStudents,

    // Шорткаты для Instructors
    canViewInstructors,
    canCreateInstructors,
    canEditInstructors,
    canDeleteInstructors,
    canViewInstructorHours,

    // Шорткаты для Organizations
    canViewOrganizations,
    canCreateOrganizations,
    canEditOrganizations,
    canDeleteOrganizations,

    // Шорткаты для Representatives
    canViewRepresentatives,
    canApproveRepresentatives,
    canBlockRepresentatives,
    canManageRepresentatives,

    // Шорткаты для Courses
    canViewCourses,
    canCreateCourses,
    canEditCourses,
    canDeleteCourses,

    // Шорткаты для Disciplines
    canViewDisciplines,
    canManageDisciplines,

    // Шорткаты для Groups
    canViewGroups,
    canViewAllGroups,
    canCreateGroups,
    canEditGroups,
    canDeleteGroups,
    canManageGroupStudents,

    // Шорткаты для Schedule
    canViewSchedule,
    canViewAllSchedule,
    canCreateSchedule,
    canEditSchedule,
    canDeleteSchedule,

    // Шорткаты для Attendance
    canViewAttendance,
    canMarkAttendance,
    canEditAttendance,

    // Шорткаты для Grades
    canViewGrades,
    canManageGrades,

    // Шорткаты для Certificates
    canViewCertificates,
    canIssueCertificates,
    canRevokeCertificates,
    canDownloadCertificates,

    // Шорткаты для Templates
    canViewTemplates,
    canCreateTemplates,
    canEditTemplates,
    canDeleteTemplates,

    // Шорткаты для Files
    canViewFiles,
    canUploadFiles,
    canDeleteFiles,
    canManageFiles,

    // Шорткаты для Settings
    canViewSettings,
    canManageSettings,

    // Шорткаты для Logs
    canViewLogs,

    // Шорткаты для Test Banks
    canViewTestBanks,
    canManageTestBanks,

    // Шорткаты для Test Templates
    canViewTestTemplates,
    canManageTestTemplates,

    // Шорткаты для Tests
    canAssignTests,
    canTakeTests,
    canViewTestResults,

    // Экспорт enum для удобства
    Permission,
  }
}
