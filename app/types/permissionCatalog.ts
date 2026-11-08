/**
 * Каталог прав для интерфейса настройки ролей: модули, русские названия,
 * пояснения, опасные права и зависимости («чтобы изменять — нужно видеть»).
 */

import { Permission } from "./permissions";

export interface PermissionMeta {
  key: Permission;
  label: string;
  hint?: string;
  /** Опасное право: удаление, управление доступом, системные настройки */
  dangerous?: boolean;
  /** Права, которые автоматически включаются вместе с этим */
  requires?: Permission[];
}

export interface PermissionModule {
  id: string;
  title: string;
  permissions: PermissionMeta[];
}

const P = Permission;

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "platform",
    title: "Платформа",
    permissions: [
      { key: P.DASHBOARD_VIEW, label: "Главная страница" },
      { key: P.DASHBOARD_STATS, label: "Статистика, аналитика и отчёты", hint: "Конструктор отчётов, публичные дашборды, свободные запросы AI-ассистента ко всем данным" },
      { key: P.SETTINGS_VIEW, label: "Личные настройки" },
      { key: P.SETTINGS_MANAGE, label: "Системные настройки", hint: "База данных, Telegram-бот, AI-провайдеры, Course Planner, перезапуск", dangerous: true },
      { key: P.AI_CHAT_USE, label: "AI-ассистент" },
      { key: P.LOGS_VIEW, label: "Журнал аудита", hint: "Кто, когда и что изменил во всей системе", dangerous: true },
    ],
  },
  {
    id: "access",
    title: "Пользователи и роли",
    permissions: [
      { key: P.USERS_VIEW, label: "Просмотр пользователей" },
      { key: P.USERS_CREATE, label: "Создание пользователей", requires: [P.USERS_VIEW] },
      { key: P.USERS_UPDATE, label: "Изменение пользователей и сброс паролей", requires: [P.USERS_VIEW], dangerous: true },
      { key: P.USERS_DELETE, label: "Удаление пользователей", requires: [P.USERS_VIEW], dangerous: true },
      { key: P.USERS_MANAGE_ROLES, label: "Назначение ролей пользователям", hint: "Только ролей, права которых есть у вас самих. Также доступ к администраторам", requires: [P.USERS_VIEW], dangerous: true },
      { key: P.ROLES_VIEW, label: "Просмотр ролей" },
      { key: P.ROLES_MANAGE, label: "Создание и настройка ролей", hint: "Можно выдавать роли только права, которые есть у вас самих", requires: [P.ROLES_VIEW], dangerous: true },
    ],
  },
  {
    id: "students",
    title: "Слушатели",
    permissions: [
      { key: P.STUDENTS_VIEW, label: "Раздел «Слушатели» (свои группы)", hint: "Без «всех слушателей» — только слушатели групп, которые ведёт пользователь" },
      { key: P.STUDENTS_VIEW_ALL, label: "Все слушатели", requires: [P.STUDENTS_VIEW] },
      { key: P.STUDENTS_VIEW_OWN, label: "Свои данные (кабинет слушателя)" },
      { key: P.STUDENTS_CREATE, label: "Добавление слушателей", requires: [P.STUDENTS_VIEW] },
      { key: P.STUDENTS_UPDATE, label: "Изменение слушателей", requires: [P.STUDENTS_VIEW] },
      { key: P.STUDENTS_DELETE, label: "Удаление слушателей", requires: [P.STUDENTS_VIEW], dangerous: true },
      { key: P.STUDENTS_IMPORT, label: "Импорт и синхронизация слушателей", requires: [P.STUDENTS_VIEW] },
      { key: P.STUDENTS_EXPORT, label: "Экспорт слушателей", requires: [P.STUDENTS_VIEW] },
    ],
  },
  {
    id: "instructors",
    title: "Инструкторы",
    permissions: [
      { key: P.INSTRUCTORS_VIEW, label: "Просмотр инструкторов", hint: "Без этого права — только свои данные инструктора" },
      { key: P.INSTRUCTORS_CREATE, label: "Добавление инструкторов", requires: [P.INSTRUCTORS_VIEW] },
      { key: P.INSTRUCTORS_UPDATE, label: "Изменение инструкторов", requires: [P.INSTRUCTORS_VIEW] },
      { key: P.INSTRUCTORS_DELETE, label: "Удаление инструкторов", requires: [P.INSTRUCTORS_VIEW], dangerous: true },
      { key: P.INSTRUCTORS_HOURS, label: "Учёт часов всех инструкторов" },
    ],
  },
  {
    id: "organizations",
    title: "Организации и представители",
    permissions: [
      { key: P.ORGANIZATIONS_VIEW, label: "Просмотр организаций" },
      { key: P.ORGANIZATIONS_CREATE, label: "Добавление организаций", requires: [P.ORGANIZATIONS_VIEW] },
      { key: P.ORGANIZATIONS_UPDATE, label: "Изменение организаций", requires: [P.ORGANIZATIONS_VIEW] },
      { key: P.ORGANIZATIONS_DELETE, label: "Удаление организаций", requires: [P.ORGANIZATIONS_VIEW], dangerous: true },
      { key: P.REPRESENTATIVES_VIEW, label: "Представители и заявки на обучение" },
      { key: P.REPRESENTATIVES_APPROVE, label: "Одобрение представителей и обработка заявок", requires: [P.REPRESENTATIVES_VIEW] },
      { key: P.REPRESENTATIVES_BLOCK, label: "Блокировка представителей", requires: [P.REPRESENTATIVES_VIEW] },
      { key: P.REPRESENTATIVES_MANAGE, label: "Полное управление представителями (удаление)", requires: [P.REPRESENTATIVES_VIEW], dangerous: true },
    ],
  },
  {
    id: "courses",
    title: "Учебные программы",
    permissions: [
      { key: P.COURSES_VIEW, label: "Просмотр программ" },
      { key: P.COURSES_CREATE, label: "Создание программ", requires: [P.COURSES_VIEW] },
      { key: P.COURSES_UPDATE, label: "Изменение программ", requires: [P.COURSES_VIEW] },
      { key: P.COURSES_ARCHIVE, label: "Архивация программ", requires: [P.COURSES_VIEW] },
      { key: P.COURSES_DELETE, label: "Удаление программ", requires: [P.COURSES_VIEW], dangerous: true },
      { key: P.DISCIPLINES_VIEW, label: "Просмотр дисциплин" },
      { key: P.DISCIPLINES_MANAGE, label: "Дисциплины и тесты дисциплин", requires: [P.DISCIPLINES_VIEW, P.COURSES_VIEW] },
    ],
  },
  {
    id: "groups",
    title: "Группы",
    permissions: [
      { key: P.GROUPS_VIEW, label: "Раздел «Группы»" },
      { key: P.GROUPS_VIEW_OWN, label: "Свои группы", hint: "Группы, которые пользователь ведёт как инструктор", requires: [P.GROUPS_VIEW] },
      { key: P.GROUPS_VIEW_ALL, label: "Все группы", requires: [P.GROUPS_VIEW] },
      { key: P.GROUPS_CREATE, label: "Создание групп", requires: [P.GROUPS_VIEW_ALL] },
      { key: P.GROUPS_UPDATE, label: "Изменение групп, отчёты групп", requires: [P.GROUPS_VIEW_ALL] },
      { key: P.GROUPS_MANAGE_STUDENTS, label: "Состав группы: добавление, перевод, исключение", requires: [P.GROUPS_VIEW_ALL] },
      { key: P.GROUPS_ARCHIVE, label: "Архивация групп", requires: [P.GROUPS_VIEW_ALL] },
      { key: P.GROUPS_EDIT_LOCKED, label: "Изменение дат начавшихся и завершённых групп", requires: [P.GROUPS_UPDATE], dangerous: true },
      { key: P.GROUPS_DELETE, label: "Удаление групп", requires: [P.GROUPS_VIEW_ALL], dangerous: true },
    ],
  },
  {
    id: "schedule",
    title: "Расписание и аудитории",
    permissions: [
      { key: P.SCHEDULE_VIEW, label: "Раздел «Расписание»" },
      { key: P.SCHEDULE_VIEW_OWN, label: "Своё расписание", requires: [P.SCHEDULE_VIEW] },
      { key: P.SCHEDULE_VIEW_ALL, label: "Всё расписание и шаблоны", requires: [P.SCHEDULE_VIEW] },
      { key: P.SCHEDULE_CREATE, label: "Создание занятий, копирование, шаблоны, пересдачи", requires: [P.SCHEDULE_VIEW_ALL] },
      { key: P.SCHEDULE_UPDATE, label: "Изменение и перенос занятий", requires: [P.SCHEDULE_VIEW_ALL] },
      { key: P.SCHEDULE_DELETE, label: "Удаление занятий и шаблонов расписания", requires: [P.SCHEDULE_VIEW_ALL], dangerous: true },
      { key: P.CLASSROOMS_MANAGE, label: "Управление аудиториями" },
    ],
  },
  {
    id: "attendance",
    title: "Журнал: посещаемость и оценки",
    permissions: [
      { key: P.ATTENDANCE_VIEW, label: "Просмотр посещаемости" },
      { key: P.ATTENDANCE_MARK, label: "Отметка посещаемости на своих занятиях", requires: [P.ATTENDANCE_VIEW] },
      { key: P.ATTENDANCE_EDIT, label: "Исправление посещаемости", requires: [P.ATTENDANCE_MARK] },
      { key: P.ATTENDANCE_MANAGE, label: "Посещаемость всех занятий, одобрение поздних отметок", requires: [P.ATTENDANCE_VIEW] },
      { key: P.GRADES_VIEW, label: "Просмотр оценок" },
      { key: P.GRADES_MANAGE, label: "Выставление оценок", hint: "Без «всех групп» — только по своим занятиям и дисциплинам", requires: [P.GRADES_VIEW] },
    ],
  },
  {
    id: "certificates",
    title: "Сертификаты",
    permissions: [
      { key: P.CERTIFICATES_VIEW, label: "Раздел сертификатов (базовый)" },
      { key: P.CERTIFICATES_VIEW_OWN, label: "Свои сертификаты" },
      { key: P.CERTIFICATES_VIEW_ALL, label: "Реестр всех сертификатов, аналитика, архивы", requires: [P.CERTIFICATES_VIEW] },
      { key: P.CERTIFICATES_DOWNLOAD, label: "Скачивание сертификатов" },
      { key: P.CERTIFICATES_ISSUE, label: "Выдача сертификатов (группе, вручную, AI-импорт)", requires: [P.CERTIFICATES_VIEW, P.TEMPLATES_VIEW] },
      { key: P.CERTIFICATES_REVOKE, label: "Отзыв и удаление сертификатов", requires: [P.CERTIFICATES_VIEW_ALL], dangerous: true },
      { key: P.TEMPLATES_VIEW, label: "Просмотр шаблонов сертификатов" },
      { key: P.TEMPLATES_CREATE, label: "Создание и дублирование шаблонов", requires: [P.TEMPLATES_VIEW] },
      { key: P.TEMPLATES_UPDATE, label: "Редактор шаблонов", requires: [P.TEMPLATES_VIEW] },
      { key: P.TEMPLATES_DELETE, label: "Удаление шаблонов", requires: [P.TEMPLATES_VIEW], dangerous: true },
    ],
  },
  {
    id: "testing",
    title: "Тестирование",
    permissions: [
      { key: P.TEST_BANKS_VIEW, label: "Банки вопросов (с правильными ответами)", dangerous: true },
      { key: P.TEST_BANKS_MANAGE, label: "Управление банками и вопросами, импорт", requires: [P.TEST_BANKS_VIEW] },
      { key: P.TEST_TEMPLATES_VIEW, label: "Просмотр шаблонов тестов, предпросмотр" },
      { key: P.TEST_TEMPLATES_MANAGE, label: "Управление шаблонами тестов, аналитика", requires: [P.TEST_TEMPLATES_VIEW] },
      { key: P.TESTS_ASSIGN, label: "Назначение тестов группам", hint: "Без «всех групп» — только своим группам" },
      { key: P.TESTS_VIEW_RESULTS, label: "Результаты тестов групп" },
      { key: P.TESTS_TAKE, label: "Прохождение тестов (слушатель)" },
    ],
  },
  {
    id: "attestation",
    title: "Аттестация инструкторов",
    permissions: [
      { key: P.ATTESTATION_VIEW_OWN, label: "Своя аттестация" },
      { key: P.ATTESTATION_VIEW, label: "Просмотр всех аттестаций и журнала" },
      { key: P.ATTESTATION_CONDUCT, label: "Проведение аттестации" },
      { key: P.ATTESTATION_MANAGE, label: "Управление аттестацией, комиссия, решения", requires: [P.ATTESTATION_VIEW] },
    ],
  },
  {
    id: "files",
    title: "Файлы и библиотека",
    permissions: [
      { key: P.FILES_VIEW, label: "Файловый менеджер" },
      { key: P.FILES_UPLOAD, label: "Загрузка файлов и создание папок", requires: [P.FILES_VIEW] },
      { key: P.FILES_DELETE, label: "Удаление любых файлов", requires: [P.FILES_VIEW], dangerous: true },
      { key: P.FILES_MANAGE, label: "Полное управление файлами", hint: "Чужие папки, пароли папок без ввода, синхронизация хранилища", requires: [P.FILES_VIEW], dangerous: true },
      { key: P.LIBRARY_VIEW, label: "Каталог библиотеки" },
      { key: P.LIBRARY_READ, label: "Чтение книг", requires: [P.LIBRARY_VIEW] },
      { key: P.LIBRARY_UPLOAD, label: "Загрузка книг", requires: [P.LIBRARY_VIEW] },
      { key: P.LIBRARY_MANAGE, label: "Управление книгами и аналитика чтения", requires: [P.LIBRARY_VIEW] },
      { key: P.LIBRARY_ACCESS_MANAGE, label: "Выдача и отзыв доступа к книгам", requires: [P.LIBRARY_VIEW] },
    ],
  },
];

