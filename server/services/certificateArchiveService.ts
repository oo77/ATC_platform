import archiver from "archiver";
import { findCertificateFile } from "../utils/certificateFile";

export async function createCertificatesArchive(certificates: any[]) {
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
      const courseName = (cert.course_name || cert.courseName || "Course")
        .replace(/[\/\\:*?"<>|]/g, "_")
        .trim();
      const studentName = (cert.student_name || cert.studentName || "Student")
        .replace(/[\/\\:*?"<>|]/g, "_")
        .trim();
      const safeCertNum = (certNum || "").replace(/[\/\\:*?"<>|]/g, "_").trim();

      const fileName = `${courseName}/${studentName}_${safeCertNum}.pdf`;
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
