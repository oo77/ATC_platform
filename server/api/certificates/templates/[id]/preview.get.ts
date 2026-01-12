/**
 * GET /api/certificates/templates/[id]/preview
 * Получить предпросмотр шаблона с тестовыми данными
 * 
 * Возвращает HTML для отображения preview шаблона
 */

import { getTemplateById } from '../../../../repositories/certificateTemplateRepository';
import {
  generateCertificateHtml,
  type VariableContext,
} from '../../../../utils/pdfGenerator';
import type { CertificateTemplateData } from '../../../../types/certificate';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID шаблона обязателен',
      });
    }

    const template = await getTemplateById(id);

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    // Проверяем наличие данных визуального редактора
    if (!template.templateData) {
      return {
        success: false,
        message: 'Шаблон не настроен. Откройте визуальный редактор.',
        hasTemplate: false,
      };
    }

    const templateData = template.templateData as CertificateTemplateData;

    // Тестовые данные для preview
    const testContext: VariableContext = {
      student: {
        id: 'test-student-id',
        fullName: 'Иванов Иван Иванович',
        organization: 'ООО "Тестовая компания"',
        position: 'Инженер-программист',
        department: 'IT-отдел',
        pinfl: '12345678901234',
      },
      course: {
        id: 'test-course-id',
        name: 'Повышение квалификации в области информационных технологий',
        shortName: 'ИТ-специалист',
        code: 'IT-2024',
        totalHours: 72,
      },
      group: {
        id: 'test-group-id',
        code: 'ПК-2024-001',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-15'),
        classroom: 'Аудитория 301',
      },
      certificate: {
        number: 'ATC24_IT_0001',
        issueDate: new Date(),
        verificationUrl: 'https://atc.uz/verify/ATC24_IT_0001',
      },
    };

    // Генерируем HTML
    const html = await generateCertificateHtml(templateData, testContext);

    return {
      success: true,
      hasTemplate: true,
      preview: {
        html,
        width: templateData.width,
        height: templateData.height,
        layout: templateData.layout,
        elementsCount: templateData.elements.length,
      },
      template: {
        id: template.id,
        name: template.name,
        layout: template.layout,
        lastNumber: template.lastNumber,
      },
    };
  } catch (error: any) {
    console.error('[GET /api/certificates/templates/[id]/preview] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка получения предпросмотра',
    });
  }
});
