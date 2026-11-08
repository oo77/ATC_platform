/**
 * Проверка доступа к конкретным объектам (владелец / право просмотра чужих).
 *
 * Дополняет requirePermission(): разрешение говорит «что можно делать»,
 * эти функции — «с каким именно объектом».
 */

import { createError, type H3Event } from "h3";
import { executeQuery } from "./db";
import {
  Permission,
  canAccessGroup,
  canAccessStudent,
  getInstructorByUserId,
  requireAnyPermission,
  requireAuthContext,
  roleHasPermission,
  type PermissionContext,
} from "./permissions";

function forbidden(message: string): never {
  throw createError({ statusCode: 403, statusMessage: "Forbidden", message });
}

function notFound(message: string): never {
  throw createError({ statusCode: 404, statusMessage: "Not Found", message });
}

/**
 * Сессия тестирования слушателя.
 *
 * - mode "owner": только сам слушатель (или автор preview-сессии) — ответы, завершение, нарушения
 * - mode "read":  владелец, либо пользователь с правом просмотра результатов
 *                 (преподаватель — только по своим группам)
 */
export async function requireTestSessionAccess(
  event: H3Event,
  sessionId: string,
  mode: "owner" | "read",
): Promise<PermissionContext> {
  const ctx = await requireAuthContext(event);

  const rows = await executeQuery<any[]>(
    `SELECT ts.is_preview, ts.preview_user_id, s.user_id AS student_user_id, ta.group_id
       FROM test_sessions ts
       LEFT JOIN students s ON s.id = ts.student_id
       LEFT JOIN test_assignments ta ON ta.id = ts.assignment_id
      WHERE ts.id = ?
      LIMIT 1`,
    [sessionId],
  );
  const row = rows[0];
  if (!row) notFound("Сессия не найдена");

  const isOwner =
    (row.is_preview && row.preview_user_id === ctx.userId) ||
    (!!row.student_user_id && row.student_user_id === ctx.userId);
  if (isOwner) return ctx;

  if (mode === "read" && roleHasPermission(ctx, Permission.TESTS_VIEW_RESULTS)) {
    if (row.is_preview) {
      // Чужие preview-сессии видят только те, кто управляет шаблонами
      if (roleHasPermission(ctx, Permission.TEST_TEMPLATES_MANAGE)) return ctx;
    } else if (row.group_id && (await canAccessGroup(ctx, row.group_id))) {
      return ctx;
    }
  }

  forbidden("Нет доступа к этой сессии тестирования");
}

/**
 * Сессия аттестационного теста инструктора.
 *
 * - mode "owner": только сам аттестуемый инструктор
 * - mode "read":  владелец или пользователь с правом просмотра аттестации
 */
export async function requireAttestationSessionAccess(
  event: H3Event,
  sessionId: string,
  mode: "owner" | "read",
): Promise<PermissionContext> {
  const ctx = await requireAuthContext(event);

  const rows = await executeQuery<any[]>(
    `SELECT i.user_id AS instructor_user_id
       FROM attestation_test_sessions ats
       LEFT JOIN instructors i ON i.id = ats.instructor_id
      WHERE ats.id = ?
      LIMIT 1`,
    [sessionId],
  );
  const row = rows[0];
  if (!row) notFound("Сессия не найдена");

  if (row.instructor_user_id && row.instructor_user_id === ctx.userId) return ctx;

  if (
    mode === "read" &&
    (roleHasPermission(ctx, Permission.ATTESTATION_VIEW) ||
      roleHasPermission(ctx, Permission.ATTESTATION_MANAGE))
  ) {
    return ctx;
  }

  forbidden("Нет доступа к этой сессии аттестации");
}

/**
 * Одно из разрешений + доступ к конкретной группе
 * (сотрудник со всеми группами — любая группа, преподаватель — свои, слушатель — своя).
 */
export async function requireGroupPermission(
  event: H3Event,
  groupId: string | undefined | null,
  permissions: Permission[],
): Promise<PermissionContext> {
  const ctx = await requireAnyPermission(event, permissions);
  if (!groupId) {
    throw createError({ statusCode: 400, message: "Не указан ID группы" });
  }
  if (!(await canAccessGroup(ctx, groupId))) {
    forbidden("Нет доступа к данной группе");
  }
  return ctx;
}

/**
 * Одно из разрешений + доступ к группе занятия расписания
 */
export async function requireScheduleEventPermission(
  event: H3Event,
  scheduleEventId: string | undefined | null,
  permissions: Permission[],
): Promise<PermissionContext> {
  const ctx = await requireAnyPermission(event, permissions);
  if (!scheduleEventId) {
    throw createError({ statusCode: 400, message: "Не указан ID занятия" });
  }
  const rows = await executeQuery<any[]>(
    "SELECT group_id FROM schedule_events WHERE id = ? LIMIT 1",
    [scheduleEventId],
  );
  const row = rows[0];
  if (!row) notFound("Занятие не найдено");
  if (row.group_id && !(await canAccessGroup(ctx, row.group_id))) {
    forbidden("Нет доступа к группе этого занятия");
  }
  return ctx;
}

/**
 * Данные инструктора: сам инструктор (по привязке user_id) или пользователь с правом
 */
