/**
 * API endpoint для синхронизации папок и файлов из storage/uploads с БД
 * POST /api/files/sync
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createFolder, getFolderByPath } from '../../repositories/folderRepository';
import { createFile } from '../../repositories/fileRepository';
import { getFileExtension } from '../../utils/storage/fileUtils';

const STORAGE_PATH = path.resolve(process.cwd(), 'storage/uploads');

// Определение MIME типа по расширению
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
    'pdf': 'application/pdf', 'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain', 'csv': 'text/csv',
    'zip': 'application/zip', 'mp4': 'video/mp4',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

function getCategoryByPath(folderPath: string): string {
  if (folderPath.includes('Сертификат')) return 'certificate_generated';
  if (folderPath.includes('Курс')) return 'course_material';
  if (folderPath.includes('Профил')) return 'profile';
  if (folderPath.includes('Групп')) return 'group_file';
  return 'other';
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    let foldersImported = 0;
    let filesImported = 0;
    let errors: string[] = [];

    // Синхронизация папок
    async function syncFolders(dirPath: string, parentId: number | null = null, parentPath: string = ''): Promise<void> {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = parentPath ? `${parentPath}/${item.name}` : `/${item.name}`;
          
          try {
            const existing = await getFolderByPath(folderPath);
            
            if (!existing) {
              const folder = await createFolder({
                name: item.name,
                parentId: parentId,
                isSystem: false,
              });
              foldersImported++;
              
              const subDirPath = path.join(dirPath, item.name);
              await syncFolders(subDirPath, folder.id, folderPath);
            } else {
              const subDirPath = path.join(dirPath, item.name);
              await syncFolders(subDirPath, existing.id, folderPath);
            }
          } catch (error: any) {
            errors.push(`Папка ${folderPath}: ${error.message}`);
          }
        }
      }
    }

    // Синхронизация файлов
    async function syncFiles(dirPath: string, relativePath: string = ''): Promise<void> {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        if (item.isDirectory()) {
          await syncFiles(itemPath, itemRelativePath);
        } else if (item.isFile()) {
          try {
            const stats = await fs.stat(itemPath);
            const extension = getFileExtension(item.name);
            const mimeType = getMimeType(extension);
            
            const folderPath = relativePath ? `/${relativePath.replace(/\\/g, '/')}` : '/';
            const folder = await getFolderByPath(folderPath);
            
            if (folder) {
              const uuid = uuidv4();
              const storagePath = itemRelativePath.substring(0, itemRelativePath.lastIndexOf('/')) || '';
              const category = getCategoryByPath(folderPath);
              
              await createFile({
                uuid,
                filename: item.name,
                storedName: item.name,
                mimeType,
                sizeBytes: stats.size,
                extension,
                storagePath,
                fullPath: itemPath,
                category: category as any,
                folderId: folder.id,
                uploadedBy: user.id,
              });
              
              filesImported++;
            }
          } catch (error: any) {
            // Пропускаем файлы, которые уже существуют
            if (!error.message?.includes('Duplicate')) {
              errors.push(`Файл ${item.name}: ${error.message}`);
            }
          }
        }
      }
    }

    // Запуск синхронизации
    await syncFolders(STORAGE_PATH);
    await syncFiles(STORAGE_PATH);

    return {
      success: true,
      foldersImported,
      filesImported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Синхронизация завершена: ${foldersImported} папок, ${filesImported} файлов`,
    };

  } catch (error: any) {
    console.error('Ошибка синхронизации:', error);
    
    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при синхронизации',
    });
  }
});
