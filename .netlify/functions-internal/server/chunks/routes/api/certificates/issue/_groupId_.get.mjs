import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { b as getTemplateById, e as getIssuedCertificatesByGroup, f as checkStudentEligibility } from '../../../../_/certificateTemplateRepository.mjs';
import { g as getGroupById } from '../../../../_/groupRepository.mjs';
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

const _groupId__get = defineEventHandler(async (event) => {
  try {
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
    let template = null;
    if (group.course?.certificateTemplateId) {
      template = await getTemplateById(group.course.certificateTemplateId);
    }
    const issuedCertificates = await getIssuedCertificatesByGroup(groupId);
    const certificatesByStudent = new Map(
      issuedCertificates.map((c) => [c.studentId, c])
    );
    const journalRows = [];
    if (group.students) {
      for (const gs of group.students) {
        const studentId = gs.studentId;
        const eligibility = await checkStudentEligibility(studentId, groupId);
        const certificate = certificatesByStudent.get(studentId) || null;
        journalRows.push({
          student: {
            id: studentId,
            fullName: gs.student?.fullName || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E",
            organization: gs.student?.organization || "",
            position: gs.student?.position || ""
          },
          disciplines: [],
          // TODO: Заполнить данными о дисциплинах
          totalAttendancePercent: eligibility.attendancePercent,
          totalAttendedHours: 0,
          // TODO
          totalHours: 0,
          // TODO
          averageGrade: eligibility.averageGrade,
          eligibility,
          certificate
        });
      }
    }
    journalRows.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "ru"));
    console.log(`[GET /api/certificates/issue/${groupId}] \u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u0436\u0443\u0440\u043D\u0430\u043B: ${journalRows.length} \u0437\u0430\u043F\u0438\u0441\u0435\u0439, \u0448\u0430\u0431\u043B\u043E\u043D: ${template?.name || "\u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D"}`);
    return {
      success: true,
      group: {
        id: group.id,
        code: group.code,
        course: group.course ? {
          ...group.course,
          certificateTemplateId: group.course.certificateTemplateId,
          certificateValidityMonths: group.course.certificateValidityMonths
        } : null,
        startDate: group.startDate,
        endDate: group.endDate
      },
      template,
      journal: journalRows,
      stats: {
        totalStudents: journalRows.length,
        eligible: journalRows.filter((r) => r.eligibility.isEligible).length,
        withWarnings: journalRows.filter((r) => !r.eligibility.isEligible && !r.eligibility.hasCertificate).length,
        issued: journalRows.filter((r) => r.certificate?.status === "issued").length,
        revoked: journalRows.filter((r) => r.certificate?.status === "revoked").length
      }
    };
  } catch (error) {
    console.error("[GET /api/certificates/issue/[groupId]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0436\u0443\u0440\u043D\u0430\u043B\u0430"
    });
  }
});

export { _groupId__get as default };
//# sourceMappingURL=_groupId_.get.mjs.map
