/**
 * Данные «Реестра» — листа регистрации слушателей и подтверждения личности
 * (TINGLOVCHILARNI RO‘YXATGA OLISH VA SHAXSINI TASDIQLASH VARAQASI), которые пользователь
 * заполняет перед скачиванием. Общий модуль: форма на странице группы и сервер
 * (см. server/services/registryService.ts).
 */

export interface RegistryForm {
  /** Sana — дата, ГГГГ-ММ-ДД; в документе «13.10.2026» */
  date: string;
  /** Vaqti: «14:00 – 15:20» */
  time: string;
  /** Joy: «Navoiy AP» */
  place: string;
  /** Komissiya raisi — ФИО, как введено: «Kashayev Ruslan Damirovich» */
  chairman: string;
  /** Komissiya rais o‘rinbosari — ФИО, как введено; null — строки заместителя в документе нет */
  deputy: string | null;
}
