import { g as defineEventHandler, r as readBody, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
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

const manual_post = defineEventHandler(async (event) => {
  console.log(
    "[TG-App] POST /api/tg-app/certificates/manual - \u0420\u0443\u0447\u043D\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
  );
  const body = await readBody(event);
  const {
    organizationId,
    representativeId,
    studentId,
    certificateNumber,
    courseName,
    issueDate,
    expiryDate,
    courseHours,
    issuingOrganization,
    notes
  } = body;
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
  if (!studentId) {
    throw createError({ statusCode: 400, message: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F" });
  }
  if (!certificateNumber || certificateNumber.trim().length < 3) {
    throw createError({
      statusCode: 400,
      message: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 3 \u0441\u0438\u043C\u0432\u043E\u043B\u0430)"
    });
  }
  if (!courseName || courseName.trim().length < 3) {
    throw createError({
      statusCode: 400,
      message: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430 (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 3 \u0441\u0438\u043C\u0432\u043E\u043B\u0430)"
    });
  }
  if (!issueDate) {
    throw createError({ statusCode: 400, message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0434\u0430\u0442\u0443 \u0432\u044B\u0434\u0430\u0447\u0438" });
  }
  try {
    const studentRows = await executeQuery(
      `SELECT id, organization_id as organizationId FROM students WHERE id = ? LIMIT 1`,
      [studentId]
    );
    if (studentRows.length === 0) {
      throw createError({ statusCode: 404, message: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
    }
    if (studentRows[0].organizationId !== organizationId) {
      console.warn(
        `[TG-App] \u041F\u043E\u043F\u044B\u0442\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0434\u043B\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u0434\u0440\u0443\u0433\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438: ${studentId}`
      );
      throw createError({
        statusCode: 403,
        message: "\u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0441\u0432\u043E\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
      });
    }
    const existingCert = await executeQuery(
      `SELECT id FROM issued_certificates WHERE certificate_number = ? LIMIT 1`,
      [certificateNumber.trim()]
    );
    if (existingCert.length > 0) {
      throw createError({
        statusCode: 409,
        message: `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C "${certificateNumber}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
      });
    }
    const certificateId = v4();
    const now = /* @__PURE__ */ new Date();
    let parsedIssueDate;
    try {
      parsedIssueDate = new Date(issueDate);
      if (isNaN(parsedIssueDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B \u0432\u044B\u0434\u0430\u0447\u0438"
      });
    }
    let parsedExpiryDate = null;
    if (expiryDate) {
      try {
        parsedExpiryDate = new Date(expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) {
          parsedExpiryDate = null;
        }
      } catch {
        parsedExpiryDate = null;
      }
    }
    const fullNotes = [
      notes?.trim() || null,
      `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u043C: ${representativeId}`
    ].filter(Boolean).join(" | ");
    await executeQuery(
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
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', 'manual', 'tg_app_manual', ?, ?, ?)`,
      [
        certificateId,
        studentId,
        certificateNumber.trim(),
        courseName.trim(),
        courseHours ? Number(courseHours) : null,
        parsedIssueDate,
        parsedExpiryDate,
        issuingOrganization?.trim() || null,
        fullNotes,
        now,
        now
      ]
    );
    console.log(
      `[TG-App] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441\u043E\u0437\u0434\u0430\u043D: ${certificateId} \u0434\u043B\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F ${studentId}`
    );
    return {
      success: true,
      message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D",
      certificate: {
        id: certificateId,
        certificateNumber: certificateNumber.trim(),
        courseName: courseName.trim(),
        issueDate: parsedIssueDate.toLocaleDateString("ru-RU"),
        expiryDate: parsedExpiryDate?.toLocaleDateString("ru-RU") || null
      }
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { manual_post as default };
//# sourceMappingURL=manual.post.mjs.map
