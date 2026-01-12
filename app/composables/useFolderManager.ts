/**
 * Composable для работы с папками
 */

import type { Folder, FolderContents, FolderResponse } from '~/types/file';

export const useFolderManager = () => {
  const { authFetch } = useAuthFetch();

  /**
   * Создание папки
   */
  const createFolder = async (name: string, parentId?: number | null): Promise<Folder> => {
    const response = await authFetch<FolderResponse>('/api/folders', {
      method: 'POST',
      body: { name, parentId },
    });

    if (!response.success || !response.folder) {
      throw new Error(response.message || 'Не удалось создать папку');
    }

    return response.folder;
  };

  /**
   * Получение списка папок
   */
  const getFolders = async (parentId?: number | null): Promise<Folder[]> => {
    const query = parentId !== undefined && parentId !== null ? `?parentId=${parentId}` : '';
    const response = await authFetch<FolderResponse>(`/api/folders${query}`);

    if (!response.success || !response.folders) {
      throw new Error(response.message || 'Не удалось получить список папок');
    }

    return response.folders;
  };

  /**
   * Получение содержимого папки
   */
  const getFolderContents = async (folderId: number | null): Promise<FolderContents> => {
    const id = folderId === null ? 'root' : String(folderId);
    
    console.log('getFolderContents - запрос:', { folderId, id, url: `/api/folders/${id}/contents` });
    
    try {
      const response = await authFetch<FolderContents>(`/api/folders/${id}/contents`);
      
      console.log('getFolderContents - ответ:', response);

      if (!response.success) {
        throw new Error(response.message || 'Не удалось получить содержимое папки');
      }

      return response;
    } catch (error) {
      console.error('getFolderContents - ошибка:', error);
      throw error;
    }
  };

  /**
   * Получение корневых папок
   */
  const getRootFolders = async (): Promise<Folder[]> => {
    return getFolders(null);
  };

  return {
    createFolder,
    getFolders,
    getFolderContents,
    getRootFolders,
  };
};
