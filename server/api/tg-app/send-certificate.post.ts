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

    // Скачиваем PDF через внутренний API (без HTTP запроса)
    let documentToSend: Buffer;
    let filename: string;

    try {
      const response = await $fetch(
        `/api/certificates/download/${certificateId}`,
        {
          responseType: "arrayBuffer",
        },
      );
      documentToSend = Buffer.from(response as ArrayBuffer);
      filename = `certificate_${certificateNumber}.pdf`;
    } catch (err: any) {
      console.warn(
        `[TG-App] Не удалось получить сертификат ${certificateId}:`,
        err,
      );
      throw createError({
        statusCode: 404,
        message: "Файл сертификата не найден",
      });
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
