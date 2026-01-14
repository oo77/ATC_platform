/**
 * Утилита для санитизации имен файлов
 *
 * Обеспечивает безопасные имена файлов:
 * - Транслитерация кириллицы
 * - Удаление опасных символов
 * - Ограничение длины
 */

/**
 * Очищает имя файла от опасных символов и транслитерирует кириллицу
 *
 * @param filename - Исходное имя файла
 * @returns Безопасное имя файла
 */
export function sanitizeFilename(filename: string): string {
  // Разделяем имя и расширение
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex) : "";

  // Транслитерация кириллицы
  const transliterated = transliterate(name);

  // Удаляем все кроме букв, цифр, дефисов и подчеркиваний
  const cleaned = transliterated
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");

  // Ограничиваем длину (макс 100 символов)
  const truncated = cleaned.slice(0, 100);

  // Если после очистки имя пустое, используем дефолтное
  const finalName = truncated || "file";

  return finalName + ext;
}

/**
 * Простая транслитерация кириллицы в латиницу
 *
 * @param text - Текст для транслитерации
 * @returns Транслитерированный текст
 */
function transliterate(text: string): string {
  const map: Record<string, string> = {
    // Русский алфавит
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "Yo",
    Ж: "Zh",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "H",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Sch",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "Yu",
    Я: "Ya",

    // Узбекский алфавит (специфические символы)
    ў: "o",
    қ: "q",
    ғ: "g",
    ҳ: "h",
    Ў: "O",
    Қ: "Q",
    Ғ: "G",
    Ҳ: "H",

    // Пробелы и специальные символы
    " ": "_",
    "-": "-",
    _: "_",
  };

  return text
    .split("")
    .map((char) => map[char] || char)
    .join("");
}

/**
 * Извлекает имя файла без расширения
 *
 * @param filename - Имя файла
 * @returns Имя без расширения
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
}

/**
 * Проверяет, является ли имя файла безопасным
 *
 * @param filename - Имя файла для проверки
 * @returns true если имя безопасно
 */
export function isSafeFilename(filename: string): boolean {
  // Проверяем на опасные паттерны
  const dangerousPatterns = [
    /\.\./, // Попытка выхода из директории
    /[<>:"|?*]/, // Запрещенные символы Windows
    /^\./, // Скрытые файлы
    /\/$/, // Директории
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(filename));
}
