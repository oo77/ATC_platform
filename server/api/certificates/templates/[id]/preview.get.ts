/**
 * GET /api/certificates/templates/[id]/preview
 * Получить предпросмотр шаблона с тестовыми данными
 *
 * Возвращает HTML для отображения preview шаблона
 */

import { getTemplateById } from "../../../../repositories/certificateTemplateRepository";
import {
  generateCertificateHtml,
  type VariableContext,
} from "../../../../utils/pdfGenerator";
import type { CertificateTemplateData } from "../../../../types/certificate";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID шаблона обязателен",
      });
    }

    const template = await getTemplateById(id);

    if (!template) {
      throw createError({
        statusCode: 404,
        message: "Шаблон не найден",
      });
    }

    // Проверяем наличие данных визуального редактора
    if (!template.templateData) {
      return {
        success: false,
        message: "Шаблон не настроен. Откройте визуальный редактор.",
        hasTemplate: false,
      };
    }

    const templateData = template.templateData as CertificateTemplateData;

    // Тестовые данные для preview
    const testContext: VariableContext = {
      student: {
        id: "test-student-id",
        fullName: "Иванов Иван Иванович",
        organization: 'ООО "Тестовая компания"',
        position: "Инженер-программист",
        department: "IT-отдел",
        pinfl: "12345678901234",
        averageScore: 86.5,
      },
      course: {
        id: "test-course-id",
        name: "Повышение квалификации в области информационных технологий",
        shortName: "ИТ-специалист",
        code: "IT-2024",
        totalHours: 72,
      },
      group: {
        id: "test-group-id",
        code: "ПК-2024-001",
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-15"),
        classroom: "Аудитория 301",
      },
      certificate: {
        number: "ATC24_IT_0001",
        issueDate: new Date(),
        verificationUrl: "https://atc.uz/verify/ATC24_IT_0001",
        theoryDate: "2024-12-02",
        practiceDate: "2024-12-10",
      },
    };

    // По одной странице за запрос: предпросмотр листает страницы шаблона (?page=0, 1, …)
    const allPages = templateData.pages?.length
      ? templateData.pages
      : [{ id: "page_0", background: templateData.background, elements: templateData.elements || [] }];
    const requestedPage = Number(getQuery(event).page) || 0;
    const pageIndex = Math.min(Math.max(requestedPage, 0), allPages.length - 1);
    const html = await generateCertificateHtml(
      { ...templateData, pages: [allPages[pageIndex]!] },
      testContext,
    );

    // Подсчет элементов
    let elementsCount = 0;
    if (templateData.pages && templateData.pages.length > 0) {
      elementsCount = templateData.pages.reduce((sum, p) => sum + (p.elements?.length || 0), 0);
    } else {
      elementsCount = templateData.elements?.length || 0;
    }

    return {
      success: true,
      hasTemplate: true,
      preview: {
        html,
        width: templateData.width,
        height: templateData.height,
        layout: templateData.layout,
        elementsCount,
        page: pageIndex,
        pageCount: allPages.length,
      },
      template: {
        id: template.id,
        name: template.name,
        layout: template.layout,
        lastNumber: template.lastNumber,
      },
    };
  } catch (error: any) {
    console.error(
      "[GET /api/certificates/templates/[id]/preview] Error:",
      error,
    );

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения предпросмотра",
    });
  }
});
