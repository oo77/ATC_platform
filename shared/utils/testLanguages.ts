/**
 * Языки тестирования (вопросы банка, шаблоны тестов, сессии прохождения).
 * Единый источник для сервера и клиента.
 *
 * Коды хранятся в БД (questions.language, test_sessions.language,
 * test_templates.allowed_languages). Существующие коды НЕ переименовываются:
 * `uz` исторически — узбекский (теперь подписан как кириллица), `en` — английский.
 *
 * Добавляя язык: дописать его сюда, в QuestionLanguage (server/types/testing.ts)
 * и в ENUM колонок через миграцию.
 */

export const TEST_LANGUAGE_CODES = [
  "ru",
  "uz",
  "uzlat",
  "kaakir",
  "kaalat",
  "en",
] as const;

export type TestLanguageCode = (typeof TEST_LANGUAGE_CODES)[number];

export interface TestLanguageInfo {
  value: TestLanguageCode;
  label: string;
  /** Короткая метка (вместо эмодзи-флагов, которые Windows показывает буквами) */
  flag: string;
}

export const TEST_LANGUAGES: TestLanguageInfo[] = [
  { value: "ru", label: "Русский", flag: "RU" },
  { value: "uz", label: "Узбекский кир.", flag: "UZ" },
  { value: "uzlat", label: "Узбекский лат.", flag: "UZLAT" },
  { value: "kaakir", label: "Каракалпакский кир.", flag: "KAAKIR" },
  { value: "kaalat", label: "Каракалпакский лат.", flag: "KAALAT" },
  { value: "en", label: "English", flag: "EN" },
];

export const TEST_LANGUAGE_LABELS: Record<TestLanguageCode, string> =
  Object.fromEntries(TEST_LANGUAGES.map((l) => [l.value, l.label])) as Record<
    TestLanguageCode,
    string
  >;

export const TEST_LANGUAGE_FLAGS: Record<TestLanguageCode, string> =
  Object.fromEntries(TEST_LANGUAGES.map((l) => [l.value, l.flag])) as Record<
    TestLanguageCode,
    string
  >;

export function isTestLanguage(value: unknown): value is TestLanguageCode {
  return (
    typeof value === "string" &&
    (TEST_LANGUAGE_CODES as readonly string[]).includes(value)
  );
}

export function testLanguageLabel(code: string | null | undefined): string {
  if (!code) return TEST_LANGUAGE_LABELS.ru;
  return isTestLanguage(code) ? TEST_LANGUAGE_LABELS[code] : code;
}

export function testLanguageFlag(code: string | null | undefined): string {
  if (!code) return TEST_LANGUAGE_FLAGS.ru;
  return isTestLanguage(code) ? TEST_LANGUAGE_FLAGS[code] : code.toUpperCase();
}

/** Пустая статистика «язык → количество» по всем языкам */
export function emptyLanguageCounts(): Record<TestLanguageCode, number> {
  return Object.fromEntries(TEST_LANGUAGE_CODES.map((c) => [c, 0])) as Record<
    TestLanguageCode,
    number
  >;
}
