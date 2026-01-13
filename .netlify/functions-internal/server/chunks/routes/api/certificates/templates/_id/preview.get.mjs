import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../../nitro/nitro.mjs';
import { b as getTemplateById } from '../../../../../_/certificateTemplateRepository.mjs';
import { a as generateCertificateHtml } from '../../../../../_/pdfGenerator.mjs';
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
import 'puppeteer';
import 'qrcode';
import 'fs';
import 'path';

const preview_get = defineEventHandler(async (event) => {
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
    if (!template.templateData) {
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440.",
        hasTemplate: false
      };
    }
    const templateData = template.templateData;
    const testContext = {
      student: {
        id: "test-student-id",
        fullName: "\u0418\u0432\u0430\u043D\u043E\u0432 \u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432\u0438\u0447",
        organization: '\u041E\u041E\u041E "\u0422\u0435\u0441\u0442\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F"',
        position: "\u0418\u043D\u0436\u0435\u043D\u0435\u0440-\u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0441\u0442",
        department: "IT-\u043E\u0442\u0434\u0435\u043B",
        pinfl: "12345678901234"
      },
      course: {
        id: "test-course-id",
        name: "\u041F\u043E\u0432\u044B\u0448\u0435\u043D\u0438\u0435 \u043A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u0432 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0445 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439",
        shortName: "\u0418\u0422-\u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442",
        code: "IT-2024",
        totalHours: 72
      },
      group: {
        id: "test-group-id",
        code: "\u041F\u041A-2024-001",
        startDate: /* @__PURE__ */ new Date("2024-12-01"),
        endDate: /* @__PURE__ */ new Date("2024-12-15"),
        classroom: "\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F 301"
      },
      certificate: {
        number: "ATC24_IT_0001",
        issueDate: /* @__PURE__ */ new Date(),
        verificationUrl: "https://atc.uz/verify/ATC24_IT_0001"
      }
    };
    const html = await generateCertificateHtml(templateData, testContext);
    return {
      success: true,
      hasTemplate: true,
      preview: {
        html,
        width: templateData.width,
        height: templateData.height,
        layout: templateData.layout,
        elementsCount: templateData.elements.length
      },
      template: {
        id: template.id,
        name: template.name,
        layout: template.layout,
        lastNumber: template.lastNumber
      }
    };
  } catch (error) {
    console.error("[GET /api/certificates/templates/[id]/preview] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430"
    });
  }
});

export { preview_get as default };
//# sourceMappingURL=preview.get.mjs.map
