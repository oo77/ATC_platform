/**
 * Утилиты для проверки разрешений на сервере
 */

import { H3Event, createError, getHeader } from "h3";
import { UserRole } from "../types/auth";
import {
  Permission,
  ROLE_PERMISSIONS,
  API_PERMISSIONS,
} from "../types/permissions";
import type {
  PermissionContext,
  AccessCheckResult,
  ApiPermissionConfig,
} from "../types/permissions";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { executeQuery } from "./db";
import { verifyToken } from "./auth";
import { getUserAccess } from "./roleRegistry";

// ========================================
// ОСНОВНЫЕ ФУНКЦИИ ПРОВЕРКИ
// ========================================

/**
 * Кого проверяем:
 *  - контекст/пользователь с набором прав (PermissionContext, event.context.user) —
 *    права его роли из БД (гибкие роли);
 *  - строка роли — статический ROLE_PERMISSIONS (только для совместимости и тестов).
 */
export type PermissionSubject =
  | UserRole
  | string
  | { permissions?: Set<string> | string[] | null; role?: string | null }
  | null
  | undefined;

function permissionSetOf(subject: PermissionSubject): Set<string> | string[] | null {
  if (!subject) return null;
  if (typeof subject === "string") {
    return (ROLE_PERMISSIONS[subject as UserRole] as string[]) || null;
  }
  if (subject.permissions) return subject.permissions;
  if (subject.role) return (ROLE_PERMISSIONS[subject.role as UserRole] as string[]) || null;
  return null;
}

/**
 * Есть ли у субъекта право
 */
export function roleHasPermission(
  subject: PermissionSubject,
  permission: Permission,
): boolean {
  const set = permissionSetOf(subject);
  if (!set) return false;
  return set instanceof Set ? set.has(permission) : set.includes(permission);
}

/**
 * Все указанные права (AND)
 */
export function roleHasAllPermissions(
  subject: PermissionSubject,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => roleHasPermission(subject, p));
}

/**
 * Хотя бы одно из прав (OR)
 */
export function roleHasAnyPermission(
  subject: PermissionSubject,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => roleHasPermission(subject, p));
}

/**
 * Статические права роли по умолчанию (из кода)
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// ========================================
// ПОЛУЧЕНИЕ КОНТЕКСТА ПОЛЬЗОВАТЕЛЯ
// ========================================

/**
 * Полный контекст доступа пользователя: роль (профиль кабинета), права его роли
 * из БД, привязки к инструктору/слушателю. Данные кладёт middleware auth
 * (event.context.user); если его нет — читаем токен и БД сами.
 */
export async function getPermissionContext(
  event: H3Event,
): Promise<PermissionContext | null> {
  let contextUser = event.context.user as any;

  if (!contextUser?.permissions) {
    let userId: string | undefined = contextUser?.id;
    if (!userId) {
      const authHeader = getHeader(event, "authorization");
      const payload = authHeader?.startsWith("Bearer ") ? verifyToken(authHeader.substring(7)) : null;
      userId = payload?.userId;
    }
    if (!userId) return null;
    const access = await getUserAccess(userId);
    if (!access) return null;
    contextUser = {
      id: access.userId,
      role: access.baseRole,
      roleId: access.roleId,
      roleName: access.roleName,
      permissions: access.permissions,
      instructorId: access.instructorId,
      studentId: access.studentId,
    };
  }

  return {
    userId: contextUser.id,
    role: contextUser.role as UserRole,
    roleId: contextUser.roleId,
    roleName: contextUser.roleName,
    permissions: contextUser.permissions,
    instructorId: contextUser.instructorId || undefined,
    studentId: contextUser.studentId || undefined,
  };
}

// ========================================
// СВЯЗИ USERS ↔ INSTRUCTORS/STUDENTS
// ========================================

/**
 * Получает инструктора по user_id
 */
export async function getInstructorByUserId(
  userId: string,
): Promise<{ id: string; fullName: string } | null> {
  try {
    const rows = await executeQuery<any[]>(
      "SELECT id, full_name as fullName FROM instructors WHERE user_id = ? LIMIT 1",
      [userId],
    );
    return rows?.[0] || null;
  } catch (error) {
    console.error("[Permissions] Error getting instructor by user_id:", error);
    return null;
  }
}

