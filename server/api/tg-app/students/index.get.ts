/**
 * API endpoint для получения списка слушателей организации
 * Используется в Telegram Mini App
 *
 * Поддерживает два режима:
 * - mode=all: Все уникальные слушатели с количеством сертификатов
 * - mode=groups: Слушатели в активных учебных группах (по умолчанию)
 */

import { executeQuery } from "../../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

// Тип для режима "все слушатели"
interface StudentAllRow extends RowDataPacket {
  id: string;
  fullName: string;
  pinfl: string;
  position: string;
  department: string | null;
  certificatesCount: number;
  lastCertificateDate: Date | null;
}

// Тип для режима "по группам"
interface StudentGroupRow extends RowDataPacket {
  id: string;
  fullName: string;
  groupName: string;
  courseName: string;
  startDate: Date | null;
  endDate: Date | null;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { organizationId, mode = "all", search } = query;

  console.log(
    `[TG-App] GET /api/tg-app/students - mode: ${mode}, orgId: ${organizationId}`,
  );

  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId обязателен",
    });
  }

  try {
    // Режим: Все слушатели (уникальные, с подсчётом сертификатов)
    if (mode === "all") {
      let sql = `
        SELECT 
          s.id,
          s.full_name as fullName,
          s.pinfl,
          s.position,
          s.department,
          COUNT(DISTINCT ic.id) as certificatesCount,
          MAX(ic.issue_date) as lastCertificateDate
        FROM students s
        LEFT JOIN issued_certificates ic ON s.id = ic.student_id AND ic.status = 'issued'
        WHERE s.organization_id = ?
      `;

      const params: any[] = [organizationId as string];

      // Добавляем поиск если есть
      if (search && typeof search === "string" && search.trim()) {
        sql += ` AND (s.full_name LIKE ? OR s.pinfl LIKE ?)`;
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern);
      }

      sql += `
        GROUP BY s.id, s.full_name, s.pinfl, s.position, s.department
        ORDER BY s.full_name ASC
      `;

      const students = await executeQuery<StudentAllRow[]>(sql, params);

      console.log(`[TG-App] Найдено слушателей (all): ${students.length}`);

      const formattedStudents = students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        pinfl: s.pinfl ? `***${s.pinfl.slice(-4)}` : null, // Маскируем ПИНФЛ
        position: s.position || "Не указана",
        department: s.department || null,
        certificatesCount: Number(s.certificatesCount) || 0,
        lastCertificateDate: s.lastCertificateDate
          ? new Date(s.lastCertificateDate).toLocaleDateString("ru-RU")
          : null,
      }));

      return {
        success: true,
        mode: "all",
        students: formattedStudents,
        total: formattedStudents.length,
      };
    }

    // Режим: По группам (слушатели в активных учебных группах)
    else {
      let sql = `
        SELECT 
          s.id,
          s.full_name as fullName,
          g.code as groupName,
          c.name as courseName,
          g.start_date as startDate,
          g.end_date as endDate
        FROM students s
        INNER JOIN study_group_students sgs ON s.id = sgs.student_id
        INNER JOIN study_groups g ON sgs.group_id = g.id
        INNER JOIN courses c ON g.course_id = c.id
        WHERE s.organization_id = ? 
          AND g.is_active = TRUE
      `;

      const params: any[] = [organizationId as string];

      // Добавляем поиск если есть
      if (search && typeof search === "string" && search.trim()) {
        sql += ` AND s.full_name LIKE ?`;
        params.push(`%${search.trim()}%`);
      }

      sql += ` ORDER BY g.start_date DESC, s.full_name ASC`;

      const students = await executeQuery<StudentGroupRow[]>(sql, params);

      console.log(`[TG-App] Найдено слушателей (groups): ${students.length}`);

      const formattedStudents = students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        groupName: s.groupName,
        courseName: s.courseName,
        startDate: s.startDate
          ? new Date(s.startDate).toLocaleDateString("ru-RU")
          : "",
        endDate: s.endDate
          ? new Date(s.endDate).toLocaleDateString("ru-RU")
          : "",
      }));

      return {
        success: true,
        mode: "groups",
        students: formattedStudents,
        total: formattedStudents.length,
      };
    }
  } catch (error: any) {
    console.error("[TG-App] Ошибка получения слушателей:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера",
    });
  }
});
