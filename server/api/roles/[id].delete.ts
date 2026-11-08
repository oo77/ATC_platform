/**
 * DELETE /api/roles/:id — удалить роль.
 * Доступ: roles:manage. Системную роль и роль, назначенную пользователям, удалить нельзя.
 */
import { Permission, requirePermission } from "../../utils/permissions";
import { executeQuery } from "../../utils/db";
import { invalidateRoles } from "../../utils/roleRegistry";
import { countUsersWithRole, loadRoleOr404 } from "../../utils/roleAdmin";
import { audit } from "../../utils/audit";

const BUILTIN = new Set(["role_admin", "role_manager", "role_teacher", "role_student"]);

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ROLES_MANAGE);
  const id = getRouterParam(event, "id") || "";
  const role = await loadRoleOr404(id);

  if (role.isSystem || BUILTIN.has(role.id)) {
    throw createError({ statusCode: 403, message: "Базовые роли удалить нельзя (их можно настроить)" });
  }
  const users = await countUsersWithRole(id);
  if (users > 0) {
    throw createError({
      statusCode: 409,
      message: `Роль назначена пользователям (${users}). Сначала назначьте им другую роль`,
    });
  }

  await executeQuery("DELETE FROM roles WHERE id = ?", [id]);
  invalidateRoles();

  await audit(event, {
    action: "role.delete",
    category: "security",
    summary: `Удалил роль «${role.name}»`,
    entity: { type: "ROLE", id, label: role.name },
    changes: [{ field: "permissions", label: "Права", before: { removed: [...role.permissions].sort() }, after: null }],
  });

  return { success: true };
});
