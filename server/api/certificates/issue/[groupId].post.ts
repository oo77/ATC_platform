/**
 * POST /api/certificates/issue/[groupId]
 * Выдать сертификат(ы) слушателям группы
 * 
 * Использует визуальный редактор шаблонов и Puppeteer для генерации PDF
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import {
  getTemplateById,
  checkStudentEligibility,
  generateCertificateNumber,
  createIssuedCertificate,
  reissueCertificate,
  updateCertificateFiles,
  getStudentCertificateInGroup,
} from '../../../repositories/certificateTemplateRepository';
import { getGroupById } from '../../../repositories/groupRepository';
import { getStudentById } from '../../../repositories/studentRepository';
import {
  generateCertificatePdf,
  type VariableContext,
} from '../../../utils/pdfGenerator';
import { logActivity } from '../../../utils/activityLogger';
import type { IssueWarning, CertificateTemplateData } from '../../../types/certificate';

const issueSchema = z.object({
  templateId: z.string().uuid('Некорректный ID шаблона'),
  studentIds: z.array(z.string().uuid()).min(1, 'Выберите хотя бы одного студента'),
  issueDate: z.string().optional(),
  expiryMode: z.enum(['auto', 'custom', 'none']).optional().default('auto'),
  expiryDate: z.string().nullable().optional(), // Конкретная дата истечения (при expiryMode = 'custom')
  overrideWarnings: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

// Директория для генерируемых файлов
const GENERATED_DIR = path.join(process.cwd(), 'storage', 'certificates', 'generated');

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'groupId');

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: 'ID группы обязателен',
      });
    }

    const body = await readBody(event);
    const validated = issueSchema.parse(body);

    // Получаем группу
    const group = await getGroupById(groupId);
    if (!group) {
      throw createError({
        statusCode: 404,
        message: 'Группа не найдена',
      });
    }

    // Получаем шаблон
    const template = await getTemplateById(validated.templateId);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    // Проверяем наличие данных визуального редактора
    if (!template.templateData) {
      throw createError({
        statusCode: 400,
        message: 'Шаблон не настроен. Откройте визуальный редактор и создайте дизайн сертификата.',
      });
    }

    const templateData = template.templateData as CertificateTemplateData;

    if (!templateData.elements || templateData.elements.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Шаблон пустой. Добавьте элементы в визуальном редакторе.',
      });
    }

    // Создаём директорию для генерируемых файлов
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    const issueDate = validated.issueDate ? new Date(validated.issueDate) : new Date();
    const results: {
      studentId: string;
      studentName: string;
      success: boolean;
      certificateId?: string;
      certificateNumber?: string;
      pdfUrl?: string;
      warnings?: IssueWarning[];
      error?: string;
    }[] = [];

    // Получаем ID текущего пользователя
    const userId = event.context.user?.id;

    for (const studentId of validated.studentIds) {
      try {
        // Проверяем, нет ли уже сертификата
        const existing = await getStudentCertificateInGroup(studentId, groupId);
        if (existing) {
          // Если сертификат уже выдан - пропускаем
          if (existing.status === 'issued') {
            results.push({
              studentId,
              studentName: existing.student?.fullName || studentId,
              success: false,
              error: 'Сертификат уже выдан',
            });
            continue;
          }
          
          // Если сертификат отозван или в черновике - будем переиздавать (обновлять)
          // Для этого используем флаг, который обработаем ниже
        }

        // Получаем студента
        const student = await getStudentById(studentId);
        if (!student) {
          results.push({
            studentId,
            studentName: studentId,
            success: false,
            error: 'Студент не найден',
          });
          continue;
        }

        // Проверяем допуск
        const eligibility = await checkStudentEligibility(studentId, groupId);
        
        // Если есть предупреждения и не указан overrideWarnings
        if (!eligibility.isEligible && !validated.overrideWarnings) {
          results.push({
            studentId,
            studentName: student.fullName,
            success: false,
            warnings: eligibility.warnings,
            error: 'Требуется подтверждение выдачи',
          });
          continue;
        }

        // Генерируем номер сертификата
        const courseCode = group.course?.code || 'UNKNOWN';
        const certificateNumber = await generateCertificateNumber(
          template.id,
          courseCode
        );

        // Подготавливаем контекст для генерации PDF
        const context: VariableContext = {
          student: {
            id: student.id,
            fullName: student.fullName,
            organization: student.organization,
            position: student.position,
            department: null,
            pinfl: student.pinfl,
          },
          course: {
            id: group.course?.id || '',
            name: group.course?.name || '',
            shortName: group.course?.shortName || '',
            code: group.course?.code || '',
            totalHours: group.course?.totalHours || 0,
          },
          group: {
            id: group.id,
            code: group.code,
            startDate: group.startDate,
            endDate: group.endDate,
            classroom: group.classroom,
          },
          certificate: {
            number: certificateNumber,
            issueDate,
            verificationUrl: `${process.env.APP_URL || 'https://atc.uz'}/verify/${certificateNumber}`,
          },
        };

        // Генерируем PDF
        const pdfFilename = `${certificateNumber.replace(/[\/\\:*?"<>|]/g, '_')}.pdf`;
        const pdfPath = path.join(GENERATED_DIR, pdfFilename);

        await generateCertificatePdf({
          templateData,
          context,
          outputPath: pdfPath,
        });

        const pdfUrl = `/storage/certificates/generated/${pdfFilename}`;

        // Вычисляем срок действия сертификата
        let expiryDate: Date | null = null;
        
        switch (validated.expiryMode) {
          case 'custom':
            // Пользователь указал конкретную дату
            if (validated.expiryDate) {
              expiryDate = new Date(validated.expiryDate);
            }
            break;
          case 'none':
            // Бессрочный сертификат
            expiryDate = null;
            break;
          case 'auto':
          default:
            // Автоматический расчёт из настроек курса
            if (group.course?.certificateValidityMonths) {
              expiryDate = new Date(issueDate);
              expiryDate.setMonth(expiryDate.getMonth() + group.course.certificateValidityMonths);
            }
            break;
        }

        // Создаём или переиздаём сертификат
        let certificate;
        const certData = {
          templateId: template.id,
          certificateNumber,
          issueDate,
          expiryDate,
          variablesData: {
            studentName: student.fullName,
            courseName: group.course?.name || '',
            certificateNumber,
          },
          warnings: eligibility.warnings.length > 0 ? eligibility.warnings : undefined,
          overrideWarnings: validated.overrideWarnings,
          issuedBy: userId,
          notes: validated.notes,
        };

        if (existing && (existing.status === 'draft' || existing.status === 'revoked')) {
          // Переиздаём существующий сертификат
          console.log(`[Certificates] Reissuing certificate for student ${studentId}, existing status: ${existing.status}`);
          certificate = await reissueCertificate(existing.id, certData);
        } else {
          // Создаём новый сертификат
          certificate = await createIssuedCertificate({
            groupId,
            studentId,
            ...certData,
          });
        }

        // Обновляем файлы (для нового подхода только PDF)
        await updateCertificateFiles(certificate.id, pdfUrl, pdfUrl);

        // Логируем
        const logAction = existing ? 'UPDATE' : 'CREATE';
        await logActivity(
          event,
          logAction,
          'ISSUED_CERTIFICATE',
          certificate.id,
          `${certificateNumber} — ${student.fullName}`,
          {
            groupId,
            studentId,
            certificateNumber,
            hasWarnings: eligibility.warnings.length > 0,
            overrideWarnings: validated.overrideWarnings,
            reissued: !!existing,
          }
        );

        results.push({
          studentId,
          studentName: student.fullName,
          success: true,
          certificateId: certificate.id,
          certificateNumber,
          pdfUrl,
          warnings: eligibility.warnings.length > 0 ? eligibility.warnings : undefined,
        });

      } catch (studentError: any) {
        console.error(`Error issuing certificate for student ${studentId}:`, studentError);
        results.push({
          studentId,
          studentName: studentId,
          success: false,
          error: studentError.message || 'Ошибка выдачи сертификата',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[POST /api/certificates/issue/${groupId}] Выдано: ${successCount}, ошибок: ${failCount}`);

    return {
      success: true,
      message: `Выдано ${successCount} сертификатов`,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    };
  } catch (error: any) {
    console.error('[POST /api/certificates/issue/[groupId]] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка выдачи сертификатов',
    });
  }
});
