/**
 * Типы для работы с файлами
 */

export type FileCategory =
  | 'profile'
  | 'certificate_template'
  | 'certificate_generated'
  | 'course_material'
  | 'course_media'
  | 'course_cover'
  | 'group_gallery'
  | 'group_file'
  | 'assignment'
  | 'other';

export type FileAccessLevel = 'public' | 'authenticated' | 'owner' | 'admin';

export interface FileRecord {
  id: number;
  uuid: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
  category: FileCategory;
  isPublic: boolean;
  url: string;
  uploadedBy: number;
  createdAt: Date | string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  success: boolean;
  file?: FileRecord;
  message?: string;
}

export interface FileListResponse {
  success: boolean;
  data: FileRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

export interface FileDeleteResponse {
  success: boolean;
  message?: string;
}

// Типы для папок
export interface Folder {
  id: number;
  uuid: string;
  name: string;
  parentId: number | null;
  path: string;
  isSystem: boolean;
  passwordHash: string | null;
  userId: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FolderContents {
  success: boolean;
  folders: Folder[];
  files: FileRecord[];
  message?: string;
}

export interface FolderResponse {
  success: boolean;
  folder?: Folder;
  folders?: Folder[];
  message?: string;
}

