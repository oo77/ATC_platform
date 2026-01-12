/**
 * API endpoint для удаления сертификата
 * DELETE /api/certificates/:id
 * 
 * Удаляет сертификат и связанный файл (если есть)
 * ВАЖНО: Можно удалять только черновики. Выданные сертификаты нужно отзывать.
 */

import { deleteCertificate, getIssuedCertificateById } from '../../repositories/certificateTemplateRepository';
import { deleteFile, getFileByUuid } from '../../repositories/fileRepository';
import { storage } from '../../utils/storage';
import { logActivity } from '../../utils/activityLogger';


export default defineEventHandler(async (event) => {
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

    // Извлекаем название курса из variablesData
    const courseName = certificate.variablesData?.courseName || 'Неизвестный курс';

    // Если есть file_url, пытаемся удалить файл
    if (certificate.pdfFileUrl) {
      try {
        // Извлекаем UUID файла из URL
        // URL может быть в формате: /api/files/{uuid} или просто {uuid}
        const fileUrl = certificate.pdfFileUrl;
        let fileUuid: string | null = null;

        // Паттерн для извлечения UUID
        const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
        const match = fileUrl.match(uuidPattern);
        
        if (match) {
          fileUuid = match[1];
          
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
        // Продолжаем удаление сертификата даже при ошибке файла
      }
    }

    // Удаляем сертификат из БД
    const deleted = await deleteCertificate(id);

    if (!deleted) {
      return {
        success: false,
        message: 'Не удалось удалить сертификат',
      };
    }

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
