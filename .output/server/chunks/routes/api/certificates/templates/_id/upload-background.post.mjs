import { g as defineEventHandler, j as getRouterParam, h as createError, l as readMultipartFormData } from '../../../../../_/nitro.mjs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';
import { b as getTemplateById } from '../../../../../_/certificateTemplateRepository.mjs';
import { l as logActivity } from '../../../../../_/activityLogger.mjs';
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
import '../../../../../_/academicHours.mjs';
import '../../../../../_/activityLogRepository.mjs';

const UPLOAD_DIR = "./public/uploads/certificate-backgrounds";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const uploadBackground_post = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const template = await getTemplateById(id);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const fileData = formData.find((item) => item.name === "background");
    if (!fileData) {
      throw createError({
        statusCode: 400,
        message: "\u041F\u043E\u043B\u0435 'background' \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      });
    }
    const contentType = fileData.type || "";
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw createError({
        statusCode: 400,
        message: `\u041D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0442\u0438\u043F \u0444\u0430\u0439\u043B\u0430. \u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u044B: ${ALLOWED_TYPES.join(", ")}`
      });
    }
    if (fileData.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `\u0424\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439. \u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = contentType.split("/")[1];
    const filename = `${id}_${v4()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, fileData.data);
    const url = `/uploads/certificate-backgrounds/${filename}`;
    await logActivity(
      event,
      "UPLOAD",
      "CERTIFICATE_TEMPLATE_BACKGROUND",
      id,
      template.name,
      { filename, size: fileData.data.length }
    );
    console.log(
      `[POST /api/certificates/templates/${id}/upload-background] \u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u0444\u043E\u043D: ${filename}`
    );
    return {
      success: true,
      url,
      filename,
      size: fileData.data.length,
      message: "\u0424\u043E\u043D\u043E\u0432\u043E\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E"
    };
  } catch (error) {
    console.error(
      "[POST /api/certificates/templates/[id]/upload-background] Error:",
      error
    );
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F"
    });
  }
});

export { uploadBackground_post as default };
//# sourceMappingURL=upload-background.post.mjs.map
