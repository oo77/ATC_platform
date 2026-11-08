/**
 * PUT /api/roles/:id — изменить роль (название, описание, профиль, права).
 * Доступ: roles:manage.
 * Нельзя: менять системную роль ADMIN; менять роль, в которой состоите сами;
 * выдавать права, которых нет у вас самого.
 */
import { Permission, requirePermission } from "../../utils/permissions";
import { executeTransaction } from "../../utils/db";
import { invalidateRoles, getRole } from "../../utils/roleRegistry";
import {
  assertBaseProfile,
  assertCanGrant,
  countUsersWithRole,
  loadRoleOr404,
  roleToJson,
  sanitizePermissions,
} from "../../utils/roleAdmin";
import { audit, diffObjects, diffSets } from "../../utils/audit";
import { UserRole } from "../../types/auth";

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, Permission.ROLES_MANAGE);
  const id = getRouterParam(event, "id") || "";
  const role = await loadRoleOr404(id);

  if (role.isSystem) {
    throw createError({ statusCode: 403, message: "Системную роль «Администратор» изменить нельзя" });
  }
  if (actor.roleId === role.id) {
    throw createError({ statusCode: 403, message: "Нельзя изменять роль, в которой вы состоите сами" });
  }

  const body = await readBody(event);
  const name = body?.name !== undefined ? String(body.name).trim() : role.name;
  if (name.length < 2 || name.length > 100) {
    throw createError({ statusCode: 400, message: "Название роли: от 2 до 100 символов" });
  }
  const description = body?.description !== undefined ? (body.description ? String(body.description).slice(0, 1000) : null) : role.description;
  const baseProfile = body?.baseProfile !== undefined ? assertBaseProfile(body.baseProfile) : role.baseProfile;
  if (baseProfile === UserRole.ADMIN) {
    throw createError({ statusCode: 400, message: "Профиль «Администратор» есть только у системной роли" });
  }
  const permissions = body?.permissions !== undefined ? sanitizePermissions(body.permissions) : [...role.permissions];

  // Можно убирать любые права, но добавлять — только те, что есть у вас
  const added = permissions.filter((p) => !role.permissions.has(p));
  assertCanGrant(actor, added);

  await executeTransaction(async (conn) => {
    await conn.execute(
      "UPDATE roles SET name = ?, description = ?, base_profile = ? WHERE id = ?",
      [name, description, baseProfile, id],
    );
    await conn.execute("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    for (const p of permissions) {
      await conn.execute("INSERT INTO role_permissions (role_id, permission) VALUES (?, ?)", [id, p]);
    }
    // Профиль кабинета пользователей этой роли следует за ролью
    if (baseProfile !== role.baseProfile) {
      await conn.execute("UPDATE users SET role = ? WHERE role_id = ?", [baseProfile, id]);
    }
  });
  invalidateRoles();

  const changes = diffObjects(
    { name: role.name, description: role.description, baseProfile: role.baseProfile },
    { name, description, baseProfile },
    { name: "Название", description: "Описание", baseProfile: "Профиль кабинета" },
  );
  const permChange = diffSets("permissions", "Права", role.permissions, permissions);
  if (permChange) changes.push(permChange);

  const usersAffected = await countUsersWithRole(id);
  const addedCount = (permChange?.after as any)?.added?.length || 0;
  const removedCount = (permChange?.before as any)?.removed?.length || 0;
  await audit(event, {
    action: "role.update",
    category: "security",
    summary: `Изменил роль «${name}»` +
      (permChange ? `: прав добавлено ${addedCount}, убрано ${removedCount}` : "") +
      ` (затронуто пользователей: ${usersAffected})`,
    entity: { type: "ROLE", id, label: name },
    changes,
    metadata: { usersAffected },
  });

  const updated = await getRole(id);
  return { success: true, role: updated ? roleToJson(updated, usersAffected) : null };
});
