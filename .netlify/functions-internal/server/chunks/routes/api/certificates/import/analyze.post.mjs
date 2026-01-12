import { d as defineEventHandler, o as readMultipartFormData, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireAuth, a as requireAnyPermission, P as Permission } from '../../../../_/permissions.mjs';
import { p as parseCertificateExcel, a as analyzeCertificateImportData } from '../../../../_/certificateImportUtils.mjs';
import { z } from 'zod';
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
import '../../../../_/certificateTemplateRepository.mjs';
import '../../../../_/courseRepository.mjs';

const ConfigSchema = z.object({
  courseSource: z.enum(["existing", "manual"]),
  courseId: z.string().optional(),
  courseName: z.string().optional(),
  courseCode: z.string().optional(),
  courseHours: z.number().optional(),
  validityType: z.enum(["unlimited", "months"]),
  validityMonths: z.number().optional(),
  urlTemplate: z.string().default(""),
  createStudents: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  skipErrors: z.boolean().default(true)
});
const analyze_post = defineEventHandler(async (event) => {
  await requireAuth(event);
  await requireAnyPermission(event, [Permission.CERTIFICATES_ISSUE]);
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D"
    });
  }
  let fileBuffer = null;
  let config = null;
  for (const part of formData) {
    if (part.name === "file" && part.data) {
      const filename = part.filename?.toLowerCase() || "";
      if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
        throw createError({
          statusCode: 400,
          statusMessage: "\u041D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 .xlsx \u0438\u043B\u0438 .xls"
        });
      }
      fileBuffer = part.data;
    }
    if (part.name === "config" && part.data) {
      try {
        const rawConfig = JSON.parse(part.data.toString("utf-8"));
        const parsed = ConfigSchema.safeParse(rawConfig);
        if (!parsed.success) {
          throw createError({
            statusCode: 400,
            statusMessage: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438: ${parsed.error.issues.map((i) => i.message).join(", ")}`
          });
        }
        config = parsed.data;
      } catch (e) {
        if (e instanceof Error && "statusCode" in e) throw e;
        throw createError({
          statusCode: 400,
          statusMessage: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438"
        });
      }
    }
  }
  if (!fileBuffer) {
    throw createError({
      statusCode: 400,
      statusMessage: "Excel-\u0444\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
    });
  }
  if (!config) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430"
    });
  }
  if (config.courseSource === "existing" && !config.courseId) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u0414\u043B\u044F \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u043A\u0443\u0440\u0441\u0430 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C courseId"
    });
  }
  if (config.courseSource === "manual" && !config.courseName) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u0414\u043B\u044F \u0440\u0443\u0447\u043D\u043E\u0433\u043E \u0432\u0432\u043E\u0434\u0430 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430"
    });
  }
  if (config.validityType === "months" && (!config.validityMonths || config.validityMonths <= 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041F\u0440\u0438 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u043E\u043C \u0441\u0440\u043E\u043A\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043C\u0435\u0441\u044F\u0446\u0435\u0432"
    });
  }
  try {
    console.log("[CertificateImport] \u041F\u0430\u0440\u0441\u0438\u043D\u0433 Excel \u0444\u0430\u0439\u043B\u0430...");
    const rows = parseCertificateExcel(fileBuffer);
    if (rows.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430"
      });
    }
    console.log(`[CertificateImport] \u041D\u0430\u0439\u0434\u0435\u043D\u043E ${rows.length} \u0441\u0442\u0440\u043E\u043A, \u043D\u0430\u0447\u0438\u043D\u0430\u044E \u0430\u043D\u0430\u043B\u0438\u0437...`);
    const analysis = await analyzeCertificateImportData(rows, config);
    console.log(`[CertificateImport] \u0410\u043D\u0430\u043B\u0438\u0437 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D:`, {
      totalRows: analysis.totalRows,
      validRows: analysis.validRows,
      errorRows: analysis.errorRows,
      newStudents: analysis.newStudents,
      newCertificates: analysis.newCertificates
    });
    return {
      success: true,
      analysis
    };
  } catch (error) {
    console.error("[CertificateImport] \u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430:", error);
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0444\u0430\u0439\u043B\u0430"
    });
  }
});

export { analyze_post as default };
//# sourceMappingURL=analyze.post.mjs.map
