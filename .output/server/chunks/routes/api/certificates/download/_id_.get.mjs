import { g as defineEventHandler, j as getRouterParam, i as getQuery, h as createError, F as setHeader } from '../../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../../_/academicHours.mjs';

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const _id__get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const query = getQuery(event);
    const requestedFormat = query.format || "pdf";
    console.log(
      `[DOWNLOAD] \u0417\u0430\u043F\u0440\u043E\u0441 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${id}, \u0444\u043E\u0440\u043C\u0430\u0442: ${requestedFormat}`
    );
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
    console.log(
      `[DOWNLOAD] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0430\u0439\u0434\u0435\u043D: ${certificate.certificateNumber}, \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A: ${certificate.sourceType || "unknown"}`
    );
    const candidates = [];
    let fileName = "";
    let extension = requestedFormat;
    if (certificate.sourceType === "ai_scan" && certificate.originalFileUrl) {
      console.log(
        `[DOWNLOAD] AI-\u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C original_file_url: ${certificate.originalFileUrl}`
      );
      candidates.push(certificate.originalFileUrl);
      const originalFileName = path.basename(certificate.originalFileUrl);
      fileName = originalFileName;
      const fileExt = path.extname(originalFileName).toLowerCase().slice(1);
      if (fileExt) {
        extension = fileExt;
      }
      candidates.push(
        path.join("storage", "uploads", "certificates", originalFileName)
      );
      candidates.push(path.join("storage", "Certificates", originalFileName));
    } else {
      if (requestedFormat === "docx" && certificate.docxFileUrl) {
        fileName = path.basename(certificate.docxFileUrl);
        candidates.push(certificate.docxFileUrl);
      } else if (certificate.pdfFileUrl) {
        fileName = path.basename(certificate.pdfFileUrl);
        candidates.push(certificate.pdfFileUrl);
      }
      if (!fileName && certificate.certificateNumber) {
        fileName = `${certificate.certificateNumber.replace(
          /[\/\\:*?"<>|]/g,
          "_"
        )}.${requestedFormat}`;
      }
      candidates.push(path.join("storage", "Certificates", fileName));
      const generatedName = `${certificate.certificateNumber.replace(
        /[\/\\:*?"<>|]/g,
        "_"
      )}.${requestedFormat}`;
      candidates.push(path.join("storage", "Certificates", generatedName));
      candidates.push(
        path.join("storage", "Certificates", "generated", fileName)
      );
      candidates.push(
        path.join("storage", "Certificates", "generated", generatedName)
      );
      candidates.push(path.join("storage", "certificates", fileName));
      candidates.push(
        path.join("storage", "certificates", "generated", fileName)
      );
    }
    if (!fileName) {
      throw createError({
        statusCode: 404,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0438\u043C\u044F \u0444\u0430\u0439\u043B\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
      });
    }
    let filePath = null;
    for (const candidate of candidates) {
      if (!candidate) continue;
      const cleanCandidate = candidate.startsWith("/") || candidate.startsWith("\\") ? candidate.slice(1) : candidate;
      const absPath = path.join(process.cwd(), cleanCandidate);
      console.log(`[DOWNLOAD] \u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u043F\u0443\u0442\u044C: ${absPath}`);
      if (fs.existsSync(absPath)) {
        filePath = absPath;
        console.log(`[DOWNLOAD] \u0424\u0430\u0439\u043B \u043D\u0430\u0439\u0434\u0435\u043D: ${absPath}`);
        break;
      }
    }
    if (!filePath) {
      console.log(
        `[DOWNLOAD] \u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043F\u043E \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u043C \u043F\u0443\u0442\u044F\u043C. \u0418\u0449\u0435\u043C \u0440\u0435\u043A\u0443\u0440\u0441\u0438\u0432\u043D\u043E...`
      );
      if (certificate.sourceType === "ai_scan") {
        const uploadRoot = path.join(STORAGE_ROOT, "uploads", "certificates");
        const found = findFileRecursively(uploadRoot, fileName);
        if (found) {
          filePath = found;
        }
      }
      if (!filePath) {
        const searchRoot = path.join(STORAGE_ROOT, "Certificates");
        const found = findFileRecursively(searchRoot, fileName);
        if (found) {
          filePath = found;
        }
      }
    }
    if (!filePath) {
      console.error(
        `[DOWNLOAD] \u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${id} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0418\u043C\u044F \u0444\u0430\u0439\u043B\u0430: ${fileName}, \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u044B: ${candidates.join(", ")}`
      );
      throw createError({
        statusCode: 404,
        message: "\u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435"
      });
    }
    console.log(`[DOWNLOAD] \u041E\u0442\u0434\u0430\u0451\u043C \u0444\u0430\u0439\u043B: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeTypes = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp"
    };
    const contentType = mimeTypes[extension] || "application/octet-stream";
    const downloadFilename = `Certificate_${certificate.certificateNumber.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    )}.${extension}`;
    setHeader(event, "Content-Type", contentType);
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(downloadFilename)}"`
    );
    setHeader(event, "Content-Length", fileBuffer.length);
    console.log(
      `[DOWNLOAD] \u0423\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u0434\u0430\u043D \u0444\u0430\u0439\u043B ${downloadFilename}, \u0440\u0430\u0437\u043C\u0435\u0440: ${fileBuffer.length} \u0431\u0430\u0439\u0442`
    );
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
function findFileRecursively(dir, filename) {
  if (!fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        if (entry.name.toLowerCase() === filename.toLowerCase()) {
          return path.join(dir, entry.name);
        }
      } else if (entry.isDirectory()) {
        const found = findFileRecursively(path.join(dir, entry.name), filename);
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn(`Error scanning dir ${dir}:`, e);
  }
  return null;
}

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
