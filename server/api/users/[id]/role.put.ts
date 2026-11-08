/**
 * PUT /api/users/:id/role — назначить пользователю роль.
 * Body: { roleId }
 * Доступ: users:manage_roles.
 * Нельзя: менять роль самому себе; назначать роль с правами сверх ваших;
 * снимать роль администратора с последнего администратора.
 */
import { Permission, requirePermission } from "../../../utils/permissions";
import { executeQuery } from "../../../utils/db";
import { invalidateUserAccess } from "../../../utils/roleRegistry";
import { assertCanGrant, countAdminsExcept, loadRoleOr404 } from "../../../utils/roleAdmin";
import { audit } from "../../../utils/audit";

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, Permission.USERS_MANAGE_ROLES);
  const userId = getRouterParam(event, "id") || "";
  const body = await readBody(event);

  if (userId === actor.userId) {
    throw createError({ statusCode: 403, message: "Нельзя изменить роль самому себе" });
  }

  const rows = await executeQuery<any[]>(
    "SELECT id, name, email, role, role_id FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  const target = rows[0];
  if (!target) throw createError({ statusCode: 404, message: "Пользователь не найден" });

  const newRole = await loadRoleOr404(String(body?.roleId || ""));
  const oldRoleId: string = target.role_id || `role_${String(target.role).toLowerCase()}`;
  const oldRole = await loadRoleOr404(oldRoleId).catch(() => null);

  if (newRole.id === oldRoleId) {
    return { success: true, unchanged: true };
  }

  // Нельзя назначить роль сильнее своей и нельзя «разжаловать» пользователя сильнее себя
  assertCanGrant(actor, newRole.permissions);
  if (oldRole) assertCanGrant(actor, oldRole.permissions);

  if (oldRoleId === "role_admin" && (await countAdminsExcept(userId)) === 0) {
    throw createError({ statusCode: 409, message: "Нельзя оставить систему без администратора" });
  }

  await executeQuery("UPDATE users SET role_id = ?, role = ?, updated_at = NOW(3) WHERE id = ?", [
    newRole.id,
    newRole.baseProfile,
    userId,
  ]);
  invalidateUserAccess(userId);

  await audit(event, {
    action: "user.role_assign",
    category: "security",
    summary: `Назначил пользователю ${target.name} роль «${newRole.name}» (была «${oldRole?.name || target.role}»)`,
    entity: { type: "USER", id: userId, label: `${target.name} <${target.email}>` },
    changes: [{ field: "role", label: "Роль", before: oldRole?.name || target.role, after: newRole.name }],
  });

  return { success: true, user: { id: userId, roleId: newRole.id, roleName: newRole.name, role: newRole.baseProfile } };
});
