/**
 * Доступ к папкам и файлам файлового менеджера.
 *
 * Пароль папки раньше проверялся только в браузере: сервер отдавал содержимое
 * закрытой папки любому, кто знал её id. Теперь:
 *  - POST /api/folders/:id/verify-password при верном пароле ставит httpOnly-cookie
 *    с подписью (пользователь + папка + срок + хэш пароля);
 *  - чтение папки или файла внутри неё (на любой глубине) требует такую cookie
 *    для КАЖДОЙ закрытой папки в цепочке предков;
 *  - владелец папки и пользователь с files:manage проходят без пароля.
 * Смена или снятие пароля меняет хэш → старые cookie перестают действовать.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { createError, getCookie, setCookie, type H3Event } from "h3";
import { getFolderById, type Folder } from "../repositories/folderRepository";
import {
  Permission,
  requireAuthContext,
  requirePermission,
  roleHasPermission,
  type PermissionContext,
} from "./permissions";

const UNLOCK_TTL_SECONDS = 12 * 60 * 60;
const SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

const cookieName = (folderId: number) => `folder_unlock_${folderId}`;

function sign(userId: string, folderId: number, exp: number, passwordHash: string): string {
  return createHmac("sha256", SECRET)
    .update(`${userId}:${folderId}:${exp}:${passwordHash}`)
    .digest("hex");
}

/** Владелец папки или пользователь с правом управлять всеми файлами */
export function canManageFolder(ctx: PermissionContext, folder: Folder): boolean {
  return (
    roleHasPermission(ctx, Permission.FILES_MANAGE) ||
    (folder.userId !== null && folder.userId !== undefined && String(folder.userId) === ctx.userId)
  );
}

/** Ставит cookie разблокировки после успешной проверки пароля */
export function grantFolderUnlock(event: H3Event, ctx: PermissionContext, folder: Folder): void {
  if (!folder.passwordHash) return;
  const exp = Math.floor(Date.now() / 1000) + UNLOCK_TTL_SECONDS;
  setCookie(event, cookieName(folder.id), `${exp}.${sign(ctx.userId, folder.id, exp, folder.passwordHash)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
    maxAge: UNLOCK_TTL_SECONDS,
  });
}

function isUnlocked(event: H3Event, ctx: PermissionContext, folder: Folder): boolean {
  if (!folder.passwordHash) return true;
  const raw = getCookie(event, cookieName(folder.id));
  if (!raw) return false;
  const [expStr, sig] = raw.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(sign(ctx.userId, folder.id, exp, folder.passwordHash));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * Папка и все её предки должны быть доступны (не закрыты паролем или разблокированы).
 * Бросает 403 с data.code = "FOLDER_LOCKED" и id закрытой папки.
 */
export async function requireFolderUnlocked(
  event: H3Event,
  ctx: PermissionContext,
  folderId: number | null | undefined,
): Promise<void> {
  let currentId = folderId ?? null;
  const seen = new Set<number>();
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const folder = await getFolderById(currentId);
    if (!folder) return;
    if (folder.passwordHash && !canManageFolder(ctx, folder) && !isUnlocked(event, ctx, folder)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Папка защищена паролем",
        data: { code: "FOLDER_LOCKED", folderId: folder.id },
      });
    }
    currentId = folder.parentId;
  }
}

/** Чтение папки: право просмотра файлов + пароль по цепочке */
export async function requireFolderRead(event: H3Event, folderId: number | null): Promise<PermissionContext> {
  const ctx = await requirePermission(event, Permission.FILES_VIEW);
  await requireFolderUnlocked(event, ctx, folderId);
  return ctx;
}

/**
 * Изменение папки (переименование, перенос, пароль): владелец или files:manage,
 * плюс доступ к самой папке по цепочке паролей.
 */
export async function requireFolderManage(event: H3Event, folderId: number | null): Promise<{ ctx: PermissionContext; folder: Folder }> {
  const ctx = await requireAuthContext(event);
  if (!folderId) {
    throw createError({ statusCode: 400, message: "ID папки не указан" });
  }
  const folder = await getFolderById(folderId);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Папка не найдена" });
  }
  if (!canManageFolder(ctx, folder)) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden", message: "Изменять папку может только владелец или администратор файлов" });
  }
  await requireFolderUnlocked(event, ctx, folder.parentId);
  return { ctx, folder };
}

/**
 * Изменение файла (переименование, перенос): загрузивший или files:manage,
 * плюс доступ к папке файла.
 */
export async function requireFileManage(
  event: H3Event,
  file: { uploadedBy?: string | null; userId?: string | number | null; folderId?: number | null } | null,
): Promise<PermissionContext> {
  const ctx = await requireAuthContext(event);
  if (!file) {
    throw createError({ statusCode: 404, message: "Файл не найден" });
  }
  const isOwner =
    (file.uploadedBy && String(file.uploadedBy) === ctx.userId) ||
    (file.userId !== null && file.userId !== undefined && String(file.userId) === ctx.userId);
  if (!isOwner && !roleHasPermission(ctx, Permission.FILES_MANAGE)) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden", message: "Изменять файл может только загрузивший или администратор файлов" });
  }
  await requireFolderUnlocked(event, ctx, file.folderId ?? null);
  return ctx;
}

/**
 * MIME-типы, которые безопасно показывать в браузере (inline).
 * Всё остальное (HTML, SVG, XML, JS и т.д.) отдаётся как вложение в песочнице —
 * иначе загруженный HTML выполнился бы в контексте сайта (хранимый XSS).
 */
const SAFE_INLINE_MIME = /^(image\/(png|jpe?g|gif|webp|bmp|avif)|application\/pdf|video\/(mp4|webm|ogg)|audio\/(mpeg|ogg|wav|webm|mp4)|text\/plain)$/i;

export function isSafeInlineMime(mimeType: string | null | undefined): boolean {
  return !!mimeType && SAFE_INLINE_MIME.test(mimeType.split(";")[0]!.trim());
}

/**
 * Все папки, закрытые паролем, вместе с их вложенными папками.
 * Для фоновых инструментов (AI-чат), у которых нет сессии разблокировки:
 * файлы из этих папок им недоступны вовсе.
 */
export async function getLockedFolderIds(): Promise<Set<number>> {
  const { executeQuery } = await import("./db");
  const rows = await executeQuery<any[]>(
    "SELECT id, parent_id, password_hash FROM folders",
  );
  const children = new Map<number, number[]>();
  const locked: number[] = [];
  for (const r of rows) {
    if (r.parent_id) {
      const list = children.get(r.parent_id) || [];
      list.push(r.id);
      children.set(r.parent_id, list);
    }
    if (r.password_hash) locked.push(r.id);
  }
  const result = new Set<number>();
  const stack = [...locked];
  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    stack.push(...(children.get(id) || []));
  }
  return result;
}

/** SQL-условие «файл не лежит в закрытой паролем папке» (числа подставляются напрямую, они из БД) */
export async function notInLockedFolderSql(column = "folder_id"): Promise<string> {
  const ids = [...(await getLockedFolderIds())].filter((n) => Number.isInteger(n));
  return ids.length ? ` AND (${column} IS NULL OR ${column} NOT IN (${ids.join(",")}))` : "";
}
