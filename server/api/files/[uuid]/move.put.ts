/**
 * API endpoint для перемещения файла в другую папку
 * PUT /api/files/[uuid]/move   body: { folderId: number | null }
 */

import { getFileByUuid, updateFile } from '../../../repositories/fileRepository';
import { getFolderById } from '../../../repositories/folderRepository';
import { logActivity } from '../../../utils/activityLogger';
import { requireFileManage, requireFolderUnlocked } from "../../../utils/folderAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  const accessCtx = await requireFileManage(event, await getFileByUuid(getRouterParam(event, "uuid") || ""));
  await requireFolderUnlocked(event, accessCtx, Number((await readBody(event))?.folderId) || null);

  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' });
  }

  const uuid = getRouterParam(event, 'uuid');
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'UUID файла не указан' });
  }

  const body = await readBody(event);
  const folderId: number | null = body?.folderId ? Number(body.folderId) : null;

  const file = await getFileByUuid(uuid);
  if (!file) {
    throw createError({ statusCode: 404, message: 'Файл не найден' });
  }

  if (folderId !== null) {
    const target = await getFolderById(folderId);
    if (!target) {
      throw createError({ statusCode: 404, message: 'Целевая папка не найдена' });
    }
  }

  const ok = await updateFile(file.id, { folderId });
  if (!ok) {
    throw createError({ statusCode: 500, message: 'Не удалось переместить файл' });
  }

  await logActivity(event, 'UPDATE', 'FILE', uuid, file.filename, { action: 'move', folderId });

  return { success: true, message: 'Файл перемещён' };
});
