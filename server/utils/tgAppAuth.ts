/**
 * Авторизация запросов Telegram Mini App (/api/tg-app/*).
 *
 * Каждый запрос Mini App несёт подписанный Telegram initData в заголовке
 * `X-Telegram-Init-Data`. Сервер проверяет подпись (HMAC от токена бота),
 * срок давности и по telegram user id находит представителя в БД.
 *
 * Организация и представитель берутся ТОЛЬКО из БД. Если клиент прислал
 * organizationId / representativeId / chatId, они обязаны совпадать с данными
 * представителя — иначе 403.
 */

import { createError, getHeader, type H3Event } from "h3";
import { validateWebAppData } from "./telegramAuth";
import {
  getRepresentativeByTelegramChatId,
  type RepresentativePermissions,
} from "../repositories/representativeRepository";

/** Сколько живёт подписанный initData (Telegram выдаёт новый при каждом открытии Mini App) */
const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

export const TG_INIT_DATA_HEADER = "x-telegram-init-data";

export interface TgRepresentativeContext {
  representativeId: string;
  representativeName: string;
  organizationId: string;
  chatId: string;
  permissions: RepresentativePermissions;
}

function deny(statusCode: number, message: string): never {
  throw createError({ statusCode, statusMessage: message, message });
}

/**
 * Проверяет initData и возвращает одобренного представителя.
 * @param permission — право представителя, без которого доступ запрещён
 */
export async function requireTgRepresentative(
  event: H3Event,
  permission?: keyof RepresentativePermissions,
): Promise<TgRepresentativeContext> {
  const initData = getHeader(event, TG_INIT_DATA_HEADER) || "";
  if (!initData) {
    deny(401, "Требуется авторизация Telegram");
  }

  const validated: any = validateWebAppData(initData);
  if (!validated?.user?.id) {
    deny(401, "Не удалось подтвердить подлинность данных Telegram");
  }

  const authDate = Number(validated.auth_date);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!authDate || nowSeconds - authDate > INIT_DATA_MAX_AGE_SECONDS) {
    deny(401, "Сессия Telegram устарела. Откройте приложение заново");
  }

  const chatId = String(validated.user.id);
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative) {
    deny(403, "Представитель не найден");
  }
  if (representative.status !== "approved") {
    deny(403, "Доступ представителя не подтверждён или заблокирован");
  }
  if (!representative.organizationId) {
    deny(403, "Представитель не привязан к организации");
  }
  if (permission && !representative.permissions?.[permission]) {
    deny(403, "Недостаточно прав представителя");
  }

  return {
    representativeId: representative.id,
    representativeName: representative.fullName,
    organizationId: representative.organizationId,
    chatId,
    permissions: representative.permissions,
  };
}

/**
 * Значение, присланное клиентом, должно совпадать с данными представителя.
 * Пустое значение допустимо (тогда используется значение из контекста).
 */
export function assertTgMatches(
  provided: unknown,
  expected: string,
  field: string,
): string {
  if (provided !== undefined && provided !== null && provided !== "" && String(provided) !== expected) {
    deny(403, `Нет доступа: ${field} не принадлежит представителю`);
  }
  return expected;
}
