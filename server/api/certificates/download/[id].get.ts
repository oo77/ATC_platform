/**
 * GET /api/certificates/download/[id]
 * Скачать сертификат (PDF или DOCX)
 */

import * as fs from "fs";
import * as path from "path";
import { getIssuedCertificateById } from "../../../repositories/certificateTemplateRepository";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

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

    // Определяем имя файла
    let fileName = "";
    if (requestedFormat === "docx" && certificate.docxFileUrl) {
      fileName = path.basename(certificate.docxFileUrl);
    } else if (certificate.pdfFileUrl) {
      fileName = path.basename(certificate.pdfFileUrl);
    }

    // Если в URL нет имени файла, пробуем сгенерировать из номера
    if (!fileName && certificate.certificateNumber) {
      fileName = `${certificate.certificateNumber.replace(
        /[\/\\:*?"<>|]/g,
        "_"
      )}.${requestedFormat}`;
    }

    if (!fileName) {
      throw createError({
        statusCode: 404,
        message: "Не удалось определить имя файла сертификата",
      });
    }

    // Стратегии поиска файла
    const candidates: string[] = [];

    // 1. Прямой путь из БД (если есть)
    if (requestedFormat === "docx" && certificate.docxFileUrl)
      candidates.push(certificate.docxFileUrl);
    else if (certificate.pdfFileUrl) candidates.push(certificate.pdfFileUrl);

    // 2. В папке storage/Certificates
    candidates.push(path.join("storage", "Certificates", fileName));

    // 3. В папке storage/Certificates (сгенерированное имя из номера)
    const generatedName = `${certificate.certificateNumber.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    )}.${requestedFormat}`;
    candidates.push(path.join("storage", "Certificates", generatedName));

    // 4. В папке storage/Certificates/generated (legacy)
    candidates.push(
      path.join("storage", "Certificates", "generated", fileName)
    );
    candidates.push(
      path.join("storage", "Certificates", "generated", generatedName)
    );

    // 5. То же самое но с lowercase 'certificates' (на всякий случай)
    candidates.push(path.join("storage", "certificates", fileName));
    candidates.push(
      path.join("storage", "certificates", "generated", fileName)
    );

    let filePath: string | null = null;
    let extension = requestedFormat;

    for (const candidate of candidates) {
      if (!candidate) continue;

      // Убираем leading slash для path.join
      const cleanCandidate =
        candidate.startsWith("/") || candidate.startsWith("\\")
          ? candidate.slice(1)
          : candidate;
      const absPath = path.join(process.cwd(), cleanCandidate);

      if (fs.existsSync(absPath)) {
        filePath = absPath;
        break;
      }
    }

    // Если не нашли, попробуем поискать рекурсивно в storage/Certificates
    if (!filePath) {
      console.log(
        `[DOWNLOAD] Файл не найден по стандартным путям. Ищем рекурсивно в storage/Certificates...`
      );
      const searchRoot = path.join(STORAGE_ROOT, "Certificates");
      const found =
        findFileRecursively(searchRoot, fileName) ||
        findFileRecursively(searchRoot, generatedName);
      if (found) {
        filePath = found;
      }
    }

    if (!filePath) {
      console.error(
        `[DOWNLOAD] Файл сертификата ${id} не найден. Имя файла: ${fileName}`
      );
      throw createError({
        statusCode: 404,
        message: "Файл сертификата не найден на сервере",
      });
    }

    console.log(`[DOWNLOAD] Отдаём файл: ${filePath}`);

    // Читаем файл
    const fileBuffer = fs.readFileSync(filePath);

    // MIME type
    const contentType =
      extension === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";

    // Имя для скачивания (безопасное)
    const downloadFilename = `Certificate_${certificate.certificateNumber.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    )}.${extension}`;

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

function findFileRecursively(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        if (entry.name.toLowerCase() === filename.toLowerCase()) {
          return path.join(dir, entry.name);
        }
      } else if (entry.isDirectory()) {
        const found = findFileRecursively(path.join(dir, entry.name), filename);
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn(`Error scanning dir ${dir}:`, e);
  }
  return null;
}
