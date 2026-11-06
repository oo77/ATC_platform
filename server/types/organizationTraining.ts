/**
 * Аналитика обучения сотрудников организации (общие типы сервера и дашборда).
 * Даты — строки YYYY-MM-DD.
 */

/** Итог зачисления слушателя в группу */
export type EnrollmentState = "certified" | "no_certificate" | "in_training";

export type GroupStatus = "planned" | "active" | "completed";

export interface TrainingCertificate {
  number: string;
  /** Название сертификата (шаблона), например «AOP-KPK» */
  name: string | null;
  /** YYYY-MM-DD */
  issueDate: string | null;
  status: "issued" | "revoked";
}

export interface TrainingStudent {
  id: string;
  fullName: string;
  pinfl: string;
  position: string;
  department: string | null;
  state: EnrollmentState;
  certificate: TrainingCertificate | null;
}

export interface TrainingCounts {
  /** Уникальные слушатели */
  students: number;
  certified: number;
  noCertificate: number;
  inTraining: number;
  /** Выданные (не отозванные) сертификаты */
  certificates: number;
}

export interface TrainingGroup {
  id: string;
  code: string;
  /** YYYY-MM-DD */
  startDate: string | null;
  endDate: string | null;
  status: GroupStatus;
  counts: TrainingCounts;
  certificateNames: string[];
  students: TrainingStudent[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  code: string | null;
  hours: number | null;
  counts: TrainingCounts;
  certificateNames: string[];
  firstDate: string | null;
  lastDate: string | null;
  groups: TrainingGroup[];
}

export interface OrganizationTraining {
  organization: { id: string; name: string; code: string; inn: string | null };
  /** Год начала группы, по которому отфильтрованы данные; null — за всё время */
  year: number | null;
  /** Годы, за которые у организации есть обучение (по убыванию) */
  years: number[];
  /** Сотрудников организации в базе */
  employees: number;
  summary: TrainingCounts & {
    programs: number;
    groups: number;
    firstDate: string | null;
    lastDate: string | null;
  };
  programs: TrainingProgram[];
}
