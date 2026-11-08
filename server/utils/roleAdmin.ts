/**
 * Управление ролями: проверки и защита от повышения прав (anti-escalation).
 *
 * Правила:
 *  1. Роль может содержать только права из каталога (enum Permission).
 *  2. Нельзя выдать роли право, которого нет у тебя самого.
 *  3. Нельзя назначить пользователю роль, у которой есть права сверх твоих.
 *  4. Нельзя изменить роль, в которой состоишь сам, и нельзя сменить роль самому себе.
 *  5. Системную роль ADMIN нельзя изменить или удалить; нельзя оставить систему без администратора.
 *  6. Роль, назначенную пользователям, удалить нельзя — сначала переназначить.
 */

import { createError } from "h3";
import { Permission } from "../types/permissions";
import { UserRole } from "../types/auth";
import type { PermissionContext } from "../types/permissions";
import { executeQuery } from "./db";
import { getRole, type RoleDefinition } from "./roleRegistry";

const ALL = new Set(Object.values(Permission) as string[]);
export const BASE_PROFILES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER, UserRole.STUDENT];

function fail(statusCode: number, message: string): never {
  throw createError({ statusCode, statusMessage: message, message });
}

/** Нормализует и проверяет список прав из запроса */
export function sanitizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) fail(400, "permissions должен быть массивом");
  const unique = Array.from(new Set(input.map((p) => String(p))));
  const unknown = unique.filter((p) => !ALL.has(p));
  if (unknown.length) fail(400, `Неизвестные права: ${unknown.join(", ")}`);
  return unique.sort();
}

/** Нельзя выдать права, которых нет у самого себя */
export function assertCanGrant(actor: PermissionContext, permissions: Iterable<string>): void {
  const own = actor.permissions || new Set<string>();
  const extra = [...permissions].filter((p) => !own.has(p));
  if (extra.length) {
    fail(403, `Нельзя выдать права, которых нет у вас: ${extra.join(", ")}`);
  }
}

export function assertBaseProfile(value: unknown): UserRole {
  const v = String(value || "");
  if (!BASE_PROFILES.includes(v as UserRole)) {
    fail(400, `Профиль кабинета должен быть одним из: ${BASE_PROFILES.join(", ")}`);
  }
  return v as UserRole;
}

export async function loadRoleOr404(roleId: string): Promise<RoleDefinition> {
  const role = await getRole(roleId);
  if (!role) fail(404, "Роль не найдена");
  return role;
}

export async function countUsersWithRole(roleId: string): Promise<number> {
  const rows = await executeQuery<any[]>("SELECT COUNT(*) AS cnt FROM users WHERE role_id = ?", [roleId]);
  return Number(rows[0]?.cnt || 0);
}

/** Сколько пользователей останется с системной ролью ADMIN, если исключить указанного */
export async function countAdminsExcept(userId: string): Promise<number> {
  const rows = await executeQuery<any[]>(
    "SELECT COUNT(*) AS cnt FROM users WHERE (role_id = 'role_admin' OR (role_id IS NULL AND role = 'ADMIN')) AND id <> ?",
    [userId],
  );
  return Number(rows[0]?.cnt || 0);
}

/** Код роли из названия: латиница/цифры/подчёркивание, уникальный */
export async function uniqueRoleCode(base: string): Promise<string> {
  const translit: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh",
    щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  let code = base
    .toLowerCase()
    .split("")
    .map((ch) => translit[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 48) || "ROLE";
  if (BASE_PROFILES.includes(code as UserRole)) code = `${code}_CUSTOM`;
  let candidate = code;
  for (let i = 2; i < 1000; i++) {
    const rows = await executeQuery<any[]>("SELECT 1 FROM roles WHERE code = ? LIMIT 1", [candidate]);
    if (!rows.length) return candidate;
    candidate = `${code}_${i}`;
  }
  return `${code}_${Date.now()}`;
}

export function roleToJson(role: RoleDefinition, userCount?: number) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    baseProfile: role.baseProfile,
    isSystem: role.isSystem,
    permissions: [...role.permissions].sort(),
    ...(userCount !== undefined ? { userCount } : {}),
  };
}