export async function requireInstructorSelfOrPermission(
  event: H3Event,
  instructorId: string | undefined | null,
  permission: Permission,
): Promise<PermissionContext> {
  const ctx = await requireAuthContext(event);
  if (roleHasPermission(ctx, permission)) return ctx;
  if (instructorId) {
    const own = await getInstructorByUserId(ctx.userId);
    if (own && own.id === instructorId) return ctx;
  }
  forbidden("Нет доступа к данным этого инструктора");
}

/**
 * Скачивание/просмотр конкретного выданного сертификата.
 * Доступ: все сертификаты (certificates:view_all / issue), сам слушатель,
 * преподаватель — по слушателям своих групп, инструктор — свой сертификат аттестации,
 * просмотр аттестации — сертификаты аттестации.
 */
export async function requireIssuedCertificateAccess(
  event: H3Event,
  certificate: { studentId: string | null; instructorId: string | null },
): Promise<PermissionContext> {
  const ctx = await requireAuthContext(event);
  if (
    roleHasPermission(ctx, Permission.CERTIFICATES_VIEW_ALL) ||
    roleHasPermission(ctx, Permission.CERTIFICATES_ISSUE)
  ) {
    return ctx;
  }

  if (certificate.studentId) {
    const rows = await executeQuery<any[]>(
      "SELECT user_id FROM students WHERE id = ? LIMIT 1",
      [certificate.studentId],
    );
    if (rows[0]?.user_id && rows[0].user_id === ctx.userId) return ctx;
    if (await canAccessStudent(ctx, certificate.studentId)) return ctx;
  }

  if (certificate.instructorId) {
    const own = await getInstructorByUserId(ctx.userId);
    if (own && own.id === certificate.instructorId) return ctx;
    if (
      roleHasPermission(ctx, Permission.ATTESTATION_VIEW) ||
      roleHasPermission(ctx, Permission.ATTESTATION_MANAGE)
    ) {
      return ctx;
    }
  }

  forbidden("Нет доступа к этому сертификату");
}

/**
 * Назначение теста группе.
 * - "manage": назначать/удалять — TESTS_ASSIGN и доступ к группе назначения
 * - "read":   смотреть — TESTS_TAKE / TESTS_ASSIGN / TESTS_VIEW_RESULTS и доступ к группе
 *             (слушатель — своя группа, преподаватель — свои группы)
 */
export async function requireTestAssignmentAccess(
  event: H3Event,
  assignmentId: string | undefined | null,
  mode: "manage" | "read",
): Promise<PermissionContext> {
  const ctx = await requireAnyPermission(
    event,
    mode === "manage"
      ? [Permission.TESTS_ASSIGN]
      : [Permission.TESTS_TAKE, Permission.TESTS_ASSIGN, Permission.TESTS_VIEW_RESULTS],
  );
  if (!assignmentId) {
    throw createError({ statusCode: 400, message: "Не указан ID назначения" });
  }
  const rows = await executeQuery<any[]>(
    "SELECT group_id FROM test_assignments WHERE id = ? LIMIT 1",
    [assignmentId],
  );
  const row = rows[0];
  if (!row) notFound("Назначение не найдено");
  if (!(await canAccessGroup(ctx, row.group_id))) {
    forbidden("Нет доступа к назначению этой группы");
  }
  return ctx;
}

/**
 * Дополнительные проверки при выставлении оценок:
 *  - все слушатели должны состоять в группе;
 *  - пользователь без доступа ко всем группам (преподаватель) работает только со своим
 *    занятием (schedule_events.instructor_id) или своей дисциплиной (discipline_instructors).
 */
export async function assertGradeTargets(
  ctx: PermissionContext,
  opts: {
    groupId: string;
    studentIds: string[];
    scheduleEventId?: string;
    disciplineId?: string;
  },
): Promise<void> {
  const ids = [...new Set(opts.studentIds.filter(Boolean).map(String))];
  if (ids.length) {
    const rows = await executeQuery<any[]>(
      `SELECT student_id FROM study_group_students WHERE group_id = ? AND student_id IN (${ids.map(() => "?").join(",")})`,
      [opts.groupId, ...ids],
    );
    if (rows.length !== ids.length) {
      forbidden("Оценку можно поставить только слушателю этой группы");
    }
  }

  if (roleHasPermission(ctx, Permission.GROUPS_VIEW_ALL)) return;
  if (!ctx.instructorId) forbidden("Оценки ставит назначенный инструктор");

  if (opts.scheduleEventId) {
    const rows = await executeQuery<any[]>(
      "SELECT instructor_id FROM schedule_events WHERE id = ? LIMIT 1",
      [opts.scheduleEventId],
    );
    if (rows[0]?.instructor_id !== ctx.instructorId) {
      forbidden("Вы не назначены инструктором на это занятие");
    }
  }
  if (opts.disciplineId) {
    const rows = await executeQuery<any[]>(
      "SELECT 1 FROM discipline_instructors WHERE discipline_id = ? AND instructor_id = ? LIMIT 1",
      [opts.disciplineId, ctx.instructorId],
    );
    if (rows.length === 0) forbidden("Вы не ведёте эту дисциплину");
  }
}
