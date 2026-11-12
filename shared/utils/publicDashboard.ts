/**
 * Публичные дашборды: каталог виджетов и типы конфигурации.
 * Общий модуль для сервера (расчёт данных, валидация) и клиента (редактор, отображение).
 */

export type WidgetCategory = "ops" | "kpi" | "chart" | "list" | "other";

export type WidgetKind = "kpi" | "chart" | "list" | "clock" | "text" | "week" | "status" | "alerts" | "booking";

export type WidgetOptionType = "select" | "number" | "text" | "textarea" | "boolean" | "multiselect";

export interface WidgetOptionDef {
  key: string;
  label: string;
  type: WidgetOptionType;
  default: string | number | boolean | string[];
  choices?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  /** multiselect: откуда редактор берёт варианты (список подгружается с сервера) */
  source?: "classrooms";
}

export interface WidgetDef {
  type: string;
  kind: WidgetKind;
  category: WidgetCategory;
  title: string;
  description: string;
  /** Иконка lucide-vue-next (имя компонента) */
  icon: string;
  defaultW: number;
  defaultH: number;
  options: WidgetOptionDef[];
}

export interface DashboardWidget {
  id: string;
  type: string;
  /** Пользовательский заголовок; пусто — заголовок из каталога */
  title?: string;
  /** Ширина в колонках сетки */
  w: number;
  /** Высота в рядах сетки */
  h: number;
  options: Record<string, any>;
}

export type DashboardTheme = "dark" | "light" | "auto";

export interface DashboardSettings {
  theme: DashboardTheme;
  /** Колонок в сетке */
  columns: number;
  /** Интервал автообновления, секунд */
  refreshInterval: number;
  showHeader: boolean;
  showClock: boolean;
  showLastUpdated: boolean;
  /** Растянуть сетку на высоту экрана (режим ТВ/киоска) */
  fitToScreen: boolean;
  /** Скрывать ФИО слушателей (Иванов И. И.) */
  maskNames: boolean;
  /** Акцентный цвет */
  accentColor: string;
  /** Показывать кнопку «На весь экран» на публичной странице */
  allowFullscreen: boolean;
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  theme: "dark",
  columns: 4,
  refreshInterval: 60,
  showHeader: true,
  showClock: true,
  showLastUpdated: true,
  fitToScreen: false,
  maskNames: true,
  accentColor: "#465FFF",
  allowFullscreen: true,
};

