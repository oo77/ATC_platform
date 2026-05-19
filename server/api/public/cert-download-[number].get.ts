import * as fs from "fs";
import * as path from "path";
import { getCertificateByNumber } from "../../repositories/certificateTemplateRepository";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

/**
 * Рекурсивный поиск файла в директории
 */
function findFileRecursively(dir: string, fileName: string): string | null {
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const found = findFileRecursively(fullPath, fileName);
      if (found) return found;
    } else if (file.toLowerCase() === fileName.toLowerCase()) {
      return fullPath;
    }
  }

  return null;
}

export default defineEventHandler(async (event) => {
  const number = getRouterParam(event, "number");

  if (!number) {
    setResponseStatus(event, 400);
    return "Номер сертификата не указан";
  }

  const certificate = await getCertificateByNumber(number);

  if (!certificate) {
    setResponseStatus(event, 404);
    return "Сертификат не найден";
  }

  // Логика поиска файла (аналогично download/[id])
  const candidates: string[] = [];
  let fileName = "";
  let extension = "pdf";

  // 1. AI Scan / Import
  if (
    certificate.sourceType === "import" &&
    (certificate as any).importSource === "ai" &&
    certificate.originalFileUrl
  ) {
    candidates.push(certificate.originalFileUrl);
    const originalFileName = path.basename(certificate.originalFileUrl);
    fileName = originalFileName;
    const fileExt = path.extname(originalFileName).toLowerCase().slice(1);
    if (fileExt) extension = fileExt;

    candidates.push(path.join("storage", "uploads", "certificates", originalFileName));
    candidates.push(path.join("storage", "Certificates", originalFileName));
  } else {
    // 2. Обычный PDF
    if (certificate.pdfFileUrl) {
      fileName = path.basename(certificate.pdfFileUrl);
      candidates.push(certificate.pdfFileUrl);
    }

    if (!fileName && certificate.certificateNumber) {
      fileName = `${certificate.certificateNumber.replace(/[\/\\:*?"<>|]/g, "_")}.pdf`;
    }

    // Пути
    candidates.push(path.join("storage", "Certificates", fileName));
    const generatedName = `${certificate.certificateNumber.replace(/[\/\\:*?"<>|]/g, "_")}.pdf`;
    candidates.push(path.join("storage", "Certificates", generatedName));
    candidates.push(path.join("storage", "Certificates", "generated", fileName));
    candidates.push(path.join("storage", "Certificates", "generated", generatedName));
    candidates.push(path.join("storage", "certificates", fileName));
    candidates.push(path.join("storage", "certificates", "generated", fileName));
  }

  let filePath: string | null = null;

  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleanCandidate = candidate.startsWith("/") || candidate.startsWith("\\") ? candidate.slice(1) : candidate;
    const absPath = path.join(process.cwd(), cleanCandidate);
    if (fs.existsSync(absPath)) {
      filePath = absPath;
      break;
    }
  }

  // Рекурсивный поиск
  if (!filePath && fileName) {
    const searchRoot = path.join(STORAGE_ROOT, "Certificates");
    filePath = findFileRecursively(searchRoot, fileName);
    if (!filePath) {
      const uploadRoot = path.join(STORAGE_ROOT, "uploads", "certificates");
      filePath = findFileRecursively(uploadRoot, fileName);
    }
  }

  if (!filePath) {
    setResponseStatus(event, 404);
    return "Файл сертификата не найден на сервере.";
  }

  // MIME types
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
  };

  const ext = path.extname(filePath).toLowerCase().slice(1);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  // Отдаем файл с Content-Disposition: attachment для принудительного скачивания!
  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(event, "Content-Disposition", `attachment; filename="certificate_${number}.${ext}"`);
  
  return fs.readFileSync(filePath);
});
