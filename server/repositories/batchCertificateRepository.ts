import { executeTransaction } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { IssuedCertificate } from "../types/certificate";
import { getIssuedCertificateById } from "./certificateTemplateRepository";

/**
 * Batch-создание standalone сертификатов (транзакционно)
 *
 * Используется для batch-импорта сертификатов через AI.
 * Все сертификаты создаются в одной транзакции (атомарность).
 *
 * @param certificatesData - Массив данных для создания сертификатов
 * @returns Массив созданных сертификатов
 */
export async function createBatchStandaloneCertificates(
  certificatesData: Array<{
    studentId: string;
    certificateNumber: string;
    issueDate: Date;
    expiryDate?: Date | null;
    // Данные курса
    courseName: string;
    courseCode?: string;
    courseHours?: number;
    // Данные группы (опционально)
    groupCode?: string;
    groupStartDate?: Date;
    groupEndDate?: Date;
    // Источник
    sourceType: "manual" | "import";
    importSource?: "manual" | "ai_scan" | "excel";
    // Файлы
    pdfFileUrl?: string;
    // Прочее
    issuedBy?: string;
    notes?: string;
  }>,
): Promise<IssuedCertificate[]> {
  return executeTransaction(async (connection) => {
    console.log(
      `🔄 Начинаем транзакцию для создания ${certificatesData.length} сертификатов...`,
    );

    const createdIds: string[] = [];
    const now = new Date();

    // Подготавливаем batch-insert
    const query = `
      INSERT INTO issued_certificates 
       (id, student_id, certificate_number, issue_date, expiry_date,
        course_name, course_code, course_hours, group_code, group_start_date, group_end_date,
        source_type, import_source, status, pdf_file_url, issued_by, issued_at, notes, created_at, updated_at)
       VALUES ?
    `;

    // Формируем массив значений для batch-insert
    const values = certificatesData.map((data) => {
      const id = uuidv4();
      createdIds.push(id);

      return [
        id,
        data.studentId,
        data.certificateNumber,
        data.issueDate,
        data.expiryDate || null,
        data.courseName,
        data.courseCode || null,
        data.courseHours || null,
        data.groupCode || null,
        data.groupStartDate || null,
        data.groupEndDate || null,

        data.sourceType,
        data.importSource || null,
        "issued", // status
        data.pdfFileUrl || null,
        data.issuedBy || null,
        now, // issued_at
        data.notes || null,
        now, // created_at
        now, // updated_at
      ];
    });

    // Выполняем batch-insert
    await connection.query(query, [values]);

    console.log(
      `✅ Транзакция успешно завершена. Создано ${createdIds.length} сертификатов.`,
    );

    // Получаем созданные сертификаты
    const certificates: IssuedCertificate[] = [];
    for (const id of createdIds) {
      const cert = await getIssuedCertificateById(id);
      if (cert) {
        certificates.push(cert);
      }
    }

    return certificates;
  });
}
