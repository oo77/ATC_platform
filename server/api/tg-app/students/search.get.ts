/**
 * API endpoint для поиска слушателей организации
 * Используется для автокомплита при загрузке сертификатов
 * Возвращает топ-N слушателей, соответствующих запросу
 */

import { executeQuery } from "../../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface StudentSearchRow extends RowDataPacket {
  id: string;
  fullName: string;
  pinfl: string;
  position: string;
  department: string | null;
  certificatesCount: number;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { organizationId, q, limit = 5 } = query;

  console.log(
    `[TG-App] GET /api/tg-app/students/search - q: "${q}", orgId: ${organizationId}`,
  );

  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId обязателен",
    });
  }

  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return {
      success: true,
      students: [],
      message: "Введите минимум 2 символа для поиска",
    };
  }

  try {
    const searchTerm = q.trim();
    const searchPattern = `%${searchTerm}%`;
    const maxResults = Math.min(Number(limit) || 5, 10); // Максимум 10 результатов

    // Поиск слушателей по имени или ПИНФЛ
    const students = await executeQuery<StudentSearchRow[]>(
      `SELECT 
        s.id,
        s.full_name as fullName,
        s.pinfl,
        s.position,
        s.department,
        (SELECT COUNT(*) FROM issued_certificates ic WHERE ic.student_id = s.id AND ic.status = 'issued') as certificatesCount
      FROM students s
      WHERE s.organization_id = ?
        AND (s.full_name LIKE ? OR s.pinfl LIKE ?)
      ORDER BY 
        CASE 
          WHEN s.full_name LIKE ? THEN 1  -- Точное начало имени
          WHEN s.full_name LIKE ? THEN 2  -- Содержит в имени
          ELSE 3
        END,
        s.full_name ASC
      LIMIT ?`,
      [
        organizationId as string,
        searchPattern,
        searchPattern,
        `${searchTerm}%`, // Начинается с
        searchPattern, // Содержит
        maxResults,
      ],
    );

    console.log(`[TG-App] Найдено слушателей: ${students.length}`);

    const formattedStudents = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      pinfl: s.pinfl,
      pinflMasked: s.pinfl ? `***${s.pinfl.slice(-4)}` : null,
      position: s.position || "Не указана",
      department: s.department || null,
      certificatesCount: Number(s.certificatesCount) || 0,
    }));

    return {
      success: true,
      students: formattedStudents,
      total: formattedStudents.length,
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка поиска слушателей:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера",
    });
  }
});
