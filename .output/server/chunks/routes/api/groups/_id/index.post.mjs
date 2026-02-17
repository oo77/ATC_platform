import { g as defineEventHandler, h as createError, j as getRouterParam, l as readMultipartFormData, f as executeQuery } from '../../../../_/nitro.mjs';
import { g as getGroupById } from '../../../../_/groupRepository.mjs';
import { v as validatePdfFile } from '../../../../_/validatePdfFile.mjs';
import { s as saveGroupReportFile } from '../../../../_/groupFileStorage.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
import { v4 } from 'uuid';
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
import 'fs/promises';
import 'path';
import '../../../../_/activityLogRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432"
    });
  }
  const groupId = getRouterParam(event, "id");
  if (!groupId) {
    throw createError({ statusCode: 400, message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D" });
  }
  const group = await getGroupById(groupId);
  if (!group) {
    throw createError({ statusCode: 404, message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
  }
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0436\u0438\u0434\u0430\u044E\u0442\u0441\u044F \u0434\u0430\u043D\u043D\u044B\u0435 multipart/form-data"
    });
  }
  const pdfFiles = [];
  for (const part of formData) {
    if (part.name === "reportFiles" || part.name === "reportFile") {
      if (part.data && part.filename) {
        pdfFiles.push({
          buffer: part.data,
          filename: part.filename
        });
      }
    }
  }
  if (pdfFiles.length === 0) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430"
    });
  }
  for (const file of pdfFiles) {
    const pdfValidation = await validatePdfFile(file.buffer, file.filename);
    if (!pdfValidation.valid) {
      throw createError({
        statusCode: 400,
        message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0444\u0430\u0439\u043B\u0430 "${file.filename}": ${pdfValidation.error}`
      });
    }
  }
  const uploadedFiles = [];
  try {
    for (const file of pdfFiles) {
      const fileResult = await saveGroupReportFile({
        groupId,
        file: file.buffer,
        originalFilename: file.filename,
        userId: user.id
      });
      const fileUuid = v4();
      await executeQuery(
        `INSERT INTO files (
          uuid, filename, stored_name, mime_type, size_bytes, extension, 
          storage_path, full_path, category, group_id, 
          uploaded_by, uploaded_by_user, uploaded_at_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
        [
          fileUuid,
          file.filename,
          fileResult.storedName,
          "application/pdf",
          file.buffer.length,
          "pdf",
          fileResult.filePath,
          fileResult.filePath,
          "group_report",
          groupId,
          user.id,
          user.id,
          /* @__PURE__ */ new Date()
        ]
      );
      uploadedFiles.push({
        uuid: fileUuid,
        name: file.filename,
        size: file.buffer.length,
        url: `/api/groups/${groupId}/reports/${fileUuid}`
      });
      await logActivity(
        event,
        "UPLOAD",
        "GROUP_REPORT",
        groupId,
        file.filename,
        {
          groupCode: group.code,
          fileSize: file.buffer.length
        }
      );
    }
    return {
      success: true,
      message: `\u0423\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E \u0444\u0430\u0439\u043B\u043E\u0432: ${uploadedFiles.length}`,
      files: uploadedFiles
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432: " + (error.message || "Unknown error")
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
