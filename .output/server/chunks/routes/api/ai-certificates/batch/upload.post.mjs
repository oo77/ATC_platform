import { g as defineEventHandler, l as readMultipartFormData, h as createError } from '../../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../../_/aiCertificateRepository.mjs';
import { s as storage } from '../../../../_/index.mjs';
import { r as requirePermission, P as Permission } from '../../../../_/permissions.mjs';
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
import 'fs/promises';
import 'path';
import '../../../../_/fileUtils.mjs';

const upload_post = defineEventHandler(async (event) => {
  const context = await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      message: "\u0424\u0430\u0439\u043B\u044B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B"
    });
  }
  const MAX_FILES = 20;
  if (files.length > MAX_FILES) {
    throw createError({
      statusCode: 400,
      message: `\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0444\u0430\u0439\u043B\u043E\u0432. \u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C ${MAX_FILES} \u0444\u0430\u0439\u043B\u043E\u0432 \u0437\u0430 \u0440\u0430\u0437, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${files.length}`
    });
  }
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const uploadPromises = files.map(async (file, index) => {
    try {
      if (!ALLOWED_TYPES.includes(file.type || "")) {
        throw new Error(
          `\u041D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430 "${file.filename}". \u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u044B: PDF, JPG, PNG, WEBP`
        );
      }
      if (file.data.length > MAX_FILE_SIZE) {
        throw new Error(
          `\u0424\u0430\u0439\u043B "${file.filename}" \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 (${(file.data.length / 1024 / 1024).toFixed(2)}MB). \u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 10MB`
        );
      }
      const savedFile = await storage.save(
        {
          filename: file.filename || `unknown_${index}`,
          data: file.data,
          mimeType: file.type || "application/octet-stream",
          size: file.data.length
        },
        "certificate_generated",
        void 0,
        "/Certificates/Imports/Temp"
      );
      const log = await aiCertificateRepository.createLog({
        originalFilename: file.filename || `unknown_${index}`,
        fileSizeBytes: file.data.length,
        processingStartedAt: /* @__PURE__ */ new Date(),
        aiModel: "pending",
        status: "pending",
        processedBy: context.userId,
        ipAddress: event.node.req.socket.remoteAddress || "unknown",
        // Сохраняем временные данные для следующего шага
        extractedData: {
          _internal: {
            tempFilePath: savedFile.fullPath,
            fileUuid: savedFile.uuid,
            mimeType: savedFile.mimeType
          }
        }
      });
      console.log(
        `[Batch Upload] File ${index + 1}/${files.length} uploaded: ${file.filename} (ID: ${log.id})`
      );
      const result = {
        success: true,
        fileId: log.id,
        filename: savedFile.filename,
        size: savedFile.sizeBytes
      };
      return result;
    } catch (error) {
      console.error(
        `[Batch Upload] Error processing file ${index + 1}/${files.length}:`,
        error
      );
      const result = {
        success: false,
        filename: file.filename || `unknown_${index}`,
        size: file.data.length,
        error: error.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0444\u0430\u0439\u043B\u0430"
      };
      return result;
    }
  });
  const results = await Promise.allSettled(uploadPromises);
  const uploadResults = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      uploadResults.push(result.value);
      if (!result.value.success) {
        errors.push(
          `\u0424\u0430\u0439\u043B ${index + 1} (${result.value.filename}): ${result.value.error}`
        );
      }
    } else {
      errors.push(
        `\u0424\u0430\u0439\u043B ${index + 1}: \u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 - ${result.reason?.message || "Unknown error"}`
      );
      uploadResults.push({
        success: false,
        filename: files[index]?.filename || `unknown_${index}`,
        size: files[index]?.data.length || 0,
        error: result.reason?.message || "\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438"
      });
    }
  });
  const successCount = uploadResults.filter((r) => r.success).length;
  const failedCount = uploadResults.filter((r) => !r.success).length;
  console.log(
    `[Batch Upload] Completed: ${successCount} success, ${failedCount} failed out of ${files.length} files`
  );
  const batchResult = {
    success: successCount > 0,
    // Успех если хотя бы один файл загружен
    totalFiles: files.length,
    successCount,
    failedCount,
    files: uploadResults,
    errors: errors.length > 0 ? errors : void 0
  };
  return batchResult;
});

export { upload_post as default };
//# sourceMappingURL=upload.post.mjs.map
