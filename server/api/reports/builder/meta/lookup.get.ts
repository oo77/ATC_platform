import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { useDatabase } from "../../../../utils/useDatabase";
import { logActivity } from "../../../../utils/activityLogger";

/**
 * GET /api/reports/builder/meta/lookup
 * Возвращает справочники для фильтров (курсы, организации, инструкторы, группы)
 */
export default defineEventHandler(async (event) => {
  try {
    requireAuth(event);
    const db = useDatabase();

    // courses: short_name есть (VARCHAR(10) из initial_schema)
    const [courses] = await db.query<any[]>(
      `SELECT id, name, short_name, code FROM courses WHERE is_active = 1 ORDER BY name`,
    );

    // organizations: short_name удалена миграцией 018, теперь name_ru/name_uz/name_en
    // Используем COALESCE(name_ru, name) как отображаемое краткое имя
    const [organizations] = await db.query<any[]>(
      `SELECT id, name, COALESCE(name_ru, name) AS short_name, code FROM organizations WHERE is_active = 1 ORDER BY name`,
    );

    const [instructors] = await db.query<any[]>(
      `SELECT id, full_name, email FROM instructors WHERE is_active = 1 ORDER BY full_name`,
    );

    const [groups] = await db.query<any[]>(
      `SELECT id, code, start_date, end_date FROM study_groups ORDER BY start_date DESC LIMIT 200`,
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
