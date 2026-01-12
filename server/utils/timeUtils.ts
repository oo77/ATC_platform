/**
 * Утилиты для работы с временем без конвертации часовых поясов.
 * 
 * ВАЖНО: Все функции сохраняют локальное время "как есть",
 * без автоматической конвертации JavaScript Date объектов в UTC.
 * 
 * Это критично для приложений расписания, где 10:00 означает именно 10:00,
 * а не UTC-время которое будет отображаться как 15:00 в UTC+5.
 */

// =============================================================================
// КОНВЕРТАЦИЯ ДЛЯ MYSQL
// =============================================================================

/**
 * Конвертирует ISO строку в формат MySQL DATETIME без изменения часового пояса.
 * "2025-12-23T10:00:00.000Z" -> "2025-12-23 10:00:00"
 * 
 * @param isoString - ISO строка времени
 * @returns Строка в формате MySQL DATETIME
 */
export function isoToMySqlDatetime(isoString: string): string {
  const datePart = isoString.substring(0, 10); // "2025-12-23"
  const timePart = isoString.substring(11, 19); // "10:00:00"
  return `${datePart} ${timePart}`;
}

/**
 * Конвертирует MySQL DATETIME (как Date объект) обратно в ISO строку
 * без конвертации часового пояса.
 * 
 * ВАЖНО: НЕ добавляем 'Z' в конце, чтобы время интерпретировалось как локальное!
 * 'Z' = Zulu time = UTC, что вызывает сдвиг в FullCalendar и других библиотеках.
 * 
 * @param date - Date объект из MySQL
 * @returns ISO строка БЕЗ 'Z' (локальное время)
 */
export function dateToLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // БЕЗ 'Z' - время будет интерпретироваться как локальное!
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// =============================================================================
// СОЗДАНИЕ ISO СТРОК БЕЗ КОНВЕРТАЦИИ
// =============================================================================

/**
 * Создаёт ISO строку из даты и времени без конвертации UTC.
 * Используется для формирования времени перед отправкой на сервер.
 * 
 * ВАЖНО: НЕ добавляем 'Z' в конце!
 * 
 * @param dateStr - Дата в формате YYYY-MM-DD
 * @param timeStr - Время в формате HH:MM или HH:MM:SS
 * @returns ISO строка БЕЗ 'Z'
 */
export function toLocalISOString(dateStr: string, timeStr: string): string {
  // Нормализуем время до HH:MM:SS
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  // БЕЗ 'Z' - время будет интерпретироваться как локальное!
  return `${dateStr}T${normalizedTime}`;
}

/**
 * Создаёт ISO строку из объекта Date без конвертации UTC.
 * Сохраняет локальное время "как есть".
 * 
 * ВАЖНО: НЕ добавляем 'Z' в конце!
 * 
 * @param date - Объект Date в локальном времени
 * @returns ISO строка БЕЗ 'Z' (локальное время)
 */
export function dateToLocalIsoString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // БЕЗ 'Z' - время будет интерпретироваться как локальное!
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// =============================================================================
// ФОРМАТИРОВАНИЕ ДАТА/ВРЕМЕНИ
// =============================================================================

/**
 * Форматирует только дату (YYYY-MM-DD) из Date объекта без сдвига часового пояса.
 * 
 * @param date - Date объект
 * @returns Строка в формате YYYY-MM-DD
 */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует время (HH:MM) из Date объекта.
 * 
 * @param date - Date объект
 * @returns Строка в формате HH:MM
 */
export function formatTimeOnly(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Форматирует дату для отображения пользователю (локализованная).
 * 
 * @param dateStr - Дата в формате YYYY-MM-DD
 * @returns Локализованная строка даты
 */
export function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year ?? 2000, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// =============================================================================
// ПАРСИНГ ИЗ ISO/MySQL СТРОК
// =============================================================================

/**
 * Парсит ISO или MySQL datetime строку и возвращает компоненты.
 * Не создаёт Date объект, чтобы избежать сдвига часового пояса.
 * 
 * @param dateTimeStr - ISO или MySQL datetime строка
 * @returns Объект с date (YYYY-MM-DD) и time (HH:MM)
 */
export function parseDateTime(dateTimeStr: string): { date: string; time: string } {
  if (!dateTimeStr) {
    return { date: '', time: '' };
  }
  
  let datePart: string;
  let timePart: string;
  
  // Проверяем формат строки
  if (dateTimeStr.includes('T')) {
    // ISO формат: "2025-12-23T10:00:00.000Z" или "2025-12-23T10:00:00"
    const parts = dateTimeStr.split('T');
    datePart = parts[0] ?? '';
    // Берём время до точки (миллисекунды) или до Z
    const timeWithMaybeMsAndZ = parts[1] ?? '00:00:00';
    timePart = timeWithMaybeMsAndZ.replace(/\.\d+Z?$/, '').replace(/Z$/, '').substring(0, 5);
  } else if (dateTimeStr.includes(' ')) {
    // MySQL формат: "2025-12-23 10:00:00"
    const parts = dateTimeStr.split(' ');
    datePart = parts[0] ?? '';
    timePart = (parts[1] ?? '00:00:00').substring(0, 5);
  } else {
    // Только дата
    datePart = dateTimeStr;
    timePart = '00:00';
  }
  
  return { date: datePart, time: timePart };
}
