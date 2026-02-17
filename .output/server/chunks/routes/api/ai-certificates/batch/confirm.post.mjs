import { g as defineEventHandler, r as readBody, h as createError, k as executeTransaction } from '../../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../../_/aiCertificateRepository.mjs';
import { c as createStandaloneCertificate } from '../../../../_/certificateTemplateRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../../_/permissions.mjs';
import { s as storage } from '../../../../_/index.mjs';
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
import '../../../../_/academicHours.mjs';
import 'fs/promises';
import 'path';
import '../../../../_/fileUtils.mjs';

const confirm_post = defineEventHandler(
  async (event) => {
    const context = await requirePermission(
      event,
      Permission.CERTIFICATES_ISSUE
    );
    const body = await readBody(event);
    const { items } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Items array is required"
      });
    }
    console.log(
      `[Batch Confirm] Starting batch import for ${items.length} certificates`
    );
    const validationErrors = [];
    items.forEach((item, index) => {
      if (!item.fileId) {
        validationErrors.push(`Item ${index + 1}: fileId is required`);
      }
      if (!item.studentId) {
        validationErrors.push(`Item ${index + 1}: studentId is required`);
      }
    });
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        message: "Validation errors",
        data: { errors: validationErrors }
      });
    }
    try {
      const results = [];
      await executeTransaction(async (connection) => {
        console.log("[Batch Confirm] Starting database transaction");
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const { fileId, studentId, overrideData } = item;
          try {
            console.log(
              `[Batch Confirm] Processing certificate ${i + 1}/${items.length} (fileId: ${fileId})`
            );
            const log = await aiCertificateRepository.getLogById(fileId);
            if (!log) {
              throw new Error(`Log not found for fileId: ${fileId}`);
            }
            if (log.status === "success" && log.certificateId) {
              console.log(
                `[Batch Confirm] Certificate ${i + 1}/${items.length} already exists (ID: ${log.certificateId})`
              );
              results.push({
                success: true,
                fileId,
                certificateId: log.certificateId
              });
              continue;
            }
            const baseData = log.extractedData || {};
            const mergedData = { ...baseData, ...overrideData };
            const finalData = {
              fullName: mergedData.fullName || "Unknown",
              certificateNumber: mergedData.certificateNumber || "UNKNOWN",
              issueDate: mergedData.issueDate || (/* @__PURE__ */ new Date()).toISOString(),
              organization: mergedData.organization || "Unknown Organization",
              courseName: mergedData.courseName || "Unknown Course",
              confidence: mergedData.confidence || 1,
              expiryDate: mergedData.expiryDate,
              courseHours: mergedData.courseHours,
              position: mergedData.position,
              department: mergedData.department,
              pinfl: mergedData.pinfl,
              rawText: mergedData.rawText
            };
            const fileUuid = log.extractedData?._internal?.fileUuid;
            const pdfUrl = fileUuid ? storage.getPublicUrl(fileUuid) : null;
            const cert = await createStandaloneCertificate({
              studentId,
              certificateNumber: finalData.certificateNumber,
              issueDate: new Date(finalData.issueDate),
              expiryDate: finalData.expiryDate ? new Date(finalData.expiryDate) : null,
              courseName: finalData.courseName,
              courseHours: finalData.courseHours ? Number(finalData.courseHours) : void 0,
              sourceType: "import",
              importSource: "ai_scan",
              pdfFileUrl: pdfUrl || void 0,
              issuedBy: context.userId,
              notes: `AI Batch Import (Log ID: ${fileId})`
            });
            console.log(
              `[Batch Confirm] \u2713 Certificate ${i + 1}/${items.length} created (ID: ${cert.id})`
            );
            await aiCertificateRepository.updateCertificateWithAiData(cert.id, {
              extractedData: finalData,
              confidence: log.aiConfidence || 1,
              processingStatus: "completed",
              originalFileUrl: pdfUrl || void 0
            });
            await aiCertificateRepository.updateLog(fileId, {
              certificateId: cert.id,
              matchedStudentId: studentId,
              matchMethod: "manual",
              matchConfidence: 1,
              extractedData: finalData,
              status: "success"
            });
            results.push({
              success: true,
              fileId,
              certificateId: cert.id
            });
          } catch (itemError) {
            console.error(
              `[Batch Confirm] \u2717 Error processing certificate ${i + 1}/${items.length}:`,
              itemError
            );
            throw new Error(
              `Failed to create certificate ${i + 1} (fileId: ${fileId}): ${itemError.message}`
            );
          }
        }
        console.log(
          `[Batch Confirm] Transaction completed successfully: ${results.length} certificates created`
        );
      });
      console.log(
        `[Batch Confirm] Batch import completed: ${results.length} certificates imported by user ${context.userId}`
      );
      const batchResult = {
        results,
        successCount: results.length,
        errorCount: 0,
        totalTime: 0
        // TODO: подсчитать общее время
      };
      return batchResult;
    } catch (transactionError) {
      console.error(
        "[Batch Confirm] Transaction failed, all changes rolled back:",
        transactionError
      );
      const errorMessage = transactionError.message || String(transactionError);
      let userMessage = "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432";
      if (errorMessage.includes("not found")) {
        userMessage = "\u041E\u0434\u0438\u043D \u0438\u043B\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0444\u0430\u0439\u043B\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B";
      } else if (errorMessage.includes("already exists")) {
        userMessage = "\u041E\u0434\u0438\u043D \u0438\u043B\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0442";
      } else if (errorMessage.includes("student")) {
        userMessage = "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0440\u0430\u0431\u043E\u0442\u0435 \u0441\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430\u043C\u0438";
      }
      throw createError({
        statusCode: 500,
        message: `${userMessage}. \u0412\u0441\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u044B.`,
        data: {
          originalError: void 0,
          rollback: true
        }
      });
    }
  }
);

export { confirm_post as default };
//# sourceMappingURL=confirm.post.mjs.map
