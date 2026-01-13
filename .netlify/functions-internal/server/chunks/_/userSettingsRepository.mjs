import { e as executeQuery } from '../nitro/nitro.mjs';

const DEFAULT_SETTINGS = {
  theme: "light",
  language: "ru",
  notifications_email: true,
  notifications_push: true,
  notifications_sms: false,
  compact_mode: false,
  font_size: "medium",
  sidebar_color: "default"
};
async function getUserSettings(userId) {
  const rows = await executeQuery(
    "SELECT * FROM user_settings WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (rows.length > 0) {
    const settings = rows[0];
    return {
      ...settings,
      notifications_email: Boolean(settings.notifications_email),
      notifications_push: Boolean(settings.notifications_push),
      notifications_sms: Boolean(settings.notifications_sms),
      compact_mode: Boolean(settings.compact_mode)
    };
  }
  return await createUserSettings(userId);
}
async function createUserSettings(userId) {
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
    updated_at: /* @__PURE__ */ new Date()
  };
}
async function updateUserSettings(userId, data) {
  await getUserSettings(userId);
  const fields = [];
  const values = [];
  if (data.theme !== void 0) {
    fields.push("theme = ?");
    values.push(data.theme);
  }
  if (data.language !== void 0) {
    fields.push("language = ?");
    values.push(data.language);
  }
  if (data.notifications_email !== void 0) {
    fields.push("notifications_email = ?");
    values.push(data.notifications_email);
  }
  if (data.notifications_push !== void 0) {
    fields.push("notifications_push = ?");
    values.push(data.notifications_push);
  }
  if (data.notifications_sms !== void 0) {
    fields.push("notifications_sms = ?");
    values.push(data.notifications_sms);
  }
  if (data.compact_mode !== void 0) {
    fields.push("compact_mode = ?");
    values.push(data.compact_mode);
  }
  if (data.font_size !== void 0) {
    fields.push("font_size = ?");
    values.push(data.font_size);
  }
  if (data.sidebar_color !== void 0) {
    fields.push("sidebar_color = ?");
    values.push(data.sidebar_color);
  }
  if (fields.length === 0) {
    return getUserSettings(userId);
  }
  values.push(userId);
  await executeQuery(
    `UPDATE user_settings SET ${fields.join(", ")} WHERE user_id = ?`,
    values
  );
  return getUserSettings(userId);
}

export { getUserSettings as g, updateUserSettings as u };
//# sourceMappingURL=userSettingsRepository.mjs.map
