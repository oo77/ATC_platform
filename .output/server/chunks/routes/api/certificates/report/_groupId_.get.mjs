import { g as defineEventHandler, h as createError, j as getRouterParam, f as executeQuery } from '../../../../_/nitro.mjs';
import { e as getIssuedCertificatesByGroup, f as checkStudentEligibility } from '../../../../_/certificateTemplateRepository.mjs';
import { g as getGroupById } from '../../../../_/groupRepository.mjs';
import { g as getUserById } from '../../../../_/userRepository.mjs';
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

const _groupId__get = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D. \u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0442\u043E\u0440\u0430 \u0438\u043B\u0438 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430."
      });
    }
    const groupId = getRouterParam(event, "groupId");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const group = await getGroupById(groupId);
    if (!group) {
      throw createError({
        statusCode: 404,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const instructorRows = await executeQuery(
      `SELECT DISTINCT i.full_name
       FROM schedule_events se
       JOIN instructors i ON se.instructor_id = i.id
       WHERE se.group_id = ?
       ORDER BY i.full_name`,
      [groupId]
    );
    const instructors = instructorRows.map((row) => row.full_name);
    const issuedCertificates = await getIssuedCertificatesByGroup(groupId);
    const certificatesByStudent = new Map(
      issuedCertificates.map((c) => [c.studentId, c])
    );
    const students = [];
    if (group.students) {
      for (const gs of group.students) {
        const studentId = gs.studentId;
        const eligibility = await checkStudentEligibility(studentId, groupId);
        const certificate = certificatesByStudent.get(studentId) || null;
        students.push({
          fullName: gs.student?.fullName || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E",
          organization: gs.student?.organization || "",
          totalAttendancePercent: eligibility.attendancePercent,
          averageGrade: eligibility.averageGrade,
          eligibility: {
            isEligible: eligibility.isEligible,
            completedDisciplines: eligibility.completedDisciplines,
            totalDisciplines: eligibility.totalDisciplines
          },
          certificate: certificate ? {
            status: certificate.status,
            issueDate: certificate.issueDate,
            certificateNumber: certificate.certificateNumber
          } : null
        });
      }
    }
    students.sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
    const fullUser = await getUserById(user.id);
    const generatedByName = fullUser?.name || user.email;
    console.log(
      `[GET /api/certificates/report/${groupId}] \u0414\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u0432\u0435\u0434\u043E\u043C\u043E\u0441\u0442\u0438: ${students.length} \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432, ${instructors.length} \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432, \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C: ${generatedByName}`
    );
    return {
      success: true,
      groupCode: group.code,
      courseName: group.course?.name || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E",
      instructors,
      students,
      startDate: group.startDate,
      endDate: group.endDate,
      generatedBy: generatedByName
    };
  } catch (error) {
    console.error("[GET /api/certificates/report/[groupId]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0432\u0435\u0434\u043E\u043C\u043E\u0441\u0442\u0438"
    });
  }
});

export { _groupId__get as default };
//# sourceMappingURL=_groupId_.get.mjs.map
