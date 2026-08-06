/**
 * Репозиторий для работы с организациями в MySQL
 * Управление организациями слушателей
 */

import { executeQuery, executeTransaction } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface Organization {
  id: string;
  code: string;
  inn: string | null;
  name: string; // Основное название (обычно RU)
  nameUz: string | null;
  nameEn: string | null;
  nameRu: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactPerson: string | null;
  address: string | null;
  legalAddress: string | null;
  mfo: string | null;
  accountNumber: string | null;
  oked: string | null;
  description: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Статистика сертификатов
  totalCertificates?: number;
  issuedCertificates?: number;
  revokedCertificates?: number;
  latestCertificateDate?: Date | null;
}

export interface CreateOrganizationInput {
  code?: string;
  inn?: string;
  name: string;
  nameUz?: string;
  nameEn?: string;
  nameRu?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPerson?: string;
  address?: string;
  legalAddress?: string;
  mfo?: string;
  accountNumber?: string;
  oked?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateOrganizationInput {
  code?: string;
  inn?: string | null;
  name?: string;
  nameUz?: string | null;
  nameEn?: string | null;
  nameRu?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  legalAddress?: string | null;
  mfo?: string | null;
  accountNumber?: string | null;
  oked?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface OrganizationFilters {
  search?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  filters?: OrganizationFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface OrganizationRow extends RowDataPacket {
  id: string;
  code: string;
  inn: string | null;
  name: string;
  name_uz: string | null;
  name_en: string | null;
  name_ru: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_person: string | null;
  address: string | null;
  legal_address: string | null;
  mfo: string | null;
  account_number: string | null;
  oked: string | null;
  description: string | null;
  is_active: boolean | number;
  students_count: number;
  created_at: Date;
  updated_at: Date;
  // Статистика сертификатов (из JOIN)
  total_certs?: number;
  issued_certs?: number;
  revoked_certs?: number;
  latest_cert_date?: Date | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ БД -> МОДЕЛЬ
// ============================================================================

function mapRowToOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    code: row.code,
    inn: row.inn || null,
    name: row.name,
    nameUz: row.name_uz,
    nameEn: row.name_en,
    nameRu: row.name_ru,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    contactPerson: row.contact_person || null,
    address: row.address,
    legalAddress: row.legal_address || null,
    mfo: row.mfo || null,
    accountNumber: row.account_number || null,
    oked: row.oked || null,
    description: row.description,
    isActive: Boolean(row.is_active),
    studentsCount: row.students_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalCertificates: row.total_certs !== undefined ? Number(row.total_certs) : undefined,
    issuedCertificates: row.issued_certs !== undefined ? Number(row.issued_certs) : undefined,
    revokedCertificates: row.revoked_certs !== undefined ? Number(row.revoked_certs) : undefined,
    latestCertificateDate: row.latest_cert_date || null,
  };
}

/**
 * Генерирует код организации из названия
 */
function generateCodeFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s]/gi, "")
      .replace(/\s+/g, "_")
      .substring(0, 100) || uuidv4().substring(0, 8)
  );
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить все организации
 */
export async function getAllOrganizations(): Promise<Organization[]> {
  const rows = await executeQuery<OrganizationRow[]>(`
    SELECT 
      o.*,
      COUNT(DISTINCT ic.id) as total_certs,
      SUM(CASE WHEN ic.status = 'issued' THEN 1 ELSE 0 END) as issued_certs,
      SUM(CASE WHEN ic.status = 'revoked' THEN 1 ELSE 0 END) as revoked_certs,
      MAX(ic.issue_date) as latest_cert_date
    FROM organizations o
    LEFT JOIN students s ON s.organization_id = o.id
    LEFT JOIN issued_certificates ic ON ic.student_id = s.id
    GROUP BY o.id
    ORDER BY o.name ASC
  `);
  return rows.map(mapRowToOrganization);
}

/**
 * Получить организации с пагинацией и фильтрами
 */
