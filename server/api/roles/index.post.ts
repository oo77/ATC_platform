/**
 * POST /api/roles — создать роль.
 * Body: { name, description?, baseProfile, permissions: string[] }
 * Доступ: roles:manage. Нельзя выдать роли права, которых нет у вас самого.
 */
import { randomUUID } from "crypto";
import { Permission, requirePermission } from "../../utils/permissions";
import { executeTransaction } from "../../utils/db";
import { invalidateRoles, getRole } from "../../utils/roleRegistry";
import {
  assertBaseProfile,
  assertCanGrant,
  roleToJson,
  sanitizePermissions,
  uniqueRoleCode,
} from "../../utils/roleAdmin";
import { audit } from "../../utils/audit";
import { UserRole } from "../../types/auth";

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, Permission.ROLES_MANAGE);
  const body = await readBody(event);

  const name = String(body?.name || "").trim();
  if (name.length < 2 || name.length > 100) {
    throw createError({ statusCode: 400, message: "Название роли: от 2 до 100 символов" });
  }
  const baseProfile = assertBaseProfile(body?.baseProfile);
  if (baseProfile === UserRole.ADMIN) {
    throw createError({ statusCode: 400, message: "Профиль «Администратор» есть только у системной роли" });
  }
  const permissions = sanitizePermissions(body?.permissions ?? []);
  assertCanGrant(actor, permissions);

  const id = `role_${randomUUID()}`;
  const code = await uniqueRoleCode(name);
  const description = body?.description ? String(body.description).slice(0, 1000) : null;

  await executeTransaction(async (conn) => {
    await conn.execute(
      "INSERT INTO roles (id, code, name, description, base_profile, is_system, created_by) VALUES (?, ?, ?, ?, ?, 0, ?)",
      [id, code, name, description, baseProfile, actor.userId],
    );
    for (const p of permissions) {
      await conn.execute("INSERT INTO role_permissions (role_id, permission) VALUES (?, ?)", [id, p]);
    }
  });
  invalidateRoles();

  await audit(event, {
    action: "role.create",
    category: "security",
    summary: `Создал роль «${name}» (${permissions.length} прав, профиль ${baseProfile})`,
    entity: { type: "ROLE", id, label: name },
    changes: [
      { field: "name", label: "Название", before: null, after: name },
      { field: "baseProfile", label: "Профиль кабинета", before: null, after: baseProfile },
      { field: "permissions", label: "Права", before: null, after: { added: permissions } },
    ],
  });

  const role = await getRole(id);
  return { success: true, role: role ? roleToJson(role, 0) : { id, code, name } };
});