export const PERMISSION_META: Record<string, PermissionMeta> = Object.fromEntries(
  PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => [p.key, p])),
);

/** Право + все его зависимости (рекурсивно) */
export function withDependencies(keys: Iterable<string>): Set<string> {
  const result = new Set<string>();
  const stack = [...keys];
  while (stack.length) {
    const k = stack.pop()!;
    if (result.has(k)) continue;
    result.add(k);
    for (const dep of PERMISSION_META[k]?.requires || []) stack.push(dep);
  }
  return result;
}

/** Права, которые зависят от данного (чтобы снять их вместе с ним) */
export function dependents(key: string): string[] {
  return Object.values(PERMISSION_META)
    .filter((m) => m.requires?.includes(key as Permission))
    .map((m) => m.key);
}

export const BASE_PROFILE_LABELS: Record<string, { label: string; hint: string }> = {
  MANAGER: { label: "Сотрудник", hint: "Кабинет сотрудника: дашборд и меню управления" },
  TEACHER: { label: "Преподаватель", hint: "Кабинет преподавателя: свои группы, журнал, аттестация" },
  STUDENT: { label: "Слушатель", hint: "Кабинет слушателя: расписание, тесты, сертификаты" },
  ADMIN: { label: "Администратор", hint: "Только системная роль" },
};
