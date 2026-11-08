/**
 * Валидация тела запроса создания/изменения публичного дашборда
 */

import { hashPassword } from "./auth";
import { normalizeSettings, normalizeWidgets } from "../../shared/utils/publicDashboard";
import type { DashboardInput } from "../repositories/publicDashboardRepository";

export async function parseDashboardInput(body: any, isCreate: boolean): Promise<DashboardInput> {
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) {
    throw createError({ statusCode: 400, message: "Укажите название дашборда" });
  }

  const settings = normalizeSettings(body?.settings);
  const widgets = normalizeWidgets(body?.widgets, settings.columns);

  let expiresAt: string | null = null;
  if (body?.expiresAt) {
    const d = new Date(body.expiresAt);
    if (Number.isNaN(d.getTime())) {
      throw createError({ statusCode: 400, message: "Некорректная дата окончания действия ссылки" });
    }
    expiresAt = d.toISOString();
  }

  let passwordHash: string | null | undefined;
  if (body?.removePassword === true) {
    passwordHash = null;
  } else if (typeof body?.password === "string" && body.password.length > 0) {
    if (body.password.length < 4 || body.password.length > 100) {
      throw createError({ statusCode: 400, message: "Пароль должен содержать от 4 до 100 символов" });
    }
    passwordHash = await hashPassword(body.password);
  } else if (isCreate) {
    passwordHash = null;
  }

  return {
    title,
    description: typeof body?.description === "string" ? body.description.trim().slice(0, 1000) || null : null,
    widgets,
    settings,
    isActive: body?.isActive !== false,
    expiresAt,
    passwordHash,
  };
}
