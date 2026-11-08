/**
 * Журнал аудита (таблица audit_events).
 *
 * Отвечает на вопросы: КТО (пользователь и его роль на момент действия), КОГДА,
 * ЧТО сделал (действие человеческим языком), НАД ЧЕМ (тип, id, название),
 * КАКИЕ ИЗМЕНЕНИЯ (поле: было → стало), С КАКИМ РЕЗУЛЬТАТОМ (успех / отказ / ошибка),
 * ОТКУДА (IP, устройство, веб / Telegram / система), В КАКОМ ЗАПРОСЕ (request_id).
 *
 * Запись в журнал никогда не ломает основной запрос: ошибки записи логируются в консоль.
 */

import { randomUUID } from "crypto";
import { getHeader, type H3Event } from "h3";
import { executeQuery } from "./db";
import { getClientIp } from "./clientIp";

export type AuditOutcome = "success" | "denied" | "failed";
export type AuditCategory = "auth" | "access" | "data" | "security" | "system";

export interface AuditChange {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
}

export interface AuditInput {
  /** Машинное имя действия: 'role.update', 'user.role_assign', 'group.update' … */
  action: string;
  /** Человеческое описание: «Изменил роль "Методист": добавлено 3 права» */
  summary: string;
  category?: AuditCategory;
  outcome?: AuditOutcome;
  entity?: { type: string; id?: string | number | null; label?: string | null };
  changes?: AuditChange[];
  metadata?: Record<string, unknown> | null;
  /** Источник: веб (по умолчанию), telegram, integration, system */
  source?: string;
  /** Явный исполнитель (для фоновых задач без event.context.user) */
  actor?: { id?: string | null; name?: string | null; roleId?: string | null; roleName?: string | null };
}

/** Поля, значения которых никогда не попадают в журнал */
const SECRET_FIELD = /(password|passwd|secret|token|api_?key|private|hash|otp|pin_?code)/i;
const MASK = "••••••";
const MAX_VALUE_LENGTH = 500;

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value.toISOString();
  if (Buffer.isBuffer(value)) return `[binary ${value.length} bytes]`;
  if (typeof value === "string" && value.length > MAX_VALUE_LENGTH) {
    // base64-картинки и длинные тексты не раздувают журнал
    return value.startsWith("data:") ? "[файл]" : value.slice(0, MAX_VALUE_LENGTH) + "…";
  }
  if (value && typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      return json.length > MAX_VALUE_LENGTH * 4 ? json.slice(0, MAX_VALUE_LENGTH * 4) + "…" : value;
    } catch {
      return String(value);
    }
  }
  return value;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a instanceof Date || b instanceof Date) {
    return String(normalizeValue(a)) === String(normalizeValue(b));
  }
  if (typeof a === "object" || typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  // "1" и 1, "2026-01-01" и Date — сравниваем как строки
  return String(a) === String(b);
}

/**
 * Разница двух состояний объекта.
 * @param fields — какие поля сравнивать и их подписи; без него сравниваются все поля after
 */
export function diffObjects(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined,
  fields?: Record<string, string>,
): AuditChange[] {
  const b = before || {};
  const a = after || {};
  const keys = fields ? Object.keys(fields) : Array.from(new Set([...Object.keys(a)]));
  const changes: AuditChange[] = [];
  for (const key of keys) {
    if (!(key in a)) continue; // поле не передавали — не меняли
    if (sameValue(b[key], a[key])) continue;
    const secret = SECRET_FIELD.test(key);
    changes.push({
      field: key,
      label: fields?.[key] || key,
      before: secret ? (b[key] ? MASK : null) : normalizeValue(b[key]),
      after: secret ? MASK : normalizeValue(a[key]),
    });
  }
  return changes;
}

/** Изменения набора значений (например, прав роли): добавлено / убрано */
export function diffSets(
  field: string,
  label: string,
  before: Iterable<string>,
  after: Iterable<string>,
): AuditChange | null {
  const b = new Set(before);
  const a = new Set(after);
  const added = [...a].filter((x) => !b.has(x)).sort();
  const removed = [...b].filter((x) => !a.has(x)).sort();
  if (!added.length && !removed.length) return null;
  return { field, label, before: removed.length ? { removed } : null, after: added.length ? { added } : null };
}

/** id запроса: все записи одного HTTP-запроса связаны между собой */
export function getRequestId(event: H3Event): string {
  if (!event.context.requestId) event.context.requestId = randomUUID();
  return event.context.requestId;
}

let tableMissingWarned = false;

/**
 * Записать событие в журнал аудита.
 * event может быть null для фоновых задач (тогда исполнитель — из input.actor).
 */
