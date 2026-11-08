/**
 * API endpoint для удаления сертификата
 * DELETE /api/certificates/:id
 *
 * Удаляет сертификат и связанные файлы (если есть)
 * ВАЖНО: Выданный сертификат удалить нельзя — его сначала отзывают.
 * Отозванный (архивный) удаляется полностью, вместе с PDF.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  deleteCertificate,
  getIssuedCertificateById,
  isCertificateFileInUse,
} from '../../repositories/certificateTemplateRepository';
import { deleteFile, getFileByUuid } from '../../repositories/fileRepository';
import { storage } from '../../utils/storage';
import { logActivity } from '../../utils/activityLogger';
import { Permission, requirePermission } from "../../utils/permissions";

// Каталог PDF, сгенерированных при выдаче из журнала группы
const CERTIFICATES_DIR = path.join(process.cwd(), 'storage', 'Certificates');
const CERTIFICATES_URL_PREFIX = '/storage/Certificates/';

/**
 * Путь к файлу на диске по ссылке вида /storage/Certificates/<имя>.pdf.
 * Ссылки, ведущие за пределы каталога сертификатов, не разрешаются.
 */
function resolveCertificateFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith(CERTIFICATES_URL_PREFIX)) {
    return null;
  }

  const filePath = path.resolve(CERTIFICATES_DIR, fileUrl.slice(CERTIFICATES_URL_PREFIX.length));
  const relativePath = path.relative(CERTIFICATES_DIR, filePath);

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return filePath;
}

/**
 * Удаляет файлы сертификата после удаления записи. Ошибки только логируются:
 * записи уже нет, и из-за файла удаление не откатывается.
 */
async function deleteCertificateFiles(fileUrls: (string | null)[]): Promise<void> {
  const uniqueUrls = [...new Set(fileUrls.filter((url): url is string => !!url))];

  for (const fileUrl of uniqueUrls) {
    try {
      // Файл может быть общим с другим сертификатом — тогда его не трогаем
      if (await isCertificateFileInUse(fileUrl)) {
        console.warn(`⚠️ Файл ${fileUrl} используется другим сертификатом, не удаляем`);
        continue;
      }

      // PDF из журнала группы лежит прямо в storage/Certificates
      const filePath = resolveCertificateFilePath(fileUrl);
      if (filePath) {
        await fs.promises.rm(filePath, { force: true });
        console.log(`✅ Файл сертификата удален: ${fileUrl}`);
        continue;
      }

      // Загруженный файл: URL в формате /api/files/{uuid} или просто {uuid}
      const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
      const match = fileUrl.match(uuidPattern);

      if (match) {
        const fileUuid = match[1];

        // Получаем информацию о файле
        const fileRecord = await getFileByUuid(fileUuid);

        if (fileRecord) {
          // Удаляем запись из БД (soft delete)
          await deleteFile(fileUuid);

          // Удаляем физический файл
          try {
            await storage.delete(fileRecord.fullPath);
            console.log(`✅ Файл сертификата удален: ${fileUuid}`);
          } catch (fileError) {
            console.warn('⚠️ Не удалось удалить физический файл сертификата:', fileError);
          }
        }
      }
    } catch (fileError) {
      console.warn('⚠️ Ошибка при удалении файла сертификата:', fileError);
    }
  }
}

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.CERTIFICATES_REVOKE);

  // Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация',
    });
  }

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID сертификата не указан',
      };
    }

    // Получаем сертификат для получения file_url и названия
    const certificate = await getIssuedCertificateById(id);

    if (!certificate) {
      return {
        success: false,
        message: 'Сертификат не найден',
      };
    }

    if (certificate.status === 'issued') {
      return {
        success: false,
        message: 'Нельзя удалить выданный сертификат. Сначала отзовите его.',
      };
    }

    // Извлекаем название курса из variablesData
    const courseName = certificate.variablesData?.courseName || 'Неизвестный курс';

    // Сначала удаляем сертификат из БД: если это не удалось, файлы остаются на месте
    const deleted = await deleteCertificate(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Не удалось удалить сертификат',
      };
    }

    await deleteCertificateFiles([certificate.pdfFileUrl, certificate.docxFileUrl]);

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'ISSUED_CERTIFICATE',
      id,
      courseName,
      {
        certificateNumber: certificate.certificateNumber,
        studentId: certificate.studentId,
        issueDate: certificate.issueDate,
      }
    );

    return {
      success: true,
      message: 'Сертификат успешно удален',
    };
  } catch (error) {
    console.error('Ошибка удаления сертификата:', error);

    return {
      success: false,
      message: 'Ошибка при удалении сертификата',
    };
  }
});
