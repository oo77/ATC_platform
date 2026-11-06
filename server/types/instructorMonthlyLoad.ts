/**
 * Нагрузка инструкторов за месяц (общие типы сервера и вкладки «Нагрузка за месяц»).
 * Даты — строки YYYY-MM-DD, месяц — YYYY-MM.
 */

/** Академические часы по типам занятий */
export interface LoadHours {
  theory: number;
  practice: number;
  assessment: number;
  other: number;
  total: number;
}

export interface LoadGroup {
  /** null — занятия без группы */
  id: string | null;
  code: string;
  courseName: string | null;
  events: number;
  days: number;
  /** Первое и последнее занятие инструктора в группе в этом месяце */
  firstDay: string;
  lastDay: string;
  hours: LoadHours;
}

export interface LoadInstructor {
  id: string;
  fullName: string;
  isActive: boolean;
  events: number;
  /** Дней с занятиями (по всем группам) */
  days: number;
  hours: LoadHours;
  groups: LoadGroup[];
}

export interface InstructorMonthlyLoad {
  month: string;
  /** Только проведённые занятия (закончились к моменту запроса) */
  onlyConducted: boolean;
  summary: {
    instructors: number;
    events: number;
    groups: number;
    programs: number;
    hours: LoadHours;
    /** Занятия месяца, у которых не указан инструктор */
    unassignedEvents: number;
  };
  instructors: LoadInstructor[];
}
