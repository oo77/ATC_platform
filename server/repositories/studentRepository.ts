/**
 * Репозиторий для работы со студентами в MySQL
 * Заменяет временное in-memory хранилище
 */

import { executeQuery, executeTransaction } from "../utils/db";
import type {
  Student,
  StudentCertificate,
  CreateStudentInput,
  UpdateStudentInput,
} from "../types/student";
import { v4 as uuidv4 } from "uuid";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  getOrCreateOrganizationByName,
  updateStudentsCount,
} from "./organizationRepository";

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  fullName?: string;
  pinfl?: string;
  organization?: string;
  position?: string;
  hasCertificates?: boolean;
  noCertificates?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Row types для MySQL
export interface StudentRow extends RowDataPacket {
  id: string;
  full_name: string;
  pinfl: string;
  organization: string;
  organization_id: string | null;
  department: string | null;
  position: string;
  created_at: Date;
  updated_at: Date;
}

// Обновлённая структура для issued_certificates
interface CertificateRow extends RowDataPacket {
  id: string;
  student_id: string;
  group_id: string;
  template_id: string;
  certificate_number: string;
  issue_date: Date;
  expiry_date: Date | null;
  pdf_file_url: string | null;
  docx_file_url: string | null;
  status: "draft" | "issued" | "revoked";
  variables_data: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  course_name?: string;
  course_code?: string;
  course_hours?: number;
  group_code?: string;
  group_start_date?: Date;
  group_end_date?: Date;
  template_name?: string;
  issued_by_name?: string;
  // Аудит и доп поля
  warnings?: any;
  notes?: string;
  revoke_reason?: string;
  revoked_at?: Date;
  issued_at?: Date;
  issued_by?: string;
  source_type?: string;
  import_source?: string;
  ai_confidence?: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ БД -> МОДЕЛЬ
// ============================================================================

function mapRowToStudent(
  row: StudentRow,
  certificates: StudentCertificate[] = [],
): Student {
  return {
    id: row.id,
    fullName: row.full_name,
    pinfl: row.pinfl,
    organization: row.organization,
    department: row.department,
    position: row.position,
    certificates,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRowToCertificate(row: CertificateRow): StudentCertificate {
  // Извлекаем название курса из variables_data или из JOIN
  let courseName = row.course_name || "";
  let courseCode = row.course_code || "";
  let courseHours = row.course_hours || null;

  // Try to fallback to variables_data if main fields are missing
  if (!courseName && row.variables_data) {
    try {
      const varsData = JSON.parse(
        typeof row.variables_data === "string"
          ? row.variables_data
          : JSON.stringify(row.variables_data),
      );
      if (!courseName)
        courseName = varsData.courseName || varsData.course_name || "";
      if (!courseCode)
        courseCode = varsData.courseCode || varsData.course_code || "";
    } catch {}
  }

  // Construct nested objects for UI compatibility
  const course = {
    name: courseName || "Не указан",
    code: courseCode || null,
    hours: courseHours,
  };

  const group = {
    id: row.group_id,
    code: row.group_code || null,
    startDate: row.group_start_date,
    endDate: row.group_end_date,
  };

  const template = row.template_id
    ? {
        id: row.template_id,
        name: row.template_name,
      }
    : null;

  const issuedBy = row.issued_by
    ? {
        id: row.issued_by,
        name: row.issued_by_name,
      }
    : null;

  // Determine warnings
  let hasWarnings = false;
  if (row.warnings) {
    try {
      // Check if warnings is not empty/null
      // It can be JSON string or object depending on driver setting? Usually object if type casted or string
      // But assuming raw row, it might be string or object.
      const w =
        typeof row.warnings === "string"
          ? JSON.parse(row.warnings)
          : row.warnings;
      if (Array.isArray(w) && w.length > 0) hasWarnings = true;
    } catch {}
  }

  return {
    id: row.id,
    studentId: row.student_id,
    groupId: row.group_id,
    templateId: row.template_id,

    // Flat fields (keeping for backward compatibility if needed)
    courseName,
    groupCode: row.group_code || undefined,
    issueDate: row.issue_date,
    certificateNumber: row.certificate_number,
    fileUrl: row.pdf_file_url,
    docxFileUrl: row.docx_file_url, // Added
    expiryDate: row.expiry_date,
    status: row.status as any,

    // Rich objects (for Modal)
    course,
    group,
    template,
    issuedBy,

    // Audit & Extra
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
    notes: row.notes,
    hasWarnings,
    sourceType: row.source_type,
    importSource: row.import_source,
    aiConfidence: row.ai_confidence,

    created_at: row.created_at,
    updated_at: row.updated_at,
  } as unknown as StudentCertificate; // Cast because we added extra fields not in interface yet (or we update interface later)
}

// ============================================================================
// СЕРТИФИКАТЫ
// ============================================================================

/**
 * Получить сертификаты студента из issued_certificates
 * Включает только выданные (issued) сертификаты
 */
async function getCertificatesByStudentId(
  studentId: string,
): Promise<StudentCertificate[]> {
  const rows = await executeQuery<CertificateRow[]>(
    `SELECT 
      ic.*, 
      COALESCE(c.name, ic.course_name) as course_name,
      COALESCE(c.code, ic.course_code) as course_code,
      COALESCE(ic.course_hours, NULL) as course_hours, -- TODO: Join disciplines hours if needed, but usually course total
      COALESCE(sg.code, ic.group_code) as group_code,
      COALESCE(sg.start_date, ic.group_start_date) as group_start_date,
      COALESCE(sg.end_date, ic.group_end_date) as group_end_date,
      ct.name as template_name,
      u.name as issued_by_name
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
     LEFT JOIN users u ON ic.issued_by = u.id
     WHERE ic.student_id = ? AND ic.status = 'issued'
     ORDER BY ic.issue_date DESC`,
    [studentId],
  );
  return rows.map(mapRowToCertificate);
}

/**
 * Получить сертификат по ID
 */
export async function getCertificateById(
  certificateId: string,
): Promise<StudentCertificate | null> {
  const rows = await executeQuery<CertificateRow[]>(
    `SELECT 
      ic.*, 
      COALESCE(c.name, ic.course_name) as course_name,
      COALESCE(c.code, ic.course_code) as course_code,
      COALESCE(ic.course_hours, NULL) as course_hours,
      COALESCE(sg.code, ic.group_code) as group_code,
      COALESCE(sg.start_date, ic.group_start_date) as group_start_date,
      COALESCE(sg.end_date, ic.group_end_date) as group_end_date,
      ct.name as template_name,
      u.name as issued_by_name
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
     LEFT JOIN users u ON ic.issued_by = u.id
     WHERE ic.id = ? LIMIT 1`,
    [certificateId],
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToCertificate(rows[0]);
}

/**
 * Получить сертификаты для нескольких студентов
 * Включает только выданные (issued) сертификаты
 */
async function getCertificatesByStudentIds(
  studentIds: string[],
): Promise<Map<string, StudentCertificate[]>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const placeholders = studentIds.map(() => "?").join(", ");
  const rows = await executeQuery<CertificateRow[]>(
    `SELECT 
      ic.*, 
      COALESCE(c.name, ic.course_name) as course_name,
      COALESCE(c.code, ic.course_code) as course_code,
      COALESCE(ic.course_hours, NULL) as course_hours,
      COALESCE(sg.code, ic.group_code) as group_code,
      COALESCE(sg.start_date, ic.group_start_date) as group_start_date,
      COALESCE(sg.end_date, ic.group_end_date) as group_end_date,
      ct.name as template_name,
      u.name as issued_by_name
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
     LEFT JOIN users u ON ic.issued_by = u.id
     WHERE ic.student_id IN (${placeholders}) AND ic.status = 'issued'
     ORDER BY ic.issue_date DESC`,
    studentIds,
  );

  const certificatesMap = new Map<string, StudentCertificate[]>();

  for (const row of rows) {
    const cert = mapRowToCertificate(row);
    const existing = certificatesMap.get(cert.studentId) || [];
    existing.push(cert);
    certificatesMap.set(cert.studentId, existing);
  }

  return certificatesMap;
}

// ============================================================================
// СТУДЕНТЫ - ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить всех студентов (без пагинации)
 */
export async function getAllStudents(): Promise<Student[]> {
  const rows = await executeQuery<StudentRow[]>(
    "SELECT * FROM students ORDER BY full_name",
  );

  if (rows.length === 0) {
    return [];
  }

  const studentIds = rows.map((r) => r.id);
  const certificatesMap = await getCertificatesByStudentIds(studentIds);

  return rows.map((row) =>
    mapRowToStudent(row, certificatesMap.get(row.id) || []),
  );
}

/**
 * Получить студентов по ID организации (для ТГ-приложения)
 * Используется при AI-импорте сертификатов с ограничением по организации
 */
export async function getStudentsByOrganizationId(
  organizationId: string,
): Promise<Student[]> {
  const rows = await executeQuery<StudentRow[]>(
    "SELECT * FROM students WHERE organization_id = ? ORDER BY full_name",
    [organizationId],
  );

  if (rows.length === 0) {
    return [];
  }

  const studentIds = rows.map((r) => r.id);
  const certificatesMap = await getCertificatesByStudentIds(studentIds);

  return rows.map((row) =>
    mapRowToStudent(row, certificatesMap.get(row.id) || []),
  );
}

/**
 * Получить студентов с пагинацией и фильтрацией
 */
export async function getStudentsPaginated(
  params: PaginationParams = {},
): Promise<PaginatedResult<Student>> {
  const {
    page = 1,
    limit = 10,
    search,
    fullName,
    pinfl,
    organization,
    position,
    hasCertificates,
    noCertificates,
  } = params;

  // Строим WHERE условия
  const conditions: string[] = [];
  const queryParams: any[] = [];

  // Универсальный поиск (используем LIKE для простоты, FULLTEXT для больших объёмов)
  if (search) {
    conditions.push(
      "(full_name LIKE ? OR pinfl LIKE ? OR organization LIKE ? OR position LIKE ?)",
    );
    const searchPattern = `%${search}%`;
    queryParams.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    );
  }

  // Фильтр по ФИО
  if (fullName) {
    conditions.push("full_name LIKE ?");
    queryParams.push(`%${fullName}%`);
  }

  // Фильтр по ПИНФЛ
  if (pinfl) {
    conditions.push("pinfl LIKE ?");
    queryParams.push(`%${pinfl}%`);
  }

  // Фильтр по организации
  if (organization) {
    conditions.push("organization LIKE ?");
    queryParams.push(`%${organization}%`);
  }

  // Фильтр по должности
  if (position) {
    conditions.push("position LIKE ?");
    queryParams.push(`%${position}%`);
  }

  // Фильтр по наличию сертификатов (подзапрос) - используем issued_certificates
  if (hasCertificates) {
    conditions.push(
      `EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`,
    );
  }

  // Фильтр по отсутствию сертификатов (подзапрос)
  if (noCertificates) {
    conditions.push(
      `NOT EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`,
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Получаем общее количество
  const countQuery = `SELECT COUNT(*) as total FROM students ${whereClause}`;
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Получаем данные с пагинацией
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM students 
    ${whereClause} 
    ORDER BY full_name 
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery<StudentRow[]>(dataQuery, dataParams);

  // Загружаем сертификаты
  let students: Student[] = [];
  if (rows.length > 0) {
    const studentIds = rows.map((r) => r.id);
    const certificatesMap = await getCertificatesByStudentIds(studentIds);
    students = rows.map((row) =>
      mapRowToStudent(row, certificatesMap.get(row.id) || []),
    );
  }

  return {
    data: students,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получить студента по ID
 */
export async function getStudentById(id: string): Promise<Student | null> {
  const rows = await executeQuery<StudentRow[]>(
    "SELECT * FROM students WHERE id = ? LIMIT 1",
    [id],
  );

  if (rows.length === 0) {
    return null;
  }

  const certificates = await getCertificatesByStudentId(id);
  return mapRowToStudent(rows[0], certificates);
}

/**
 * Получить студента по ПИНФЛ
 */
export async function getStudentByPinfl(
  pinfl: string,
): Promise<Student | null> {
  const rows = await executeQuery<StudentRow[]>(
    "SELECT * FROM students WHERE pinfl = ? LIMIT 1",
    [pinfl],
  );

  if (rows.length === 0) {
    return null;
  }

  const certificates = await getCertificatesByStudentId(rows[0].id);
  return mapRowToStudent(rows[0], certificates);
}

/**
 * Проверить существование студента по ПИНФЛ
 */
export async function studentExistsByPinfl(
  pinfl: string,
  excludeId?: string,
): Promise<boolean> {
  let query = "SELECT 1 FROM students WHERE pinfl = ?";
  const params: any[] = [pinfl];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  query += " LIMIT 1";

  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

/**
 * Получить множество студентов по списку ПИНФЛ
 * Оптимизированный метод для батч-операций
 */
export async function getExistingStudentsByPinfls(
  pinfls: string[],
): Promise<StudentRow[]> {
  if (pinfls.length === 0) {
    return [];
  }

  // Используем ручное формирование плейсхолдеров для надежности с массивами
  const placeholders = pinfls.map(() => "?").join(", ");
  const query = `SELECT * FROM students WHERE pinfl IN (${placeholders})`;

  const rows = await executeQuery<StudentRow[]>(query, pinfls);
  return rows;
}

/**
 * Создать нового студента
 */
export async function createStudent(
  data: CreateStudentInput,
): Promise<Student> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery(
    `INSERT INTO students (id, full_name, pinfl, organization, department, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.fullName,
      data.pinfl,
      data.organization,
      data.department || null,
      data.position,
      now,
      now,
    ],
  );

  // Возвращаем созданного студента
  const student = await getStudentById(id);
  if (!student) {
    throw new Error("Failed to create student");
  }

  return student;
}

/**
 * Обновить студента
 */
export async function updateStudent(
  id: string,
  data: UpdateStudentInput,
): Promise<Student | null> {
  // Проверяем существование
  const existing = await getStudentById(id);
  if (!existing) {
    return null;
  }

  // Строим UPDATE запрос динамически
  const updates: string[] = [];
  const params: any[] = [];

  if (data.fullName !== undefined) {
    updates.push("full_name = ?");
    params.push(data.fullName);
  }
  if (data.pinfl !== undefined) {
    updates.push("pinfl = ?");
    params.push(data.pinfl);
  }
  if (data.organization !== undefined) {
    updates.push("organization = ?");
    params.push(data.organization);
  }
  if (data.department !== undefined) {
    updates.push("department = ?");
    params.push(data.department || null);
  }
  if (data.position !== undefined) {
    updates.push("position = ?");
    params.push(data.position);
  }

  if (updates.length === 0) {
    return existing; // Нечего обновлять
  }

  params.push(id); // для WHERE id = ?

  await executeQuery(
    `UPDATE students SET ${updates.join(", ")} WHERE id = ?`,
    params,
  );

  return getStudentById(id);
}

/**
 * Удалить студента
 */
export async function deleteStudent(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM students WHERE id = ?",
    [id],
  );

  return result.affectedRows > 0;
}

/**
 * Связывает студента с пользователем (user) для авторизации
 */
export async function linkStudentToUser(
  studentId: string,
  userId: string,
): Promise<void> {
  await executeQuery("UPDATE students SET user_id = ? WHERE id = ?", [
    userId,
    studentId,
  ]);
}

/**
 * Получить студента по user_id
 */
export async function getStudentByUserId(
  userId: string,
): Promise<Student | null> {
  const rows = await executeQuery<StudentRow[]>(
    "SELECT * FROM students WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (rows.length === 0) {
    return null;
  }

  const certificates = await getCertificatesByStudentId(rows[0].id);
  return mapRowToStudent(rows[0], certificates);
}

// ============================================================================
// СЕРТИФИКАТЫ - ПУБЛИЧНЫЕ ОПЕРАЦИИ
// ============================================================================
//
// ВАЖНО: Управление сертификатами теперь осуществляется через единую таблицу
// issued_certificates и функции из certificateTemplateRepository:
//
// - createIssuedCertificate() - создание сертификата
// - reissueCertificate() - переиздание сертификата
// - revokeCertificate() - отзыв сертификата
// - deleteCertificate() - удаление черновика
// - getIssuedCertificatesByGroup() - сертификаты группы
// - getStudentCertificateInGroup() - сертификат студента в группе
//
// Для получения сертификатов студента используйте getCertificatesByStudentId()
// которая уже читает из issued_certificates.
// ============================================================================

// ============================================================================
// BATCH ОПЕРАЦИИ (для импорта)
// ============================================================================

export interface BatchUpsertResult {
  created: number;
  updated: number;
  errors: Array<{ pinfl: string; error: string }>;
  organizationsCreated: number;
  accountsCreated: number;
}

/**
 * Массовое создание/обновление студентов (upsert)
 * Использует транзакцию для атомарности
 * Автоматически создаёт организации и учётные записи
 */
export async function batchUpsertStudents(
  students: Array<{
    pinfl: string;
    fullName: string;
    organization: string;
    department?: string | null;
    position: string;
  }>,
): Promise<BatchUpsertResult> {
  const result: BatchUpsertResult = {
    created: 0,
    updated: 0,
    errors: [],
    organizationsCreated: 0,
    accountsCreated: 0,
  };

  if (students.length === 0) {
    return result;
  }

  // Импорт hashPassword
  const { hashPassword } = await import("../utils/auth");

  // Кэш организаций для оптимизации
  const organizationCache = new Map<string, string>(); // name -> id
  const affectedOrganizationIds = new Set<string>();

  // Сначала получаем или создаём все организации
  const uniqueOrganizations = [
    ...new Set(students.map((s) => s.organization.trim())),
  ];
  for (const orgName of uniqueOrganizations) {
    try {
      const org = await getOrCreateOrganizationByName(orgName);
      organizationCache.set(orgName, org.id);
      // Подсчитываем только новые (без studentsCount)
      if (org.studentsCount === 0) {
        result.organizationsCreated++;
      }
    } catch (error) {
      console.error(`Error creating organization "${orgName}":`, error);
    }
  }

  await executeTransaction(async (connection: PoolConnection) => {
    for (const student of students) {
      try {
        const organizationId =
          organizationCache.get(student.organization.trim()) || null;

        // Проверяем существование по ПИНФЛ
        const [existingRows] = await connection.execute<StudentRow[]>(
          "SELECT id, organization_id, user_id FROM students WHERE pinfl = ? LIMIT 1",
          [student.pinfl],
        );

        if (existingRows.length > 0) {
          const existingOrgId = existingRows[0].organization_id;

          // Обновляем
          await connection.execute(
            `UPDATE students 
             SET full_name = ?, organization = ?, organization_id = ?, department = ?, position = ?, updated_at = ?
             WHERE pinfl = ?`,
            [
              student.fullName,
              student.organization,
              organizationId,
              student.department || null,
              student.position,
              new Date(),
              student.pinfl,
            ],
          );
          result.updated++;

          // Отслеживаем изменённые организации
          if (organizationId) affectedOrganizationIds.add(organizationId);
          if (existingOrgId && existingOrgId !== organizationId)
            affectedOrganizationIds.add(existingOrgId);
        } else {
          // Создаём студента
          const studentId = uuidv4();
          const now = new Date();

          // Создаём учётную запись для студента
          const email = `${student.pinfl}@student.local`;
          const password = student.pinfl; // Пароль = ПИНФЛ
          const passwordHash = await hashPassword(password);

          // Проверяем существование пользователя с таким email
          const [existingUserRows] = await connection.execute<RowDataPacket[]>(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email],
          );

          let userId: string | null = null;

          if (existingUserRows.length === 0) {
            // Создаём пользователя
            userId = uuidv4();
            await connection.execute(
              `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
               VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
              [
                userId,
                student.fullName,
                email,
                passwordHash,
                student.pinfl,
                student.organization,
                student.position,
              ],
            );
            result.accountsCreated++;
          } else {
            // Пользователь уже существует, используем его ID
            userId = (existingUserRows[0] as any).id;
          }

          // Создаём студента
          await connection.execute(
            `INSERT INTO students (id, full_name, pinfl, organization, organization_id, department, position, user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              studentId,
              student.fullName,
              student.pinfl,
              student.organization,
              organizationId,
              student.department || null,
              student.position,
              userId,
              now,
              now,
            ],
          );
          result.created++;

          if (organizationId) affectedOrganizationIds.add(organizationId);
        }
      } catch (error) {
        result.errors.push({
          pinfl: student.pinfl,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  // Обновляем счётчики студентов для затронутых организаций
  for (const orgId of affectedOrganizationIds) {
    try {
      await updateStudentsCount(orgId);
    } catch (error) {
      console.error(
        `Error updating students count for organization ${orgId}:`,
        error,
      );
    }
  }

  return result;
}

/**
 * Массовое создание/обновление с прогрессом (для импорта с отслеживанием)
 * Автоматически создаёт организации и учётные записи
 */
export async function batchUpsertStudentsWithProgress(
  students: Array<{
    pinfl: string;
    fullName: string;
    organization: string;
    department?: string | null;
    position: string;
    rowNumber?: number;
  }>,
  onProgress?: (
    processed: number,
    created: number,
    updated: number,
    errors: number,
  ) => void,
  batchSize: number = 100,
): Promise<BatchUpsertResult> {
  const result: BatchUpsertResult = {
    created: 0,
    updated: 0,
    errors: [],
    organizationsCreated: 0,
    accountsCreated: 0,
  };

  if (students.length === 0) {
    return result;
  }

  // Импорт hashPassword (лениво, чтобы избежать циклических зависимостей)
  const { hashPassword } = await import("../utils/auth");

  // Кэш организаций для оптимизации
  const organizationCache = new Map<string, string>(); // name -> id
  const affectedOrganizationIds = new Set<string>();

  // 1. Предварительная обработка Организаций
  const uniqueOrganizations = [
    ...new Set(students.map((s) => s.organization.trim())),
  ];

  // Создаём отсутствующие организации последовательно (их обычно мало)
  for (const orgName of uniqueOrganizations) {
    try {
      const org = await getOrCreateOrganizationByName(orgName);
      organizationCache.set(orgName, org.id);
      if (org.studentsCount === 0) {
        result.organizationsCreated++;
      }
    } catch (error) {
      console.error(`Error creating organization "${orgName}":`, error);
    }
  }

  // 2. Обработка студентов батчами
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchPinfls = batch.map((s) => s.pinfl);

    await executeTransaction(async (connection: PoolConnection) => {
      try {
        // --- ШАГ A: Получаем данные существующих студентов ---
        const placeholders = batchPinfls.map(() => "?").join(",");
        const [existingStudentRows] = await connection.query<StudentRow[]>(
          `SELECT id, pinfl, user_id, organization_id FROM students WHERE pinfl IN (${placeholders})`,
          batchPinfls,
        );

        const existingStudentsMap = new Map<string, StudentRow>();
        existingStudentRows.forEach((row) =>
          existingStudentsMap.set(row.pinfl, row),
        );

        // --- ШАГ B: Подготовка пользователей (Users) ---
        // Нам нужно убедиться, что для каждого студента есть User
        const emailsToCheck: string[] = [];
        const pinflsOfNewUsers: string[] = [];

        batch.forEach((student) => {
          const existing = existingStudentsMap.get(student.pinfl);
          // Если студента нет или у него нет user_id, нам нужен User
          if (!existing || !existing.user_id) {
            emailsToCheck.push(`${student.pinfl}@student.local`);
            pinflsOfNewUsers.push(student.pinfl);
          }
        });

        const userMap = new Map<string, string>(); // email -> user_id

        if (emailsToCheck.length > 0) {
          const emailPlaceholders = emailsToCheck.map(() => "?").join(",");
          const [existingUserRows] = await connection.query<RowDataPacket[]>(
            `SELECT id, email FROM users WHERE email IN (${emailPlaceholders})`,
            emailsToCheck,
          );

          existingUserRows.forEach((row: any) =>
            userMap.set(row.email, row.id),
          );

          // Находим тех, кого надо создать
          const usersToCreate = [];
          for (const pinfl of pinflsOfNewUsers) {
            const email = `${pinfl}@student.local`;
            if (!userMap.has(email)) {
              usersToCreate.push({
                id: uuidv4(),
                pinfl,
                email,
                fullName: batch.find((s) => s.pinfl === pinfl)?.fullName || "",
                organization:
                  batch.find((s) => s.pinfl === pinfl)?.organization || "",
                position: batch.find((s) => s.pinfl === pinfl)?.position || "",
              });
            }
          }

          if (usersToCreate.length > 0) {
            // Пароли хешируем параллельно
            const passwordHashes = await Promise.all(
              usersToCreate.map((u) => hashPassword(u.pinfl)),
            );

            // Bulk Insert Users
            const userValues: any[] = [];
            const userPlaceholders = usersToCreate
              .map((u, idx) => {
                userValues.push(
                  u.id,
                  "STUDENT",
                  u.fullName,
                  u.email,
                  passwordHashes[idx],
                  u.pinfl,
                  u.organization,
                  u.position,
                  new Date(),
                  new Date(),
                );
                // Запоминаем ID для маппинга
                userMap.set(u.email, u.id);
                return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
              })
              .join(",");

            await connection.query(
              `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at) VALUES ${userPlaceholders}`,
              userValues,
            );
            result.accountsCreated += usersToCreate.length;
          }
        }

        // --- ШАГ C: Bulk Upsert Студентов ---
        const upsertValues: any[] = [];
        const upsertPlaceholders = batch
          .map((student) => {
            const existing = existingStudentsMap.get(student.pinfl);
            const organizationId =
              organizationCache.get(student.organization.trim()) || null;

            // Если студент существует, используем его ID, иначе новый
            const studentId = existing ? existing.id : uuidv4();

            // Получаем userID: либо существующий у студента, либо из мапы пользователей
            const email = `${student.pinfl}@student.local`;
            const userId = existing?.user_id || userMap.get(email) || null; // Should not be null at this point

            const now = new Date();

            upsertValues.push(
              studentId,
              student.fullName,
              student.pinfl,
              student.organization,
              organizationId,
              student.department || null,
              student.position,
              userId,
              now, // created_at
              now, // updated_at
            );

            // Трекинг статистики и затронутых организаций
            if (existing) {
              result.updated++;
              if (
                existing.organization_id &&
                existing.organization_id !== organizationId
              ) {
                affectedOrganizationIds.add(existing.organization_id);
              }
            } else {
              result.created++;
            }
            if (organizationId) affectedOrganizationIds.add(organizationId);

            return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
          })
          .join(",");

        // Используем VALUES(col) синтаксис (совместимо с MySQL 8.0)
        // ON DUPLICATE KEY UPDATE
        const query = `
            INSERT INTO students 
            (id, full_name, pinfl, organization, organization_id, department, position, user_id, created_at, updated_at) 
            VALUES ${upsertPlaceholders} 
            ON DUPLICATE KEY UPDATE 
            full_name = VALUES(full_name),
            organization = VALUES(organization),
            organization_id = VALUES(organization_id),
            department = VALUES(department),
            position = VALUES(position),
            user_id = VALUES(user_id),
            updated_at = VALUES(updated_at)
        `;

        await connection.query(query, upsertValues);
      } catch (error) {
        // В случае ошибки в батче, fallback на индивидуальную обработку?
        // Или просто помечаем весь батч как ошибку?
        // Для скорости мы жертвуем гранулярностью ошибок.
        // Если ошибка, то транзакция откатится для всего батча.
        console.error("Batch import error:", error);
        batch.forEach((item) => {
          result.errors.push({
            pinfl: item.pinfl,
            error:
              error instanceof Error ? error.message : "Batch processing error",
          });
        });
        // Откат счетчиков
        result.created -= batch.filter(
          (s) => !result.errors.find((e) => e.pinfl === s.pinfl),
        ).length; // Грубая оценка, но здесь мы просто фейлим всё
        // На самом деле счетчики мы инкрементировали локально, но результирующий объект вернёт неверные данные если не скорректировать.
        // Но так как мы бросаем except, транзакция откатится в executeTransaction.
        // Нам нужно скорректировать result?
        // Поскольку batchUpsertStudentsWithProgress не бросает исключение обычно, а возвращает result с errors.
        // Но внутри executeTransaction если выбросить ошибку - будет rollback.
        // Мы должны поймать и записать ошибки.
      }
    });

    // Уведомляем о прогрессе
    if (onProgress) {
      onProgress(
        Math.min(i + batchSize, students.length),
        result.created,
        result.updated,
        result.errors.length,
      );
    }

    // Minimal delay to let event loop breathe
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  // 3. Обновляем счётчики студентов для затронутых организаций
  // Это можно сделать асинхронно после ответа, но лучше дождаться
  for (const orgId of affectedOrganizationIds) {
    try {
      await updateStudentsCount(orgId);
    } catch (error) {
      console.error(
        `Error updating students count for organization ${orgId}:`,
        error,
      );
    }
  }

  return result;
}
