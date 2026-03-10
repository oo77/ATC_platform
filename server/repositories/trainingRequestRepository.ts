import { executeQuery } from "../utils/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// ТИПЫ
// ============================================================================

export type TrainingRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_progress"
  | "completed";

export type ContractStatus = "not_signed" | "signed";
export type PaymentStatus = "not_paid" | "paid";

/** Одна позиция заявки: курс + группа слушателей + месяц */
export interface TrainingRequestItem {
  id: string;
  requestId: string;
  courseId: string;
  courseName: string;
  trainingMonth: string; // 'YYYY-MM'
  studentIds: string[];
  studentsCount: number;
  groupLabel: string | null;
  sortOrder: number;
  createdAt: Date;
}

/** Входные данные для одной позиции */
export interface TrainingRequestItemInput {
  courseId: string;
  courseName: string;
  trainingMonth: string;
  studentIds: string[];
  groupLabel?: string;
  sortOrder?: number;
}

/** Заголовок заявки */
export interface TrainingRequest {
  id: string;
  representativeId: string;
  representativeName?: string;
  organizationId: string;
  organizationName?: string;
  totalItemsCount: number;
  totalStudentsCount: number;
  status: TrainingRequestStatus;
  contractStatus: ContractStatus;
  paymentStatus: PaymentStatus;
  adminComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewedByName?: string;
  items?: TrainingRequestItem[];
}

/** Входные данные для создания заявки */
export interface CreateTrainingRequestInput {
  representativeId: string;
  organizationId: string;
  items: TrainingRequestItemInput[];
}

/** Параметры обновления заявки (admin) */
export interface UpdateTrainingRequestInput {
  status?: TrainingRequestStatus;
  contractStatus?: ContractStatus;
  paymentStatus?: PaymentStatus;
  adminComment?: string;
  reviewedBy?: string;
}

/** Параметры пагинации / фильтрации */
export interface TrainingRequestFilters {
  page?: number;
  limit?: number;
  status?: TrainingRequestStatus;
  organizationId?: string;
  representativeId?: string;
  courseId?: string;
  month?: string; // 'YYYY-MM'
  year?: string;  // 'YYYY'
}

