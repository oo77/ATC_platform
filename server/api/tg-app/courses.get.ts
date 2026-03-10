/**
 * GET /api/tg-app/courses
 * Список активных курсов для выбора в форме заявки (TG App)
 * Публичный в рамках /api/tg-app (без admin-авторизации)
 */
import { executeQuery } from "../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface CourseRow extends RowDataPacket {
  id: string;
  name: string;
  duration_hours: number | null;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const search = query.search as string | undefined;

    console.log("[TG-App] GET /api/tg-app/courses");

    let sql = `
      SELECT id, name, duration_hours
      FROM courses
      WHERE is_active = 1 AND (is_archived = 0 OR is_archived IS NULL)
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      sql += ` AND name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY name ASC`;

    const courses = await executeQuery<CourseRow[]>(sql, params);

    console.log(`[TG-App] Курсов найдено: ${courses.length}`);

    return {
      success: true,
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        durationHours: c.duration_hours,
      })),
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка получения курсов:", error);
    throw createError({ statusCode: 500, message: "Внутренняя ошибка сервера" });
  }
});
