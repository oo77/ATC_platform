/**
 * GET /api/roles — список ролей с правами и числом пользователей.
 * Доступ: roles:view или users:manage_roles (выбор роли при назначении пользователю).
 */
import { Permission, requireAnyPermission } from "../../utils/permissions";
import { getRoles } from "../../utils/roleRegistry";
import { roleToJson } from "../../utils/roleAdmin";
import { executeQuery } from "../../utils/db";

export default defineEventHandler(async (event) => {
  await requireAnyPermission(event, [Permission.ROLES_VIEW, Permission.USERS_MANAGE_ROLES]);

  const roles = await getRoles();
  let counts = new Map<string, number>();
  try {
    const rows = await executeQuery<any[]>(
      "SELECT COALESCE(role_id, CONCAT('role_', LOWER(role))) AS rid, COUNT(*) AS cnt FROM users GROUP BY rid",
    );
    counts = new Map(rows.map((r) => [r.rid, Number(r.cnt)]));
  } catch {
    /* до миграции 054 */
  }

  const list = [...roles.values()]
    .map((r) => roleToJson(r, counts.get(r.id) || 0))
    .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name, "ru"));

  return { success: true, roles: list, catalog: Object.values(Permission) };
});
