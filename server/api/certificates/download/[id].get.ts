/**
 * GET /api/certificates/download/[id]
 * Скачать сертификат (PDF или DOCX)
 */

import * as fs from "fs";
import * as path from "path";
import { getIssuedCertificateById } from "../../../repositories/certificateTemplateRepository";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const query = getQuery(event);
    const requestedFormat = (query.format as string) || "pdf";

    console.log(
      `[DOWNLOAD] Запрос скачивания сертификата ${id}, формат: ${requestedFormat}`
    );

    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID сертификата обязателен",
      });
    }

    const certificate = await getIssuedCertificateById(id);

    if (!certificate) {
      console.error(`[DOWNLOAD] Сертификат ${id} не найден в БД`);
      throw createError({
        statusCode: 404,
        message: "Сертификат не найден",
      });
    }

    console.log(
      `[DOWNLOAD] Сертификат найден: ${certificate.certificateNumber}`
    );
    console.log(`[DOWNLOAD] PDF URL: ${certificate.pdfFileUrl}`);
    console.log(`[DOWNLOAD] DOCX URL: ${certificate.docxFileUrl}`);

    // Определяем файл для скачивания
    let fileUrl: string | null = null;
    let contentType: string = "";
    let extension: string = "";
    let actualFormat: string = "";
    let filePath: string | null = null;

    const searchPaths = [
      // 1. Direct path from DB
      certificate.pdfFileUrl,
      // 2. Standard location (Certificate root)
      certificate.pdfFileUrl
        ? path.join(
            "/storage/Certificates",
            path.basename(certificate.pdfFileUrl)
          )
        : null,
      // 3. Nested generated paths (legacy/import locations)
      certificate.pdfFileUrl
        ? path.join(
            "/storage/Certificates/certificates/generated",
            path.basename(certificate.pdfFileUrl)
          )
        : null,
      certificate.pdfFileUrl
        ? path.join(
            "/storage/certificates/certificates/generated",
            path.basename(certificate.pdfFileUrl)
          )
        : null,
      // 4. Just filename in known folder
      certificate.certificateNumber
        ? path.join(
            "/storage/Certificates",
            `${certificate.certificateNumber.replace(
              /[\/\\:*?"<>|]/g,
              "_"
            )}.pdf`
          )
        : null,
    ];

    if (requestedFormat === "docx") {
      // DOCX logic (simplified for now, strictly follows DB or similar pattern if needed)
      if (
        certificate.docxFileUrl &&
        fs.existsSync(path.join(process.cwd(), certificate.docxFileUrl))
      ) {
        fileUrl = certificate.docxFileUrl;
        filePath = path.join(process.cwd(), fileUrl);
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        extension = "docx";
        actualFormat = "docx";
      }
    }

    // Attempt to find PDF if no DOCX selected or found
    if (!filePath) {
      for (const searchPath of searchPaths) {
        if (!searchPath) continue;

        // Remove leading slash for path.join if it exists to ensure relative to cwd works or is absolute?
        // path.join(process.cwd(), '/foo') -> D:\foo (absolute). We want relative to project root usually.
        // But our strings start with /storage.
        // let's strip leading / or use it as relative.
        const cleanPath =
          searchPath.startsWith("/") || searchPath.startsWith("\\")
            ? searchPath.slice(1)
            : searchPath;
        const attemptPath = path.join(process.cwd(), cleanPath);

        if (fs.existsSync(attemptPath)) {
          fileUrl = searchPath; // Keep the found path
          filePath = attemptPath;
          contentType = "application/pdf";
          extension = "pdf";
          actualFormat = "pdf";
          console.log(`[DOWNLOAD] Found PDF at: ${attemptPath}`);
          break;
        }
      }
    }

    // Fallback to DOCX if PDF not found and format wasn't strictly PDF
    if (!filePath && certificate.docxFileUrl) {
      const cleanDocx = certificate.docxFileUrl.startsWith("/")
        ? certificate.docxFileUrl.slice(1)
        : certificate.docxFileUrl;
      const attemptDocx = path.join(process.cwd(), cleanDocx);
      if (fs.existsSync(attemptDocx)) {
        console.log(`[DOWNLOAD] PDF not found, falling back to DOCX`);
        fileUrl = certificate.docxFileUrl;
        filePath = attemptDocx;
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        extension = "docx";
        actualFormat = "docx";
      }
    }

    if (!filePath) {
      console.error(
        `[DOWNLOAD] Файл сертификата ${id} не найден. Searched in:`,
        searchPaths
      );
      throw createError({
        statusCode: 404,
        message: "Файл сертификата не найден на сервере",
      });
    }

    // Читаем файл
    const fileBuffer = fs.readFileSync(filePath);

    // Формируем имя файла для скачивания
    const downloadFilename = `Сертификат_${certificate.certificateNumber.replace(
      /\//g,
      "_"
    )}.${extension}`;

    console.log(
      `[DOWNLOAD] Отдаём файл: ${downloadFilename} (${actualFormat}, ${fileBuffer.length} байт)`
    );

    // Устанавливаем заголовки
    setHeader(event, "Content-Type", contentType);
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(downloadFilename)}"`
    );
    setHeader(event, "Content-Length", fileBuffer.length);

    return fileBuffer;
  } catch (error: any) {
    console.error("[GET /api/certificates/download/[id]] Error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка скачивания сертификата",
    });
  }
});