export interface PaginatedTrainingRequests {
  data: TrainingRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface TrainingRequestRow extends RowDataPacket {
  id: string;
  representative_id: string;
  representative_name?: string;
  organization_id: string;
  organization_name?: string;
  total_items_count: number;
  total_students_count: number;
  status: TrainingRequestStatus;
  contract_status: ContractStatus;
  payment_status: PaymentStatus;
  admin_comment: string | null;
  created_at: Date;
  updated_at: Date;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  reviewed_by_name?: string;
}

interface TrainingRequestItemRow extends RowDataPacket {
  id: string;
  request_id: string;
  course_id: string;
  course_name: string;
  training_month: string;
  student_ids: string; // JSON string
  students_count: number;
  group_label: string | null;
  sort_order: number;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToRequest(row: TrainingRequestRow): TrainingRequest {
  return {
    id: row.id,
    representativeId: row.representative_id,
    representativeName: row.representative_name,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    totalItemsCount: Number(row.total_items_count) || 0,
    totalStudentsCount: Number(row.total_students_count) || 0,
    status: row.status,
    contractStatus: row.contract_status,
    paymentStatus: row.payment_status,
    adminComment: row.admin_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewed_by_name,
  };
}

function mapRowToItem(row: TrainingRequestItemRow): TrainingRequestItem {
  let studentIds: string[] = [];
  try {
    const parsed = typeof row.student_ids === "string"
      ? JSON.parse(row.student_ids)
      : row.student_ids;
    studentIds = Array.isArray(parsed) ? parsed : [];
  } catch {
    studentIds = [];
  }

  return {
    id: row.id,
    requestId: row.request_id,
    courseId: row.course_id,
    courseName: row.course_name,
    trainingMonth: row.training_month,
    studentIds,
    studentsCount: Number(row.students_count) || 0,
    groupLabel: row.group_label,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
  };
}

// ============================================================================
// ПУБЛИЧНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Создать заявку с позициями (транзакционно)
 */
export async function createTrainingRequest(
  data: CreateTrainingRequestInput,
): Promise<TrainingRequest> {
  if (!data.items || data.items.length === 0) {
    throw new Error("Заявка должна содержать хотя бы одну позицию");
  }

  const requestId = uuidv4();
  const now = new Date();

  // Подсчёт агрегированных данных
  const totalStudents = data.items.reduce(
    (sum, item) => sum + item.studentIds.length,
    0,
  );

  await executeQuery(
    `INSERT INTO training_requests
       (id, representative_id, organization_id,
        total_items_count, total_students_count,
        status, contract_status, payment_status,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 'not_signed', 'not_paid', ?, ?)`,
    [
      requestId,
      data.representativeId,
      data.organizationId,
      data.items.length,
      totalStudents,
      now,
      now,
    ],
  );

  // Вставка позиций
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const itemId = uuidv4();
    await executeQuery(
      `INSERT INTO training_request_items
         (id, request_id, course_id, course_name, training_month,
          student_ids, students_count, group_label, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        requestId,
        item.courseId,
        item.courseName,
        item.trainingMonth,
        JSON.stringify(item.studentIds),
        item.studentIds.length,
        item.groupLabel || null,
        item.sortOrder ?? i,
        now,
      ],
    );
  }

  const result = await getTrainingRequestById(requestId);
  if (!result) throw new Error("Не удалось создать заявку");
  return result;
}

/**
 * Получить заявку по ID (с позициями)
 */
export async function getTrainingRequestById(
  id: string,
): Promise<TrainingRequest | null> {
  const rows = await executeQuery<TrainingRequestRow[]>(
    `SELECT
       tr.*,
       r.full_name  AS representative_name,
       o.name       AS organization_name,
       u.name       AS reviewed_by_name
     FROM training_requests tr
     LEFT JOIN organization_representatives r ON tr.representative_id = r.id
     LEFT JOIN organizations o                ON tr.organization_id   = o.id
     LEFT JOIN users u                        ON tr.reviewed_by       = u.id
     WHERE tr.id = ?
     LIMIT 1`,
    [id],
  );

  if (rows.length === 0) return null;

  const request = mapRowToRequest(rows[0]);
  request.items = await getItemsByRequestId(id);
  return request;
}

/**
 * Получить позиции заявки
 */
export async function getItemsByRequestId(
  requestId: string,
): Promise<TrainingRequestItem[]> {
  const rows = await executeQuery<TrainingRequestItemRow[]>(
    `SELECT * FROM training_request_items
     WHERE request_id = ?
     ORDER BY sort_order ASC, created_at ASC`,
    [requestId],
  );
  return rows.map(mapRowToItem);
}

/**
 * Получить все заявки конкретного представителя
 */
export async function getRequestsByRepresentative(
  representativeId: string,
): Promise<TrainingRequest[]> {
  const rows = await executeQuery<TrainingRequestRow[]>(
    `SELECT
       tr.*,
       r.full_name AS representative_name,
       o.name      AS organization_name
     FROM training_requests tr
     LEFT JOIN organization_representatives r ON tr.representative_id = r.id
     LEFT JOIN organizations o                ON tr.organization_id   = o.id
     WHERE tr.representative_id = ?
     ORDER BY tr.created_at DESC`,
    [representativeId],
  );

  const requests = rows.map(mapRowToRequest);

  // Загружаем позиции для каждой заявки
  for (const req of requests) {
    req.items = await getItemsByRequestId(req.id);
  }

  return requests;
}

/**
 * Получить все заявки с пагинацией (Admin)
 */
export async function getTrainingRequestsPaginated(
  params: TrainingRequestFilters = {},
): Promise<PaginatedTrainingRequests> {
  const {
    page = 1,
    limit = 20,
    status,
    organizationId,
    representativeId,
    courseId,
    month,
    year,
  } = params;

  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (status) {
    conditions.push("tr.status = ?");
    queryParams.push(status);
  }
  if (organizationId) {
    conditions.push("tr.organization_id = ?");
    queryParams.push(organizationId);
  }
  if (representativeId) {
    conditions.push("tr.representative_id = ?");
    queryParams.push(representativeId);
  }
  // Фильтр по курсу — через подзапрос к items
  if (courseId) {
    conditions.push(
      "EXISTS (SELECT 1 FROM training_request_items i WHERE i.request_id = tr.id AND i.course_id = ?)",
    );
    queryParams.push(courseId);
  }
  // Фильтр по конкретному месяцу
  if (month) {
    conditions.push(
      "EXISTS (SELECT 1 FROM training_request_items i WHERE i.request_id = tr.id AND i.training_month = ?)",
    );
    queryParams.push(month);
  }
  // Фильтр по году
  if (year) {
    conditions.push(
      "EXISTS (SELECT 1 FROM training_request_items i WHERE i.request_id = tr.id AND i.training_month LIKE ?)",
    );
    queryParams.push(`${year}-%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM training_requests tr ${whereClause}`,
    queryParams,
  );
  const total = countResult[0]?.total || 0;

  const offset = (page - 1) * limit;
  const rows = await executeQuery<TrainingRequestRow[]>(
    `SELECT
       tr.*,
       r.full_name AS representative_name,
       o.name      AS organization_name,
       u.name      AS reviewed_by_name
     FROM training_requests tr
     LEFT JOIN organization_representatives r ON tr.representative_id = r.id
     LEFT JOIN organizations o                ON tr.organization_id   = o.id
     LEFT JOIN users u                        ON tr.reviewed_by       = u.id
     ${whereClause}
     ORDER BY
       CASE tr.status WHEN 'pending' THEN 0 ELSE 1 END,
       tr.created_at DESC
     LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset],
  );

