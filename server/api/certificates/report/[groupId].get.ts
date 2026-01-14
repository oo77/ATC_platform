/**
 * GET /api/certificates/report/[groupId]
 * Получить данные для формирования ведомости выдачи сертификатов
 * Доступ: только для модераторов и администраторов
 */

import {
  getIssuedCertificatesByGroup,
  checkStudentEligibility,
} from "../../../repositories/certificateTemplateRepository";
import { getGroupById } from "../../../repositories/groupRepository";
import { getUserById } from "../../../repositories/userRepository";
import { executeQuery } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем права доступа - только модератор или админ
    const user = event.context.user;

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Необходима авторизация",
      });
    }

    // MANAGER - это модератор в системе
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        message:
          "Доступ запрещен. Требуются права модератора или администратора.",
      });
    }

    const groupId = getRouterParam(event, "groupId");

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: "ID группы обязателен",
      });
    }

    // Получаем группу с курсом и слушателями
    const group = await getGroupById(groupId);

    if (!group) {
      throw createError({
        statusCode: 404,
        message: "Группа не найдена",
      });
    }

    // Получаем всех уникальных инструкторов группы
    const instructorRows = await executeQuery<{ full_name: string }[]>(
      `SELECT DISTINCT i.full_name
       FROM schedule_events se
       JOIN instructors i ON se.instructor_id = i.id
       WHERE se.group_id = ?
       ORDER BY i.full_name`,
      [groupId]
    );

    const instructors = instructorRows.map((row) => row.full_name);

    // Получаем выданные сертификаты
    const issuedCertificates = await getIssuedCertificatesByGroup(groupId);
    const certificatesByStudent = new Map(
      issuedCertificates.map((c: any) => [c.studentId, c])
    );

    // Получаем информацию о допуске для каждого студента
    const students = [];

    if (group.students) {
      for (const gs of group.students) {
        const studentId = gs.studentId;

        // Проверяем допуск
        const eligibility = await checkStudentEligibility(studentId, groupId);

        // Получаем существующий сертификат
        const certificate = certificatesByStudent.get(studentId) || null;

        students.push({
          fullName: gs.student?.fullName || "Неизвестно",
          organization: gs.student?.organization || "",
          totalAttendancePercent: eligibility.attendancePercent,
          averageGrade: eligibility.averageGrade,
          eligibility: {
            isEligible: eligibility.isEligible,
            completedDisciplines: eligibility.completedDisciplines,
            totalDisciplines: eligibility.totalDisciplines,
          },
          certificate: certificate
            ? {
                status: certificate.status,
                issueDate: certificate.issueDate,
                certificateNumber: certificate.certificateNumber,
              }
            : null,
        });
      }
    }

    // Сортируем по ФИО
    students.sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));

    // Получаем полные данные пользователя для имени
    const fullUser = await getUserById(user.id);
    const generatedByName = fullUser?.name || user.email;

    console.log(
      `[GET /api/certificates/report/${groupId}] Данные для ведомости: ${students.length} студентов, ${instructors.length} инструкторов, пользователь: ${generatedByName}`
    );

    return {
      success: true,
      groupCode: group.code,
      courseName: group.course?.name || "Не указано",
      instructors,
      students,
      startDate: group.startDate,
      endDate: group.endDate,
      generatedBy: generatedByName,
    };
  } catch (error: any) {
    console.error("[GET /api/certificates/report/[groupId]] Error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка загрузки данных для ведомости",
    });
  }
});
