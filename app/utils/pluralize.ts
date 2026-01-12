/**
 * Утилита для склонения слов в русском языке
 * 
 * @example
 * pluralize(1, 'строка', 'строки', 'строк') // 'строка'
 * pluralize(2, 'строка', 'строки', 'строк') // 'строки'
 * pluralize(5, 'строка', 'строки', 'строк') // 'строк'
 * pluralize(21, 'строка', 'строки', 'строк') // 'строка'
 */
export const pluralize = (
  count: number,
  one: string,
  few: string,
  many: string
): string => {
  const absCount = Math.abs(count);
  const mod10 = absCount % 10;
  const mod100 = absCount % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }

  if (mod10 === 1) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
};

/**
 * Возвращает число с правильным склонением слова
 * 
 * @example
 * pluralizeWithCount(5, 'запись', 'записи', 'записей') // '5 записей'
 */
export const pluralizeWithCount = (
  count: number,
  one: string,
  few: string,
  many: string
): string => {
  return `${count} ${pluralize(count, one, few, many)}`;
};

// Предопределённые склонения для часто используемых слов
export const pluralizeRecords = (count: number): string => 
  pluralizeWithCount(count, 'запись', 'записи', 'записей');

export const pluralizeRows = (count: number): string => 
  pluralizeWithCount(count, 'строка', 'строки', 'строк');

export const pluralizeErrors = (count: number): string => 
  pluralizeWithCount(count, 'ошибка', 'ошибки', 'ошибок');

export const pluralizeStudents = (count: number): string => 
  pluralizeWithCount(count, 'студент', 'студента', 'студентов');