  const data = rows.map(mapRowToRequest);

  // Загружаем позиции для каждой заявки
  for (const req of data) {
    req.items = await getItemsByRequestId(req.id);
  }

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Обновить статусы заявки (Admin)
 */
export async function updateTrainingRequest(
  id: string,
  data: UpdateTrainingRequestInput,
  userId: string,
): Promise<TrainingRequest | null> {
  const updates: string[] = ["updated_at = ?"];
  const params: any[] = [new Date()];

  if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);
    // При смене статуса — фиксируем ревьюера и время
    updates.push("reviewed_by = ?", "reviewed_at = ?");
    params.push(userId, new Date());
  }
  if (data.contractStatus !== undefined) {
    updates.push("contract_status = ?");
    params.push(data.contractStatus);
  }
  if (data.paymentStatus !== undefined) {
    updates.push("payment_status = ?");
    params.push(data.paymentStatus);
  }
  if (data.adminComment !== undefined) {
    updates.push("admin_comment = ?");
    params.push(data.adminComment);
  }

  params.push(id);

  await executeQuery(
    `UPDATE training_requests SET ${updates.join(", ")} WHERE id = ?`,
    params,
  );

  return getTrainingRequestById(id);
}

/**
 * Аналитика: группировка по месяцам
 */
export async function getStatsByMonth(year?: string): Promise<
  { month: string; totalRequests: number; totalStudents: number }[]
> {
  const yearFilter = year ? `AND i.training_month LIKE '${year}-%'` : "";
  const rows = await executeQuery<
    (RowDataPacket & {
      month: string;
      totalRequests: number;
      totalStudents: number;
    })[]
  >(
    `SELECT
       i.training_month        AS month,
       COUNT(DISTINCT tr.id)   AS totalRequests,
       SUM(i.students_count)   AS totalStudents
     FROM training_request_items i
     JOIN training_requests tr ON i.request_id = tr.id
     WHERE 1=1 ${yearFilter}
     GROUP BY i.training_month
     ORDER BY i.training_month ASC`,
  );
  return rows.map((r) => ({
    month: r.month,
    totalRequests: Number(r.totalRequests) || 0,
    totalStudents: Number(r.totalStudents) || 0,
  }));
}

/**
 * Аналитика: группировка по курсам
 */
export async function getStatsByCourse(): Promise<
  {
    courseId: string;
    courseName: string;
    totalRequests: number;
    totalStudents: number;
  }[]
> {
  const rows = await executeQuery<
    (RowDataPacket & {
      courseId: string;
      courseName: string;
      totalRequests: number;
      totalStudents: number;
    })[]
  >(
    `SELECT
       i.course_id             AS courseId,
       i.course_name           AS courseName,
       COUNT(DISTINCT tr.id)   AS totalRequests,
       SUM(i.students_count)   AS totalStudents
     FROM training_request_items i
     JOIN training_requests tr ON i.request_id = tr.id
     GROUP BY i.course_id, i.course_name
     ORDER BY totalRequests DESC`,
  );
  return rows.map((r) => ({
    courseId: r.courseId,
    courseName: r.courseName,
    totalRequests: Number(r.totalRequests) || 0,
    totalStudents: Number(r.totalStudents) || 0,
  }));
}

/**
 * Аналитика: итоговые счётчики по статусам
 */
export async function getStatusTotals(): Promise<
  Record<TrainingRequestStatus, number> & { total: number }
> {
  const rows = await executeQuery<
    (RowDataPacket & { status: TrainingRequestStatus; count: number })[]
  >(
    `SELECT status, COUNT(*) as count FROM training_requests GROUP BY status`,
  );

  const result = {
    pending: 0,
    approved: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
    total: 0,
  };

  for (const row of rows) {
    result[row.status] = Number(row.count) || 0;
    result.total += Number(row.count) || 0;
  }

  return result;
}
