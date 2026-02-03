/**
 * Утилиты форматирования для AI-импорта сертификатов
 */

/**
 * Форматирование уверенности AI в проценты
 * @param confidence Значение от 0 до 1
 * @returns Строка с процентами (e.g. "95%")
 */
export const formatConfidence = (
  confidence: number | null | undefined,
): string => {
  if (confidence === null || confidence === undefined) return "—";
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Получение цвета для индикатора уверенности
 * @param confidence Значение от 0 до 1
 * @returns CSS класс или HEX цвет (в зависимости от использования)
 */
export const getConfidenceColorClass = (
  confidence: number | null | undefined,
): string => {
  if (confidence === null || confidence === undefined) return "text-gray-500";
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.7) return "text-yellow-600";
  return "text-red-600";
};

/**
 * Получение цвета для фона индикатора уверенности (badge)
 * @param confidence Значение от 0 до 1
 * @returns Tailwind классы
 */
export const getConfidenceBadgeClass = (
  confidence: number | null | undefined,
): string => {
  if (confidence === null || confidence === undefined)
    return "bg-gray-100 text-gray-800";
  if (confidence >= 0.9) return "bg-green-100 text-green-800";
  if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

/**
 * Форматирование стоимости
 * @param cost Стоимость в USD
 * @returns Отформатированная строка (e.g. "$0.01")
 */
export const formatCost = (
  cost: number | string | null | undefined,
): string => {
  if (cost === null || cost === undefined) return "—";
  const value = typeof cost === "string" ? parseFloat(cost) : cost;
  if (isNaN(value)) return "—";

  if (value < 0.01 && value > 0) {
    return `< $0.01`;
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Форматирование времени обработки
 * @param ms Время в миллисекундах
 * @returns Строка (e.g. "1.5s")
 */
export const formatProcessingTime = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Форматирование размера файла
 * @param bytes Размер в байтах
 * @returns Строка (e.g. "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
