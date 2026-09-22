import { executeQuery } from "../../utils/db";
import { createCertificatesArchive } from "../../services/certificateArchiveService";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Для скачивания архива требуется авторизация",
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const certificateIds: string[] = body?.certificateIds || [];

  if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Необходимо передать массив ID сертификатов",
    });
  }

  // Ограничение до 200 файлов в одном архиве
  const safeIds = certificateIds.slice(0, 200);
  const placeholders = safeIds.map(() => "?").join(",");

  const sql = `
    SELECT 
      ic.id,
      ic.certificate_number,
      ic.pdf_file_url,
      ic.docx_file_url,
      ic.issue_date,
      s.full_name as student_name,
      c.name as course_name
    FROM issued_certificates ic
    LEFT JOIN students s ON ic.student_id = s.id
    LEFT JOIN study_groups g ON ic.group_id = g.id
    LEFT JOIN courses c ON g.course_id = c.id
    WHERE ic.id IN (${placeholders})
  `;

  const certificates = await executeQuery<any[]>(sql, safeIds);

  if (!certificates || certificates.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Сертификаты по указанным идентификаторам не найдены",
    });
  }

  const filename = `certificates_archive_${new Date().toISOString().slice(0, 10)}.zip`;

  setHeader(event, "Content-Type", "application/zip");
  setHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);

  try {
    return await createCertificatesArchive(certificates);
  } catch (error: any) {
    throw createError({
      statusCode: 404,
      message: error.message || "Не удалось создать архив сертификатов",
    });
  }
});