export const ACCENT_COLORS = [
  "#465FFF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

export const REFRESH_CHOICES = [
  { value: 30, label: "30 секунд" },
  { value: 60, label: "1 минута" },
  { value: 300, label: "5 минут" },
  { value: 900, label: "15 минут" },
  { value: 1800, label: "30 минут" },
  { value: 3600, label: "1 час" },
];

const MONTHS_OPTION: WidgetOptionDef = {
  key: "months",
  label: "Период",
  type: "select",
  default: 12,
  choices: [
    { value: 6, label: "6 месяцев" },
    { value: 12, label: "12 месяцев" },
    { value: 24, label: "24 месяца" },
  ],
};

const DAYS_OPTION: WidgetOptionDef = {
  key: "days",
  label: "Период",
  type: "select",
  default: 30,
  choices: [
    { value: 7, label: "7 дней" },
    { value: 30, label: "30 дней" },
    { value: 90, label: "90 дней" },
    { value: 365, label: "Год" },
  ],
};

const LIMIT_OPTION = (def = 10): WidgetOptionDef => ({
  key: "limit",
  label: "Количество строк",
  type: "number",
  default: def,
  min: 3,
  max: 30,
});

const CHART_STYLE_OPTION = (def: "bar" | "line" | "area" = "bar"): WidgetOptionDef => ({
  key: "chartStyle",
  label: "Вид графика",
  type: "select",
  default: def,
  choices: [
    { value: "bar", label: "Столбцы" },
    { value: "line", label: "Линия" },
    { value: "area", label: "Область" },
  ],
});

const PIE_STYLE_OPTION: WidgetOptionDef = {
  key: "chartStyle",
  label: "Вид диаграммы",
  type: "select",
  default: "donut",
  choices: [
    { value: "donut", label: "Кольцо" },
    { value: "pie", label: "Круг" },
    { value: "bar", label: "Горизонтальные столбцы" },
  ],
};

const kpi = (type: string, title: string, description: string, icon: string, extra: WidgetOptionDef[] = []): WidgetDef => ({
  type,
  kind: "kpi",
  category: "kpi",
  title,
  description,
  icon,
  defaultW: 1,
  defaultH: 1,
  options: extra,
});

export const WIDGET_CATALOG: WidgetDef[] = [
  // ───────────── Оперативный контроль ─────────────
  {
    type: "week_schedule",
    kind: "week",
    category: "ops",
    title: "Расписание на неделю",
    description: "Занятия по дням недели: время, группа, аудитория, инструктор. Текущее занятие подсвечено",
    icon: "CalendarRange",
    defaultW: 4,
    defaultH: 3,
    options: [
      {
        key: "range",
        label: "Период",
        type: "select",
        default: "week",
        choices: [
          { value: "week", label: "Текущая неделя (Пн–Вс)" },
          { value: "next7", label: "7 дней начиная с сегодня" },
          { value: "next5", label: "5 дней начиная с сегодня" },
        ],
      },
      { key: "hideEmptyDays", label: "Скрывать дни без занятий", type: "boolean", default: true },
      { key: "showInstructor", label: "Показывать инструктора", type: "boolean", default: true },
    ],
  },
  {
    type: "status_rooms",
    kind: "status",
    category: "ops",
    title: "Статус аудиторий",
    description: "Занята / скоро занятие / свободна — по каждой аудитории прямо сейчас",
    icon: "DoorOpen",
    defaultW: 4,
    defaultH: 2,
    options: [
      { key: "onlyUsedToday", label: "Только аудитории с занятиями сегодня", type: "boolean", default: false },
      { key: "soonMinutes", label: "«Скоро» — минут до начала", type: "number", default: 30, min: 5, max: 120 },
    ],
  },
  {
    type: "rooms_booking",
    kind: "booking",
    category: "ops",
    title: "Бронь аудиторий",
    description: "Кто, когда и для какого курса занял каждую аудиторию — по неделям или дням вперёд",
    icon: "CalendarDays",
    defaultW: 4,
    defaultH: 3,
    options: [
      {
        key: "source",
        label: "Что показывать",
        type: "select",
        default: "bookings",
        choices: [
          { value: "bookings", label: "Брони под курсы (планирование)" },
          { value: "events", label: "Занятия из расписания" },
        ],
      },
      {
        key: "period",
        label: "Период",
        type: "select",
        default: "6w",
        choices: [
          { value: "1w", label: "1 неделя" },
          { value: "2w", label: "2 недели" },
          { value: "4w", label: "4 недели" },
          { value: "6w", label: "6 недель" },
          { value: "8w", label: "8 недель" },
          { value: "12w", label: "12 недель" },
          { value: "month", label: "Текущий месяц" },
          { value: "nextMonth", label: "Следующий месяц" },
        ],
      },
      {
        key: "startFrom",
        label: "Начинать с",
        type: "select",
        default: "weekStart",
        choices: [
          { value: "weekStart", label: "Начала текущей недели" },
          { value: "today", label: "Сегодняшнего дня" },
        ],
      },
      {
        key: "step",
        label: "Колонки",
        type: "select",
        default: "week",
        choices: [
          { value: "week", label: "По неделям" },
          { value: "day", label: "По дням" },
        ],
      },
      {
        key: "classrooms",
        label: "Аудитории (пусто — все)",
        type: "multiselect",
        default: [],
        source: "classrooms",
      },
      { key: "hideEmptyRooms", label: "Скрывать аудитории без брони", type: "boolean", default: false },
      { key: "mergeBookings", label: "Сводить занятия группы в одну бронь (для занятий)", type: "boolean", default: true },
      {
        key: "eventType",
        label: "Тип занятий (для занятий)",
        type: "select",
        default: "all",
        choices: [
          { value: "all", label: "Все" },
          { value: "theory", label: "Теория" },
          { value: "practice", label: "Практика" },
          { value: "assessment", label: "Проверка знаний" },
        ],
      },
      { key: "showCourse", label: "Показывать курс", type: "boolean", default: true },
      { key: "showGroup", label: "Показывать группу", type: "boolean", default: true },
      { key: "showInstructor", label: "Показывать инструктора", type: "boolean", default: true },
      { key: "showBookedBy", label: "Показывать, кто забронировал", type: "boolean", default: true },
      { key: "showBookedAt", label: "Показывать дату брони", type: "boolean", default: false },
      { key: "showHours", label: "Показывать часы (для занятий)", type: "boolean", default: true },
      { key: "highlightClashes", label: "Подсвечивать накладки (для занятий)", type: "boolean", default: true },
    ],
  },
  {
    type: "status_instructors",
    kind: "status",
    category: "ops",
    title: "Статус инструкторов",
    description: "Кто на занятии, у кого перерыв, кто закончил; долги по отметкам посещаемости",
    icon: "UserCog",
    defaultW: 4,
    defaultH: 2,
    options: [
      {
        key: "scope",
        label: "Кого показывать",
        type: "select",
        default: "today",
        choices: [
          { value: "today", label: "С занятиями сегодня" },
          { value: "all", label: "Всех активных" },
        ],
      },
      { key: "unmarkedDays", label: "Неотмеченные занятия за, дней", type: "number", default: 7, min: 1, max: 60 },
    ],
  },
  {
    type: "status_groups",
    kind: "status",
    category: "ops",
    title: "Статус групп",
    description: "Активные группы: на занятии, перерыв, занятия окончены, без занятий; последний день; неотмеченные занятия",
    icon: "Layers",
    defaultW: 4,
    defaultH: 2,
    options: [
      { key: "unmarkedDays", label: "Неотмеченные занятия за, дней", type: "number", default: 7, min: 1, max: 60 },
    ],
  },
  {
    type: "alerts_operational",
    kind: "alerts",
    category: "ops",
    title: "Требует внимания",
    description: "Неотмеченная посещаемость, накладки аудиторий и инструкторов, группы без расписания и сертификатов, заявки",
    icon: "AlertTriangle",
    defaultW: 2,
    defaultH: 2,
    options: [{ key: "days", label: "Горизонт проверки расписания, дней", type: "number", default: 7, min: 1, max: 30 }],
  },
  {
    type: "list_unmarked_attendance",
    kind: "list",
    category: "ops",
    title: "Неотмеченная посещаемость",
    description: "Прошедшие занятия, по которым инструктор не отметил посещаемость",
    icon: "ClipboardX",
    defaultW: 2,
    defaultH: 2,
    options: [
      { key: "days", label: "За последние, дней", type: "number", default: 7, min: 1, max: 60 },
      LIMIT_OPTION(10),
    ],
  },
  ...[
    kpi("kpi_rooms_busy", "Аудитории заняты", "Сколько аудиторий занято прямо сейчас", "DoorClosed"),
    kpi("kpi_lessons_now", "Идёт занятий", "Занятия, которые проходят прямо сейчас", "Radio"),
    kpi("kpi_unmarked", "Не отмечено занятий", "Прошедшие занятия без отметки посещаемости", "ClipboardX", [
      { key: "days", label: "За последние, дней", type: "number", default: 7, min: 1, max: 60 },
    ]),
  ].map((d): WidgetDef => ({ ...d, category: "ops" })),

  // ───────────── Показатели (KPI) ─────────────
  kpi("kpi_students", "Всего слушателей", "Количество слушателей в базе", "Users"),
  kpi("kpi_trained", "Обучено", "Слушатели, получившие хотя бы один сертификат", "GraduationCap"),
  kpi("kpi_students_on_courses", "Сейчас обучаются", "Уникальные слушатели в активных группах", "UserCheck"),
  kpi("kpi_active_groups", "Активные группы", "Группы, обучение в которых не завершено", "Layers"),
  kpi("kpi_instructors", "Инструкторы", "Активные инструкторы", "Presentation"),
  kpi("kpi_courses", "Учебные программы", "Активные программы обучения", "BookOpen"),
  kpi("kpi_organizations", "Организации", "Организации-заказчики", "Building2"),
  kpi("kpi_certificates_total", "Выдано сертификатов", "Все действующие сертификаты", "Award"),
  kpi("kpi_certificates_period", "Сертификаты за период", "Выдано сертификатов за выбранный период", "BadgeCheck", [
    {
      key: "period",
      label: "Период",
      type: "select",
      default: "month",
      choices: [
        { value: "today", label: "Сегодня" },
        { value: "week", label: "Неделя" },
        { value: "month", label: "Текущий месяц" },
        { value: "year", label: "Текущий год" },
      ],
    },
  ]),
  kpi("kpi_lessons_today", "Занятий сегодня", "Занятия в расписании на сегодня", "CalendarDays"),
  kpi("kpi_tests_period", "Пройдено тестов", "Завершённые тестирования за период", "ClipboardCheck", [DAYS_OPTION]),
  kpi("kpi_pass_rate", "Успеваемость тестов", "Доля сданных тестов за период, %", "Target", [DAYS_OPTION]),
  kpi("kpi_attendance_rate", "Посещаемость", "Средняя посещаемость занятий за период, %", "Percent", [DAYS_OPTION]),
  kpi("kpi_verifications", "Проверок сертификатов", "Успешные проверки подлинности по QR/номеру", "ShieldCheck"),
  kpi("kpi_training_requests", "Заявки на обучение", "Заявки организаций по статусу", "Inbox", [
    {
      key: "status",
      label: "Статус",
      type: "select",
      default: "pending",
      choices: [
        { value: "pending", label: "Ожидают" },
        { value: "approved", label: "Одобрены" },
        { value: "in_progress", label: "В работе" },
        { value: "completed", label: "Завершены" },
        { value: "all", label: "Все" },
      ],
    },
  ]),
  kpi("kpi_hours_period", "Проведено часов", "Академические часы проведённых занятий за период", "Clock", [DAYS_OPTION]),

  // ───────────── Графики ─────────────
  {
    type: "chart_certificates_by_month",
    kind: "chart",
    category: "chart",
    title: "Динамика выдачи сертификатов",
    description: "Количество выданных сертификатов по месяцам",
    icon: "TrendingUp",
    defaultW: 2,
    defaultH: 2,
    options: [MONTHS_OPTION, CHART_STYLE_OPTION("area")],
  },
  {
    type: "chart_students_by_month",
    kind: "chart",
    category: "chart",
    title: "Зачисление слушателей",
    description: "Новые зачисления в группы по месяцам",
    icon: "UserPlus",
    defaultW: 2,
    defaultH: 2,
    options: [MONTHS_OPTION, CHART_STYLE_OPTION("bar")],
  },
  {
    type: "chart_attendance_trend",
    kind: "chart",
    category: "chart",
    title: "Посещаемость по неделям",
    description: "Средний процент посещаемости за последние недели",
    icon: "Activity",
    defaultW: 2,
    defaultH: 2,
    options: [
      {
        key: "weeks",
        label: "Недель",
        type: "select",
        default: 12,
        choices: [
          { value: 8, label: "8 недель" },
          { value: 12, label: "12 недель" },
          { value: 26, label: "26 недель" },
        ],
      },
      CHART_STYLE_OPTION("line"),
    ],
  },
  {
    type: "chart_students_by_org",
    kind: "chart",
    category: "chart",
    title: "Слушатели по организациям",
    description: "Распределение слушателей по организациям",
    icon: "PieChart",
    defaultW: 2,
    defaultH: 2,
    options: [PIE_STYLE_OPTION, { key: "top", label: "Топ организаций", type: "number", default: 8, min: 3, max: 15 }],
  },
  {
    type: "chart_trained_by_org",
    kind: "chart",
    category: "chart",
    title: "Обученные по организациям",
    description: "Слушатели с сертификатами по организациям",
    icon: "PieChart",
    defaultW: 2,
    defaultH: 2,
    options: [PIE_STYLE_OPTION, { key: "top", label: "Топ организаций", type: "number", default: 8, min: 3, max: 15 }],
  },
  {
    type: "chart_students_by_course",
    kind: "chart",
    category: "chart",
    title: "Слушатели по программам сейчас",
    description: "Сколько слушателей обучается по каждой программе в активных группах",
    icon: "BarChart3",
    defaultW: 2,
    defaultH: 2,
    options: [PIE_STYLE_OPTION, { key: "top", label: "Топ программ", type: "number", default: 8, min: 3, max: 15 }],
  },
  {
    type: "chart_top_courses",
    kind: "chart",
    category: "chart",
    title: "Популярные программы",
    description: "Программы по числу слушателей за всё время",
    icon: "BarChart3",
    defaultW: 2,
    defaultH: 2,
    options: [
      {
        key: "metric",
        label: "Показатель",
        type: "select",
        default: "students",
        choices: [
          { value: "students", label: "Слушатели" },
          { value: "groups", label: "Группы" },
          { value: "certificates", label: "Сертификаты" },
        ],
      },
      { key: "top", label: "Топ программ", type: "number", default: 8, min: 3, max: 15 },
    ],
  },
  {
    type: "chart_top_instructors",
    kind: "chart",
    category: "chart",
    title: "Нагрузка инструкторов",
    description: "Проведённые академические часы за период",
    icon: "BarChart3",
    defaultW: 2,
    defaultH: 2,
    options: [DAYS_OPTION, { key: "top", label: "Топ инструкторов", type: "number", default: 8, min: 3, max: 15 }],
  },
  {
    type: "chart_test_results",
    kind: "chart",
    category: "chart",
    title: "Результаты тестирования",
    description: "Сдали / не сдали за период",
    icon: "PieChart",
    defaultW: 1,
    defaultH: 2,
    options: [DAYS_OPTION],
  },
  {
    type: "chart_grades_distribution",
    kind: "chart",
    category: "chart",
    title: "Распределение результатов",
    description: "Тесты по проценту выполнения за период",
    icon: "BarChart3",
    defaultW: 2,
    defaultH: 2,
    options: [DAYS_OPTION],
  },
  {
    type: "chart_event_types",
    kind: "chart",
    category: "chart",
    title: "Виды занятий",
    description: "Теория / практика / проверка знаний за период",
    icon: "PieChart",
    defaultW: 1,
    defaultH: 2,
    options: [DAYS_OPTION],
  },
  {
    type: "chart_training_requests_status",
    kind: "chart",
    category: "chart",
    title: "Заявки на обучение",
    description: "Распределение заявок по статусам",
    icon: "PieChart",
    defaultW: 1,
    defaultH: 2,
    options: [],
  },

  // ───────────── Списки ─────────────
  {
    type: "list_today_schedule",
    kind: "list",
    category: "list",
    title: "Расписание на сегодня",
    description: "Занятия на сегодня: время, группа, инструктор, аудитория",
    icon: "CalendarClock",
    defaultW: 2,
    defaultH: 2,
    options: [
      LIMIT_OPTION(10),
      { key: "hidePast", label: "Скрывать прошедшие занятия", type: "boolean", default: false },
    ],
  },
  {
    type: "list_active_groups",
    kind: "list",
    category: "list",
    title: "Активные группы",
    description: "Группы в процессе обучения с прогрессом",
    icon: "Layers",
    defaultW: 2,
    defaultH: 2,
    options: [LIMIT_OPTION(8)],
  },
  {
    type: "list_groups_ending",
    kind: "list",
    category: "list",
    title: "Завершаются скоро",
    description: "Группы, которые закончат обучение в ближайшие дни",
    icon: "Flag",
    defaultW: 1,
    defaultH: 2,
    options: [{ key: "days", label: "Дней вперёд", type: "number", default: 7, min: 1, max: 60 }, LIMIT_OPTION(8)],
  },
  {
    type: "list_upcoming_groups",
    kind: "list",
    category: "list",
    title: "Ближайшие наборы",
    description: "Группы, которые начнут обучение в ближайшие дни",
    icon: "CalendarPlus",
    defaultW: 1,
    defaultH: 2,
    options: [{ key: "days", label: "Дней вперёд", type: "number", default: 14, min: 1, max: 90 }, LIMIT_OPTION(8)],
  },
  {
    type: "list_recent_certificates",
    kind: "list",
    category: "list",
    title: "Последние сертификаты",
    description: "Недавно выданные сертификаты",
    icon: "Award",
    defaultW: 2,
    defaultH: 2,
    options: [LIMIT_OPTION(8)],
  },
  {
    type: "list_top_organizations",
    kind: "list",
    category: "list",
    title: "Рейтинг организаций",
    description: "Организации по числу обученных слушателей",
    icon: "Trophy",
    defaultW: 1,
    defaultH: 2,
    options: [DAYS_OPTION, LIMIT_OPTION(8)],
  },

  // ───────────── Прочее ─────────────
  {
    type: "clock",
    kind: "clock",
    category: "other",
    title: "Часы",
    description: "Текущее время и дата",
    icon: "Clock",
    defaultW: 1,
    defaultH: 1,
    options: [{ key: "showSeconds", label: "Показывать секунды", type: "boolean", default: true }],
  },
  {
    type: "text",
    kind: "text",
    category: "other",
    title: "Объявление",
    description: "Произвольный текст: объявление, приветствие, контакты",
    icon: "Megaphone",
    defaultW: 2,
    defaultH: 1,
    options: [
      { key: "content", label: "Текст", type: "textarea", default: "Добро пожаловать в учебный центр!" },
      {
        key: "align",
        label: "Выравнивание",
        type: "select",
        default: "center",
        choices: [
          { value: "left", label: "Слева" },
          { value: "center", label: "По центру" },
        ],
      },
      {
        key: "size",
        label: "Размер шрифта",
        type: "select",
        default: "lg",
        choices: [
          { value: "md", label: "Обычный" },
          { value: "lg", label: "Крупный" },
          { value: "xl", label: "Очень крупный" },
        ],
      },
    ],
  },
];

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  ops: "Оперативно",
  kpi: "Показатели",
  chart: "Графики",
  list: "Списки",
  other: "Прочее",
};

