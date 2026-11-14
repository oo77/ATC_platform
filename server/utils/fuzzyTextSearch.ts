/**
 * Толерантный текстовый поиск для названий (организации и т.п.).
 *
 * Обычный `LIKE '%ООО «SANEG JETWHITES»%'` не находит запись, если пользователь
 * ввёл другие кавычки ("…" вместо «…») или набрал «ООО» латиницей (OOO).
 * Здесь запрос разбивается на слова (кавычки и пунктуация отбрасываются),
 * каждое слово должно встретиться в одной из колонок, а для слов с
 * буквами-двойниками (кириллица/латиница: О/O, А/A, С/C …) проверяются оба написания.
 */

const PUNCTUATION_RE = /[«»"'`“”„‘’‹›(),.;:!?]+/g;

// Кириллические буквы, внешне совпадающие с латинскими
const CYR_TO_LAT: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X",
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x",
};
const LAT_TO_CYR: Record<string, string> = Object.fromEntries(
  Object.entries(CYR_TO_LAT).map(([cyr, lat]) => [lat, cyr]),
);

function mapChars(word: string, table: Record<string, string>): string {
  return Array.from(word, (ch) => table[ch] ?? ch).join("");
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Слова поискового запроса без кавычек и пунктуации */
export function tokenizeSearchText(query: string): string[] {
  return query
    .replace(PUNCTUATION_RE, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Варианты написания слова: как введено, кириллица→латиница, латиница→кириллица */
export function homoglyphVariants(word: string): string[] {
  return [...new Set([word, mapChars(word, CYR_TO_LAT), mapChars(word, LAT_TO_CYR)])];
}

/**
 * Строит SQL-условие: каждое слово запроса (в любом из вариантов написания)
 * должно содержаться хотя бы в одной из колонок.
 * Возвращает null, если в запросе нет значимых слов.
 */
export function buildFuzzyTextCondition(
  columns: string[],
  query: string,
): { sql: string; params: string[] } | null {
  const words = tokenizeSearchText(query);
  if (words.length === 0 || columns.length === 0) return null;

  const parts: string[] = [];
  const params: string[] = [];
  for (const word of words) {
    const ors: string[] = [];
    for (const variant of homoglyphVariants(word)) {
      for (const column of columns) {
        ors.push(`${column} LIKE ?`);
        params.push(`%${escapeLike(variant)}%`);
      }
    }
    parts.push(`(${ors.join(" OR ")})`);
  }
  return { sql: `(${parts.join(" AND ")})`, params };
}
