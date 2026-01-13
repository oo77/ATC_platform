import { d as defineEventHandler, o as readMultipartFormData } from '../../../../nitro/nitro.mjs';
import { p as parseExcelFile, a as analyzeImportData } from '../../../../_/importUtils.mjs';
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

const analyze_post = defineEventHandler(async (event) => {
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
    const filename = fileField.filename || "";
    if (!filename.match(/\.(xlsx|xls)$/i)) {
      return {
        success: false,
        error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430. \u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E .xlsx \u0438 .xls"
      };
    }
    const rows = parseExcelFile(fileField.data);
    const analysis = await analyzeImportData(rows);
    return {
      success: true,
      analysis
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0444\u0430\u0439\u043B\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0444\u0430\u0439\u043B\u0430"
    };
  }
});

export { analyze_post as default };
//# sourceMappingURL=analyze.post.mjs.map
