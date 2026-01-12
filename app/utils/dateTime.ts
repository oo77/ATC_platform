/**
 * Утилиты для работы с датой/временем на клиенте.
 * 
 * ВАЖНО: Все функции сохраняют локальное время "как есть",
 * без автоматической конвертации в UTC.
 * 
 * Стандартный toISOString() в JavaScript конвертирует дату в UTC,
 * что вызывает сдвиг времени (например, 10:00 в UTC+5 станет 05:00 UTC).
 * Эти утилиты позволяют избежать этой проблемы.
 */

// =============================================================================
// СОЗДАНИЕ ISO СТРОК БЕЗ КОНВЕРТАЦИИ UTC
// =============================================================================

/**
 * Создаёт ISO строку из даты и времени без конвертации UTC.
 * Используется перед отправкой на сервер.
 * 
 * ВАЖНО: НЕ добавляем 'Z' в конце!
 * 'Z' = Zulu time = UTC, что вызывает сдвиг в FullCalendar и других библиотеках.
 * 
 * @param dateStr - Дата в формате YYYY-MM-DD
 * @param timeStr - Время в формате HH:MM или HH:MM:SS
 * @returns ISO-подобная строка БЕЗ 'Z' (локальное время)
 * 
 * @example
 * toLocalISOString('2025-12-23', '10:00') // => '2025-12-23T10:00:00'
 */
export function toLocalISOString(dateStr: string, timeStr: string): string {
  // Нормализуем время до HH:MM:SS
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  // БЕЗ 'Z' - время будет интерпретироваться как локальное!
  return `${dateStr}T${normalizedTime}`;
}

/**
 * Конвертирует объект Date в ISO строку БЕЗ конвертации в UTC.
 * Сохраняет локальное время "как есть".
 * 
 * ВАЖНО: НЕ добавляем 'Z' в конце!
 * ИСПОЛЬЗОВАТЬ ВМЕСТО date.toISOString() когда нужно сохранить локальное время!
 * 
 * @param date - Объект Date в локальном времени
 * @returns ISO-подобная строка БЕЗ 'Z' (локальное время)
 * 
 * @example
 * const localDate = new Date(2025, 11, 23, 10, 0); // 10:00 local
 * dateToLocalIsoString(localDate) // => '2025-12-23T10:00:00'
 * // vs date.toISOString() => '2025-12-23T05:00:00.000Z' (в UTC+5!)
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
 * Форматирует только дату (YYYY-MM-DD) из Date объекта.
 * Использует локальные методы для избежания сдвига часового пояса.
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
 * Форматирует только время (HH:MM) из Date объекта.
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
 * @returns Локализованная строка даты (например: "23 декабря 2025")
 */
export function formatDateForDisplay(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] ?? 2000;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  // Создаём дату в локальном часовом поясе (не UTC)
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Короткий формат даты: ДД.ММ.ГГ
 * 
 * @param dateStr - Дата в формате YYYY-MM-DD
 * @returns Строка в формате ДД.ММ.ГГ (например: "23.12.25")
 */
export function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] ?? 2000;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
  });
}

// =============================================================================
// ПАРСИНГ ISO/MySQL СТРОК
// =============================================================================

/**
 * Парсит ISO или MySQL datetime строку и возвращает компоненты.
 * НЕ создаёт Date объект, чтобы избежать сдвига часового пояса.
 * 
 * @param dateTimeStr - ISO или MySQL datetime строка
 * @returns Объект с date (YYYY-MM-DD) и time (HH:MM)
 * 
 * @example
 * parseDateTime('2025-12-23T10:00:00.000Z') // => { date: '2025-12-23', time: '10:00' }
 * parseDateTime('2025-12-23 10:00:00')       // => { date: '2025-12-23', time: '10:00' }
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

/**
 * Парсит ISO/MySQL datetime строку и создаёт объект Date С ЛОКАЛЬНЫМ ВРЕМЕНЕМ.
 * 
 * ВАЖНО: Эта функция интерпретирует время в строке как локальное,
 * а не как UTC. Используйте когда нужен Date объект для работы.
 * 
 * @param dateTimeStr - ISO или MySQL datetime строка
 * @returns Date объект с локальным временем
 */
export function parseDateTimeToLocal(dateTimeStr: string): Date {
  const { date, time } = parseDateTime(dateTimeStr);
  
  if (!date) {
    return new Date();
  }
  
  const dateParts = date.split('-').map(Number);
  const timeParts = time.split(':').map(Number);
  
  const year = dateParts[0] ?? 2000;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  const hours = timeParts[0] ?? 0;
  const minutes = timeParts[1] ?? 0;
  
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

// =============================================================================
// ФОРМАТИРОВАНИЕ ДЛЯ ОТОБРАЖЕНИЯ ИЗ ISO СТРОК
// =============================================================================

/**
 * Форматирует ISO/MySQL datetime строку для отображения даты.
 * 
 * @param dateTimeStr - ISO или MySQL datetime строка
 * @returns Локализованная строка даты
 */
export function formatEventDate(dateTimeStr: string): string {
  const { date } = parseDateTime(dateTimeStr);
  if (!date) return '';
  
  const dateParts = date.split('-').map(Number);
  const year = dateParts[0] ?? 2000;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('ru-RU', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Форматирует ISO/MySQL datetime строку для отображения времени.
 * 
 * @param dateTimeStr - ISO или MySQL datetime строка
 * @returns Время в формате HH:MM
 */
export function formatEventTime(dateTimeStr: string): string {
  const { time } = parseDateTime(dateTimeStr);
  return time;
}
