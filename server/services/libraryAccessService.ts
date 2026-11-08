/**
 * Выдача доступа к книгам.
 *
 * Группа и курс хранятся одной записью (group_id / course_id), а не копируются
 * на каждого слушателя: новые слушатели группы получают доступ автоматически,
 * а отзыв доступа группы действительно забирает его у всех.
 */
import { createError } from "h3";
import { v4 as uuidv4 } from "uuid";
import { executeQuery } from "../utils/db";
import { LIBRARY_ROLES, ROLE_LABELS, type AccessTargetType } from "../utils/libraryAccess";

export interface AccessTarget {
  type: AccessTargetType;
  id: string;
  label: string;
}

const COLUMN: Record<AccessTargetType, string> = {
  user: "user_id",
  group: "group_id",
  course: "course_id",
  role: "role_name",
};

/** Проверяет, что получатель существует, и возвращает его название для журнала */
export async function resolveAccessTarget(type: unknown, rawId: unknown): Promise<AccessTarget> {
  const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId).trim() : "";
  if (!id || id.length > 191) {
    throw createError({ statusCode: 400, message: "Не выбран получатель доступа" });
  }

  switch (type) {
    case "user": {
      const [row] = await executeQuery<any[]>("SELECT id, name, email FROM users WHERE id = ? LIMIT 1", [id]);
      if (!row) throw createError({ statusCode: 404, message: "Пользователь не найден" });
      return { type, id, label: row.name || row.email };
    }
    case "group": {
      const [row] = await executeQuery<any[]>(
        `SELECT sg.id, sg.code, c.name AS course_name FROM study_groups sg
         LEFT JOIN courses c ON c.id = sg.course_id WHERE sg.id = ? LIMIT 1`,
        [id],
      );
      if (!row) throw createError({ statusCode: 404, message: "Группа не найдена" });
      return { type, id, label: row.course_name ? `${row.code} · ${row.course_name}` : row.code };
    }
    case "course": {
      const [row] = await executeQuery<any[]>("SELECT id, name FROM courses WHERE id = ? LIMIT 1", [id]);
      if (!row) throw createError({ statusCode: 404, message: "Курс не найден" });
      return { type, id, label: row.name };
    }
    case "role": {
      if (!(LIBRARY_ROLES as readonly string[]).includes(id)) {
        throw createError({ statusCode: 400, message: "Неизвестная роль" });
      }
      return { type, id, label: ROLE_LABELS[id] || id };
    }
    default:
      throw createError({ statusCode: 400, message: "Тип доступа: user, group, course или role" });
  }
}

const MAX_EXPIRES = new Date("2037-12-31T23:59:59");

/** Разбирает дату окончания доступа: null — бессрочно; прошлое — ошибка */
export function parseExpiresAt(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, message: "Некорректная дата окончания доступа" });
  }
  // Дата без времени — доступ действует до конца этого дня
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setHours(23, 59, 59, 0);
  if (date.getTime() <= Date.now()) {
    throw createError({ statusCode: 400, message: "Дата окончания доступа должна быть в будущем" });
  }
  // book_access.expires_at — TIMESTAMP: значения после 2038-01-19 MySQL не принимает
  if (date.getTime() > MAX_EXPIRES.getTime()) {
    throw createError({ statusCode: 400, message: "Дата окончания доступа — не позже 31.12.2037. Для бессрочного доступа оставьте поле пустым" });
  }
  return date;
}

/**
 * Выдаёт доступ к книге. Если такая запись уже есть — обновляет срок
 * (продление или снятие ограничения), а не создаёт дубликат.
 */
export async function grantBookAccess(
  bookId: string,
  target: AccessTarget,
  grantedBy: string,
  expiresAt: Date | null,
): Promise<"created" | "updated"> {
  const column = COLUMN[target.type];
  const existing = await executeQuery<any[]>(
    `SELECT id FROM book_access WHERE book_id = ? AND ${column} = ? LIMIT 1`,
    [bookId, target.id],
  );

  if (existing[0]) {
    await executeQuery(
      `UPDATE book_access SET expires_at = ?, granted_by = ? WHERE id = ?`,
      [expiresAt, grantedBy, existing[0].id],
    );
    return "updated";
  }

  await executeQuery(
    `INSERT INTO book_access (id, book_id, ${column}, expires_at, granted_by) VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), bookId, target.id, expiresAt, grantedBy],
  );
  return "created";
}
