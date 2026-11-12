import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";
import { Permission, requirePermission } from "../../../../utils/permissions";

/**
 * GET /api/reports/builder/meta/lookup
 * Возвращает справочники для фильтров (курсы, организации, инструкторы, группы)
 */
export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.DASHBOARD_STATS);

  try {
    requireAuth(event);
    const db = useDatabase();

    // courses: short_name есть (VARCHAR(10) из initial_schema)
    const [courses] = await db.query<any[]>(
      `SELECT id, name, short_name, code, is_active FROM courses ORDER BY is_active DESC, name`,
    );

    // organizations: short_name удалена миграцией 018, теперь name_ru/name_uz/name_en
    // Используем COALESCE(name_ru, name) как отображаемое краткое имя
    const [organizations] = await db.query<any[]>(
      `SELECT id, name, COALESCE(name_ru, name) AS short_name, code, is_active FROM organizations ORDER BY is_active DESC, name`,
    );

    const [instructors] = await db.query<any[]>(
      `SELECT id, full_name, email, is_active FROM instructors ORDER BY is_active DESC, full_name`,
    );

    const [groups] = await db.query<any[]>(
      `SELECT sg.id, sg.code, sg.start_date, sg.end_date, c.short_name AS course_short_name, c.name AS course_name
       FROM study_groups sg LEFT JOIN courses c ON c.id = sg.course_id
       ORDER BY sg.start_date DESC LIMIT 3000`,
    );

    await logActivity(
      event,
      "VIEW",
      "SYSTEM",
      undefined,
      "Конструктор отчётов: загрузка справочников",
    );

    return {
      success: true,
      data: {
        courses,
        organizations,
        instructors,
        groups,
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Reports] Error fetching lookup data:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при получении справочников",
    });
  }
});