const CATALOG_MAP = new Map(WIDGET_CATALOG.map((w) => [w.type, w]));

export function getWidgetDef(type: string): WidgetDef | undefined {
  return CATALOG_MAP.get(type);
}

export const MAX_WIDGETS = 40;
export const MAX_ROWS_PER_WIDGET = 4;

function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

/** Нормализует опции виджета по описанию в каталоге (неизвестные ключи отбрасываются) */
export function normalizeWidgetOptions(def: WidgetDef, raw: Record<string, any> | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  for (const opt of def.options) {
    const v = raw?.[opt.key];
    switch (opt.type) {
      case "number":
        out[opt.key] = clampInt(v, opt.min ?? 0, opt.max ?? 1000, Number(opt.default));
        break;
      case "boolean":
        out[opt.key] = typeof v === "boolean" ? v : Boolean(opt.default);
        break;
      case "select": {
        const match = opt.choices?.find((c) => String(c.value) === String(v));
        out[opt.key] = match ? match.value : opt.default;
        break;
      }
      case "multiselect":
        out[opt.key] = Array.isArray(v)
          ? [...new Set(v.map(String).filter((s) => /^[a-zA-Z0-9_-]{1,64}$/.test(s)))].slice(0, 50)
          : [];
        break;
      default:
        out[opt.key] = typeof v === "string" ? v.slice(0, 2000) : opt.default;
    }
  }
  return out;
}

