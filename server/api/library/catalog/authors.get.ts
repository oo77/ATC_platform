import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import { isLibraryStaff, accessExistsSql, accessParams } from "../../../utils/libraryAccess";

/**
 * GET /api/library/catalog/authors?scope=admin
 * Авторы для подсказок фильтра. Читатель видит только авторов доступных ему книг
 * (раньше список раскрывал авторов всего фонда). scope=admin — все книги, для персонала.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const staff = isLibraryStaff(user);
  const adminScope = staff && getQuery(event).scope === "admin";

  const rows = await executeQuery<{ author: string }[]>(
    `SELECT DISTINCT b.author
     FROM books b
     WHERE b.deleted_at IS NULL AND b.author IS NOT NULL AND b.author <> ''
       ${adminScope ? "" : "AND b.status = 'ready'"}
       ${staff ? "" : `AND ${accessExistsSql("b")}`}
     ORDER BY b.author ASC
     LIMIT 500`,
    staff ? [] : accessParams(user),
  );

  return { authors: rows.map((r) => r.author).filter(Boolean) };
});
