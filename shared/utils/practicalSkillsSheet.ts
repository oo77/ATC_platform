/**
 * Данные «Ведомости практических работ» (Amaliy koʻnikmalarni tekshirish QAYDNOMASI), которые
 * пользователь вводит перед скачиванием. Общий модуль: форма на странице группы и сервер
 * (см. server/services/practicalSkillsSheetService.ts).
 */

/** Варианты «Aviatsiya xavfsizligi xizmati» */
export const PRACTICAL_SKILLS_SERVICES = ["AXX", "AXTX DXX", "AQB DXX"] as const;
export type PracticalSkillsService = (typeof PRACTICAL_SKILLS_SERVICES)[number];

/** Членов комиссии в бланке — не больше пяти (в образце — три) */
export const MAX_PRACTICAL_COMMISSION_MEMBERS = 5;

export interface PracticalSkillsSheetForm {
  service: PracticalSkillsService;
  /** Oʻtkazilgan sana, ГГГГ-ММ-ДД */
  date: string;
  /** Vaqti: boshlanishi, «ЧЧ:ММ» */
  timeStart: string;
  /** Vaqti: tugashi, «ЧЧ:ММ» */
  timeEnd: string;
  /** Komissiya aʼzolari: «R.D. Kashayev» — по одному в строке подписи */
  commission: string[];
}