export function createWidget(type: string, id: string): DashboardWidget | null {
  const def = getWidgetDef(type);
  if (!def) return null;
  return {
    id,
    type,
    title: "",
    w: def.defaultW,
    h: def.defaultH,
    options: normalizeWidgetOptions(def, {}),
  };
}

/** Нормализует список виджетов: отбрасывает неизвестные типы, ограничивает размеры */
export function normalizeWidgets(raw: unknown, columns = 6): DashboardWidget[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DashboardWidget[] = [];
  for (const item of raw.slice(0, MAX_WIDGETS)) {
    if (!item || typeof item !== "object") continue;
    const def = getWidgetDef(String((item as any).type));
    if (!def) continue;
    let id = String((item as any).id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (!id || seen.has(id)) id = `w${out.length}_${Math.random().toString(36).slice(2, 8)}`;
    seen.add(id);
    out.push({
      id,
      type: def.type,
      title: typeof (item as any).title === "string" ? (item as any).title.slice(0, 120) : "",
      w: clampInt((item as any).w, 1, columns, Math.min(def.defaultW, columns)),
      h: clampInt((item as any).h, 1, MAX_ROWS_PER_WIDGET, def.defaultH),
      options: normalizeWidgetOptions(def, (item as any).options),
    });
  }
  return out;
}

export function normalizeSettings(raw: unknown): DashboardSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const d = DEFAULT_DASHBOARD_SETTINGS;
  const bool = (k: keyof DashboardSettings) => (typeof r[k] === "boolean" ? r[k] : d[k]) as boolean;
  return {
    theme: ["dark", "light", "auto"].includes(r.theme) ? r.theme : d.theme,
    columns: clampInt(r.columns, 2, 6, d.columns),
    refreshInterval: clampInt(r.refreshInterval, 30, 3600, d.refreshInterval),
    showHeader: bool("showHeader"),
    showClock: bool("showClock"),
    showLastUpdated: bool("showLastUpdated"),
    fitToScreen: bool("fitToScreen"),
    maskNames: bool("maskNames"),
    accentColor: /^#[0-9a-fA-F]{6}$/.test(r.accentColor) ? r.accentColor : d.accentColor,
    allowFullscreen: bool("allowFullscreen"),
  };
}

