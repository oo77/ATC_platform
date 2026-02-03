/**
 * Валидаторы для AI-импорта сертификатов
 */

import type { ExtractedCertificateData } from "~/../server/types/aiCertificateImport";

/**
 * Валидация загружаемого файла
 * @param file Объект файла
 * @returns Объект с результатом валидации
 */
export const validateImportFile = (
  file: File,
): { valid: boolean; error?: string } => {
  // Проверка типа
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Неподдерживаемый формат файла. Разрешены: PDF, JPG, PNG",
    };
  }

  // Проверка размера (макс 10 МБ)
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Файл слишком большой. Максимальный размер: 10 МБ",
    };
  }

  return { valid: true };
};

/**
 * Валидация извлеченных данных
 * @param data Извлеченные данные
 * @returns Объект с ошибками по полям
 */
export const validateExtractedData = (
  data: ExtractedCertificateData,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.certificateNumber || data.certificateNumber.trim().length === 0) {
    errors.certificateNumber = "Номер сертификата обязателен";
  }

  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.fullName = "ФИО слушателя обязательно";
  }

  if (!data.issueDate) {
    errors.issueDate = "Дата выдачи обязательна";
  } else {
    // Простая проверка формата даты, можно усилить
    const date = new Date(data.issueDate);
    if (isNaN(date.getTime())) {
      errors.issueDate = "Некорректный формат даты";
    }
  }

  if (!data.organization || data.organization.trim().length === 0) {
    errors.organization = "Организация обязательна";
  }

  if (!data.courseName || data.courseName.trim().length === 0) {
    errors.courseName = "Название курса обязательно";
  }

  return errors;
};
