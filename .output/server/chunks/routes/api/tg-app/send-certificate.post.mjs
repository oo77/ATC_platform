import { g as defineEventHandler, r as readBody, h as createError, aa as sendDocument } from '../../../_/nitro.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const sendCertificate_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { certificateId, chatId, pdfUrl, studentName, certificateNumber } = body;
    if (!chatId || !pdfUrl) {
      throw createError({
        statusCode: 400,
        message: "chatId \u0438 pdfUrl \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B"
      });
    }
    let documentToSend = pdfUrl;
    let filename = void 0;
    const fs = await import('fs/promises');
    const path = await import('path');
    const isAbsolutePath = path.isAbsolute(pdfUrl);
    if (isAbsolutePath) {
      try {
        const fileBuffer = await fs.readFile(pdfUrl);
        documentToSend = fileBuffer;
        filename = path.basename(pdfUrl);
        console.log(`[TG-App] \u0427\u0438\u0442\u0430\u0435\u043C \u0444\u0430\u0439\u043B \u043F\u043E \u0430\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u043E\u043C\u0443 \u043F\u0443\u0442\u0438: ${pdfUrl}`);
      } catch (err) {
        console.warn(`[TG-App] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0444\u0430\u0439\u043B ${pdfUrl}:`, err);
        throw createError({
          statusCode: 404,
          message: "\u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        });
      }
    } else if (pdfUrl.startsWith("/")) {
      let filePath;
      if (pdfUrl.startsWith("/storage/")) {
        filePath = path.join(process.cwd(), pdfUrl.substring(1));
      } else {
        filePath = path.join(process.cwd(), "public", pdfUrl.substring(1));
      }
      try {
        const fileBuffer = await fs.readFile(filePath);
        documentToSend = fileBuffer;
        filename = path.basename(pdfUrl);
        if (!filename.toLowerCase().endsWith(".pdf")) {
          filename += ".pdf";
        }
      } catch (err) {
        console.warn(
          `[TG-App] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u0430\u0439\u043B ${filePath}:`,
          err
        );
      }
    }
    const caption = `\u{1F4DC} \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442

\u{1F464} ${studentName}
\u2116 ${certificateNumber}`;
    if (Buffer.isBuffer(documentToSend) && !filename) {
      filename = `certificate_${certificateNumber}.pdf`;
    }
    await sendDocument(chatId, documentToSend, caption, filename);
    console.log(
      `[TG-App] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${certificateId} \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 \u0447\u0430\u0442 ${chatId}`
    );
    return {
      success: true,
      message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 \u0447\u0430\u0442"
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442"
    });
  }
});

export { sendCertificate_post as default };
//# sourceMappingURL=send-certificate.post.mjs.map