/** Стартовый набор виджетов для нового дашборда */
export const DEFAULT_WIDGET_SET: { type: string; w?: number; h?: number }[] = [
  { type: "kpi_students" },
  { type: "kpi_trained" },
  { type: "kpi_active_groups" },
  { type: "kpi_certificates_total" },
  { type: "chart_certificates_by_month", w: 2, h: 2 },
  { type: "list_today_schedule", w: 2, h: 2 },
  { type: "chart_students_by_org", w: 2, h: 2 },
  { type: "chart_top_courses", w: 2, h: 2 },
];

export type StatusTone = "danger" | "warning" | "success" | "info" | "muted";

/** Одна бронь аудитории в ячейке «аудитория × период». Скрытые настройками поля пустые */
export interface BookingItem {
  /** Курс (название) */
  course: string;
  /** Код группы или название занятия, если группы нет */
  group: string;
  /** Дни: «Пн–Пт», «Пн, Ср» (пусто при колонках по дням) */
  days: string;
  /** Время: «09:00–13:00» или несколько интервалов */
  time: string;
  /** Сумма академических часов; null — не указаны */
  hours: number | null;
  /** Занятий в брони */
  count: number;
  instructors: string;
  bookedBy: string;
  bookedAt: string;
  type: string;
  retake: boolean;
  clash: boolean;
  /** Идёт прямо сейчас */
  now: boolean;
}

