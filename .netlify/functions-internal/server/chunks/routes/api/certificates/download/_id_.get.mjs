import { d as defineEventHandler, a as getRouterParam, g as getQuery, c as createError, s as setHeader } from '../../../../nitro/nitro.mjs';
import * as fs from 'fs';
import * as path from 'path';
import { g as getIssuedCertificateById } from '../../../../_/certificateTemplateRepository.mjs';
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
import 'jsonwebtoken';

const _id__get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const query = getQuery(event);
    const requestedFormat = query.format || "pdf";
    console.log(`[DOWNLOAD] \u0417\u0430\u043F\u0440\u043E\u0441 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${id}, \u0444\u043E\u0440\u043C\u0430\u0442: ${requestedFormat}`);
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const certificate = await getIssuedCertificateById(id);
    if (!certificate) {
      console.error(`[DOWNLOAD] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${id} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0411\u0414`);
      throw createError({
        statusCode: 404,
        message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    console.log(`[DOWNLOAD] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0430\u0439\u0434\u0435\u043D: ${certificate.certificateNumber}`);
    console.log(`[DOWNLOAD] PDF URL: ${certificate.pdfFileUrl}`);
    console.log(`[DOWNLOAD] DOCX URL: ${certificate.docxFileUrl}`);
    let fileUrl = null;
    let contentType;
    let extension;
    let actualFormat;
    if (requestedFormat === "docx") {
      fileUrl = certificate.docxFileUrl;
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      extension = "docx";
      actualFormat = "docx";
    } else {
      if (certificate.pdfFileUrl) {
        const pdfPath = path.join(process.cwd(), certificate.pdfFileUrl);
        if (fs.existsSync(pdfPath)) {
          fileUrl = certificate.pdfFileUrl;
          contentType = "application/pdf";
          extension = "pdf";
          actualFormat = "pdf";
        }
      }
      if (!fileUrl && certificate.docxFileUrl) {
        console.log(`[DOWNLOAD] PDF \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C DOCX`);
        fileUrl = certificate.docxFileUrl;
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        extension = "docx";
        actualFormat = "docx";
      }
    }
    if (!fileUrl) {
      console.error(`[DOWNLOAD] \u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${id} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D (\u043D\u0435\u0442 \u043D\u0438 PDF, \u043D\u0438 DOCX)`);
      throw createError({
        statusCode: 404,
        message: "\u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const filePath = path.join(process.cwd(), fileUrl);
    console.log(`[DOWNLOAD] \u041F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      console.error(`[DOWNLOAD] \u0424\u0430\u0439\u043B \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 \u043D\u0430 \u0434\u0438\u0441\u043A\u0435: ${filePath}`);
      throw createError({
        statusCode: 404,
        message: "\u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043D\u0430 \u0434\u0438\u0441\u043A\u0435"
      });
    }
    const fileBuffer = fs.readFileSync(filePath);
    const downloadFilename = `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442_${certificate.certificateNumber.replace(/\//g, "_")}.${extension}`;
    console.log(`[DOWNLOAD] \u041E\u0442\u0434\u0430\u0451\u043C \u0444\u0430\u0439\u043B: ${downloadFilename} (${actualFormat}, ${fileBuffer.length} \u0431\u0430\u0439\u0442)`);
    setHeader(event, "Content-Type", contentType);
    setHeader(event, "Content-Disposition", `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
    setHeader(event, "Content-Length", fileBuffer.length);
    return fileBuffer;
  } catch (error) {
    console.error("[GET /api/certificates/download/[id]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
