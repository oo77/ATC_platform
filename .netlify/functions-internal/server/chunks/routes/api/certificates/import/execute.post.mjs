import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireAuth, a as requireAnyPermission, P as Permission } from '../../../../_/permissions.mjs';
import { c as cleanupOldCertificateImportJobs, b as createCertificateImportJob, e as executeCertificateImport } from '../../../../_/certificateImportUtils.mjs';
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

const ExecuteSchema = z.object({
  rows: z.array(z.object({
    rowNumber: z.number(),
    pinfl: z.string(),
    fullName: z.string(),
    organization: z.string(),
    position: z.string(),
    certificateNumber: z.string(),
    issueDate: z.string(),
    expiryDate: z.string().nullable().optional(),
    generatedUrl: z.string(),
    status: z.enum(["valid", "warning", "error"]),
    studentStatus: z.enum(["exists", "new", "not_found"]),
    studentId: z.string().optional(),
    certificateStatus: z.enum(["new", "duplicate"]),
    existingCertificateId: z.string().optional(),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  })),
  config: z.object({
    courseSource: z.enum(["existing", "manual"]),
    courseId: z.string().optional(),
    courseName: z.string().optional(),
    courseCode: z.string().optional(),
    courseHours: z.number().optional(),
    validityType: z.enum(["unlimited", "months"]),
    validityMonths: z.number().optional(),
    urlTemplate: z.string(),
    createStudents: z.boolean(),
    updateExisting: z.boolean(),
    skipErrors: z.boolean()
  }),
  courseInfo: z.object({
    name: z.string(),
    code: z.string().optional(),
    hours: z.number().optional()
  })
});
const execute_post = defineEventHandler(async (event) => {
  const context = await requireAuth(event);
  await requireAnyPermission(event, [Permission.CERTIFICATES_ISSUE]);
  cleanupOldCertificateImportJobs();
  const body = await readBody(event);
  const parsed = ExecuteSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    });
  }
  const { rows, config, courseInfo } = parsed.data;
  let rowsToImport;
  if (config.skipErrors) {
    rowsToImport = rows.filter((row) => {
      if (row.status === "error") return false;
      if (row.certificateStatus === "duplicate" && !config.updateExisting) return false;
      return true;
    });
  } else {
    rowsToImport = rows.filter((row) => row.status !== "error");
  }
  if (rowsToImport.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430 (\u0432\u0441\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0441 \u043E\u0448\u0438\u0431\u043A\u0430\u043C\u0438 \u0438\u043B\u0438 \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u044B)"
    });
  }
  console.log(`[CertificateImport] \u041D\u0430\u0447\u0438\u043D\u0430\u044E \u0438\u043C\u043F\u043E\u0440\u0442 ${rowsToImport.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432...`);
  const jobId = createCertificateImportJob(rowsToImport.length);
  setImmediate(async () => {
    try {
      await executeCertificateImport(
        rowsToImport,
        config,
        courseInfo,
        jobId,
        context.userId
      );
      console.log(`[CertificateImport] \u0418\u043C\u043F\u043E\u0440\u0442 ${jobId} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E`);
    } catch (error) {
      console.error(`[CertificateImport] \u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 ${jobId}:`, error);
    }
  });
  return {
    success: true,
    jobId,
    totalRecords: rowsToImport.length,
    message: `\u0418\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u043F\u0443\u0449\u0435\u043D. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 GET /api/certificates/import/status/${jobId} \u0434\u043B\u044F \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430.`
  };
});

export { execute_post as default };
//# sourceMappingURL=execute.post.mjs.map
