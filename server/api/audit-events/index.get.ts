/**
 * GET /api/audit-events — журнал аудита с фильтрами.
 * Query: page, limit, q (поиск по описанию/объекту/пользователю), actorId, category,
 *        outcome, entityType, entityId, action, requestId, from, to (YYYY-MM-DD), format=csv
 * Доступ: logs:view. Выгрузка журнала сама фиксируется в журнале.
 */
import { Permission, requirePermission } from "../../utils/permissions";
import { executeQuery } from "../../utils/db";
import { audit } from "../../utils/audit";

const CATEGORIES = new Set(["auth", "access", "data", "security", "system"]);
const OUTCOMES = new Set(["success", "denied", "failed"]);

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.LOGS_VIEW);
  const q = getQuery(event);

  const where: string[] = [];
  const params: any[] = [];
  const add = (sql: string, ...values: any[]) => {
    where.push(sql);
    params.push(...values);
  };

  if (q.q) {
    const like = `%${String(q.q).slice(0, 100)}%`;
    add("(summary LIKE ? OR entity_label LIKE ? OR actor_name LIKE ? OR http_path LIKE ?)", like, like, like, like);
  }
  if (q.actorId) add("actor_user_id = ?", String(q.actorId));
  if (q.category && CATEGORIES.has(String(q.category))) add("category = ?", String(q.category));
  if (q.outcome && OUTCOMES.has(String(q.outcome))) add("outcome = ?", String(q.outcome));
  if (q.entityType) add("entity_type = ?", String(q.entityType));
  if (q.entityId) add("entity_id = ?", String(q.entityId));
  // Префикс действия; % и _ экранируем (в именах действий есть подчёркивания: auth.login_failed)
  if (q.action) add("action LIKE ? ESCAPE '\\\\'", `${String(q.action).replace(/[\\%_]/g, (m) => "\\" + m)}%`);
  if (q.requestId) add("request_id = ?", String(q.requestId));
  if (q.source) add("source = ?", String(q.source));
  if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(String(q.from))) add("occurred_at >= ?", `${q.from} 00:00:00`);
  if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(String(q.to))) add("occurred_at <= ?", `${q.to} 23:59:59.999`);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const isCsv = q.format === "csv";
  const limit = isCsv ? 10000 : Math.min(Math.max(parseInt(String(q.limit || "50"), 10) || 50, 1), 200);
  const page = Math.max(parseInt(String(q.page || "1"), 10) || 1, 1);
  const offset = isCsv ? 0 : (page - 1) * limit;

  let rows: any[] = [];
  let total = 0;
  try {
    rows = await executeQuery<any[]>(
      `SELECT id, occurred_at, request_id, actor_user_id, actor_name, actor_role_name, source, action,
              category, entity_type, entity_id, entity_label, outcome, summary, changes, metadata,
              ip_address, user_agent, http_method, http_path, http_status
         FROM audit_events ${whereSql}
        ORDER BY occurred_at DESC, id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    const countRows = await executeQuery<any[]>(`SELECT COUNT(*) AS cnt FROM audit_events ${whereSql}`, params);
    total = Number(countRows[0]?.cnt || 0);
  } catch (error: any) {
    if (error?.code === "ER_NO_SUCH_TABLE") {
      return { success: true, events: [], total: 0, page, limit, migrationRequired: true };
    }
    throw error;
  }

  const parse = (v: any) => {
    if (v == null) return null;
    if (typeof v === "object") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  };
  const events = rows.map((r) => ({
    id: Number(r.id),
    occurredAt: r.occurred_at,
    requestId: r.request_id,
    actorId: r.actor_user_id,
    actorName: r.actor_name,
    actorRole: r.actor_role_name,
    source: r.source,
    action: r.action,
    category: r.category,
    entityType: r.entity_type,
    entityId: r.entity_id,
    entityLabel: r.entity_label,
    outcome: r.outcome,
    summary: r.summary,
    changes: parse(r.changes),
    metadata: parse(r.metadata),
    ip: r.ip_address,
    userAgent: r.user_agent,
    method: r.http_method,
    path: r.http_path,
    status: r.http_status,
  }));

  if (isCsv) {
    await audit(event, {
      action: "audit.export",
      category: "access",
      summary: `Выгрузил журнал аудита (${events.length} записей)`,
      metadata: { filters: q },
    });
    const header = ["Время", "Пользователь", "Роль", "Действие", "Описание", "Объект", "Результат", "Изменения", "IP", "Запрос"];
    const lines = [header.join(";")];
    for (const e of events) {
      lines.push(
        [
          new Date(e.occurredAt).toISOString(),
          e.actorName,
          e.actorRole,
          e.action,
          e.summary,
          [e.entityType, e.entityLabel || e.entityId].filter(Boolean).join(": "),
          e.outcome,
          e.changes,
          e.ip,
          [e.method, e.path, e.status].filter(Boolean).join(" "),
        ].map(csvCell).join(";"),
      );
    }
    setHeader(event, "Content-Type", "text/csv; charset=utf-8");
    setHeader(event, "Content-Disposition", `attachment; filename="audit_${new Date().toISOString().slice(0, 10)}.csv"`);
    return "﻿" + lines.join("\n");
  }

  return { success: true, events, total, page, limit };
});
