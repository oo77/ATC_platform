/**
 * Репозиторий публичных дашбордов (таблица public_dashboards)
 */

import { randomBytes, randomUUID } from "node:crypto";
import { executeQuery } from "../utils/db";
import {
  normalizeSettings,
  normalizeWidgets,
  type DashboardSettings,
  type DashboardWidget,
} from "../../shared/utils/publicDashboard";

export interface PublicDashboardRow {
  id: string;
  title: string;
  description: string | null;
  token: string;
  widgets: DashboardWidget[];
  settings: DashboardSettings;
  isActive: boolean;
  hasPassword: boolean;
  passwordHash: string | null;
  expiresAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

const parseJson = (v: unknown) => {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v;
};

const iso = (v: unknown): string | null => (v ? new Date(v as any).toISOString() : null);

function mapRow(r: any): PublicDashboardRow {
  const settings = normalizeSettings(parseJson(r.settings));
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    token: r.token,
    widgets: normalizeWidgets(parseJson(r.widgets), settings.columns),
    settings,
    isActive: !!r.is_active,
    hasPassword: !!r.password_hash,
    passwordHash: r.password_hash ?? null,
    expiresAt: iso(r.expires_at),
    viewCount: Number(r.view_count) || 0,
    lastViewedAt: iso(r.last_viewed_at),
    createdBy: r.created_by ?? null,
    createdByName: r.created_by_name ?? null,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  };
}

/** Убирает секретные поля перед отдачей в админку */
export function toAdminDto(d: PublicDashboardRow) {
  const { passwordHash, ...rest } = d;
  return rest;
}

export function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

const SELECT = `
  SELECT pd.*, u.name AS created_by_name
  FROM public_dashboards pd
  LEFT JOIN users u ON u.id = pd.created_by`;

export async function listDashboards(): Promise<PublicDashboardRow[]> {
  const rows = await executeQuery<any[]>(`${SELECT} ORDER BY pd.updated_at DESC`);
  return rows.map(mapRow);
}

export async function getDashboardById(id: string): Promise<PublicDashboardRow | null> {
  const rows = await executeQuery<any[]>(`${SELECT} WHERE pd.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getDashboardByToken(token: string): Promise<PublicDashboardRow | null> {
  const rows = await executeQuery<any[]>(`${SELECT} WHERE pd.token = ? LIMIT 1`, [token]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export interface DashboardInput {
  title: string;
  description?: string | null;
  widgets: DashboardWidget[];
  settings: DashboardSettings;
  isActive: boolean;
  expiresAt?: string | null;
  /** undefined — не менять; null — снять пароль; строка — bcrypt-хеш */
  passwordHash?: string | null;
}

const toMysqlDate = (v: string | null | undefined): string | null => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
};

export async function createDashboard(input: DashboardInput, userId: string | null): Promise<string> {
  const id = randomUUID();
  await executeQuery(
    `INSERT INTO public_dashboards
       (id, title, description, token, widgets, settings, is_active, password_hash, expires_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? null,
      generateToken(),
      JSON.stringify(input.widgets),
      JSON.stringify(input.settings),
      input.isActive ? 1 : 0,
      input.passwordHash ?? null,
      toMysqlDate(input.expiresAt),
      userId,
    ],
  );
  return id;
}

export async function updateDashboard(id: string, input: DashboardInput): Promise<void> {
  const sets = [
    "title = ?",
    "description = ?",
    "widgets = ?",
    "settings = ?",
    "is_active = ?",
    "expires_at = ?",
  ];
  const params: any[] = [
    input.title,
    input.description ?? null,
    JSON.stringify(input.widgets),
    JSON.stringify(input.settings),
    input.isActive ? 1 : 0,
    toMysqlDate(input.expiresAt),
  ];
  if (input.passwordHash !== undefined) {
    sets.push("password_hash = ?");
    params.push(input.passwordHash);
  }
  params.push(id);
  await executeQuery(`UPDATE public_dashboards SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function regenerateToken(id: string): Promise<string> {
  const token = generateToken();
  await executeQuery("UPDATE public_dashboards SET token = ? WHERE id = ?", [token, id]);
  return token;
}

export async function deleteDashboard(id: string): Promise<void> {
  await executeQuery("DELETE FROM public_dashboards WHERE id = ?", [id]);
}

export async function registerView(id: string): Promise<void> {
  // updated_at не трогаем: это не изменение настроек
  await executeQuery(
    "UPDATE public_dashboards SET view_count = view_count + 1, last_viewed_at = NOW(3), updated_at = updated_at WHERE id = ?",
    [id],
  );
}
