import { updateUserSettings, type UpdateUserSettingsInput } from '../../repositories/userSettingsRepository';
import { logActivity } from '../../utils/activityLogger';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.enum(['ru', 'en', 'uz']).optional(),
  notifications_email: z.boolean().optional(),
  notifications_push: z.boolean().optional(),
  notifications_sms: z.boolean().optional(),
  compact_mode: z.boolean().optional(),
  font_size: z.enum(['small', 'medium', 'large']).optional(),
  sidebar_color: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const result = updateSettingsSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors,
    });
  }

  try {
    const updatedSettings = await updateUserSettings(user.id, result.data as UpdateUserSettingsInput);

    await logActivity(event, {
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      details: { updatedSettings: result.data },
    });

    return updatedSettings;
  } catch (error: any) {
    console.error('Failed to update user settings:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update settings',
    });
  }
});