/**
 * Получает студента по user_id
 */
export async function getStudentByUserId(
  userId: string,
): Promise<{ id: string; fullName: string } | null> {
  try {
    const rows = await executeQuery<any[]>(
      "SELECT id, full_name as fullName FROM students WHERE user_id = ? LIMIT 1",
      [userId],
    );
    return rows[0] || null;
  } catch (error) {
    console.error("[Permissions] Error getting student by user_id:", error);
    return null;
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
export async function getTeacherGroups(
  instructorId: string,
): Promise<string[]> {
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
      [instructorId, instructorId],
    );

    const groupIds = rows
      .map((r: { group_id: string }) => r.group_id)
      .filter(Boolean);
    console.log(
      `[Permissions] getTeacherGroups for ${instructorId}: found ${groupIds.length} groups`,
    );

    return groupIds;
  } catch (error) {
    console.error("[Permissions] Error getting teacher groups:", error);
    return [];
  }
}

/**
 * Получает группы студента
 */
export async function getStudentGroups(studentId: string): Promise<string[]> {
  try {
    const rows = await executeQuery<any[]>(
      "SELECT group_id FROM study_group_students WHERE student_id = ?",
      [studentId],
    );
    return rows.map((r: { group_id: string }) => r.group_id);
  } catch (error) {
    console.error("[Permissions] Error getting student groups:", error);
    return [];
  }
}

/**
 * Доступ к группе — по праву, а не по названию роли:
 *  - groups:view_all → любая группа;
 *  - привязан к инструктору и есть groups:view_own → группы, которые он ведёт;
 *  - привязан к слушателю → группы, в которых он учится.
 */
export async function canAccessGroup(
  context: PermissionContext,
  groupId: string,
): Promise<boolean> {
  if (!groupId) return false;
  if (roleHasPermission(context, Permission.GROUPS_VIEW_ALL)) return true;

  if (context.instructorId && roleHasPermission(context, Permission.GROUPS_VIEW_OWN)) {
    const teacherGroups = await getTeacherGroups(context.instructorId);
    if (teacherGroups.includes(groupId)) return true;
  }

  if (context.studentId) {
    const studentGroups = await getStudentGroups(context.studentId);
    if (studentGroups.includes(groupId)) return true;
  }

  return false;
}

/**
 * Доступ к слушателю — по праву:
 *  - students:view_all → любой слушатель;
 *  - привязан к инструктору → слушатели его групп;
 *  - сам слушатель → только он сам.
 */
export async function canAccessStudent(
  context: PermissionContext,
  studentId: string,
): Promise<boolean> {
  if (!studentId) return false;
  if (roleHasPermission(context, Permission.STUDENTS_VIEW_ALL)) return true;

  if (context.studentId && context.studentId === studentId) return true;

  if (context.instructorId && roleHasAnyPermission(context, [Permission.STUDENTS_VIEW, Permission.GROUPS_VIEW_OWN])) {
    const teacherGroups = await getTeacherGroups(context.instructorId);
    if (teacherGroups.length === 0) return false;
    const rows = await executeQuery<any[]>(
      `SELECT 1 FROM study_group_students
       WHERE student_id = ? AND group_id IN (${teacherGroups.map(() => "?").join(",")})
       LIMIT 1`,
      [studentId, ...teacherGroups],
    );
    return rows.length > 0;
  }

  return false;
}

// ========================================
// MIDDLEWARE-ХЕЛПЕРЫ
// ========================================

/**
 * Требует только авторизацию (без проверки разрешений)
 */
export async function requireAuthContext(
  event: H3Event,
): Promise<PermissionContext> {
  const context = await getPermissionContext(event);

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  return context;
}

/**
 * Требует указанное разрешение (бросает ошибку если нет доступа)
 */
