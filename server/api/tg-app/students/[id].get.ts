/**
 * API endpoint для получения детальной информации о слушателе
 * Включает все сертификаты слушателя
 * Используется в Telegram Mini App
 */

import { executeQuery } from "../../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface StudentDetailRow extends RowDataPacket {
  id: string;
  fullName: string;
  pinfl: string;
  position: string;
  department: string | null;
  organizationId: string;
  organizationName: string;
  createdAt: Date;
}

interface CertificateRow extends RowDataPacket {
  id: string;
  certificateNumber: string;
  courseName: string;
  courseCode: string | null;
  courseHours: number | null;
  groupCode: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  status: string;
  pdfFileUrl: string | null;
  originalFileUrl: string | null;
  sourceType: string | null;
  importSource: string | null;
}

export default defineEventHandler(async (event) => {
  const studentId = getRouterParam(event, "id");
  const query = getQuery(event);
  const { organizationId } = query;

  console.log(
    `[TG-App] GET /api/tg-app/students/${studentId} - Детали слушателя`,
  );

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: "ID слушателя обязателен",
    });
  }

  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId обязателен",
    });
  }

  try {
    // Получаем данные слушателя с проверкой организации
    const studentRows = await executeQuery<StudentDetailRow[]>(
      `SELECT 
        s.id,
        s.full_name as fullName,
        s.pinfl,
        s.position,
        s.department,
        s.organization_id as organizationId,
        COALESCE(o.name, s.organization) as organizationName,
        s.created_at as createdAt
      FROM students s
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE s.id = ? AND s.organization_id = ?
      LIMIT 1`,
      [studentId, organizationId as string],
    );

    if (studentRows.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Слушатель не найден или не принадлежит вашей организации",
      });
    }

    const student = studentRows[0];

    // Получаем все сертификаты слушателя
    const certificates = await executeQuery<CertificateRow[]>(
      `SELECT 
        ic.id,
        ic.certificate_number as certificateNumber,
        COALESCE(c.name, ic.course_name) as courseName,
        COALESCE(c.code, ic.course_code) as courseCode,
        COALESCE(ic.course_hours, c.total_hours) as courseHours,
        COALESCE(sg.code, ic.group_code) as groupCode,
        ic.issue_date as issueDate,
        ic.expiry_date as expiryDate,
        ic.status,
        ic.pdf_file_url as pdfFileUrl,
        ic.original_file_url as originalFileUrl,
        ic.source_type as sourceType,
        ic.import_source as importSource
      FROM issued_certificates ic
      LEFT JOIN study_groups sg ON ic.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      WHERE ic.student_id = ?
      ORDER BY ic.issue_date DESC`,
      [studentId],
    );

    console.log(`[TG-App] Найдено сертификатов: ${certificates.length}`);

    // Форматируем данные
    const formattedCertificates = certificates.map((cert) => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      courseName: cert.courseName || "Не указан",
      courseCode: cert.courseCode,
      courseHours: cert.courseHours,
      groupCode: cert.groupCode,
      issueDate: cert.issueDate
        ? new Date(cert.issueDate).toLocaleDateString("ru-RU")
        : null,
      expiryDate: cert.expiryDate
        ? new Date(cert.expiryDate).toLocaleDateString("ru-RU")
        : null,
      status: cert.status,
      isExpired: cert.expiryDate
        ? new Date(cert.expiryDate) < new Date()
        : false,
      hasPdf: !!(cert.pdfFileUrl || cert.originalFileUrl),
      pdfFileUrl: cert.pdfFileUrl || cert.originalFileUrl, // Fallback на оригинальный файл
      sourceType: cert.sourceType,
      importSource: cert.importSource,
    }));

    // Статистика по сертификатам
    const stats = {
      total: certificates.length,
      issued: certificates.filter((c) => c.status === "issued").length,
      revoked: certificates.filter((c) => c.status === "revoked").length,
      expired: formattedCertificates.filter((c) => c.isExpired).length,
    };

    return {
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        pinfl: student.pinfl ? `***${student.pinfl.slice(-4)}` : null,
        pinflFull: student.pinfl, // Полный ПИНФЛ для представителя
        position: student.position || "Не указана",
        department: student.department,
        organizationName: student.organizationName,
        registeredAt: student.createdAt
          ? new Date(student.createdAt).toLocaleDateString("ru-RU")
          : null,
      },
      certificates: formattedCertificates,
      stats,
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка получения данных слушателя:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера",
    });
  }
});
