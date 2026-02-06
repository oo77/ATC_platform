/**
 * API endpoint для подтверждения и сохранения сертификатов из AI-импорта
 * Используется представителями организаций в Telegram Mini App
 *
 * Особенности:
 * - Создание новых студентов ЗАПРЕЩЕНО
 * - Проверка дублирования перед сохранением
 * - Транзакционное сохранение (все или ничего)
 *
 * POST /api/tg-app/certificates/ai-batch/confirm
 */

import { executeQuery, executeTransaction } from "../../../../utils/db";
import { aiCertificateRepository } from "../../../../repositories/aiCertificateRepository";
import { v4 as uuidv4 } from "uuid";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";

interface ConfirmItem {
  fileId: string;
  studentId: string;
  extractedData: {
    certificateNumber: string;
    courseName: string;
    issueDate?: string;
    expiryDate?: string;
    issuingOrganization?: string;
    courseHours?: number;
    confidence?: number;
    _internal?: {
      tempFilePath?: string;
      mimeType?: string;
    };
  };
}

interface CertificateCheckRow extends RowDataPacket {
  id: string;
}

interface StudentCheckRow extends RowDataPacket {
  id: string;
  organization_id: string;
  full_name: string;
}

interface ProcessingLogRow extends RowDataPacket {
  id: string;
  extracted_data: string | null;
}

export default defineEventHandler(
  async (
    event,
  ): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: Array<{ fileId: string; error: string }>;
    message: string;
  }> => {
    console.log(
      "[TG-App] POST /api/tg-app/certificates/ai-batch/confirm - Подтверждение импорта",
    );

    const body = await readBody(event);
    const { items, organizationId, representativeId } = body;

    // 1. Валидация
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: "items обязателен (массив сертификатов для импорта)",
      });
    }

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

    console.log(
      `[TG-App] Подтверждение ${items.length} сертификатов для organizationId=${organizationId}`,
    );

    const errors: Array<{ fileId: string; error: string }> = [];
    let created = 0;
    let skipped = 0;

    // 2. Предварительная валидация всех элементов
    const validItems: ConfirmItem[] = [];

    for (const item of items as ConfirmItem[]) {
      // 2.1 Проверка наличия обязательных полей
      if (
        !item.fileId ||
        !item.studentId ||
        !item.extractedData?.certificateNumber
      ) {
        errors.push({
          fileId: item.fileId || "unknown",
          error:
            "Отсутствуют обязательные поля (fileId, studentId, certificateNumber)",
        });
        continue;
      }

      // 2.2 Проверка, что студент принадлежит организации
      const studentRows = await executeQuery<StudentCheckRow[]>(
        `SELECT id, organization_id, full_name FROM students WHERE id = ? LIMIT 1`,
        [item.studentId],
      );

      if (studentRows.length === 0) {
        errors.push({
          fileId: item.fileId,
          error: "Слушатель не найден",
        });
        continue;
      }

      if (studentRows[0].organization_id !== organizationId) {
        errors.push({
          fileId: item.fileId,
          error: "Слушатель не принадлежит вашей организации",
        });
        continue;
      }

      // 2.3 Проверка дублирования номера сертификата
      const existingCert = await executeQuery<CertificateCheckRow[]>(
        `SELECT id FROM issued_certificates WHERE certificate_number = ? LIMIT 1`,
        [item.extractedData.certificateNumber.trim()],
      );

      if (existingCert.length > 0) {
        errors.push({
          fileId: item.fileId,
          error: `Сертификат с номером "${item.extractedData.certificateNumber}" уже существует`,
        });
        skipped++;
        continue;
      }

      validItems.push(item);
    }

    // 3. Если нет валидных элементов - возвращаем ошибку
    if (validItems.length === 0) {
      return {
        success: false,
        created: 0,
        skipped,
        errors,
        message: "Нет сертификатов для импорта. Все элементы содержат ошибки.",
      };
    }

    // 4. Транзакционное сохранение
    try {
      await executeTransaction(async (connection: PoolConnection) => {
        const now = new Date();

        for (const item of validItems) {
          const certificateId = uuidv4();
          const data = item.extractedData;

          // Парсим дату выдачи
          let parsedIssueDate: Date | null = null;
          if (data.issueDate) {
            try {
              parsedIssueDate = new Date(data.issueDate);
              if (isNaN(parsedIssueDate.getTime())) {
                parsedIssueDate = null;
              }
            } catch {
              parsedIssueDate = null;
            }
          }

          // Парсим дату окончания
          let parsedExpiryDate: Date | null = null;
          if (data.expiryDate) {
            try {
              parsedExpiryDate = new Date(data.expiryDate);
              if (isNaN(parsedExpiryDate.getTime())) {
                parsedExpiryDate = null;
              }
            } catch {
              parsedExpiryDate = null;
            }
          }

          // Получаем путь к файлу из лога
          let originalFileUrl: string | null = null;
          try {
            const log = await aiCertificateRepository.getLogById(item.fileId);
            if (log?.extractedData) {
              const internalData = (log.extractedData as any)?._internal;
              if (internalData?.tempFilePath) {
                // Сохраняем путь к временному файлу как URL для скачивания
                // В будущем можно переместить файл в постоянное хранилище
                originalFileUrl = internalData.tempFilePath;
              }
            }
          } catch (logErr) {
            console.warn(
              `[TG-App] Не удалось получить путь к файлу из лога ${item.fileId}:`,
              logErr,
            );
          }

          // Создаём сертификат
          await connection.execute<ResultSetHeader>(
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
              ai_confidence,
              original_file_url,
              notes,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', 'ai_scan', 'tg_app_ai_batch', ?, ?, ?, ?, ?)`,
            [
              certificateId,
              item.studentId,
              data.certificateNumber.trim(),
              data.courseName?.trim() || "Не указан",
              data.courseHours || null,
              parsedIssueDate || now,
              parsedExpiryDate,
              data.issuingOrganization?.trim() || null,
              data.confidence || null,
              originalFileUrl,
              `Импортировано через AI | Представитель: ${representativeId}`,
              now,
              now,
            ],
          );

          // Обновляем лог обработки
          await aiCertificateRepository.updateLog(item.fileId, {
            certificateId: certificateId,
            matchedStudentId: item.studentId,
            processingCompletedAt: now,
            status: "success", // Используем строковый литерал вместо типа
          });

          created++;
          console.log(
            `[TG-App] Создан сертификат ${certificateId} для студента ${item.studentId}`,
          );
        }
      });

      console.log(
        `[TG-App] Импорт завершён: создано ${created}, пропущено ${skipped}, ошибок ${errors.length}`,
      );

      return {
        success: true,
        created,
        skipped,
        errors,
        message: `Успешно импортировано ${created} сертификатов`,
      };
    } catch (error: any) {
      console.error("[TG-App] Ошибка транзакции импорта:", error);

      throw createError({
        statusCode: 500,
        message: `Ошибка сохранения: ${error.message}`,
      });
    }
  },
);
