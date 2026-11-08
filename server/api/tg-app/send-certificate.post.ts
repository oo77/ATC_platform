/**
 * API endpoint для отправки сертификата в Telegram бот
 */

import { readFileSync } from "fs";
import { sendDocument } from "../../utils/telegramBot";
import { findCertificateFile } from "../../utils/certificateFile";
import { executeQuery } from "../../utils/db";
import { requireTgRepresentative, assertTgMatches } from "../../utils/tgAppAuth";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { certificateId, chatId, pdfUrl, studentName, certificateNumber } =
      body;
    // TG-ACCESS: подпись Telegram + представитель и организация только из БД
    const tg = await requireTgRepresentative(event, "can_view_certificates");
    assertTgMatches(chatId, tg.chatId, "chatId");

    if (!chatId) {
      throw createError({
        statusCode: 400,
        message: "chatId обязателен",
      });
    }

    if (!certificateId) {
      throw createError({ statusCode: 400, message: "certificateId обязателен" });
    }

    // Сертификат должен принадлежать слушателю организации представителя
    const rows = await executeQuery<any[]>(
      `SELECT ic.certificate_number AS certificateNumber, ic.pdf_file_url AS pdfFileUrl
         FROM issued_certificates ic
         JOIN students s ON s.id = ic.student_id
        WHERE ic.id = ? AND s.organization_id = ? AND ic.status = 'issued'
        LIMIT 1`,
      [certificateId, tg.organizationId],
    );
    const cert = rows[0];
    if (!cert) {
      throw createError({ statusCode: 404, message: "Сертификат не найден" });
    }

    // Читаем файл с диска напрямую (внутренний $fetch к /api/certificates/download
    // шёл без токена и всегда получал 401). pdfUrl от клиента больше не используется.
    const filePath = findCertificateFile(cert, "pdf");
    if (!filePath) {
      throw createError({ statusCode: 404, message: "Файл сертификата не найден" });
    }
    const documentToSend: Buffer = readFileSync(filePath);
    let filename = `certificate_${cert.certificateNumber}.pdf`;

    // Отправляем документ в Telegram
    const caption = `📜 Сертификат\n\n👤 ${studentName || ""}\n№ ${cert.certificateNumber}`;

    // Если отправляем буфер, нужно указать filename
    if (Buffer.isBuffer(documentToSend) && !filename) {
      filename = `certificate_${certificateNumber}.pdf`;
    }

    await sendDocument(tg.chatId, documentToSend, caption, filename);

    // Логируем действие
    console.log(
      `[TG-App] Сертификат ${certificateId} отправлен в чат ${chatId}`,
    );

    return {
      success: true,
      message: "Сертификат отправлен в чат",
    };
  } catch (error: any) {
    console.error("[TG-App] Ошибка отправки сертификата:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Не удалось отправить сертификат",
    });
  }
});
