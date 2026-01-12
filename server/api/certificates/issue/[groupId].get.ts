/**
 * GET /api/certificates/issue/[groupId]
 * Получить журнал выдачи сертификатов для группы
 */

import { 
  getIssuedCertificatesByGroup,
  checkStudentEligibility,
  getTemplateById,
} from '../../../repositories/certificateTemplateRepository';
import { getGroupById } from '../../../repositories/groupRepository';
import type { CertificateJournalRow } from '../../../types/certificate';

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'groupId');

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: 'ID группы обязателен',
      });
    }

    // Получаем группу с курсом и слушателями
    const group = await getGroupById(groupId);

    if (!group) {
      throw createError({
        statusCode: 404,
        message: 'Группа не найдена',
      });
    }

    // Получаем шаблон сертификата из курса
    let template = null;
    if (group.course?.certificateTemplateId) {
      template = await getTemplateById(group.course.certificateTemplateId);
    }

    // Получаем выданные сертификаты
    const issuedCertificates = await getIssuedCertificatesByGroup(groupId);
    const certificatesByStudent = new Map(
      issuedCertificates.map((c: any) => [c.studentId, c])
    );

    // Получаем информацию о допуске для каждого студента
    const journalRows: CertificateJournalRow[] = [];

    if (group.students) {
      for (const gs of group.students) {
        const studentId = gs.studentId;
        
        // Проверяем допуск
        const eligibility = await checkStudentEligibility(studentId, groupId);
        
        // Получаем существующий сертификат
        const certificate = certificatesByStudent.get(studentId) || null;

        journalRows.push({
          student: {
            id: studentId,
            fullName: gs.student?.fullName || 'Неизвестно',
            organization: gs.student?.organization || '',
            position: gs.student?.position || '',
          },
          disciplines: [], // TODO: Заполнить данными о дисциплинах
          totalAttendancePercent: eligibility.attendancePercent,
          totalAttendedHours: 0, // TODO
          totalHours: 0, // TODO
          averageGrade: eligibility.averageGrade,
          eligibility,
          certificate,
        });
      }
    }

    // Сортируем по ФИО
    journalRows.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, 'ru'));

    console.log(`[GET /api/certificates/issue/${groupId}] Загружен журнал: ${journalRows.length} записей, шаблон: ${template?.name || 'не назначен'}`);

    return {
      success: true,
      group: {
        id: group.id,
        code: group.code,
        course: group.course ? {
          ...group.course,
          certificateTemplateId: group.course.certificateTemplateId,
          certificateValidityMonths: group.course.certificateValidityMonths,
        } : null,
        startDate: group.startDate,
        endDate: group.endDate,
      },
      template,
      journal: journalRows,
      stats: {
        totalStudents: journalRows.length,
        eligible: journalRows.filter(r => r.eligibility.isEligible).length,
        withWarnings: journalRows.filter(r => !r.eligibility.isEligible && !r.eligibility.hasCertificate).length,
        issued: journalRows.filter(r => r.certificate?.status === 'issued').length,
        revoked: journalRows.filter(r => r.certificate?.status === 'revoked').length,
      },
    };
  } catch (error: any) {
    console.error('[GET /api/certificates/issue/[groupId]] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка загрузки журнала',
    });
  }
});
