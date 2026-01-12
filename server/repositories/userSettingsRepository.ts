/**
 * Репозиторий для работы с настройками пользователей
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'ru' | 'en' | 'uz';
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_sms: boolean;
  compact_mode: boolean;
  font_size: 'small' | 'medium' | 'large';
  sidebar_color?: string;
  updated_at: Date;
}

export type UpdateUserSettingsInput = Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>;

interface UserSettingsRow extends RowDataPacket, UserSettings {}

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  theme: 'light',
  language: 'ru',
  notifications_email: true,
  notifications_push: true,
  notifications_sms: false,
  compact_mode: false,
  font_size: 'medium',
  sidebar_color: 'default'
};

/**
 * Получение настроек пользователя по ID
 * Если настроек нет, они создаются с дефолтными значениями
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const rows = await executeQuery<UserSettingsRow[]>(
    'SELECT * FROM user_settings WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (rows.length > 0) {
    // Преобразование boolean полей из 0/1 (MySQL) в true/false
    const settings = rows[0];
    return {
      ...settings,
      notifications_email: Boolean(settings.notifications_email),
      notifications_push: Boolean(settings.notifications_push),
      notifications_sms: Boolean(settings.notifications_sms),
      compact_mode: Boolean(settings.compact_mode),
    };
  }

  // Если настроек нет, создаем дефолтные
  return await createUserSettings(userId);
}

/**
 * Создание дефолтных настроек для пользователя
 */
async function createUserSettings(userId: string): Promise<UserSettings> {
  await executeQuery(
    `INSERT INTO user_settings (
      user_id, theme, language, notifications_email, notifications_push, 
      notifications_sms, compact_mode, font_size, sidebar_color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      DEFAULT_SETTINGS.theme,
      DEFAULT_SETTINGS.language,
      DEFAULT_SETTINGS.notifications_email,
      DEFAULT_SETTINGS.notifications_push,
      DEFAULT_SETTINGS.notifications_sms,
      DEFAULT_SETTINGS.compact_mode,
      DEFAULT_SETTINGS.font_size,
      DEFAULT_SETTINGS.sidebar_color
    ]
  );

  return {
    user_id: userId,
    ...DEFAULT_SETTINGS,
    updated_at: new Date()
  };
}

/**
 * Обновление настроек пользователя
 */
export async function updateUserSettings(
  userId: string,
  data: UpdateUserSettingsInput
): Promise<UserSettings> {
  // Сначала убедимся, что запись существует (если нет — создастся)
  await getUserSettings(userId);

  const fields: string[] = [];
  const values: any[] = [];

  if (data.theme !== undefined) {
    fields.push('theme = ?');
    values.push(data.theme);
  }
  if (data.language !== undefined) {
    fields.push('language = ?');
    values.push(data.language);
  }
  if (data.notifications_email !== undefined) {
    fields.push('notifications_email = ?');
    values.push(data.notifications_email);
  }
  if (data.notifications_push !== undefined) {
    fields.push('notifications_push = ?');
    values.push(data.notifications_push);
  }
  if (data.notifications_sms !== undefined) {
    fields.push('notifications_sms = ?');
    values.push(data.notifications_sms);
  }
  if (data.compact_mode !== undefined) {
    fields.push('compact_mode = ?');
    values.push(data.compact_mode);
  }
  if (data.font_size !== undefined) {
    fields.push('font_size = ?');
    values.push(data.font_size);
  }
  if (data.sidebar_color !== undefined) {
    fields.push('sidebar_color = ?');
    values.push(data.sidebar_color);
  }

  if (fields.length === 0) {
    return getUserSettings(userId);
  }

  values.push(userId);

  await executeQuery(
    `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );

  return getUserSettings(userId);
}
