/**
 * Репозиторий для итоговых решений комиссии по аттестации инструкторов
 */

import { executeQuery } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket } from "mysql2/promise";

export type AttestationDecision = "passed" | "failed" | "pending";

export interface AttestationResult {
  id: string;
  groupId: string;
  instructorId: string;
  scorePercent: number | null;
  decision: AttestationDecision;
  decidedAt: Date | null;
  decidedBy: string | null;
  notes: string | null;
  evaluationSheetFileId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Строка результата на карточке группы — существует для КАЖДОГО инструктора
 * группы, даже если он ещё не проходил тест (id/createdAt/updatedAt = null)
 */
export interface AttestationResultWithInstructor {
  id: string | null;
  groupId: string;
  instructorId: string;
  scorePercent: number | null;
  decision: AttestationDecision;
  decidedAt: Date | null;
  decidedBy: string | null;
  notes: string | null;
  evaluationSheetFileId: number | null;
  fullName: string;
  positionSnapshot: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
}

interface ResultRow extends RowDataPacket {
  id: string;
  group_id: string;
  instructor_id: string;
  score_percent: string | null;
  decision: AttestationDecision;
  decided_at: Date | null;
  decided_by: string | null;
  notes: string | null;
  evaluation_sheet_file_id: number | null;
  created_at: Date;
  updated_at: Date;
}

function mapResult(row: ResultRow): AttestationResult {
  return {
    id: row.id,
    groupId: row.group_id,
    instructorId: row.instructor_id,
    scorePercent: row.score_percent ? parseFloat(row.score_percent) : null,
    decision: row.decision,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    notes: row.notes,
    evaluationSheetFileId: row.evaluation_sheet_file_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getResultByGroupAndInstructor(
  groupId: string,
  instructorId: string
): Promise<AttestationResult | null> {
  const rows = await executeQuery<ResultRow[]>(
    "SELECT * FROM attestation_results WHERE group_id = ? AND instructor_id = ? LIMIT 1",
    [groupId, instructorId]
  );
  return rows.length ? mapResult(rows[0]) : null;
}

export async function getResultById(id: string): Promise<AttestationResult | null> {
  const rows = await executeQuery<ResultRow[]>(
    "SELECT * FROM attestation_results WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length ? mapResult(rows[0]) : null;
}

/**
 * Создаёт запись результата (pending) или обновляет счёт по лучшей попытке
 */
export async function upsertResultScore(
  groupId: string,
  instructorId: string,
  scorePercent: number
): Promise<AttestationResult> {
  const existing = await getResultByGroupAndInstructor(groupId, instructorId);
  const now = new Date();

  if (existing) {
    if (existing.decision === "pending" || (existing.scorePercent ?? -1) < scorePercent) {
      await executeQuery(
        "UPDATE attestation_results SET score_percent = ?, updated_at = ? WHERE id = ?",
        [scorePercent, now, existing.id]
      );
    }
    const updated = await getResultById(existing.id);
    return updated!;
  }

  const id = uuidv4();
  await executeQuery(
    `INSERT INTO attestation_results (id, group_id, instructor_id, score_percent, decision, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [id, groupId, instructorId, scorePercent, now, now]
  );
  const created = await getResultById(id);
  return created!;
}

export async function decideResult(
  id: string,
  data: { decision: AttestationDecision; decidedBy: string; notes?: string | null }
): Promise<AttestationResult | null> {
  await executeQuery(
    `UPDATE attestation_results
     SET decision = ?, decided_at = ?, decided_by = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [data.decision, new Date(), data.decidedBy, data.notes ?? null, new Date(), id]
  );
  return getResultById(id);
}

/**
 * Принять решение комиссии по инструктору, даже если у него ещё нет строки
 * результата (он не проходил тест) — строка создаётся автоматически
 */
export async function decideForInstructor(
  groupId: string,
  instructorId: string,
  data: { decision: AttestationDecision; decidedBy: string; notes?: string | null }
): Promise<AttestationResult> {
  const existing = await getResultByGroupAndInstructor(groupId, instructorId);
  if (existing) {
    const updated = await decideResult(existing.id, data);
    return updated!;
  }

  const id = uuidv4();
  const now = new Date();
  await executeQuery(
    `INSERT INTO attestation_results (id, group_id, instructor_id, decision, decided_at, decided_by, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, groupId, instructorId, data.decision, now, data.decidedBy, data.notes ?? null, now, now]
  );
  const created = await getResultById(id);
  return created!;
}

/**
 * Гарантирует наличие строки результата (pending) для инструктора —
 * используется перед генерацией "Оценочного листа" без готового счёта
 */
export async function ensureResultRow(groupId: string, instructorId: string): Promise<AttestationResult> {
  const existing = await getResultByGroupAndInstructor(groupId, instructorId);
  if (existing) return existing;

  const id = uuidv4();
  const now = new Date();
  await executeQuery(
    `INSERT INTO attestation_results (id, group_id, instructor_id, decision, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
    [id, groupId, instructorId, now, now]
  );
  const created = await getResultById(id);
  return created!;
}

export async function setEvaluationSheetFile(id: string, fileId: number): Promise<void> {
  await executeQuery(
    "UPDATE attestation_results SET evaluation_sheet_file_id = ?, updated_at = ? WHERE id = ?",
    [fileId, new Date(), id]
  );
}

/**
 * Результаты группы вместе с данными по инструктору (для таблицы группы/протокола)
 * Возвращает строку для КАЖДОГО инструктора группы, даже если он ещё не
 * проходил тест и решение по нему не принято.
 */
export async function getGroupResults(groupId: string): Promise<AttestationResultWithInstructor[]> {
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT
        agi.group_id,
        agi.instructor_id,
        agi.position_snapshot,
        i.full_name,
        ar.id as result_id,
        ar.score_percent,
        ar.decision,
        ar.decided_at,
        ar.decided_by,
        ar.notes,
        ar.evaluation_sheet_file_id,
        (SELECT COUNT(*) FROM attestation_test_sessions ts WHERE ts.group_id = agi.group_id AND ts.instructor_id = agi.instructor_id) as attempts,
        (SELECT MAX(ts.started_at) FROM attestation_test_sessions ts WHERE ts.group_id = agi.group_id AND ts.instructor_id = agi.instructor_id) as last_attempt_at
     FROM attestation_group_instructors agi
     JOIN instructors i ON agi.instructor_id = i.id
     LEFT JOIN attestation_results ar ON ar.group_id = agi.group_id AND ar.instructor_id = agi.instructor_id
     WHERE agi.group_id = ?
     ORDER BY i.full_name ASC`,
    [groupId]
  );

  return rows.map((row) => ({
    id: row.result_id ?? null,
    groupId: row.group_id,
    instructorId: row.instructor_id,
    scorePercent: row.score_percent ? parseFloat(row.score_percent) : null,
    decision: (row.decision as AttestationDecision) ?? "pending",
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    notes: row.notes,
    evaluationSheetFileId: row.evaluation_sheet_file_id,
    fullName: row.full_name,
    positionSnapshot: row.position_snapshot,
    attempts: row.attempts || 0,
    lastAttemptAt: row.last_attempt_at,
  }));
}

/**
 * Общая ведомость по всем группам (журнал аттестации)
 */
export async function getAttestationJournal(filters: {
  groupId?: string;
  decision?: AttestationDecision;
} = {}) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.groupId) {
    conditions.push("ar.group_id = ?");
    params.push(filters.groupId);
  }
  if (filters.decision) {
    conditions.push("ar.decision = ?");
    params.push(filters.decision);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT
        ar.*,
        i.full_name,
        ag.code as group_code,
        ag.name as group_name,
        ag.exam_start,
        ag.status as group_status
     FROM attestation_results ar
     JOIN instructors i ON ar.instructor_id = i.id
     JOIN attestation_groups ag ON ar.group_id = ag.id
     ${whereClause}
     ORDER BY ag.exam_start DESC, i.full_name ASC`,
    params
  );

  return rows.map((row) => ({
    ...mapResult(row as ResultRow),
    fullName: row.full_name,
    groupCode: row.group_code,
    groupName: row.group_name,
    examStart: row.exam_start,
    groupStatus: row.group_status,
  }));
}
