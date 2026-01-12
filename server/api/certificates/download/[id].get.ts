/**
 * GET /api/certificates/download/[id]
 * Скачать сертификат (PDF или DOCX)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getIssuedCertificateById } from '../../../repositories/certificateTemplateRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    const query = getQuery(event);
    const requestedFormat = (query.format as string) || 'pdf';

    console.log(`[DOWNLOAD] Запрос скачивания сертификата ${id}, формат: ${requestedFormat}`);

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID сертификата обязателен',
      });
    }

    const certificate = await getIssuedCertificateById(id);

    if (!certificate) {
      console.error(`[DOWNLOAD] Сертификат ${id} не найден в БД`);
      throw createError({
        statusCode: 404,
        message: 'Сертификат не найден',
      });
    }

    console.log(`[DOWNLOAD] Сертификат найден: ${certificate.certificateNumber}`);
    console.log(`[DOWNLOAD] PDF URL: ${certificate.pdfFileUrl}`);
    console.log(`[DOWNLOAD] DOCX URL: ${certificate.docxFileUrl}`);

    // Определяем файл для скачивания
    let fileUrl: string | null = null;
    let contentType: string;
    let extension: string;
    let actualFormat: string;

    if (requestedFormat === 'docx') {
      // Явно запросили DOCX
      fileUrl = certificate.docxFileUrl;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
      actualFormat = 'docx';
    } else {
      // Попробуем PDF, с fallback на DOCX
      if (certificate.pdfFileUrl) {
        const pdfPath = path.join(process.cwd(), certificate.pdfFileUrl);
        if (fs.existsSync(pdfPath)) {
          fileUrl = certificate.pdfFileUrl;
          contentType = 'application/pdf';
          extension = 'pdf';
          actualFormat = 'pdf';
        }
      }

      // Если PDF не найден, используем DOCX
      if (!fileUrl && certificate.docxFileUrl) {
        console.log(`[DOWNLOAD] PDF не найден, используем DOCX`);
        fileUrl = certificate.docxFileUrl;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
        actualFormat = 'docx';
      }
    }

    if (!fileUrl) {
      console.error(`[DOWNLOAD] Файл сертификата ${id} не найден (нет ни PDF, ни DOCX)`);
      throw createError({
        statusCode: 404,
        message: 'Файл сертификата не найден',
      });
    }

    const filePath = path.join(process.cwd(), fileUrl);
    console.log(`[DOWNLOAD] Путь к файлу: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`[DOWNLOAD] Файл не существует на диске: ${filePath}`);
      throw createError({
        statusCode: 404,
        message: 'Файл сертификата не найден на диске',
      });
    }

    // Читаем файл
    const fileBuffer = fs.readFileSync(filePath);

    // Формируем имя файла для скачивания
    const downloadFilename = `Сертификат_${certificate.certificateNumber.replace(/\//g, '_')}.${extension}`;

    console.log(`[DOWNLOAD] Отдаём файл: ${downloadFilename} (${actualFormat}, ${fileBuffer.length} байт)`);

    // Устанавливаем заголовки
    setHeader(event, 'Content-Type', contentType);
    setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFilename)}"`);
    setHeader(event, 'Content-Length', fileBuffer.length);

    return fileBuffer;
  } catch (error: any) {
    console.error('[GET /api/certificates/download/[id]] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка скачивания сертификата',
    });
  }
});
