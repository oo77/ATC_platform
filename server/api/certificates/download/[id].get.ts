/**
 * GET /api/certificates/download/[id]
 * Скачать сертификат (PDF, DOCX или оригинальный файл)
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
      `[DOWNLOAD] Запрос скачивания сертификата ${id}, формат: ${requestedFormat}`,
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
      `[DOWNLOAD] Сертификат найден: ${certificate.certificateNumber}, источник: ${certificate.sourceType || "unknown"}`,
    );

    // Стратегии поиска файла
    const candidates: string[] = [];
    let fileName = "";
    let extension = requestedFormat;

    // Для сертификатов, импортированных через AI, используем original_file_url
    if (certificate.sourceType === "ai_scan" && certificate.originalFileUrl) {
      console.log(
        `[DOWNLOAD] AI-сертификат, используем original_file_url: ${certificate.originalFileUrl}`,
      );

      // Добавляем прямой путь из БД
      candidates.push(certificate.originalFileUrl);

      // Извлекаем имя файла из пути
      const originalFileName = path.basename(certificate.originalFileUrl);
      fileName = originalFileName;

      // Определяем расширение из оригинального файла
      const fileExt = path.extname(originalFileName).toLowerCase().slice(1);
      if (fileExt) {
        extension = fileExt;
      }

      // Добавляем альтернативные пути
      candidates.push(
        path.join("storage", "uploads", "certificates", originalFileName),
      );
      candidates.push(path.join("storage", "Certificates", originalFileName));
    } else {
      // Для обычных сертификатов используем стандартную логику
      if (requestedFormat === "docx" && certificate.docxFileUrl) {
        fileName = path.basename(certificate.docxFileUrl);
        candidates.push(certificate.docxFileUrl);
      } else if (certificate.pdfFileUrl) {
        fileName = path.basename(certificate.pdfFileUrl);
        candidates.push(certificate.pdfFileUrl);
      }

      // Если в URL нет имени файла, пробуем сгенерировать из номера
      if (!fileName && certificate.certificateNumber) {
        fileName = `${certificate.certificateNumber.replace(
          /[\/\\:*?"<>|]/g,
          "_",
        )}.${requestedFormat}`;
      }

      // Добавляем стандартные пути поиска
      candidates.push(path.join("storage", "Certificates", fileName));

      // Сгенерированное имя из номера
      const generatedName = `${certificate.certificateNumber.replace(
        /[\/\\:*?"<>|]/g,
        "_",
      )}.${requestedFormat}`;
      candidates.push(path.join("storage", "Certificates", generatedName));

      // Legacy пути
      candidates.push(
        path.join("storage", "Certificates", "generated", fileName),
      );
      candidates.push(
        path.join("storage", "Certificates", "generated", generatedName),
      );

      // Lowercase варианты
      candidates.push(path.join("storage", "certificates", fileName));
      candidates.push(
        path.join("storage", "certificates", "generated", fileName),
      );
    }

    if (!fileName) {
      throw createError({
        statusCode: 404,
        message: "Не удалось определить имя файла сертификата",
      });
    }

    let filePath: string | null = null;

    // Ищем файл по всем кандидатам
    for (const candidate of candidates) {
      if (!candidate) continue;

      // Убираем leading slash для path.join
      const cleanCandidate =
        candidate.startsWith("/") || candidate.startsWith("\\")
          ? candidate.slice(1)
          : candidate;
      const absPath = path.join(process.cwd(), cleanCandidate);

      console.log(`[DOWNLOAD] Проверяем путь: ${absPath}`);

      if (fs.existsSync(absPath)) {
        filePath = absPath;
        console.log(`[DOWNLOAD] Файл найден: ${absPath}`);
        break;
      }
    }

    // Если не нашли, попробуем поискать рекурсивно в storage
    if (!filePath) {
      console.log(
        `[DOWNLOAD] Файл не найден по стандартным путям. Ищем рекурсивно...`,
      );

      // Для AI-сертификатов ищем в uploads/certificates
      if (certificate.sourceType === "ai_scan") {
        const uploadRoot = path.join(STORAGE_ROOT, "uploads", "certificates");
        const found = findFileRecursively(uploadRoot, fileName);
        if (found) {
          filePath = found;
        }
      }

      // Если не нашли, ищем в Certificates
      if (!filePath) {
        const searchRoot = path.join(STORAGE_ROOT, "Certificates");
        const found = findFileRecursively(searchRoot, fileName);
        if (found) {
          filePath = found;
        }
      }
    }

    if (!filePath) {
      console.error(
        `[DOWNLOAD] Файл сертификата ${id} не найден. Имя файла: ${fileName}, кандидаты: ${candidates.join(", ")}`,
      );
      throw createError({
        statusCode: 404,
        message: "Файл сертификата не найден на сервере",
      });
    }

    console.log(`[DOWNLOAD] Отдаём файл: ${filePath}`);

    // Читаем файл
    const fileBuffer = fs.readFileSync(filePath);

    // Определяем MIME type по расширению
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    const contentType = mimeTypes[extension] || "application/octet-stream";

    // Имя для скачивания (безопасное)
    const downloadFilename = `Certificate_${certificate.certificateNumber.replace(
      /[\/\\:*?"<>|]/g,
      "_",
    )}.${extension}`;

    // Устанавливаем заголовки
    setHeader(event, "Content-Type", contentType);
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
    );
    setHeader(event, "Content-Length", fileBuffer.length);

    // Логируем успешное скачивание
    console.log(
      `[DOWNLOAD] Успешно отдан файл ${downloadFilename}, размер: ${fileBuffer.length} байт`,
    );

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
