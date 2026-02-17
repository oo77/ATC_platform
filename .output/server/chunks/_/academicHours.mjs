import { f as executeQuery } from './nitro.mjs';

let cachedAcademicHourMinutes = null;
async function getAcademicHourMinutes() {
  if (cachedAcademicHourMinutes !== null) {
    return cachedAcademicHourMinutes;
  }
  try {
    const rows = await executeQuery(
      "SELECT setting_value FROM schedule_settings WHERE setting_key = 'academic_hour_minutes' LIMIT 1"
    );
    if (rows.length > 0 && rows[0]) {
      const value = parseInt(rows[0].setting_value, 10);
      cachedAcademicHourMinutes = isNaN(value) ? 40 : value;
    } else {
      cachedAcademicHourMinutes = 40;
    }
  } catch (error) {
    console.warn(
      "[getAcademicHourMinutes] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E:",
      error
    );
    cachedAcademicHourMinutes = 40;
  }
  return cachedAcademicHourMinutes;
}
function resetAcademicHourCache() {
  cachedAcademicHourMinutes = null;
}

export { getAcademicHourMinutes as g, resetAcademicHourCache as r };
//# sourceMappingURL=academicHours.mjs.map
