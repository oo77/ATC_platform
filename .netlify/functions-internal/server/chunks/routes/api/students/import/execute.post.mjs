import { d as defineEventHandler, o as readMultipartFormData } from '../../../../nitro/nitro.mjs';
import { p as parseExcelFile, g as getValidImportData, c as createImportJob, e as executeImport } from '../../../../_/importUtils.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
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
import 'module';
import '../../../../_/studentRepository.mjs';
import '../../../../_/activityLogRepository.mjs';

const execute_post = defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      return {
        success: false,
        error: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D"
      };
    }
    const fileField = formData.find((field) => field.name === "file");
    if (!fileField || !fileField.data) {
      return {
        success: false,
        error: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
      };
    }
    const rows = parseExcelFile(fileField.data);
    const validData = getValidImportData(rows);
    if (validData.length === 0) {
      return {
        success: false,
        error: "\u041D\u0435\u0442 \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430"
      };
    }
    const jobId = createImportJob(validData.length);
    executeImport(validData, jobId).catch((error) => {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430:", error);
    });
    await logActivity(
      event,
      "IMPORT",
      "STUDENT",
      jobId,
      "\u0418\u043C\u043F\u043E\u0440\u0442 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432",
      { totalRows: validData.length }
    );
    return {
      success: true,
      jobId,
      totalRows: validData.length,
      message: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u043F\u0443\u0449\u0435\u043D"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430"
    };
  }
});

export { execute_post as default };
//# sourceMappingURL=execute.post.mjs.map
