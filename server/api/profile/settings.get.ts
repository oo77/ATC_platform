import { getUserSettings } from '../../repositories/userSettingsRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const settings = await getUserSettings(user.id);
    return settings;
  } catch (error: any) {
    console.error('Failed to get user settings:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve settings',
    });
  }
});
