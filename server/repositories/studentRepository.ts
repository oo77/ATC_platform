/**
 * Репозиторий для работы со студентами в MySQL
 * Заменяет временное in-memory хранилище
 */

import { executeQuery, executeTransaction } from '../utils/db';
import type { Student, StudentCertificate, CreateStudentInput, UpdateStudentInput } from '../types/student';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getOrCreateOrganizationByName, updateStudentsCount } from './organizationRepository';

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
interface StudentRow extends RowDataPacket {
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
  status: 'draft' | 'issued' | 'revoked';
  variables_data: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  course_name?: string;
  group_code?: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ БД -> МОДЕЛЬ
// ============================================================================

function mapRowToStudent(row: StudentRow, certificates: StudentCertificate[] = []): Student {
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
  let courseName = row.course_name || '';
  if (!courseName && row.variables_data) {
    try {
      const varsData = JSON.parse(row.variables_data);
      courseName = varsData.courseName || varsData.course_name || '';
    } catch { }
  }

  return {
    id: row.id,
    studentId: row.student_id,
    groupId: row.group_id,
    templateId: row.template_id,
    courseName,
    groupCode: row.group_code || undefined,
    issueDate: row.issue_date,
    certificateNumber: row.certificate_number,
    fileUrl: row.pdf_file_url,
    expiryDate: row.expiry_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================================================
// СЕРТИФИКАТЫ
// ============================================================================

/**
 * Получить сертификаты студента из issued_certificates
 * Включает только выданные (issued) сертификаты
 */
async function getCertificatesByStudentId(studentId: string): Promise<StudentCertificate[]> {
  const rows = await executeQuery<CertificateRow[]>(
    `SELECT ic.*, 
            c.name as course_name,
            sg.code as group_code
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     WHERE ic.student_id = ? AND ic.status = 'issued'
     ORDER BY ic.issue_date DESC`,
    [studentId]
  );
  return rows.map(mapRowToCertificate);
}

/**
 * Получить сертификат по ID
 */
export async function getCertificateById(certificateId: string): Promise<StudentCertificate | null> {
  const rows = await executeQuery<CertificateRow[]>(
    `SELECT ic.*, 
            c.name as course_name,
            sg.code as group_code
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     WHERE ic.id = ? LIMIT 1`,
    [certificateId]
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
async function getCertificatesByStudentIds(studentIds: string[]): Promise<Map<string, StudentCertificate[]>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const placeholders = studentIds.map(() => '?').join(', ');
  const rows = await executeQuery<CertificateRow[]>(
    `SELECT ic.*, 
            c.name as course_name,
            sg.code as group_code
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     WHERE ic.student_id IN (${placeholders}) AND ic.status = 'issued'
     ORDER BY ic.issue_date DESC`,
    studentIds
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
  const rows = await executeQuery<StudentRow[]>('SELECT * FROM students ORDER BY full_name');

  if (rows.length === 0) {
    return [];
  }

  const studentIds = rows.map(r => r.id);
  const certificatesMap = await getCertificatesByStudentIds(studentIds);

  return rows.map(row => mapRowToStudent(row, certificatesMap.get(row.id) || []));
}

/**
 * Получить студентов с пагинацией и фильтрацией
 */
export async function getStudentsPaginated(params: PaginationParams = {}): Promise<PaginatedResult<Student>> {
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
    conditions.push('(full_name LIKE ? OR pinfl LIKE ? OR organization LIKE ? OR position LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Фильтр по ФИО
  if (fullName) {
    conditions.push('full_name LIKE ?');
    queryParams.push(`%${fullName}%`);
  }

  // Фильтр по ПИНФЛ
  if (pinfl) {
    conditions.push('pinfl LIKE ?');
    queryParams.push(`%${pinfl}%`);
  }

  // Фильтр по организации
  if (organization) {
    conditions.push('organization LIKE ?');
    queryParams.push(`%${organization}%`);
  }

  // Фильтр по должности
  if (position) {
    conditions.push('position LIKE ?');
    queryParams.push(`%${position}%`);
  }

  // Фильтр по наличию сертификатов (подзапрос) - используем issued_certificates
  if (hasCertificates) {
    conditions.push(`EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`);
  }

  // Фильтр по отсутствию сертификатов (подзапрос)
  if (noCertificates) {
    conditions.push(`NOT EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
    const studentIds = rows.map(r => r.id);
    const certificatesMap = await getCertificatesByStudentIds(studentIds);
    students = rows.map(row => mapRowToStudent(row, certificatesMap.get(row.id) || []));
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
    'SELECT * FROM students WHERE id = ? LIMIT 1',
    [id]
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
export async function getStudentByPinfl(pinfl: string): Promise<Student | null> {
  const rows = await executeQuery<StudentRow[]>(
    'SELECT * FROM students WHERE pinfl = ? LIMIT 1',
    [pinfl]
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
export async function studentExistsByPinfl(pinfl: string, excludeId?: string): Promise<boolean> {
  let query = 'SELECT 1 FROM students WHERE pinfl = ?';
  const params: any[] = [pinfl];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  query += ' LIMIT 1';

  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

/**
 * Создать нового студента
 */
export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery(
    `INSERT INTO students (id, full_name, pinfl, organization, department, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.fullName, data.pinfl, data.organization, data.department || null, data.position, now, now]
  );

  // Возвращаем созданного студента
  const student = await getStudentById(id);
  if (!student) {
    throw new Error('Failed to create student');
  }

  return student;
}

/**
 * Обновить студента
 */
export async function updateStudent(id: string, data: UpdateStudentInput): Promise<Student | null> {
  // Проверяем существование
  const existing = await getStudentById(id);
  if (!existing) {
    return null;
  }

  // Строим UPDATE запрос динамически
  const updates: string[] = [];
  const params: any[] = [];

  if (data.fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(data.fullName);
  }
  if (data.pinfl !== undefined) {
    updates.push('pinfl = ?');
    params.push(data.pinfl);
  }
  if (data.organization !== undefined) {
    updates.push('organization = ?');
    params.push(data.organization);
  }
  if (data.department !== undefined) {
    updates.push('department = ?');
    params.push(data.department || null);
  }
  if (data.position !== undefined) {
    updates.push('position = ?');
    params.push(data.position);
  }

  if (updates.length === 0) {
    return existing; // Нечего обновлять
  }

  params.push(id); // для WHERE id = ?

  await executeQuery(
    `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return getStudentById(id);
}

/**
 * Удалить студента
 */
export async function deleteStudent(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM students WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

/**
 * Связывает студента с пользователем (user) для авторизации
 */
export async function linkStudentToUser(studentId: string, userId: string): Promise<void> {
  await executeQuery(
    'UPDATE students SET user_id = ? WHERE id = ?',
    [userId, studentId]
  );
}

/**
 * Получить студента по user_id
 */
export async function getStudentByUserId(userId: string): Promise<Student | null> {
  const rows = await executeQuery<StudentRow[]>(
    'SELECT * FROM students WHERE user_id = ? LIMIT 1',
    [userId]
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
  }>
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
  const { hashPassword } = await import('../utils/auth');

  // Кэш организаций для оптимизации
  const organizationCache = new Map<string, string>(); // name -> id
  const affectedOrganizationIds = new Set<string>();

  // Сначала получаем или создаём все организации
  const uniqueOrganizations = [...new Set(students.map(s => s.organization.trim()))];
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
        const organizationId = organizationCache.get(student.organization.trim()) || null;

        // Проверяем существование по ПИНФЛ
        const [existingRows] = await connection.execute<StudentRow[]>(
          'SELECT id, organization_id, user_id FROM students WHERE pinfl = ? LIMIT 1',
          [student.pinfl]
        );

        if (existingRows.length > 0) {
          const existingOrgId = existingRows[0].organization_id;

          // Обновляем
          await connection.execute(
            `UPDATE students 
             SET full_name = ?, organization = ?, organization_id = ?, department = ?, position = ?, updated_at = ?
             WHERE pinfl = ?`,
            [student.fullName, student.organization, organizationId, student.department || null, student.position, new Date(), student.pinfl]
          );
          result.updated++;

          // Отслеживаем изменённые организации
          if (organizationId) affectedOrganizationIds.add(organizationId);
          if (existingOrgId && existingOrgId !== organizationId) affectedOrganizationIds.add(existingOrgId);
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
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [email]
          );

          let userId: string | null = null;

          if (existingUserRows.length === 0) {
            // Создаём пользователя
            userId = uuidv4();
            await connection.execute(
              `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
               VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
              [userId, student.fullName, email, passwordHash, student.pinfl, student.organization, student.position]
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
            [studentId, student.fullName, student.pinfl, student.organization, organizationId, student.department || null, student.position, userId, now, now]
          );
          result.created++;

          if (organizationId) affectedOrganizationIds.add(organizationId);
        }
      } catch (error) {
        result.errors.push({
          pinfl: student.pinfl,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // Обновляем счётчики студентов для затронутых организаций
  for (const orgId of affectedOrganizationIds) {
    try {
      await updateStudentsCount(orgId);
    } catch (error) {
      console.error(`Error updating students count for organization ${orgId}:`, error);
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
  onProgress?: (processed: number, created: number, updated: number, errors: number) => void,
  batchSize: number = 100
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
  const { hashPassword } = await import('../utils/auth');

  // Кэш организаций для оптимизации
  const organizationCache = new Map<string, string>(); // name -> id
  const affectedOrganizationIds = new Set<string>();

  // Сначала получаем или создаём все организации
  const uniqueOrganizations = [...new Set(students.map(s => s.organization.trim()))];
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

  // Обрабатываем батчами
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);

    await executeTransaction(async (connection: PoolConnection) => {
      for (const student of batch) {
        try {
          const organizationId = organizationCache.get(student.organization.trim()) || null;

          // Проверяем существование по ПИНФЛ
          const [existingRows] = await connection.execute<StudentRow[]>(
            'SELECT id, organization_id, user_id FROM students WHERE pinfl = ? LIMIT 1',
            [student.pinfl]
          );

          if (existingRows.length > 0) {
            const existingOrgId = existingRows[0].organization_id;

            // Обновляем
            await connection.execute(
              `UPDATE students 
               SET full_name = ?, organization = ?, organization_id = ?, department = ?, position = ?, updated_at = ?
               WHERE pinfl = ?`,
              [student.fullName, student.organization, organizationId, student.department || null, student.position, new Date(), student.pinfl]
            );
            result.updated++;

            if (organizationId) affectedOrganizationIds.add(organizationId);
            if (existingOrgId && existingOrgId !== organizationId) affectedOrganizationIds.add(existingOrgId);
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
              'SELECT id FROM users WHERE email = ? LIMIT 1',
              [email]
            );

            let userId: string | null = null;

            if (existingUserRows.length === 0) {
              // Создаём пользователя
              userId = uuidv4();
              await connection.execute(
                `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
                 VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
                [userId, student.fullName, email, passwordHash, student.pinfl, student.organization, student.position]
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
              [studentId, student.fullName, student.pinfl, student.organization, organizationId, student.department || null, student.position, userId, now, now]
            );
            result.created++;

            if (organizationId) affectedOrganizationIds.add(organizationId);
          }
        } catch (error) {
          result.errors.push({
            pinfl: student.pinfl,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    // Уведомляем о прогрессе
    if (onProgress) {
      onProgress(
        Math.min(i + batchSize, students.length),
        result.created,
        result.updated,
        result.errors.length
      );
    }

    // Небольшая пауза между батчами для снижения нагрузки
    if (i + batchSize < students.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Обновляем счётчики студентов для затронутых организаций
  for (const orgId of affectedOrganizationIds) {
    try {
      await updateStudentsCount(orgId);
    } catch (error) {
      console.error(`Error updating students count for organization ${orgId}:`, error);
    }
  }

  return result;
}
