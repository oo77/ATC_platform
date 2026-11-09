import archiver from "archiver";
import { findCertificateFile } from "../utils/certificateFile";

export type CertificatesArchiveGroupBy = "organization" | "group" | "course" | "none";

export interface CertificatesArchiveOptions {
  // Папка на каждую организацию, файлы внутри названы как при скачивании по одному
  // @deprecated используйте groupBy: "organization"
  byOrganization?: boolean;
  // Группировка файлов архива по подпапкам
  groupBy?: CertificatesArchiveGroupBy;
}

const sanitize = (value: unknown, fallback: string): string => {
  const str = String(value ?? "").trim();
  return (str || fallback).replace(/[\/\\:*?"<>|]/g, "_").trim();
};

export async function createCertificatesArchive(
  certificates: any[],
  options: CertificatesArchiveOptions = {},
) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const groupBy: CertificatesArchiveGroupBy =
    options.groupBy ?? (options.byOrganization ? "organization" : "none");

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
      const safeCertNum = sanitize(certNum, "0000000");
      const studentName = sanitize(cert.student_name || cert.studentName, "Student");
      const groupCode = sanitize(
        cert.group_code || cert.groupCode || cert.standalone_group_code,
        "",
      );

      // Имя файла: ФИО_НомерСертификата_Группа.pdf (номер сертификата
      // объединяет серию и номер — отдельного поля "серия" в БД нет)
      const fileBaseName = groupCode
        ? `${studentName}_${safeCertNum}_${groupCode}.pdf`
        : `${studentName}_${safeCertNum}.pdf`;

      let folder = "";
      if (groupBy === "organization") {
        folder = sanitize(
          cert.organization_name || cert.organizationName,
          "Без организации",
        );
      } else if (groupBy === "course") {
        folder = sanitize(cert.course_name || cert.courseName, "Без курса");
      } else if (groupBy === "group") {
        folder = groupCode || "Без группы";
      }

      const fileName = folder ? `${folder}/${fileBaseName}` : fileBaseName;

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
