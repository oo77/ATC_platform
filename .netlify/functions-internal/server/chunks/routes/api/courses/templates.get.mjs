import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { i as getAllCertificateTemplates } from '../../../_/courseRepository.mjs';
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

const templates_get = defineEventHandler(async (event) => {
  try {
    const templates = await getAllCertificateTemplates();
    return {
      success: true,
      templates
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432",
      templates: []
    };
  }
});

export { templates_get as default };
//# sourceMappingURL=templates.get.mjs.map