export async function getOrganizationsPaginated(
  params: PaginationParams = {},
): Promise<PaginatedResult<Organization>> {
  const { page = 1, limit = 20, filters = {} } = params;
  const offset = (page - 1) * limit;
  const { search, isActive } = filters;

  // Строим WHERE условия
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (search) {
    conditions.push(
      "(o.name LIKE ? OR o.name_uz LIKE ? OR o.name_en LIKE ? OR o.name_ru LIKE ? OR o.code LIKE ? OR o.inn LIKE ? OR o.contact_person LIKE ?)",
    );
    const searchPattern = `%${search}%`;
    queryParams.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    );
  }

  if (isActive !== undefined) {
    conditions.push("o.is_active = ?");
    queryParams.push(isActive);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Получаем общее количество
  const countQuery = `SELECT COUNT(*) as total FROM organizations o ${whereClause}`;
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Получаем данные с пагинацией
  const dataQuery = `
    SELECT 
      o.*,
      COUNT(DISTINCT ic.id) as total_certs,
      SUM(CASE WHEN ic.status = 'issued' THEN 1 ELSE 0 END) as issued_certs,
      SUM(CASE WHEN ic.status = 'revoked' THEN 1 ELSE 0 END) as revoked_certs,
      MAX(ic.issue_date) as latest_cert_date
    FROM organizations o
    LEFT JOIN students s ON s.organization_id = o.id
    LEFT JOIN issued_certificates ic ON ic.student_id = s.id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.name ASC
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery<OrganizationRow[]>(dataQuery, [
    ...queryParams,
    limit,
    offset,
  ]);

  return {
    data: rows.map(mapRowToOrganization),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получить организацию по ID
 */
export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  const rows = await executeQuery<OrganizationRow[]>(
    "SELECT * FROM organizations WHERE id = ?",
    [id],
  );
  return rows.length > 0 ? mapRowToOrganization(rows[0]) : null;
}

/**
 * Получить организацию по ИНН
 */
export async function getOrganizationByInn(
  inn: string,
): Promise<Organization | null> {
  const rows = await executeQuery<OrganizationRow[]>(
    "SELECT * FROM organizations WHERE inn = ?",
    [inn.trim()],
  );
  return rows.length > 0 ? mapRowToOrganization(rows[0]) : null;
}

/**
 * Получить организацию по коду
 */
export async function getOrganizationByCode(
  code: string,
): Promise<Organization | null> {
  const rows = await executeQuery<OrganizationRow[]>(
    "SELECT * FROM organizations WHERE code = ?",
    [code],
  );
  return rows.length > 0 ? mapRowToOrganization(rows[0]) : null;
}

/**
 * Получить организацию по названию (точное совпадение)
 */
export async function getOrganizationByName(
  name: string,
): Promise<Organization | null> {
  const rows = await executeQuery<OrganizationRow[]>(
    "SELECT * FROM organizations WHERE name = ?",
    [name.trim()],
  );
  return rows.length > 0 ? mapRowToOrganization(rows[0]) : null;
}

/**
 * Поиск организаций по названию или ИНН (для автокомплита)
 */
export async function searchOrganizations(
  query: string,
  limit: number = 10,
): Promise<Organization[]> {
  const rows = await executeQuery<OrganizationRow[]>(
    `SELECT * FROM organizations 
     WHERE name LIKE ? OR name_uz LIKE ? OR name_en LIKE ? OR name_ru LIKE ? OR inn LIKE ?
     ORDER BY name ASC
     LIMIT ?`,
    [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit],
  );
  return rows.map(mapRowToOrganization);
}

/**
 * Проверить существование кода организации
 */
export async function organizationCodeExists(
  code: string,
  excludeId?: string,
): Promise<boolean> {
  let query = "SELECT COUNT(*) as total FROM organizations WHERE code = ?";
  const params: any[] = [code];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const result = await executeQuery<CountRow[]>(query, params);
  return (result[0]?.total || 0) > 0;
}

/**
 * Проверить существование ИНН организации
 */
export async function organizationInnExists(
  inn: string,
  excludeId?: string,
): Promise<boolean> {
  if (!inn || !inn.trim()) return false;
  let query = "SELECT COUNT(*) as total FROM organizations WHERE inn = ?";
  const params: any[] = [inn.trim()];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const result = await executeQuery<CountRow[]>(query, params);
  return (result[0]?.total || 0) > 0;
}

/**
 * Создать новую организацию
 */
export async function createOrganization(
  data: CreateOrganizationInput,
): Promise<Organization> {
  const id = uuidv4();
  const now = new Date();

  // Генерируем код если не указан
  let code = data.code?.trim();
  if (!code) {
    code = generateCodeFromName(data.name);
    // Проверяем уникальность и добавляем суффикс если нужно
    let suffix = 0;
    let finalCode = code;
    while (await organizationCodeExists(finalCode)) {
      suffix++;
      finalCode = `${code}_${suffix}`;
    }
    code = finalCode;
  }

  await executeQuery<ResultSetHeader>(
    `INSERT INTO organizations 
     (id, code, inn, name, name_uz, name_en, name_ru, contact_phone, contact_email, contact_person, address, legal_address, mfo, account_number, oked, description, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      code,
      data.inn?.trim() || null,
      data.name.trim(),
      data.nameUz?.trim() || null,
      data.nameEn?.trim() || null,
      data.nameRu?.trim() || null,
      data.contactPhone?.trim() || null,
      data.contactEmail?.trim() || null,
      data.contactPerson?.trim() || null,
      data.address?.trim() || null,
      data.legalAddress?.trim() || null,
      data.mfo?.trim() || null,
      data.accountNumber?.trim() || null,
      data.oked?.trim() || null,
      data.description?.trim() || null,
      data.isActive !== false,
      now,
      now,
    ],
  );

  const created = await getOrganizationById(id);
  if (!created) {
    throw new Error("Failed to create organization");
  }
  return created;
}