export async function audit(event: H3Event | null, input: AuditInput): Promise<void> {
  try {
    const user: any = event?.context?.user || null;
    const actor = input.actor || {};
    if (event) event.context.auditRecorded = true;

    await executeQuery(
      `INSERT INTO audit_events
        (request_id, actor_user_id, actor_name, actor_role_id, actor_role_name, source,
         action, category, entity_type, entity_id, entity_label, outcome, summary,
         changes, metadata, ip_address, user_agent, http_method, http_path, http_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event ? getRequestId(event) : null,
        actor.id ?? user?.id ?? null,
        (actor.name ?? user?.name ?? user?.email ?? null)?.toString().slice(0, 191) ?? null,
        actor.roleId ?? user?.roleId ?? null,
        (actor.roleName ?? user?.roleName ?? user?.role ?? null)?.toString().slice(0, 191) ?? null,
        input.source || (event?.path?.startsWith("/api/tg-app") ? "telegram" : event ? "web" : "system"),
        input.action.slice(0, 100),
        input.category || "data",
        input.entity?.type ?? null,
        input.entity?.id != null ? String(input.entity.id).slice(0, 191) : null,
        input.entity?.label != null ? String(input.entity.label).slice(0, 255) : null,
        input.outcome || "success",
        input.summary.slice(0, 500),
        (() => {
          // Явные изменения или накопленные в запросе через recordChanges()
          const changes = input.changes?.length ? input.changes : (event?.context?.auditChanges as AuditChange[] | undefined);
          if (event && !input.changes?.length) event.context.auditChanges = undefined;
          return changes && changes.length ? JSON.stringify(changes) : null;
        })(),
        input.metadata ? JSON.stringify(input.metadata) : null,
        event ? getClientIp(event).slice(0, 45) : null,
        event ? (getHeader(event, "user-agent") || "").slice(0, 500) || null : null,
        event?.method || null,
        event?.path ? event.path.split("?")[0]!.slice(0, 500) : null,
        null,
      ],
    );
  } catch (error: any) {
    if (error?.code === "ER_NO_SUCH_TABLE") {
      if (!tableMissingWarned) {
        tableMissingWarned = true;
        console.warn("[Audit] Таблица audit_events не найдена — примените миграции (054_roles_and_audit)");
      }
      return;
    }
    console.error("[Audit] Не удалось записать событие:", input.action, error?.message);
  }
}

/** Русские подписи типовых полей для журнала */
export const FIELD_LABELS: Record<string, string> = {
  name: "Название / имя",
  fullName: "ФИО",
  full_name: "ФИО",
  email: "Email",
  phone: "Телефон",
  pinfl: "ПИНФЛ",
  position: "Должность",
  workplace: "Место работы",
  department: "Подразделение",
  organization: "Организация",
  organizationId: "Организация (id)",
  code: "Код",
  shortName: "Краткое название",
  description: "Описание",
  totalHours: "Всего часов",
  courseId: "Программа (id)",
  groupId: "Группа (id)",
  startDate: "Дата начала",
  endDate: "Дата окончания",
  startTime: "Начало",
  endTime: "Окончание",
  classroom: "Аудитория",
  classroomId: "Аудитория (id)",
  instructorId: "Инструктор (id)",
  disciplineId: "Дисциплина (id)",
  title: "Заголовок",
  eventType: "Тип занятия",
  isActive: "Активна",
  isArchived: "В архиве",
  status: "Статус",
  grade: "Оценка",
  finalGrade: "Итоговая оценка",
  hoursAttended: "Часы посещения",
  notes: "Примечание",
  hireDate: "Дата приёма",
  contractNumber: "Номер договора",
  contractStartDate: "Начало договора",
  contractEndDate: "Окончание договора",
  maxHours: "Лимит часов",
  inn: "ИНН",
  address: "Адрес",
  contactPhone: "Контактный телефон",
  contactEmail: "Контактный email",
  nameUz: "Название (uz)",
  nameEn: "Название (en)",
  nameRu: "Название (ru)",
  role: "Роль",
};

/** Служебные поля, изменение которых не показываем */
const IGNORED_FIELDS = new Set(["id", "createdAt", "updatedAt", "created_at", "updated_at", "photo", "photoBase64", "photo_base64", "password", "passwordHash"]);

/**
 * Запомнить изменения объекта для журнала: следующая запись аудита в этом запросе
 * (в т.ч. через logActivity) получит список «поле: было → стало».
 * Сравниваются только поля, присланные в after (то, что пользователь менял).
 */
export function recordChanges(
  event: H3Event,
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined,
  labels: Record<string, string> = {},
): AuditChange[] {
  if (!after) return [];
  const fields: Record<string, string> = {};
  for (const key of Object.keys(after)) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (after[key] !== null && typeof after[key] === "object" && !(after[key] instanceof Date) && !Array.isArray(after[key])) continue;
    fields[key] = labels[key] || FIELD_LABELS[key] || key;
  }
  const changes = diffObjects(before || {}, after, fields);
  event.context.auditChanges = [...((event.context.auditChanges as AuditChange[]) || []), ...changes];
  return changes;
}
