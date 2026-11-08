import { requireSetupModeOrPermission, Permission } from "../../utils/permissions";
import { initializeDatabase } from '../../database/init';

/**
 * API endpoint для инициализации базы данных
 * GET /api/db/init
 * 
 * Создает таблицы и администратора по умолчанию
 * ВНИМАНИЕ: В продакшене этот endpoint должен быть защищен или удален!
 */
export default defineEventHandler(async (event) => {
  // В production эндпоинт выключен полностью (проверка до try, чтобы catch не превратил 403 в 500)
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      statusMessage: 'This endpoint is disabled in production',
    });
  }
  // Только до первичной настройки или с правом управления настройками
  await requireSetupModeOrPermission(event, Permission.SETTINGS_MANAGE);

  try {

    await initializeDatabase();

    return {
      success: true,
      message: 'Database initialized successfully',
      data: {
        adminEmail: 'admin@atc.uz',
        adminPassword: 'admin123',
        warning: 'Please change the admin password after first login!',
      },
    };
  } catch (error: any) {
    console.error('Database initialization error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Database initialization failed',
      data: error.message,
    });
  }
});
