import { g as defineEventHandler, l as readMultipartFormData, h as createError } from '../../../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../../../_/aiCertificateRepository.mjs';
import { v4 } from 'uuid';
import fs from 'fs/promises';
import path__default from 'path';
import os from 'os';
import 'grammy';
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

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf"
];
const upload_post = defineEventHandler(
  async (event) => {
    console.log(
      "[TG-App] POST /api/tg-app/certificates/ai-batch/upload - \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432"
    );
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u0424\u0430\u0439\u043B\u044B \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u044B"
      });
    }
    let organizationId = null;
    let representativeId = null;
    const files = [];
    for (const item of formData) {
      if (item.name === "organizationId") {
        organizationId = item.data.toString("utf-8");
      } else if (item.name === "representativeId") {
        representativeId = item.data.toString("utf-8");
      } else if (item.name === "files" || item.name === "file") {
        files.push(item);
      }
    }
    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    if (!representativeId) {
      throw createError({
        statusCode: 400,
        message: "representativeId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    if (files.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u0424\u0430\u0439\u043B\u044B \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u044B"
      });
    }
    if (files.length > MAX_FILES) {
      throw createError({
        statusCode: 400,
        message: `\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C ${MAX_FILES} \u0444\u0430\u0439\u043B\u043E\u0432 \u0437\u0430 \u0440\u0430\u0437`
      });
    }
    console.log(
      `[TG-App] \u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442\u0441\u044F ${files.length} \u0444\u0430\u0439\u043B\u043E\u0432 \u043E\u0442 organizationId=${organizationId}`
    );
    const results = [];
    const tempDir = path__default.join(os.tmpdir(), "tg-cert-uploads");
    await fs.mkdir(tempDir, { recursive: true });
    for (const file of files) {
      const filename = file.filename || `file_${Date.now()}`;
      const fileId = v4();
      try {
        const mimeType = file.type || "";
        if (!ALLOWED_TYPES.includes(mimeType)) {
          results.push({
            fileId,
            filename,
            success: false,
            error: `\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0442\u0438\u043F \u0444\u0430\u0439\u043B\u0430: ${mimeType}. \u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u044B: JPG, PNG, PDF`
          });
          continue;
        }
        if (file.data.length > MAX_FILE_SIZE) {
          results.push({
            fileId,
            filename,
            success: false,
            error: `\u0424\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439. \u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C ${MAX_FILE_SIZE / 1024 / 1024} \u041C\u0411`
          });
          continue;
        }
        const tempFilePath = path__default.join(tempDir, `${fileId}_${filename}`);
        await fs.writeFile(tempFilePath, file.data);
        const log = await aiCertificateRepository.createLog({
          originalFilename: filename,
          fileSizeBytes: file.data.length,
          processingStartedAt: /* @__PURE__ */ new Date(),
          aiModel: "pending",
          // Будет обновлено при анализе
          processedBy: representativeId,
          // Уже проверено на null выше
          status: "pending",
          extractedData: {
            _internal: {
              tempFilePath,
              mimeType,
              organizationId,
              representativeId
            }
          }
          // Приводим к any, так как _internal не в типе (но JSON.stringify сохранит всё)
        });
        results.push({
          fileId: log.id,
          filename,
          success: true
        });
        console.log(`[TG-App] \u0424\u0430\u0439\u043B \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D: ${filename} -> ${log.id}`);
      } catch (error) {
        console.error(`[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u0430\u0439\u043B\u0430 ${filename}:`, error);
        results.push({
          fileId,
          filename,
          success: false,
          error: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u0430\u0439\u043B\u0430"
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    console.log(
      `[TG-App] \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430: ${successCount} \u0443\u0441\u043F\u0435\u0448\u043D\u043E, ${errorCount} \u043E\u0448\u0438\u0431\u043E\u043A`
    );
    return {
      success: successCount > 0,
      files: results,
      message: successCount > 0 ? `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E ${successCount} \u0438\u0437 ${results.length} \u0444\u0430\u0439\u043B\u043E\u0432` : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u0430\u0439\u043B\u044B"
    };
  }
);

export { upload_post as default };
//# sourceMappingURL=upload.post.mjs.map