export async function requirePermission(
  event: H3Event,
  permission: Permission,
): Promise<PermissionContext> {
  const context = await getPermissionContext(event);

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  if (!roleHasPermission(context, permission)) {
    console.warn(
      `[Permissions] Access denied: user ${context.userId} (${context.role}) lacks permission ${permission}`,
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Недостаточно прав. Требуется: ${permission}`,
    });
  }

  return context;
}

/**
 * Требует хотя бы одно из указанных разрешений
 */
export async function requireAnyPermission(
  event: H3Event,
  permissions: Permission[],
): Promise<PermissionContext> {
  const context = await getPermissionContext(event);

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  if (!roleHasAnyPermission(context, permissions)) {
    console.warn(
      `[Permissions] Access denied: user ${context.userId} (${context.role}) lacks any of [${permissions.join(", ")}]`,
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Недостаточно прав. Требуется одно из: ${permissions.join(", ")}`,
    });
  }

  return context;
}

/**
 * Требует все указанные разрешения
 */
export async function requireAllPermissions(
  event: H3Event,
  permissions: Permission[],
): Promise<PermissionContext> {
  const context = await getPermissionContext(event);

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  if (!roleHasAllPermissions(context, permissions)) {
    const missing = permissions.filter(
      (p) => !roleHasPermission(context, p),
    );
    console.warn(
      `[Permissions] Access denied: user ${context.userId} (${context.role}) lacks permissions [${missing.join(", ")}]`,
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Недостаточно прав. Отсутствуют: ${missing.join(", ")}`,
    });
  }

  return context;
}

/**
 * Требует доступ к группе (с учётом роли)
 */
export async function requireGroupAccess(
  event: H3Event,
  groupId: string,
): Promise<PermissionContext> {
  const context = await getPermissionContext(event);

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  const hasAccess = await canAccessGroup(context, groupId);
  if (!hasAccess) {
    console.warn(
      `[Permissions] Access denied: user ${context.userId} cannot access group ${groupId}`,
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "Нет доступа к данной группе",
    });
  }

  return context;
}

/**
 * Требует доступ к студенту (с учётом роли)
 */
export async function requireStudentAccess(
  event: H3Event,
  studentId: string,
): Promise<PermissionContext> {
  const context = await getPermissionContext(event);

  if (!context) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Требуется авторизация",
    });
  }

  const hasAccess = await canAccessStudent(context, studentId);
  if (!hasAccess) {
    console.warn(
      `[Permissions] Access denied: user ${context.userId} cannot access student ${studentId}`,
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "Нет доступа к данным студента",
    });
  }

  return context;
}

/**
 * Метка «установка завершена». Пока её нет, мастер настройки может работать без входа.
 * Создаётся автоматически, как только в БД обнаружен хотя бы один администратор,
 * и больше никогда не удаляется приложением. Для повторной первичной настройки
 * её удаляют вручную на сервере.
 */
const INSTALL_LOCK_FILE = join(process.cwd(), "storage", ".installed");

/** Ошибки MySQL, означающие «БД ещё не создана / таблиц нет» — это действительно первичная установка */
const NOT_INSTALLED_DB_ERRORS = new Set(["ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE"]);

function markInstalled(): void {
  try {
    mkdirSync(dirname(INSTALL_LOCK_FILE), { recursive: true });
    writeFileSync(INSTALL_LOCK_FILE, new Date().toISOString());
  } catch (error) {
    console.error("[Permissions] Не удалось записать метку установки:", error);
  }
}

/**
 * Система ещё не настроена (первичная установка).
 *
 * Fail-closed: при любой ОШИБКЕ БД (сеть, перезапуск MySQL, нет соединений)
 * считаем систему настроенной — иначе сбой БД открывал бы мастер настройки
 * без входа. Режим настройки включается только если:
 *   - нет метки установки, И
 *   - БД ещё не создана / нет таблиц, ИЛИ в таблице users нет ни одного ADMIN.
 */
export async function isSetupMode(): Promise<boolean> {
  if (process.env.INSTALLATION_COMPLETE === "true" || existsSync(INSTALL_LOCK_FILE)) {
    return false;
  }
  try {
    const rows = await executeQuery<any[]>(
      "SELECT COUNT(*) AS cnt FROM users WHERE role = 'ADMIN'",
    );
    const hasAdmin = Number(rows?.[0]?.cnt ?? 0) > 0;
    if (hasAdmin) {
      markInstalled();
      return false;
    }
    return true;
  } catch (error: any) {
    return NOT_INSTALLED_DB_ERRORS.has(error?.code);
  }
}

/**
 * Для эндпоинтов мастера настройки: без входа — только пока система не настроена,
 * после настройки — только с указанным разрешением.
 */
export async function requireSetupModeOrPermission(
  event: H3Event,
  permission: Permission,
): Promise<PermissionContext | null> {
  if (await isSetupMode()) {
    return null;
  }
  return requirePermission(event, permission);
}

/**
 * Служебные и отладочные эндпоинты: в production недоступны вовсе,
 * в разработке — только с указанным разрешением.
 */
export async function requireDevOnly(
  event: H3Event,
  permission: Permission = Permission.SETTINGS_MANAGE,
): Promise<PermissionContext> {
  if (process.env.NODE_ENV === "production") {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "Эндпоинт недоступен",
    });
  }
  return requirePermission(event, permission);
}

// ========================================
// ПРОВЕРКА API КОНФИГУРАЦИИ
// ========================================

/**
 * Проверяет URL и метод на соответствие паттерну
 */
export function matchApiPattern(
  url: string,
  method: string,
  config: ApiPermissionConfig,
): boolean {
  // Проверяем метод
  if (config.method !== "*" && config.method !== method.toUpperCase()) {
    return false;
  }

  // Проверяем URL по паттерну
  const patternParts = config.pattern.split("/");
  const urlWithoutQuery = url.split("?")[0];
  const urlParts = urlWithoutQuery ? urlWithoutQuery.split("/") : []; // Убираем query params

  if (patternParts.length !== urlParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === "*") {
      continue; // Wildcard — любое значение
    }
    if (patternParts[i] !== urlParts[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Находит конфигурацию разрешений для API endpoint
 */
export function findApiPermissionConfig(
  url: string,
  method: string,
): ApiPermissionConfig | null {
  for (const config of API_PERMISSIONS) {
    if (matchApiPattern(url, method, config)) {
      return config;
    }
  }
  return null;
}

/**
 * Проверяет доступ к API endpoint на основе конфигурации
 */
export async function checkApiAccess(
  event: H3Event,
): Promise<AccessCheckResult> {
  const url = event.path || "";
  const method = event.method || "GET";

  // Находим конфигурацию для этого endpoint
  const config = findApiPermissionConfig(url, method);

  // Если конфигурация не найдена — разрешаем доступ (может быть публичный endpoint)
  if (!config) {
    return { allowed: true };
  }

  // Получаем контекст пользователя
  const context = await getPermissionContext(event);
  if (!context) {
    return { allowed: false, reason: "Требуется авторизация" };
  }

  // Проверяем разрешения
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    if (!roleHasAllPermissions(context, config.requiredPermissions)) {
      return {
        allowed: false,
        reason: `Недостаточно прав. Требуется: ${config.requiredPermissions.join(", ")}`,
      };
    }
  }

  if (config.anyPermissions && config.anyPermissions.length > 0) {
    if (!roleHasAnyPermission(context, config.anyPermissions)) {
      return {
        allowed: false,
        reason: `Недостаточно прав. Требуется одно из: ${config.anyPermissions.join(", ")}`,
      };
    }
  }

  return {
    allowed: true,
    requiresOwnerFilter: config.requiresOwnerCheck,
  };
}

// ========================================
// ЭКСПОРТ ТИПОВ
// ========================================

// Runtime-значения (enum и const)
export { Permission, ROLE_PERMISSIONS };

// TypeScript типы (интерфейсы) — реэкспорт через type для корректной работы Rollup
export type { PermissionContext, AccessCheckResult, ApiPermissionConfig };

/**
 * Роль для логики отметки посещаемости (attendanceMarkingRepository ждёт строку роли):
 *  - attendance:manage → "ADMIN" (видит и одобряет всё, без ограничения сроков);
 *  - иначе → "TEACHER" (только свои занятия, со сроками).
 * Так логика работает и для кастомных ролей, а не только по названию роли.
 */
export function attendanceActorRole(user: PermissionSubject): "ADMIN" | "TEACHER" {
  return roleHasPermission(user, Permission.ATTENDANCE_MANAGE) ? "ADMIN" : "TEACHER";
}
