/**
 * Реестр ролей: роли и их права из БД (roles / role_permissions).
 *
 * - Права пользователя определяются ТОЛЬКО его ролью (users.role_id).
 * - users.role (ADMIN/MANAGER/TEACHER/STUDENT) — «профиль кабинета»: какой дашборд,
 *   меню и сценарии показывать. Для кастомной роли это base_profile роли.
 * - Системная роль ADMIN всегда имеет все права, включая добавленные в код позже.
 * - Роль берётся из БД на каждом запросе (кэш 15 с), а не из JWT: смена роли
 *   или удаление пользователя действуют сразу, а не после истечения токена.
 * - Если миграция 054 ещё не применена — используется статический ROLE_PERMISSIONS.
 */

import { Permission, ROLE_PERMISSIONS } from "../types/permissions";
import { UserRole } from "../types/auth";
import { executeQuery } from "./db";

export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseProfile: UserRole;
  isSystem: boolean;
  permissions: Set<string>;
}

export interface UserAccess {
  userId: string;
  name: string;
  email: string;
  /** Профиль кабинета (ADMIN/MANAGER/TEACHER/STUDENT) */
  baseRole: UserRole;
  roleId: string;
  roleName: string;
  permissions: Set<string>;
  instructorId: string | null;
  studentId: string | null;
}

const ALL_PERMISSIONS = Object.values(Permission) as string[];
const ROLES_TTL_MS = 15_000;
const USER_TTL_MS = 15_000;

let rolesCache: { at: number; byId: Map<string, RoleDefinition> } | null = null;
let rolesLoading: Promise<Map<string, RoleDefinition>> | null = null;
const userCache = new Map<string, { at: number; access: UserAccess | null }>();

const ROLE_NAMES: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Модератор",
  TEACHER: "Преподаватель",
  STUDENT: "Слушатель",
};

/** Роли по умолчанию из кода — запасной вариант, пока нет таблиц ролей */
function staticRoles(): Map<string, RoleDefinition> {
  const map = new Map<string, RoleDefinition>();
  for (const code of Object.values(UserRole)) {
    map.set(`role_${code.toLowerCase()}`, {
      id: `role_${code.toLowerCase()}`,
      code,
      name: ROLE_NAMES[code] || code,
      description: null,
      baseProfile: code as UserRole,
      isSystem: code === UserRole.ADMIN,
      permissions: new Set(
        code === UserRole.ADMIN ? ALL_PERMISSIONS : (ROLE_PERMISSIONS[code as UserRole] as string[]),
      ),
    });
  }
  return map;
}

async function loadRoles(): Promise<Map<string, RoleDefinition>> {
  try {
    const roles = await executeQuery<any[]>(
      "SELECT id, code, name, description, base_profile, is_system FROM roles",
    );
    const perms = await executeQuery<any[]>("SELECT role_id, permission FROM role_permissions");
    const valid = new Set(ALL_PERMISSIONS);
    const byId = new Map<string, RoleDefinition>();
    for (const r of roles) {
      const isAdmin = r.code === UserRole.ADMIN;
      byId.set(r.id, {
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        baseProfile: r.base_profile as UserRole,
        isSystem: !!r.is_system,
        permissions: new Set(isAdmin ? ALL_PERMISSIONS : []),
      });
    }
    for (const p of perms) {
      const role = byId.get(p.role_id);
      if (role && role.code !== UserRole.ADMIN && valid.has(p.permission)) {
        role.permissions.add(p.permission);
      }
    }
    return byId.size ? byId : staticRoles();
  } catch (error: any) {
    if (error?.code !== "ER_NO_SUCH_TABLE") {
      console.error("[Roles] Не удалось загрузить роли:", error?.message);
    }
    return staticRoles();
  }
}

export async function getRoles(): Promise<Map<string, RoleDefinition>> {
  if (rolesCache && Date.now() - rolesCache.at < ROLES_TTL_MS) return rolesCache.byId;
  if (!rolesLoading) {
    rolesLoading = loadRoles()
      .then((byId) => {
        rolesCache = { at: Date.now(), byId };
        return byId;
      })
      .finally(() => {
        rolesLoading = null;
      });
  }
  return rolesLoading;
}

export async function getRole(roleId: string): Promise<RoleDefinition | null> {
  return (await getRoles()).get(roleId) || null;
}

/** Сбросить кэш ролей в этом процессе (после изменения роли). Другие процессы обновятся за 15 с */
export function invalidateRoles(): void {
  rolesCache = null;
  userCache.clear();
}

export function invalidateUserAccess(userId?: string): void {
  if (userId) userCache.delete(userId);
  else userCache.clear();
}

/** Доступ пользователя: роль и права из БД. null — пользователь не найден (удалён) */
export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.at < USER_TTL_MS) return cached.access;

  let row: any;
  try {
    const rows = await executeQuery<any[]>(
      `SELECT u.id, u.name, u.email, u.role, u.role_id,
              (SELECT i.id FROM instructors i WHERE i.user_id = u.id LIMIT 1) AS instructor_id,
              (SELECT s.id FROM students s WHERE s.user_id = u.id LIMIT 1) AS student_id
         FROM users u WHERE u.id = ? LIMIT 1`,
      [userId],
    );
    row = rows[0];
  } catch (error: any) {
    // До миграции 054 колонки role_id нет — читаем без неё
    if (error?.code !== "ER_BAD_FIELD_ERROR") throw error;
    const rows = await executeQuery<any[]>(
      `SELECT u.id, u.name, u.email, u.role, NULL AS role_id,
              (SELECT i.id FROM instructors i WHERE i.user_id = u.id LIMIT 1) AS instructor_id,
              (SELECT s.id FROM students s WHERE s.user_id = u.id LIMIT 1) AS student_id
         FROM users u WHERE u.id = ? LIMIT 1`,
      [userId],
    );
    row = rows[0];
  }

  let access: UserAccess | null = null;
  if (row) {
    const roles = await getRoles();
    const roleId: string = row.role_id || `role_${String(row.role).toLowerCase()}`;
    const role = roles.get(roleId) || roles.get(`role_${String(row.role).toLowerCase()}`);
    access = {
      userId: row.id,
      name: row.name,
      email: row.email,
      baseRole: (role?.baseProfile || row.role) as UserRole,
      roleId: role?.id || roleId,
      roleName: role?.name || ROLE_NAMES[row.role] || row.role,
      // Неизвестная роль → никаких прав (fail-closed)
      permissions: role ? role.permissions : new Set<string>(),
      instructorId: row.instructor_id || null,
      studentId: row.student_id || null,
    };
  }
  userCache.set(userId, { at: Date.now(), access });
  return access;
}

/** Публичные данные пользователя + его роль и права (для клиента: меню, кнопки, страницы) */
export async function withAccess<T extends { id: string }>(publicUser: T): Promise<
  T & { roleId?: string; roleName?: string; permissions?: string[] }
> {
  try {
    const access = await getUserAccess(publicUser.id);
    if (!access) return publicUser;
    return {
      ...publicUser,
      role: access.baseRole,
      roleId: access.roleId,
      roleName: access.roleName,
      permissions: [...access.permissions].sort(),
    };
  } catch {
    return publicUser;
  }
}
