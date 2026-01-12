import { a as getCertificateByNumber, c as createStandaloneCertificate } from '../../../_/certificateTemplateRepository.mjs';
import { g as getStudentByPinfl, c as createStudent, a as getStudentById } from '../../../_/studentRepository.mjs';
import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import 'uuid';
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
import 'jsonwebtoken';

const manual_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const errors = [];
    if (!body.studentId && !body.createNewStudent) {
      errors.push({ field: "studentId", message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u0438\u043B\u0438 \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u043E\u0433\u043E" });
    }
    if (body.createNewStudent && body.studentData) {
      if (!body.studentData.fullName?.trim()) {
        errors.push({ field: "studentData.fullName", message: "\u0424\u0418\u041E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E" });
      }
      if (!body.studentData.pinfl?.trim()) {
        errors.push({ field: "studentData.pinfl", message: "\u041F\u0418\u041D\u0424\u041B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D" });
      } else if (!/^\d{14}$/.test(body.studentData.pinfl.trim())) {
        errors.push({ field: "studentData.pinfl", message: "\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 14 \u0446\u0438\u0444\u0440" });
      }
      if (!body.studentData.organization?.trim()) {
        errors.push({ field: "studentData.organization", message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430" });
      }
      if (!body.studentData.position?.trim()) {
        errors.push({ field: "studentData.position", message: "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430" });
      }
    }
    if (!body.certificateNumber?.trim()) {
      errors.push({ field: "certificateNumber", message: "\u041D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D" });
    }
    if (!body.issueDate) {
      errors.push({ field: "issueDate", message: "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430" });
    }
    if (!body.courseName?.trim()) {
      errors.push({ field: "courseName", message: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E" });
    }
    if (body.expiryDate && body.issueDate) {
      const issueDate = new Date(body.issueDate);
      const expiryDate = new Date(body.expiryDate);
      if (expiryDate <= issueDate) {
        errors.push({ field: "expiryDate", message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0434\u0430\u0442\u044B \u0432\u044B\u0434\u0430\u0447\u0438" });
      }
    }
    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438",
        data: { errors }
      });
    }
    const existingCert = await getCertificateByNumber(body.certificateNumber.trim());
    if (existingCert) {
      throw createError({
        statusCode: 409,
        message: `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C ${body.certificateNumber} \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
      });
    }
    let studentId = body.studentId;
    if (body.createNewStudent && body.studentData) {
      const existingStudent = await getStudentByPinfl(body.studentData.pinfl.trim());
      if (existingStudent) {
        throw createError({
          statusCode: 409,
          message: `\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u0441 \u041F\u0418\u041D\u0424\u041B ${body.studentData.pinfl} \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
        });
      }
      const newStudent = await createStudent({
        fullName: body.studentData.fullName.trim(),
        pinfl: body.studentData.pinfl.trim(),
        organization: body.studentData.organization.trim(),
        position: body.studentData.position.trim(),
        department: body.studentData.department?.trim() || void 0
      });
      studentId = newStudent.id;
    } else if (studentId) {
      const student = await getStudentById(studentId);
      if (!student) {
        throw createError({
          statusCode: 404,
          message: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        });
      }
    }
    if (!studentId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F"
      });
    }
    let pdfFileUrl = body.fileUrl?.trim() || void 0;
    if (body.fileUuid && !pdfFileUrl) {
    }
    const certificate = await createStandaloneCertificate({
      studentId,
      certificateNumber: body.certificateNumber.trim(),
      issueDate: new Date(body.issueDate),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : void 0,
      courseName: body.courseName.trim(),
      courseCode: body.courseCode?.trim(),
      courseHours: body.courseHours,
      sourceType: "manual",
      pdfFileUrl
    });
    return {
      success: true,
      message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D",
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        courseName: certificate.courseName,
        courseCode: certificate.courseCode,
        sourceType: certificate.sourceType
      }
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
    });
  }
});

export { manual_post as default };
//# sourceMappingURL=manual.post.mjs.map
