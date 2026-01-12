import { executeQuery } from "../../utils/db";
import type { ResultSetHeader } from "mysql2/promise";

export default defineEventHandler(async (event) => {
  try {
    // Используем raw SQL для обновления, так как это проще для массового исправления путей
    // Таблица issued_certificates, поле pdf_file_url

    // 1. Обновляем pdf_file_url: меняем '/storage/certificates/' на '/storage/Certificates/'
    // Используем REPLACE.

    // Выполняем обновление
    const result = await executeQuery<ResultSetHeader>(`
      UPDATE issued_certificates 
      SET pdf_file_url = REPLACE(pdf_file_url, '/storage/certificates/', '/storage/Certificates/')
      WHERE pdf_file_url LIKE '%/storage/certificates/%'
    `);

    // Также обновим docx_file_url на всякий случай
    const resultDocx = await executeQuery<ResultSetHeader>(`
        UPDATE issued_certificates
        SET docx_file_url = REPLACE(docx_file_url, '/storage/certificates/', '/storage/Certificates/')
        WHERE docx_file_url LIKE '%/storage/certificates/%'
    `);

    return {
      success: true,
      message: "Paths updated",
      updatedPdf: result.affectedRows || 0,
      updatedDocx: resultDocx.affectedRows || 0,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
});
