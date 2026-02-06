/**
 * API endpoint для ручной загрузки сертификата
 * Используется представителями организаций в Telegram Mini App
 * Создаёт сертификат для слушателя своей организации
 */

import { executeQuery } from "../../../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

interface StudentRow extends RowDataPacket {
  id: string;
  organizationId: string;
}

interface CertificateCheckRow extends RowDataPacket {
  id: string;
}

export default defineEventHandler(async (event) => {
  console.log(
    "[TG-App] POST /api/tg-app/certificates/manual - Ручная загрузка сертификата",
  );

  const body = await readBody(event);
  const {
    organizationId,
    representativeId,
    studentId,
    certificateNumber,
    courseName,
    issueDate,
    expiryDate,
    courseHours,
    issuingOrganization,
    notes,
  } = body;

  // Валидация обязательных полей
  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId обязателен",
    });
  }
  if (!representativeId) {
    throw createError({
      statusCode: 400,
      message: "representativeId обязателен",
    });
  }
  if (!studentId) {
    throw createError({ statusCode: 400, message: "Выберите слушателя" });
  }
  if (!certificateNumber || certificateNumber.trim().length < 3) {
    throw createError({
      statusCode: 400,
      message: "Введите номер сертификата (минимум 3 символа)",
    });
  }
  if (!courseName || courseName.trim().length < 3) {
    throw createError({
      statusCode: 400,
      message: "Введите название курса (минимум 3 символа)",
    });
  }
  if (!issueDate) {
    throw createError({ statusCode: 400, message: "Укажите дату выдачи" });
  }

  try {
    // 1. Проверяем, что слушатель принадлежит организации представителя
    const studentRows = await executeQuery<StudentRow[]>(
      `SELECT id, organization_id as organizationId FROM students WHERE id = ? LIMIT 1`,
      [studentId],
    );

    if (studentRows.length === 0) {
      throw createError({ statusCode: 404, message: "Слушатель не найден" });
    }

    if (studentRows[0].organizationId !== organizationId) {
      console.warn(
        `[TG-App] Попытка загрузить сертификат для слушателя другой организации: ${studentId}`,
      );
      throw createError({
        statusCode: 403,
        message:
          "Вы можете загружать сертификаты только для слушателей своей организации",
      });
    }

    // 2. Проверяем уникальность номера сертификата
    const existingCert = await executeQuery<CertificateCheckRow[]>(
      `SELECT id FROM issued_certificates WHERE certificate_number = ? LIMIT 1`,
      [certificateNumber.trim()],
    );

    if (existingCert.length > 0) {
      throw createError({
        statusCode: 409,
        message: `Сертификат с номером "${certificateNumber}" уже существует`,
      });
    }

    // 3. Создаём сертификат
    const certificateId = uuidv4();
    const now = new Date();

    // Парсим дату выдачи
    let parsedIssueDate: Date;
    try {
      parsedIssueDate = new Date(issueDate);
      if (isNaN(parsedIssueDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch {
      throw createError({
        statusCode: 400,
        message: "Неверный формат даты выдачи",
      });
    }

    // Парсим дату окончания (опционально)
    let parsedExpiryDate: Date | null = null;
    if (expiryDate) {
      try {
        parsedExpiryDate = new Date(expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) {
          parsedExpiryDate = null;
        }
      } catch {
        parsedExpiryDate = null;
      }
    }

    // Формируем примечания с информацией о загрузчике
    const fullNotes = [
      notes?.trim() || null,
      `Загружено представителем: ${representativeId}`,
    ]
      .filter(Boolean)
      .join(" | ");

    await executeQuery<ResultSetHeader>(
      `INSERT INTO issued_certificates (
        id,
        student_id,
        certificate_number,
        course_name,
        course_hours,
        issue_date,
        expiry_date,
        issuing_organization,
        status,
        source_type,
        import_source,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', 'manual', 'tg_app_manual', ?, ?, ?)`,
      [
        certificateId,
        studentId,
        certificateNumber.trim(),
        courseName.trim(),
        courseHours ? Number(courseHours) : null,
        parsedIssueDate,
        parsedExpiryDate,
        issuingOrganization?.trim() || null,
        fullNotes,
        now,
        now,
      ],
    );

    console.log(
      `[TG-App] Сертификат создан: ${certificateId} для слушателя ${studentId}`,
    );

    return {
      success: true,
      message: "Сертификат успешно загружен",
      certificate: {
        id: certificateId,
        certificateNumber: certificateNumber.trim(),
        courseName: courseName.trim(),
        issueDate: parsedIssueDate.toLocaleDateString("ru-RU"),
        expiryDate: parsedExpiryDate?.toLocaleDateString("ru-RU") || null,
      },
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка создания сертификата:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера",
    });
  }
});
