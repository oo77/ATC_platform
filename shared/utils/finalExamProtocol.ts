/**
 * Данные «Bayonnoma» — протокола итогового экзамена группы, которые пользователь заполняет
 * перед скачиванием. Общий модуль: форма на странице группы и сервер
 * (см. server/services/finalExamProtocolService.ts).
 */

/** Членов комиссии в протоколе — не больше пяти */
export const MAX_PROTOCOL_MEMBERS = 5;

/** Участник комиссии: ФИО и должность вводятся отдельно и ставятся в документ как введены */
export interface FinalExamProtocolPerson {
  /** «R.D. Kashayev» */
  fullName: string;
  /** «“Airports Training Center” MChJ katta instruktor-oʻqituvchisi» */
  position: string;
}

export interface FinalExamProtocolForm {
  /** Дата заседания комиссии, ГГГГ-ММ-ДД — в документе «8-oktabr 2026-yil» */
  date: string;
  /** Номер протокола: «AX-26-04» */
  number: string;
  /** Место составления (строка под заголовком): «Navoiy xalqaro aeroporti bazasi» */
  place: string;
  /** Raislik qiluvchi — председательствующий; в должности указывается и его роль в комиссии */
  presiding: FinalExamProtocolPerson;
  /** «Buyruq bilan tasdiqlangan N nafar komissiya aʼzosidan M nafari ishtirok etdi» */
  approvedMembers: number;
  presentMembers: number;
  /** Imtihon shakli: «ogʻzaki, biletlar boʻyicha (har bir biletda 5 ta savol)» */
  examForm: string;
  /** Imtihon vaqti: «14:00 – 15:20» */
  examTime: string;
  /** Imtihon joyi: «Navoi xalqaro aeroporti, (PQAQTX xonasida)» */
  examPlace: string;
  /** Велась ли видеозапись экзамена; false — слов «imtihon jarayoni videoyozuvga olindi» в протоколе нет */
  videoRecorded: boolean;
  /** Краткое название курса для «Imtihon tartibi» (в документе — в кавычках): «Aviatsiya xavfsizligi» */
  courseTitle: string;
  /**
   * Свой текст «Imtihon tartibi» целиком (вместо предложения «Курс» oʻquv kursi boʻyicha …);
   * пусто или не задан — предложение собирается из названия курса
   */
  examOrderText?: string | null;
  /** Перечень под «Imtihon tartibi» (в документе — в скобках): «Kashayev R.D., Yunusov X.M.» */
  commissionList: string;
  /** Приказ о составе комиссии: «2026-yil 2-oktabrdagi 43-son» (дальше в документе — «buyrugʻi») */
  order: string;
  chairman: FinalExamProtocolPerson;
  /** Заместитель председателя; null — в протоколе его нет */
  deputy: FinalExamProtocolPerson | null;
  /** Члены комиссии (от 1 до MAX_PROTOCOL_MEMBERS) — у каждого своя строка и своя подпись */
  members: FinalExamProtocolPerson[];
}

/**
 * Краткое название курса из полного: текст в кавычках в начале названия
 * («“Aviatsiya xavfsizligi”. Agentlar, …» → «Aviatsiya xavfsizligi»), а без кавычек —
 * первое предложение. Подставляется в форму по умолчанию, пользователь может поправить.
 */
export function courseShortTitle(courseName: string): string {
  const name = courseName.trim();
  const quoted = /^[«“"„]\s*([^»”"“]+?)\s*[»”"]/.exec(name);
  if (quoted) return quoted[1]!;
  return (/^[^.]+/.exec(name)?.[0] ?? name).trim();
}
