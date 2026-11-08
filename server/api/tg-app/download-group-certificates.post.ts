/**
 * API endpoint для создания и отправки ZIP архива сертификатов группы
 */

import { executeQuery } from "../../utils/db";
import type { RowDataPacket } from "mysql2/promise";
import { sendDocument } from "../../utils/telegramBot";
import AdmZip from "adm-zip";
import { readFileSync } from "fs";
import { findCertificateFile } from "../../utils/certificateFile";
import { requireTgRepresentative, assertTgMatches } from "../../utils/tgAppAuth";

interface CertificateRow extends RowDataPacket {
  id: string;
  certificateNumber: string;
  pdfFileUrl: string;
  studentName: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { groupCode, organizationId, chatId } = body;
    // TG-ACCESS: подпись Telegram + представитель и организация только из БД
    const tg = await requireTgRepresentative(event, "can_view_certificates");
    assertTgMatches(organizationId, tg.organizationId, "organizationId");
    assertTgMatches(chatId, tg.chatId, "chatId");

    if (!groupCode || !organizationId || !chatId) {
      throw createError({
        statusCode: 400,
        message: "groupCode, organizationId и chatId обязательны",
      });
    }

    // Получаем все сертификаты группы
    const certificates = await executeQuery<CertificateRow[]>(
      `SELECT 
        cert.id,
        cert.certificate_number AS certificateNumber,
        cert.pdf_file_url AS pdfFileUrl,
        s.full_name AS studentName
      FROM issued_certificates cert
      INNER JOIN students s ON cert.student_id = s.id
      LEFT JOIN study_groups g ON cert.group_id = g.id
      WHERE g.code = ? 
        AND s.organization_id = ?
        AND cert.status = 'issued'
        AND cert.pdf_file_url IS NOT NULL
        AND cert.expiry_date >= CURRENT_DATE
      ORDER BY s.full_name`,
      [groupCode, organizationId],
    );

    if (certificates.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Сертификаты не найдены",
      });
    }

    console.log(
      `[TG-App] Создание ZIP архива для группы ${groupCode}, сертификатов: ${certificates.length}`,
    );

    // Создаём ZIP архив
    const zip = new AdmZip();

    // Скачиваем и добавляем каждый PDF в архив
    for (const cert of certificates) {
      try {
        // Читаем файл с диска напрямую. Раньше здесь был внутренний $fetch к
        // /api/certificates/download без токена — он всегда получал 401.
        const filePath = findCertificateFile(
          { pdfFileUrl: cert.pdfFileUrl, certificateNumber: cert.certificateNumber },
          "pdf",
        );
        if (!filePath) {
          console.warn(`[TG-App] Файл сертификата ${cert.id} не найден на диске`);
          continue;
        }
        const buffer: Buffer = readFileSync(filePath);

        // Формируем имя файла: ФИО_НомерСертификата.pdf
        const fileName = `${cert.studentName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "_")}_${cert.certificateNumber}.pdf`;

        // Добавляем в архив
        zip.addFile(fileName, buffer);

        console.log(`[TG-App] Добавлен в архив: ${fileName}`);
      } catch (err) {
        console.error(
          `[TG-App] Ошибка добавления сертификата ${cert.id} в архив:`,
          err,
        );
      }
    }

    // Получаем буфер ZIP архива
    const zipBuffer = zip.toBuffer();

    // Отправляем ZIP в Telegram
    const zipFileName = `Сертификаты_${groupCode}_${new Date().toISOString().split("T")[0]}.zip`;
    const caption = `📦 Архив сертификатов группы ${groupCode}\n\nВсего сертификатов: ${certificates.length}`;

    // Сохраняем временно в память и отправляем
    await sendDocument(chatId, zipBuffer, caption, zipFileName);

    console.log(`[TG-App] ZIP архив отправлен в чат ${chatId}`);

    return {
      success: true,
      message: "ZIP архив отправлен в чат",
      count: certificates.length,
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка создания ZIP архива:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Не удалось создать архив",
    });
  }
});
