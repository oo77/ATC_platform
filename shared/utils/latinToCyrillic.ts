/**
 * Транслитерация латиницы (узбекская латиница / международная запись ФИО) в русскую кириллицу.
 * Нужна печатным формам, где имена должны быть написаны по-русски: «Yunusov Xurshid» → «Юнусов Хуршид».
 * Кириллические символы остаются как есть, поэтому строку, уже написанную по-русски, можно
 * пропускать через функцию без последствий.
 */

/** Сочетания из нескольких символов — проверяются раньше одиночных букв (длинные — первыми) */
const MULTI: Array<[string, string]> = [
  ["yo'", "ю"],
  ["o'", "у"],
  ["g'", "г"],
  ["sh", "ш"],
  ["ch", "ч"],
  ["kh", "х"],
  ["zh", "ж"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["ng", "нг"],
];

const SINGLE: Record<string, string> = {
  a: "а",
  b: "б",
  c: "к",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "дж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "к",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "х",
  y: "й",
  z: "з",
};

const APOSTROPHES = /[ʻʼ‘’`´]/g;

function transliterateWord(word: string): string {
  const lower = word.replace(APOSTROPHES, "'").toLowerCase();
  let out = "";
  let i = 0;

  while (i < lower.length) {
    let matched = false;
    for (const [from, to] of MULTI) {
      if (lower.startsWith(from, i)) {
        out += to;
        i += from.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = lower[i]!;
    if (ch === "'") {
      // Апостроф внутри слова — твёрдый знак («Саъдулла»; в начале и в конце слова отбрасываем)
      if (out && i < lower.length - 1) out += "ъ";
    } else if (ch === "e" && i === 0) {
      out += "э"; // «Elmurod» → «Эльмурод» (в начале слова «е» читается как «э»)
    } else {
      out += SINGLE[ch] ?? ch;
    }
    i++;
  }

  if (!out) return word;

  // Регистр: ВЕРХНИЙ, Заглавный или строчный — как в исходном слове
  const letters = word.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  if (letters.length > 1 && letters === letters.toUpperCase()) return out.toUpperCase();
  const first = word.charAt(0);
  if (first !== first.toLowerCase()) return out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

/** «Yunusov Xurshid» → «Юнусов Хуршид». Слова без латиницы возвращаются без изменений. */
export function latinToCyrillic(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/[A-Za-zʻʼ‘’'`´]+/g, (chunk) =>
    /[A-Za-z]/.test(chunk) ? transliterateWord(chunk) : chunk,
  );
}
