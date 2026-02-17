import { g as defineEventHandler, r as readBody, h as createError, f as executeQuery, aa as sendDocument } from '../../../_/nitro.mjs';
import AdmZip from 'adm-zip';
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

const downloadGroupCertificates_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { groupCode, organizationId, chatId } = body;
    if (!groupCode || !organizationId || !chatId) {
      throw createError({
        statusCode: 400,
        message: "groupCode, organizationId \u0438 chatId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B"
      });
    }
    const certificates = await executeQuery(
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
        AND cert.pdf_file_url IS NOT NULL
        AND cert.expiry_date >= CURRENT_DATE
      ORDER BY s.full_name`,
      [groupCode, organizationId]
    );
    if (certificates.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B"
      });
    }
    console.log(
      `[TG-App] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 ZIP \u0430\u0440\u0445\u0438\u0432\u0430 \u0434\u043B\u044F \u0433\u0440\u0443\u043F\u043F\u044B ${groupCode}, \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432: ${certificates.length}`
    );
    const zip = new AdmZip();
    for (const cert of certificates) {
      try {
        const response = await fetch(cert.pdfFileUrl);
        if (!response.ok) {
          console.warn(
            `[TG-App] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${cert.id}: ${response.statusText}`
          );
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${cert.studentName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "_")}_${cert.certificateNumber}.pdf`;
        zip.addFile(fileName, buffer);
        console.log(`[TG-App] \u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u0432 \u0430\u0440\u0445\u0438\u0432: ${fileName}`);
      } catch (err) {
        console.error(
          `[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${cert.id} \u0432 \u0430\u0440\u0445\u0438\u0432:`,
          err
        );
      }
    }
    const zipBuffer = zip.toBuffer();
    const zipFileName = `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B_${groupCode}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.zip`;
    const caption = `\u{1F4E6} \u0410\u0440\u0445\u0438\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0433\u0440\u0443\u043F\u043F\u044B ${groupCode}

\u0412\u0441\u0435\u0433\u043E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432: ${certificates.length}`;
    await sendDocument(chatId, zipBuffer, caption, zipFileName);
    console.log(`[TG-App] ZIP \u0430\u0440\u0445\u0438\u0432 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 \u0447\u0430\u0442 ${chatId}`);
    return {
      success: true,
      message: "ZIP \u0430\u0440\u0445\u0438\u0432 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 \u0447\u0430\u0442",
      count: certificates.length
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F ZIP \u0430\u0440\u0445\u0438\u0432\u0430:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u0440\u0445\u0438\u0432"
    });
  }
});

export { downloadGroupCertificates_post as default };
//# sourceMappingURL=download-group-certificates.post.mjs.map
