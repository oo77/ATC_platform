import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { b as getTemplateById, h as getStudentCertificateInGroup, f as checkStudentEligibility, i as generateCertificateNumber, j as reissueCertificate, k as createIssuedCertificate, u as updateCertificateFiles } from '../../../../_/certificateTemplateRepository.mjs';
import { g as getGroupById } from '../../../../_/groupRepository.mjs';
import { a as getStudentById } from '../../../../_/studentRepository.mjs';
import { g as generateCertificatePdf } from '../../../../_/pdfGenerator.mjs';
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
import 'puppeteer';
import 'qrcode';
import '../../../../_/activityLogRepository.mjs';

const issueSchema = z.object({
  templateId: z.string().uuid("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430"),
  studentIds: z.array(z.string().uuid()).min(1, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E\u0433\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430"),
  issueDate: z.string().optional(),
  expiryMode: z.enum(["auto", "custom", "none"]).optional().default("auto"),
  expiryDate: z.string().nullable().optional(),
  // Конкретная дата истечения (при expiryMode = 'custom')
  overrideWarnings: z.boolean().optional(),
  notes: z.string().max(1e3).optional()
});
const GENERATED_DIR = path.join(process.cwd(), "storage", "certificates", "generated");
const _groupId__post = defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, "groupId");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const body = await readBody(event);
    const validated = issueSchema.parse(body);
    const group = await getGroupById(groupId);
    if (!group) {
      throw createError({
        statusCode: 404,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const template = await getTemplateById(validated.templateId);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    if (!template.templateData) {
      throw createError({
        statusCode: 400,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0438 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0434\u0438\u0437\u0430\u0439\u043D \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430."
      });
    }
    const templateData = template.templateData;
    if (!templateData.elements || templateData.elements.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043F\u0443\u0441\u0442\u043E\u0439. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u0432 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E\u043C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435."
      });
    }
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }
    const issueDate = validated.issueDate ? new Date(validated.issueDate) : /* @__PURE__ */ new Date();
    const results = [];
    const userId = event.context.user?.id;
    for (const studentId of validated.studentIds) {
      try {
        const existing = await getStudentCertificateInGroup(studentId, groupId);
        if (existing) {
          if (existing.status === "issued") {
            results.push({
              studentId,
              studentName: existing.student?.fullName || studentId,
              success: false,
              error: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0436\u0435 \u0432\u044B\u0434\u0430\u043D"
            });
            continue;
          }
        }
        const student = await getStudentById(studentId);
        if (!student) {
          results.push({
            studentId,
            studentName: studentId,
            success: false,
            error: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
          });
          continue;
        }
        const eligibility = await checkStudentEligibility(studentId, groupId);
        if (!eligibility.isEligible && !validated.overrideWarnings) {
          results.push({
            studentId,
            studentName: student.fullName,
            success: false,
            warnings: eligibility.warnings,
            error: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0432\u044B\u0434\u0430\u0447\u0438"
          });
          continue;
        }
        const courseCode = group.course?.code || "UNKNOWN";
        const certificateNumber = await generateCertificateNumber(
          template.id,
          courseCode
        );
        const context = {
          student: {
            id: student.id,
            fullName: student.fullName,
            organization: student.organization,
            position: student.position,
            department: null,
            pinfl: student.pinfl
          },
          course: {
            id: group.course?.id || "",
            name: group.course?.name || "",
            shortName: group.course?.shortName || "",
            code: group.course?.code || "",
            totalHours: group.course?.totalHours || 0
          },
          group: {
            id: group.id,
            code: group.code,
            startDate: group.startDate,
            endDate: group.endDate,
            classroom: group.classroom
          },
          certificate: {
            number: certificateNumber,
            issueDate,
            verificationUrl: `${process.env.APP_URL || "https://atc.uz"}/verify/${certificateNumber}`
          }
        };
        const pdfFilename = `${certificateNumber.replace(/[\/\\:*?"<>|]/g, "_")}.pdf`;
        const pdfPath = path.join(GENERATED_DIR, pdfFilename);
        await generateCertificatePdf({
          templateData,
          context,
          outputPath: pdfPath
        });
        const pdfUrl = `/storage/certificates/generated/${pdfFilename}`;
        let expiryDate = null;
        switch (validated.expiryMode) {
          case "custom":
            if (validated.expiryDate) {
              expiryDate = new Date(validated.expiryDate);
            }
            break;
          case "none":
            expiryDate = null;
            break;
          case "auto":
          default:
            if (group.course?.certificateValidityMonths) {
              expiryDate = new Date(issueDate);
              expiryDate.setMonth(expiryDate.getMonth() + group.course.certificateValidityMonths);
            }
            break;
        }
        let certificate;
        const certData = {
          templateId: template.id,
          certificateNumber,
          issueDate,
          expiryDate,
          variablesData: {
            studentName: student.fullName,
            courseName: group.course?.name || "",
            certificateNumber
          },
          warnings: eligibility.warnings.length > 0 ? eligibility.warnings : void 0,
          overrideWarnings: validated.overrideWarnings,
          issuedBy: userId,
          notes: validated.notes
        };
        if (existing && (existing.status === "draft" || existing.status === "revoked")) {
          console.log(`[Certificates] Reissuing certificate for student ${studentId}, existing status: ${existing.status}`);
          certificate = await reissueCertificate(existing.id, certData);
        } else {
          certificate = await createIssuedCertificate({
            groupId,
            studentId,
            ...certData
          });
        }
        await updateCertificateFiles(certificate.id, pdfUrl, pdfUrl);
        const logAction = existing ? "UPDATE" : "CREATE";
        await logActivity(
          event,
          logAction,
          "ISSUED_CERTIFICATE",
          certificate.id,
          `${certificateNumber} \u2014 ${student.fullName}`,
          {
            groupId,
            studentId,
            certificateNumber,
            hasWarnings: eligibility.warnings.length > 0,
            overrideWarnings: validated.overrideWarnings,
            reissued: !!existing
          }
        );
        results.push({
          studentId,
          studentName: student.fullName,
          success: true,
          certificateId: certificate.id,
          certificateNumber,
          pdfUrl,
          warnings: eligibility.warnings.length > 0 ? eligibility.warnings : void 0
        });
      } catch (studentError) {
        console.error(`Error issuing certificate for student ${studentId}:`, studentError);
        results.push({
          studentId,
          studentName: studentId,
          success: false,
          error: studentError.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    console.log(`[POST /api/certificates/issue/${groupId}] \u0412\u044B\u0434\u0430\u043D\u043E: ${successCount}, \u043E\u0448\u0438\u0431\u043E\u043A: ${failCount}`);
    return {
      success: true,
      message: `\u0412\u044B\u0434\u0430\u043D\u043E ${successCount} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432`,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount
      }
    };
  } catch (error) {
    console.error("[POST /api/certificates/issue/[groupId]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438",
        data: error.errors
      });
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432"
    });
  }
});

export { _groupId__post as default };
//# sourceMappingURL=_groupId_.post.mjs.map
