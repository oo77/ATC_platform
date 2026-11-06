import archiver from "archiver";
import { findCertificateFile } from "../utils/certificateFile";

export interface CertificatesArchiveOptions {
  // Папка на каждую организацию, файлы внутри названы как при скачивании по одному
  byOrganization?: boolean;
}

export async function createCertificatesArchive(
  certificates: any[],
  options: CertificatesArchiveOptions = {},
) {
  const archive = archiver("zip", { zlib: { level: 9 } });

  let filesAdded = 0;

  for (const cert of certificates) {
    const pdfUrl = cert.pdf_file_url || cert.pdfFileUrl;
    const docxUrl = cert.docx_file_url || cert.docxFileUrl;
    const certNum = cert.certificate_number || cert.certificateNumber;

    const filePath = findCertificateFile({
      pdfFileUrl: pdfUrl,
      docxFileUrl: docxUrl,
      certificateNumber: certNum,
    });

    if (filePath) {
      const safeCertNum = (certNum || "").replace(/[\/\\:*?"<>|]/g, "_").trim();
      let fileName: string;

      if (options.byOrganization) {
        const organizationName = (
          cert.organization_name ||
          cert.organizationName ||
          "Без организации"
        )
          .replace(/[\/\\:*?"<>|]/g, "_")
          .trim();

        fileName = `${organizationName}/Certificate_${safeCertNum}.pdf`;
      } else {
        const courseName = (cert.course_name || cert.courseName || "Course")
          .replace(/[\/\\:*?"<>|]/g, "_")
          .trim();
        const studentName = (cert.student_name || cert.studentName || "Student")
          .replace(/[\/\\:*?"<>|]/g, "_")
          .trim();

        fileName = `${courseName}/${studentName}_${safeCertNum}.pdf`;
      }

      archive.file(filePath, { name: fileName });
      filesAdded++;
    }
  }

  if (filesAdded === 0) {
    throw new Error("Файлы сертификатов не найдены");
  }

  archive.finalize();
  return archive;
}
