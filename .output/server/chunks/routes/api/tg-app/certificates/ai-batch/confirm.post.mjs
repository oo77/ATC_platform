import { g as defineEventHandler, r as readBody, h as createError, f as executeQuery, k as executeTransaction } from '../../../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../../../_/aiCertificateRepository.mjs';
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

const confirm_post = defineEventHandler(
  async (event) => {
    console.log(
      "[TG-App] POST /api/tg-app/certificates/ai-batch/confirm - \u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0438\u043C\u043F\u043E\u0440\u0442\u0430"
    );
    const body = await readBody(event);
    const { items, organizationId, representativeId } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: "items \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D (\u043C\u0430\u0441\u0441\u0438\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430)"
      });
    }
    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    if (!representativeId) {
      throw createError({
        statusCode: 400,
        message: "representativeId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    console.log(
      `[TG-App] \u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 ${items.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F organizationId=${organizationId}`
    );
    const errors = [];
    let created = 0;
    let skipped = 0;
    const validItems = [];
    for (const item of items) {
      if (!item.fileId || !item.studentId || !item.extractedData?.certificateNumber) {
        errors.push({
          fileId: item.fileId || "unknown",
          error: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F (fileId, studentId, certificateNumber)"
        });
        continue;
      }
      const studentRows = await executeQuery(
        `SELECT id, organization_id, full_name FROM students WHERE id = ? LIMIT 1`,
        [item.studentId]
      );
      if (studentRows.length === 0) {
        errors.push({
          fileId: item.fileId,
          error: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        });
        continue;
      }
      if (studentRows[0].organization_id !== organizationId) {
        errors.push({
          fileId: item.fileId,
          error: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
        });
        continue;
      }
      const existingCert = await executeQuery(
        `SELECT id FROM issued_certificates WHERE certificate_number = ? LIMIT 1`,
        [item.extractedData.certificateNumber.trim()]
      );
      if (existingCert.length > 0) {
        errors.push({
          fileId: item.fileId,
          error: `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C "${item.extractedData.certificateNumber}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
        });
        skipped++;
        continue;
      }
      validItems.push(item);
    }
    if (validItems.length === 0) {
      return {
        success: false,
        created: 0,
        skipped,
        errors,
        message: "\u041D\u0435\u0442 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0438\u043C\u043F\u043E\u0440\u0442\u0430. \u0412\u0441\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442 \u043E\u0448\u0438\u0431\u043A\u0438."
      };
    }
    console.log(
      `[TG-App] \u041F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F ${validItems.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432...`
    );
    const itemsWithFileUrls = [];
    for (const item of validItems) {
      let originalFileUrl = null;
      try {
        const log = await aiCertificateRepository.getLogById(item.fileId);
        if (log?.extractedData) {
          const internalData = log.extractedData?._internal;
          if (internalData?.tempFilePath) {
            originalFileUrl = internalData.tempFilePath;
          }
        }
      } catch (logErr) {
        console.warn(
          `[TG-App] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443 \u0438\u0437 \u043B\u043E\u0433\u0430 ${item.fileId}:`,
          logErr
        );
      }
      itemsWithFileUrls.push({ item, originalFileUrl });
    }
    try {
      await executeTransaction(async (connection) => {
        const now = /* @__PURE__ */ new Date();
        for (const { item, originalFileUrl } of itemsWithFileUrls) {
          const certificateId = v4();
          const data = item.extractedData;
          let parsedIssueDate = null;
          if (data.issueDate) {
            try {
              parsedIssueDate = new Date(data.issueDate);
              if (isNaN(parsedIssueDate.getTime())) {
                parsedIssueDate = null;
              }
            } catch {
              parsedIssueDate = null;
            }
          }
          let parsedExpiryDate = null;
          if (data.expiryDate) {
            try {
              parsedExpiryDate = new Date(data.expiryDate);
              if (isNaN(parsedExpiryDate.getTime())) {
                parsedExpiryDate = null;
              }
            } catch {
              parsedExpiryDate = null;
            }
          }
          await connection.execute(
            `INSERT INTO issued_certificates (
              id,
              student_id,
              certificate_number,
              course_name,
              course_hours,
              issue_date,
              expiry_date,
              issuing_organization,
              status,
              source_type,
              import_source,
              ai_confidence,
              original_file_url,
              notes,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', 'ai_scan', 'tg_app_ai_batch', ?, ?, ?, ?, ?)`,
            [
              certificateId,
              item.studentId,
              data.certificateNumber.trim(),
              data.courseName?.trim() || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
              data.courseHours || null,
              parsedIssueDate || now,
              parsedExpiryDate,
              data.issuingOrganization?.trim() || null,
              data.confidence || null,
              originalFileUrl,
              `\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0447\u0435\u0440\u0435\u0437 AI | \u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C: ${representativeId}`,
              now,
              now
            ]
          );
          await connection.execute(
            `UPDATE ai_certificate_processing_logs 
             SET certificate_id = ?, 
                 matched_student_id = ?, 
                 processing_completed_at = ?, 
                 status = 'success'
             WHERE id = ?`,
            [certificateId, item.studentId, now, item.fileId]
          );
          created++;
          console.log(
            `[TG-App] \u0421\u043E\u0437\u0434\u0430\u043D \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${certificateId} \u0434\u043B\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 ${item.studentId}`
          );
        }
      });
      console.log(
        `[TG-App] \u0418\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D: \u0441\u043E\u0437\u0434\u0430\u043D\u043E ${created}, \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E ${skipped}, \u043E\u0448\u0438\u0431\u043E\u043A ${errors.length}`
      );
      return {
        success: true,
        created,
        skipped,
        errors,
        message: `\u0423\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E ${created} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432`
      };
    } catch (error) {
      console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438 \u0438\u043C\u043F\u043E\u0440\u0442\u0430:", error);
      throw createError({
        statusCode: 500,
        message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F: ${error.message}`
      });
    }
  }
);

export { confirm_post as default };
//# sourceMappingURL=confirm.post.mjs.map
