/**
 * Composable для работы с файлами
 */

import type {
  FileCategory,
  FileRecord,
  FileUploadResponse,
  FileListResponse,
  FileDeleteResponse,
} from '~/types/file';

export const useFileManager = () => {
  const { authFetch } = useAuthFetch();

  /**
   * Загрузка файла
   */
  const uploadFile = async (
    file: File,
    category: FileCategory,
    folderId?: number | null,
    relatedId?: number,
    metadata?: Record<string, any>
  ): Promise<FileRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (folderId !== undefined && folderId !== null) {
      formData.append('folderId', String(folderId));
    }
    if (relatedId) {
      formData.append('relatedId', String(relatedId));
    }
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await authFetch<FileUploadResponse>('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.success || !response.file) {
      throw new Error(response.message || 'Не удалось загрузить файл');
    }

    return response.file;
  };

  /**
   * Получение списка файлов
   */
  const getFiles = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: FileCategory;
    userId?: number;
    courseId?: number;
    groupId?: number;
  }): Promise<FileListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.userId) queryParams.append('userId', String(params.userId));
    if (params?.courseId) queryParams.append('courseId', String(params.courseId));
    if (params?.groupId) queryParams.append('groupId', String(params.groupId));

    const url = `/api/files${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await authFetch<FileListResponse>(url);

    if (!response.success) {
      throw new Error(response.message || 'Не удалось получить список файлов');
    }

    return response;
  };

  /**
   * Удаление файла
   */
  const deleteFile = async (uuid: string): Promise<void> => {
    const response = await authFetch<FileDeleteResponse>(`/api/files/${uuid}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Не удалось удалить файл');
    }
  };

  /**
   * Получение URL файла
   */
  const getFileUrl = (uuid: string): string => {
    return `/api/files/${uuid}`;
  };

  /**
   * Форматирование размера файла
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    uploadFile,
    getFiles,
    deleteFile,
    getFileUrl,
    formatFileSize,
  };
};
