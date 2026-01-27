/**
 * API endpoint для отправки сертификата в Telegram бот
 */

import { sendDocument } from "../../utils/telegramBot";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { certificateId, chatId, pdfUrl, studentName, certificateNumber } =
      body;

    if (!chatId || !pdfUrl) {
      throw createError({
        statusCode: 400,
        message: "chatId и pdfUrl обязательны",
      });
    }

    // Если pdfUrl относительный, пытаемся найти файл локально
    let documentToSend: string | Buffer = pdfUrl;
    let filename: string | undefined = undefined;

    if (pdfUrl.startsWith("/")) {
      const fs = await import("fs/promises");
      const path = await import("path");

      let filePath: string;
      if (pdfUrl.startsWith("/storage/")) {
        filePath = path.join(process.cwd(), pdfUrl.substring(1));
      } else {
        filePath = path.join(process.cwd(), "public", pdfUrl.substring(1));
      }

      try {
        const fileBuffer = await fs.readFile(filePath);
        documentToSend = fileBuffer;

        // Извлекаем имя файла из URL
        filename = path.basename(pdfUrl);
        // Если имя файла не содержит расширение, добавляем .pdf (на всякий случай)
        if (!filename.toLowerCase().endsWith(".pdf")) {
          filename += ".pdf";
        }
      } catch (err) {
        console.warn(
          `[TG-App] Не удалось прочитать локальный файл ${filePath}:`,
          err,
        );
        // Если не удалось прочитать, пробуем отправить как есть (возможно это внешний URL)
      }
    }

    // Отправляем документ в Telegram
    const caption = `📜 Сертификат\n\n👤 ${studentName}\n№ ${certificateNumber}`;

    // Если отправляем буфер, нужно указать filename
    if (Buffer.isBuffer(documentToSend) && !filename) {
      filename = `certificate_${certificateNumber}.pdf`;
    }

    await sendDocument(chatId, documentToSend, caption, filename);

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
