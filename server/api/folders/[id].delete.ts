/**
 * API endpoint для удаления папки (soft delete) вместе с вложенными папками и файлами
 * DELETE /api/folders/[id]
 */

import { getFolderById, deleteFolder } from '../../repositories/folderRepository';
import { executeQuery } from '../../utils/db';
import { logActivity } from '../../utils/activityLogger';
import { Permission, roleHasPermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' });
  }

  const folderId = parseInt(getRouterParam(event, 'id') || '');
  if (!folderId) {
    throw createError({ statusCode: 400, message: 'ID папки не указан' });
  }

  const folder = await getFolderById(folderId);
  if (!folder) {
    throw createError({ statusCode: 404, message: 'Папка не найдена' });
  }
  if (folder.isSystem) {
    throw createError({ statusCode: 403, message: 'Системные папки нельзя удалять' });
  }
  if (!roleHasPermission(user, Permission.FILES_MANAGE) && String(folder.userId) !== user.id) {
    throw createError({ statusCode: 403, message: 'Недостаточно прав для удаления папки' });
  }

  const now = new Date();
  // Сначала файлы внутри папки и всех вложенных, чтобы они не осиротели
  await executeQuery(
    `UPDATE files SET deleted_at = ?, updated_at = ?
     WHERE deleted_at IS NULL AND folder_id IN (
       SELECT id FROM (SELECT id FROM folders WHERE (id = ? OR path LIKE ?) AND deleted_at IS NULL) AS t
     )`,
    [now, now, folderId, `${folder.path}/%`],
  );

  const ok = await deleteFolder(folderId);
  if (!ok) {
    throw createError({ statusCode: 500, message: 'Не удалось удалить папку' });
  }

  await logActivity(event, 'DELETE', 'FOLDER', String(folderId), folder.name, { path: folder.path });

  return { success: true, message: 'Папка удалена' };
});