/** Данные, которые сервер возвращает для одного виджета */
export type WidgetData =
  | { kind: "kpi"; value: number; suffix?: string; hint?: string }
  | {
      kind: "chart";
      chart: "series" | "pie" | "hbar";
      labels: string[];
      series: { name: string; data: number[] }[];
      suffix?: string;
    }
  | {
      kind: "list";
      columns: { key: string; label: string; align?: "left" | "right" | "center"; progress?: boolean }[];
      rows: Record<string, string | number | null>[];
    }
  | {
      kind: "week";
      days: {
        key: string;
        weekday: string;
        date: string;
        isToday: boolean;
        events: {
          start: string;
          end: string;
          title: string;
          type: string;
          group: string;
          room: string;
          instructor: string;
          state: "done" | "now" | "next";
        }[];
      }[];
    }
  | {
      kind: "status";
      summary: { tone: StatusTone; label: string; count: number }[];
      items: {
        title: string;
        subtitle?: string;
        tone: StatusTone;
        label: string;
        lines: string[];
        badges?: { tone: StatusTone; text: string }[];
      }[];
      empty?: string;
    }
  | {
      kind: "alerts";
      items: { level: "critical" | "warning" | "info"; title: string; detail?: string; count: number }[];
    }
  | {
      kind: "booking";
      columns: { key: string; label: string; sub: string; isCurrent: boolean }[];
      rooms: {
        id: string;
        name: string;
        subtitle?: string;
        /** Брони по ключу колонки */
        cells: Record<string, BookingItem[]>;
      }[];
      /** Сколько занятий пересекаются с другим занятием в той же аудитории */
      clashCount: number;
      empty?: string;
    }
  | { kind: "static" }
  | { kind: "error"; message: string };
