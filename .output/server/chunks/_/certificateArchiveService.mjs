import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), "storage");
function findCertificateFile(certificate, format = "pdf") {
  let fileName = "";
  if (format === "docx" && certificate.docxFileUrl) {
    fileName = path.basename(certificate.docxFileUrl);
  } else if (certificate.pdfFileUrl) {
    fileName = path.basename(certificate.pdfFileUrl);
  }
  if (!fileName && certificate.certificateNumber) {
    fileName = `${certificate.certificateNumber.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    )}.${format}`;
  }
  if (!fileName) return null;
  const candidates = [];
  if (format === "docx" && certificate.docxFileUrl)
    candidates.push(certificate.docxFileUrl);
  else if (certificate.pdfFileUrl) candidates.push(certificate.pdfFileUrl);
  candidates.push(path.join("storage", "Certificates", fileName));
  const generatedName = `${certificate.certificateNumber.replace(
    /[\/\\:*?"<>|]/g,
    "_"
  )}.${format}`;
  candidates.push(path.join("storage", "Certificates", generatedName));
  candidates.push(path.join("storage", "Certificates", "generated", fileName));
  candidates.push(
    path.join("storage", "Certificates", "generated", generatedName)
  );
  candidates.push(path.join("storage", "certificates", fileName));
  candidates.push(path.join("storage", "certificates", "generated", fileName));
  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleanCandidate = candidate.startsWith("/") || candidate.startsWith("\\") ? candidate.slice(1) : candidate;
    const absPath = path.join(process.cwd(), cleanCandidate);
    if (fs.existsSync(absPath)) {
      return absPath;
    }
  }
  const searchRoot = path.join(STORAGE_ROOT, "Certificates");
  return findFileRecursively(searchRoot, fileName) || findFileRecursively(searchRoot, generatedName);
}
function findFileRecursively(dir, filename) {
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
  }
  return null;
}

async function createCertificatesArchive(certificates) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  let filesAdded = 0;
  for (const cert of certificates) {
    const pdfUrl = cert.pdf_file_url || cert.pdfFileUrl;
    const docxUrl = cert.docx_file_url || cert.docxFileUrl;
    const certNum = cert.certificate_number || cert.certificateNumber;
    const filePath = findCertificateFile({
      pdfFileUrl: pdfUrl,
      docxFileUrl: docxUrl,
      certificateNumber: certNum
    });
    if (filePath) {
      const courseName = (cert.course_name || cert.courseName || "Course").replace(/[\/\\:*?"<>|]/g, "_").trim();
      const studentName = (cert.student_name || cert.studentName || "Student").replace(/[\/\\:*?"<>|]/g, "_").trim();
      const safeCertNum = (certNum || "").replace(/[\/\\:*?"<>|]/g, "_").trim();
      const fileName = `${courseName}/${studentName}_${safeCertNum}.pdf`;
      archive.file(filePath, { name: fileName });
      filesAdded++;
    }
  }
  if (filesAdded === 0) {
    throw new Error("\u0424\u0430\u0439\u043B\u044B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B");
  }
  archive.finalize();
  return archive;
}

export { createCertificatesArchive };
//# sourceMappingURL=certificateArchiveService.mjs.map
