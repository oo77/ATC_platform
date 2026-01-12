/**
 * API: PUT /api/schedule/settings
 * Обновить настройки расписания
 */

import { updateScheduleSettings } from '../../../repositories/scheduleRepository';
import type { H3Event } from 'h3';

interface UpdateSettingsData {
  settings: Array<{ key: string; value: string }>;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<UpdateSettingsData>(event);
    const role = event.context.auth?.role || event.context.user?.role;

    // Только администратор может менять настройки
    if (role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Доступ запрещен. Только администратор может менять настройки.',
      });
    }

    // Валидация
    if (!body.settings || !Array.isArray(body.settings) || body.settings.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Необходимо указать массив настроек',
      });
    }

    // Валидация каждой настройки
    for (const setting of body.settings) {
      if (!setting.key || typeof setting.key !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Некорректный ключ настройки',
        });
      }
      if (setting.value === undefined || setting.value === null) {
        throw createError({
          statusCode: 400,
          statusMessage: `Некорректное значение для настройки ${setting.key}`,
        });
      }
    }

    const settings = await updateScheduleSettings(body.settings);

    console.log(`[API] PUT /api/schedule/settings - Обновлено ${settings.length} настроек`);

    return {
      success: true,
      settings,
      message: 'Настройки расписания успешно обновлены',
    };
  } catch (error: any) {
    console.error('[API] Ошибка при обновлении настроек расписания:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при обновлении настроек расписания',
    });
  }
});
