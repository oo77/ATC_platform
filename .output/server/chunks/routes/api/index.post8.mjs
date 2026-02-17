import { g as defineEventHandler, h as createError, l as readMultipartFormData, k as executeTransaction } from '../../_/nitro.mjs';
import { v as validatePdfFile } from '../../_/validatePdfFile.mjs';
import { s as saveGroupReportFile } from '../../_/groupFileStorage.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
import { a as groupCodeExists, b as checkStudentConflicts, g as getGroupById } from '../../_/groupRepository.mjs';
import { g as getCourseById } from '../../_/courseRepository.mjs';
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
import 'fs/promises';
import 'path';
import '../../_/activityLogRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0436\u0438\u0434\u0430\u044E\u0442\u0441\u044F \u0434\u0430\u043D\u043D\u044B\u0435 multipart/form-data"
    });
  }
  let groupData = {};
  const pdfFiles = [];
  for (const part of formData) {
    if (part.name === "data") {
      try {
        groupData = JSON.parse(part.data.toString("utf-8"));
      } catch (e) {
        throw createError({
          statusCode: 400,
          message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 JSON \u0432 \u043F\u043E\u043B\u0435 data"
        });
      }
    } else if (part.name === "reportFile") {
      if (part.data && part.filename) {
        pdfFiles.push({
          buffer: part.data,
          filename: part.filename
        });
      }
    }
  }
  if (pdfFiles.length === 0) {
    throw createError({
      statusCode: 400,
      message: "PDF-\u043E\u0442\u0447\u0435\u0442\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
  for (const file of pdfFiles) {
    const pdfValidation = await validatePdfFile(file.buffer, file.filename);
    if (!pdfValidation.valid) {
      throw createError({
        statusCode: 400,
        message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0444\u0430\u0439\u043B\u0430 "${file.filename}": ${pdfValidation.error}`
      });
    }
  }
  if (!groupData.code || !groupData.courseId || !groupData.startDate || !groupData.endDate) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F (code, courseId, startDate, endDate)"
    });
  }
  const startDate = new Date(groupData.startDate);
  const endDate = new Date(groupData.endDate);
  if (endDate < startDate) {
    throw createError({
      statusCode: 400,
      message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430"
    });
  }
  if (await groupCodeExists(groupData.code)) {
    throw createError({
      statusCode: 400,
      message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
    });
  }
  const course = await getCourseById(groupData.courseId, false);
  if (!course) {
    throw createError({
      statusCode: 400,
      message: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0443\u0447\u0435\u0431\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
    });
  }
  if (course.isArchived) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043B\u044C\u0437\u044F \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0430\u0440\u0445\u0438\u0432\u043D\u043E\u0439 \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B"
    });
  }
  if (groupData.studentIds && Array.isArray(groupData.studentIds) && groupData.studentIds.length > 0) {
    const conflicts = await checkStudentConflicts(
      groupData.studentIds,
      groupData.startDate,
      groupData.endDate
    );
    if (conflicts.length > 0) {
      throw createError({
        statusCode: 409,
        message: "\u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u044B \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u0434\u043B\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432",
        data: conflicts
      });
    }
  }
  try {
    const newGroupId = v4();
    let savedFileUrl = "";
    const result = await executeTransaction(
      async (connection) => {
        await connection.execute(
          `INSERT INTO study_groups (id, code, course_id, start_date, end_date, classroom, description, is_active, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW(3), NOW(3))`,
          [
            newGroupId,
            groupData.code,
            groupData.courseId,
            groupData.startDate,
            groupData.endDate,
            groupData.classroom || null,
            groupData.description || null,
            groupData.isActive !== false ? 1 : 0
          ]
        );
        if (groupData.studentIds && Array.isArray(groupData.studentIds)) {
          for (const studentId of groupData.studentIds) {
            await connection.execute(
              `INSERT INTO study_group_students (id, group_id, student_id)
             VALUES (?, ?, ?)`,
              [v4(), newGroupId, studentId]
            );
          }
        }
        const uploadedFiles = [];
        for (const file of pdfFiles) {
          const fileResult = await saveGroupReportFile({
            groupId: newGroupId,
            file: file.buffer,
            originalFilename: file.filename,
            userId: user.id
          });
          uploadedFiles.push(fileResult.fileUrl);
          await connection.execute(
            `INSERT INTO files (
             uuid, filename, stored_name, mime_type, size_bytes, extension, 
             storage_path, full_path, category, group_id, 
             uploaded_by, uploaded_by_user, uploaded_at_time, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
            [
              v4(),
              file.filename,
              fileResult.storedName,
              "application/pdf",
              file.buffer.length,
              "pdf",
              fileResult.filePath,
              fileResult.filePath,
              "group_report",
              newGroupId,
              user.id,
              user.id,
              /* @__PURE__ */ new Date()
            ]
          );
        }
        return { newGroupId, uploadedFiles };
      }
    );
    await logActivity(event, "CREATE", "GROUP", newGroupId, groupData.code, {
      courseId: groupData.courseId,
      studentsCount: groupData.studentIds?.length || 0,
      filesCount: pdfFiles.length
    });
    const createdGroup = await getGroupById(newGroupId);
    return {
      success: true,
      message: `\u0413\u0440\u0443\u043F\u043F\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u0441 ${pdfFiles.length} \u0444\u0430\u0439\u043B\u0430\u043C\u0438`,
      group: createdGroup,
      uploadedFiles: result.uploadedFiles
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B: " + (error.message || "Unknown error")
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post8.mjs.map
