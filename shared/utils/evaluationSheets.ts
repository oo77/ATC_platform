/**
 * Состав комиссии для «Оценочных листов» (BAHOLASH VARAQASI).
 * Общий модуль: форма перед скачиванием показывает сокращение ФИО председателя,
 * сервер подставляет состав в Word (см. server/services/evaluationSheetsService.ts).
 */

/** Членов комиссии на листе — не больше пяти */
export const MAX_COMMISSION_MEMBERS = 5;

export interface EvaluationSheetsCommission {
  /**
   * Председатель, ФИО полностью («Ismailov Sardor Ulugbekovich»): в таблице оценок стоит
   * как введено, в подписях — сокращённо («S.U. Ismailov», см. abbreviateFullName)
   */
  chairman: string;
  /** Заместитель председателя — как введено; null — заместителя на листе нет */
  deputy: string | null;
  /** Члены комиссии (от 1 до MAX_COMMISSION_MEMBERS) — как введено */
  members: string[];
}

/** «o‘g‘li», «qizi» и их варианты написания — часть отчества: со строчной буквы, без инициала */
export const PATRONYMIC_PARTICLE_RE =
  /^(?:[ou]['‘’ʻʼ`]?g['‘’ʻʼ`]?l[iu]|uli['‘’ʻʼ`]?|[qk]izi|ўғли|угли|оглы|[қк]изи)$/;

/** Инициал слова: первая буква, а у «Sh…» и «Ch…» — обе («Shavkat» → «Sh») */
function initialOf(word: string): string {
  const digraph = /^[sc]h/i.exec(word)?.[0];
  if (digraph) return digraph.charAt(0).toUpperCase() + "h";
  return (/\p{L}/u.exec(word)?.[0] ?? "").toUpperCase();
}

/**
 * «Ismailov Sardor Ulugbekovich» и «Ismailov Sardor Ulugbek o‘g‘li» → «S.U. Ismailov»:
 * первое слово — фамилия, от остальных (кроме «o‘g‘li»/«qizi») берутся инициалы.
 */
export function abbreviateFullName(fullName: string): string {
  const [surname, ...rest] = fullName.trim().split(/\s+/).filter(Boolean);
  if (!surname) return "";

  const initials = rest
    .filter((word) => !PATRONYMIC_PARTICLE_RE.test(word.toLowerCase()))
    .map(initialOf)
    .filter(Boolean)
    .map((initial) => `${initial}.`)
    .join("");
  return initials ? `${initials} ${surname}` : surname;
}
