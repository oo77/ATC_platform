import { defineEventHandler, getQuery, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import { requireLibraryPermission, ROLE_LABELS, LIBRARY_ROLES } from "../../../utils/libraryAccess";
import { Permission } from "../../../types/permissions";

/**
 * GET /api/library/admin/recipients?type=user|group|course|role&q=...
 * Кому можно выдать доступ — с поиском на сервере.
 *
 * Раньше модалки грузили /api/users и /api/groups целиком: группы приходили
 * постранично (видны были только первые 10) и без названия (у групп есть только code).
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user, Permission.LIBRARY_ACCESS_MANAGE);

  const query = getQuery(event);
  const type = String(query.type || "user");
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;

  if (type === "role") {
    return {
      items: LIBRARY_ROLES.map((r) => ({ id: r, label: ROLE_LABELS[r], description: r })),
    };
  }

  if (type === "user") {
    const rows = await executeQuery<any[]>(
      `SELECT id, name, email, role FROM users
       ${q ? "WHERE name LIKE ? OR email LIKE ?" : ""}
       ORDER BY name ASC LIMIT 50`,
      q ? [like, like] : [],
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        label: r.name || r.email,
        description: `${r.email} · ${ROLE_LABELS[r.role] || r.role}`,
      })),
    };
  }

  if (type === "group") {
    const rows = await executeQuery<any[]>(
      `SELECT sg.id, sg.code, sg.start_date, sg.end_date, sg.is_active, c.name AS course_name,
              (SELECT COUNT(*) FROM study_group_students x WHERE x.group_id = sg.id) AS students
       FROM study_groups sg
       LEFT JOIN courses c ON c.id = sg.course_id
       WHERE COALESCE(sg.is_archived, 0) = 0
         ${q ? "AND (sg.code LIKE ? OR c.name LIKE ?)" : ""}
       ORDER BY sg.is_active DESC, sg.start_date DESC
       LIMIT 50`,
      q ? [like, like] : [],
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        label: r.code,
        description: `${r.course_name || "Без курса"} · ${r.students} чел.${r.is_active ? "" : " · неактивна"}`,
      })),
    };
  }

  if (type === "course") {
    const rows = await executeQuery<any[]>(
      `SELECT c.id, c.name, c.code,
              (SELECT COUNT(*) FROM study_groups g WHERE g.course_id = c.id) AS groups_count
       FROM courses c
       ${q ? "WHERE c.name LIKE ? OR c.code LIKE ?" : ""}
       ORDER BY c.name ASC LIMIT 50`,
      q ? [like, like] : [],
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        label: r.name,
        description: `${r.code} · групп: ${r.groups_count}`,
      })),
    };
  }

  throw createError({ statusCode: 400, message: "Неизвестный тип получателя" });
});
