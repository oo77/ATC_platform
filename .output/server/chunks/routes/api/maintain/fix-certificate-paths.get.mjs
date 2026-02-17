import { g as defineEventHandler, f as executeQuery } from '../../../_/nitro.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const fixCertificatePaths_get = defineEventHandler(async (event) => {
  try {
    const result = await executeQuery(`
      UPDATE issued_certificates 
      SET pdf_file_url = REPLACE(pdf_file_url, '/storage/certificates/', '/storage/Certificates/')
      WHERE pdf_file_url LIKE '%/storage/certificates/%'
    `);
    const resultDocx = await executeQuery(`
        UPDATE issued_certificates
        SET docx_file_url = REPLACE(docx_file_url, '/storage/certificates/', '/storage/Certificates/')
        WHERE docx_file_url LIKE '%/storage/certificates/%'
    `);
    return {
      success: true,
      message: "Paths updated",
      updatedPdf: result.affectedRows || 0,
      updatedDocx: resultDocx.affectedRows || 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

export { fixCertificatePaths_get as default };
//# sourceMappingURL=fix-certificate-paths.get.mjs.map