/**
 * Обновить организацию
 */
export async function updateOrganization(
  id: string,
  data: UpdateOrganizationInput,
): Promise<Organization | null> {
  const existing = await getOrganizationById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.code !== undefined) {
    updates.push("code = ?");
    params.push(data.code.trim());
  }
  if (data.inn !== undefined) {
    updates.push("inn = ?");
    params.push(data.inn?.trim() || null);
  }
  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name.trim());
  }
  if (data.nameUz !== undefined) {
    updates.push("name_uz = ?");
    params.push(data.nameUz?.trim() || null);
  }
  if (data.nameEn !== undefined) {
    updates.push("name_en = ?");
    params.push(data.nameEn?.trim() || null);
  }
  if (data.nameRu !== undefined) {
    updates.push("name_ru = ?");
    params.push(data.nameRu?.trim() || null);
  }
  if (data.contactPhone !== undefined) {
    updates.push("contact_phone = ?");
    params.push(data.contactPhone?.trim() || null);
  }
  if (data.contactEmail !== undefined) {
    updates.push("contact_email = ?");
    params.push(data.contactEmail?.trim() || null);
  }
  if (data.contactPerson !== undefined) {
    updates.push("contact_person = ?");
    params.push(data.contactPerson?.trim() || null);
  }
  if (data.address !== undefined) {
    updates.push("address = ?");
    params.push(data.address?.trim() || null);
  }
  if (data.legalAddress !== undefined) {
    updates.push("legal_address = ?");
    params.push(data.legalAddress?.trim() || null);
  }
  if (data.mfo !== undefined) {
    updates.push("mfo = ?");
    params.push(data.mfo?.trim() || null);
  }
  if (data.accountNumber !== undefined) {
    updates.push("account_number = ?");
    params.push(data.accountNumber?.trim() || null);
  }
  if (data.oked !== undefined) {
    updates.push("oked = ?");
    params.push(data.oked?.trim() || null);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description?.trim() || null);
  }
  if (data.isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }

  if (updates.length === 0) {
    return existing;
  }

  updates.push("updated_at = ?");
  params.push(new Date());
  params.push(id);

  await executeQuery<ResultSetHeader>(
    `UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`,
    params,
  );

  return getOrganizationById(id);
}

/**
 * Удалить организацию
 */
export async function deleteOrganization(id: string): Promise<boolean> {
  // Проверяем есть ли связанные студенты
  const studentsCount = await executeQuery<CountRow[]>(
    "SELECT COUNT(*) as total FROM students WHERE organization_id = ?",
    [id],
  );

  if ((studentsCount[0]?.total || 0) > 0) {
    throw new Error("Невозможно удалить организацию: есть связанные слушатели");
  }

  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM organizations WHERE id = ?",
    [id],
  );

  return result.affectedRows > 0;
}

/**
 * Получить или создать организацию по названию (для импорта)
 */
export async function getOrCreateOrganizationByName(
  name: string,
  names?: { nameUz?: string; nameEn?: string; nameRu?: string },
): Promise<Organization> {
  const trimmedName = name.trim();

  // Сначала ищем существующую
  const existing = await getOrganizationByName(trimmedName);
  if (existing) {
    return existing;
  }

  // Создаём новую
  return createOrganization({
    name: trimmedName,
    nameUz: names?.nameUz,
    nameEn: names?.nameEn,
    nameRu: names?.nameRu,
  });
}

/**
 * Обновить счётчик студентов для организации
 */
export async function updateStudentsCount(
  organizationId: string,
): Promise<void> {
  await executeQuery<ResultSetHeader>(
    `UPDATE organizations 
     SET students_count = (SELECT COUNT(*) FROM students WHERE organization_id = ?)
     WHERE id = ?`,
    [organizationId, organizationId],
  );
}

/**
 * Обновить счётчики студентов для всех организаций
 */
export async function updateAllStudentsCounts(): Promise<void> {
  await executeQuery<ResultSetHeader>(`
    UPDATE organizations o
    SET students_count = (
      SELECT COUNT(*) FROM students s WHERE s.organization_id = o.id
    )
  `);
}

/**
 * Получить статистику организаций
 */
export async function getOrganizationsStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  withStudents: number;
}> {
  const stats = await executeQuery<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
      SUM(CASE WHEN students_count > 0 THEN 1 ELSE 0 END) as with_students
    FROM organizations
  `);

  const row = stats[0];
  return {
    total: row?.total || 0,
    active: row?.active || 0,
    inactive: row?.inactive || 0,
    withStudents: row?.with_students || 0,
  };
}
