/**
 * Репозиторий для работы с шаблонами сертификатов
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  CertificateTemplate,
  CertificateTemplateData,
  CreateCertificateTemplateInput,
  UpdateCertificateTemplateInput,
  VariableMapping,
  QRSettings,
  IssuedCertificate,
  IssueCertificateInput,
  IssueWarning,
  StudentEligibility,
  IssuedCertificateStatus,
  CertificateSourceType,
  TemplateLayout
} from '../types/certificate';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

interface TemplateRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  template_file_url: string | null;
  original_file_url: string | null;
  variables: string | null;
  qr_settings: string | null;
  number_format: string;
  last_number: number;
  is_active: boolean;
  // Новые поля для визуального редактора
  template_data: string | null;
  layout: TemplateLayout | null;
  background_url: string | null;
  created_at: Date;
  updated_at: Date;
}

interface IssuedCertificateRow extends RowDataPacket {
  id: string;
  group_id: string | null;
  student_id: string;
  template_id: string | null;
  certificate_number: string;
  issue_date: Date;
  // Standalone поля
  course_name: string | null;
  course_code: string | null;
  course_hours: number | null;
  group_code: string | null;
  group_start_date: Date | null;
  group_end_date: Date | null;
  source_type: CertificateSourceType;
  // Файлы
  docx_file_url: string | null;
  pdf_file_url: string | null;
  // Статус и данные
  status: IssuedCertificateStatus;
  variables_data: string | null;
  warnings: string | null;
  override_warnings: boolean;
  // Срок действия
  expiry_date: Date | null;
  // Telegram
  is_sent_via_telegram: boolean;
  sent_at: Date | null;
  // Аудит
  issued_by: string | null;
  issued_at: Date | null;
  revoked_by: string | null;
  revoked_at: Date | null;
  revoke_reason: string | null;
  notes: string | null;
  // Legacy
  legacy_id: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  student_full_name?: string;
  student_organization?: string;
  student_position?: string;
  template_name?: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToTemplate(row: TemplateRow): CertificateTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateFileUrl: row.template_file_url,
    originalFileUrl: row.original_file_url,
    variables: row.variables ? JSON.parse(row.variables) : null,
    qrSettings: row.qr_settings ? JSON.parse(row.qr_settings) : null,
    numberFormat: row.number_format || 'ATC{YY}_{CODE}_{NUM}',
    lastNumber: row.last_number || 0,
    isActive: Boolean(row.is_active),
    // Новые поля для визуального редактора
    templateData: row.template_data ? JSON.parse(row.template_data) : null,
    layout: row.layout || null,
    backgroundUrl: row.background_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToIssuedCertificate(row: IssuedCertificateRow): IssuedCertificate {
  const cert: IssuedCertificate = {
    id: row.id,
    groupId: row.group_id,
    studentId: row.student_id,
    templateId: row.template_id,
    certificateNumber: row.certificate_number,
    issueDate: row.issue_date,
    // Standalone поля
    courseName: row.course_name,
    courseCode: row.course_code,
    courseHours: row.course_hours,
    groupCode: row.group_code,
    groupStartDate: row.group_start_date,
    groupEndDate: row.group_end_date,
    sourceType: row.source_type || 'group_journal',
    // Файлы
    docxFileUrl: row.docx_file_url,
    pdfFileUrl: row.pdf_file_url,
    // Статус и данные
    status: row.status,
    variablesData: row.variables_data ? JSON.parse(row.variables_data) : null,
    warnings: row.warnings ? JSON.parse(row.warnings) : null,
    overrideWarnings: Boolean(row.override_warnings),
    // Срок действия
    expiryDate: row.expiry_date,
    // Telegram
    isSentViaTelegram: Boolean(row.is_sent_via_telegram),
    sentAt: row.sent_at,
    // Аудит
    issuedBy: row.issued_by,
    issuedAt: row.issued_at,
    revokedBy: row.revoked_by,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
    notes: row.notes,
    // Legacy
    legacyId: row.legacy_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Добавляем связанные данные, если они есть
  if (row.student_full_name) {
    cert.student = {
      id: row.student_id,
      fullName: row.student_full_name,
      organization: row.student_organization || '',
      position: row.student_position || '',
    };
  }

  return cert;
}

// ============================================================================
// ШАБЛОНЫ СЕРТИФИКАТОВ - CRUD
// ============================================================================

/**
 * Получить все шаблоны сертификатов
 */
export async function getTemplates(filters?: { isActive?: boolean }): Promise<CertificateTemplate[]> {
  let sql = 'SELECT * FROM certificate_templates WHERE 1=1';
  const params: any[] = [];

  if (filters?.isActive !== undefined) {
    sql += ' AND is_active = ?';
    params.push(filters.isActive);
  }

  sql += ' ORDER BY name ASC';

  const rows = await executeQuery<TemplateRow[]>(sql, params);
  return rows.map(mapRowToTemplate);
}

/**
 * Получить шаблон по ID
 */
export async function getTemplateById(id: string): Promise<CertificateTemplate | null> {
  const rows = await executeQuery<TemplateRow[]>(
    'SELECT * FROM certificate_templates WHERE id = ? LIMIT 1',
    [id]
  );
  return rows.length > 0 ? mapRowToTemplate(rows[0]) : null;
}

/**
 * Создать шаблон
 */
export async function createTemplate(data: CreateCertificateTemplateInput): Promise<CertificateTemplate> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery<ResultSetHeader>(
    `INSERT INTO certificate_templates 
     (id, name, description, number_format, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, TRUE, ?, ?)`,
    [
      id,
      data.name,
      data.description || null,
      data.numberFormat || 'ATC{YY}_{CODE}_{NUM}',
      now,
      now,
    ]
  );

  return (await getTemplateById(id))!;
}

/**
 * Обновить шаблон
 */
export async function updateTemplate(
  id: string,
  data: UpdateCertificateTemplateInput
): Promise<CertificateTemplate | null> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }

  if (data.variables !== undefined) {
    updates.push('variables = ?');
    params.push(JSON.stringify(data.variables));
  }

  if (data.qrSettings !== undefined) {
    updates.push('qr_settings = ?');
    params.push(JSON.stringify(data.qrSettings));
  }

  if (data.numberFormat !== undefined) {
    updates.push('number_format = ?');
    params.push(data.numberFormat);
  }

  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive);
  }

  // Новые поля для визуального редактора
  if (data.templateData !== undefined) {
    updates.push('template_data = ?');
    params.push(JSON.stringify(data.templateData));
  }

  if (data.layout !== undefined) {
    updates.push('layout = ?');
    params.push(data.layout);
  }

  if (data.backgroundUrl !== undefined) {
    updates.push('background_url = ?');
    params.push(data.backgroundUrl);
  }

  if (updates.length === 0) {
    return getTemplateById(id);
  }

  updates.push('updated_at = ?');
  params.push(new Date());
  params.push(id);

  await executeQuery<ResultSetHeader>(
    `UPDATE certificate_templates SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return getTemplateById(id);
}

/**
 * Обновить файлы шаблона
 */
export async function updateTemplateFiles(
  id: string,
  originalFileUrl: string,
  previewFileUrl?: string
): Promise<void> {
  await executeQuery<ResultSetHeader>(
    `UPDATE certificate_templates 
     SET original_file_url = ?, template_file_url = ?, updated_at = ?
     WHERE id = ?`,
    [originalFileUrl, previewFileUrl || null, new Date(), id]
  );
}

/**
 * Удалить шаблон
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  // Проверяем, нет ли выданных сертификатов с этим шаблоном
  const [countRow] = await executeQuery<CountRow[]>(
    'SELECT COUNT(*) as total FROM issued_certificates WHERE template_id = ?',
    [id]
  );

  if (countRow && countRow.total > 0) {
    throw new Error(`Невозможно удалить шаблон: существует ${countRow.total} выданных сертификатов`);
  }

  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM certificate_templates WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

// ============================================================================
// ГЕНЕРАЦИЯ НОМЕРА СЕРТИФИКАТА
// ============================================================================

/**
 * Генерировать следующий номер сертификата
 */
export async function generateCertificateNumber(
  templateId: string,
  courseCode: string
): Promise<string> {
  return executeTransaction(async (connection) => {
    // Получаем шаблон и блокируем строку
    const [template] = await connection.query<TemplateRow[]>(
      'SELECT * FROM certificate_templates WHERE id = ? FOR UPDATE',
      [templateId]
    );

    if (!template || template.length === 0) {
      throw new Error('Шаблон не найден');
    }

    const tpl = template[0];
    const nextNumber = (tpl.last_number || 0) + 1;
    const format = tpl.number_format || 'ATC{YY}_{CODE}_{NUM}';

    // Формируем номер
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // "25"
    const paddedNum = nextNumber.toString().padStart(4, '0'); // "0001"

    let certificateNumber = format
      .replace('{YY}', year)
      .replace('{YYYY}', now.getFullYear().toString())
      .replace('{CODE}', courseCode)
      .replace('{NUM}', paddedNum);

    // Обновляем счётчик
    await connection.query(
      'UPDATE certificate_templates SET last_number = ?, updated_at = ? WHERE id = ?',
      [nextNumber, new Date(), templateId]
    );

    return certificateNumber;
  });
}

// ============================================================================
// ВЫДАННЫЕ СЕРТИФИКАТЫ - CRUD
// ============================================================================

/**
 * Получить выданные сертификаты для группы
 */
export async function getIssuedCertificatesByGroup(groupId: string): Promise<IssuedCertificate[]> {
  const rows = await executeQuery<IssuedCertificateRow[]>(
    `SELECT ic.*, 
            s.full_name as student_full_name,
            s.organization as student_organization,
            s.position as student_position
     FROM issued_certificates ic
     LEFT JOIN students s ON ic.student_id = s.id
     WHERE ic.group_id = ?
     ORDER BY s.full_name ASC`,
    [groupId]
  );

  return rows.map(mapRowToIssuedCertificate);
}

/**
 * Получить сертификат по ID
 */
export async function getIssuedCertificateById(id: string): Promise<IssuedCertificate | null> {
  const rows = await executeQuery<IssuedCertificateRow[]>(
    `SELECT ic.*, 
            s.full_name as student_full_name,
            s.organization as student_organization,
            s.position as student_position
     FROM issued_certificates ic
     LEFT JOIN students s ON ic.student_id = s.id
     WHERE ic.id = ?
     LIMIT 1`,
    [id]
  );

  return rows.length > 0 ? mapRowToIssuedCertificate(rows[0]) : null;
}

/**
 * Получить сертификат студента в группе
 */
export async function getStudentCertificateInGroup(
  studentId: string,
  groupId: string
): Promise<IssuedCertificate | null> {
  const rows = await executeQuery<IssuedCertificateRow[]>(
    `SELECT * FROM issued_certificates 
     WHERE student_id = ? AND group_id = ?
     LIMIT 1`,
    [studentId, groupId]
  );

  return rows.length > 0 ? mapRowToIssuedCertificate(rows[0]) : null;
}

/**
 * Создать запись о выданном сертификате (из журнала группы)
 */
export async function createIssuedCertificate(
  data: {
    groupId: string;
    studentId: string;
    templateId: string;
    certificateNumber: string;
    issueDate: Date;
    expiryDate?: Date | null;
    variablesData?: Record<string, string>;
    warnings?: IssueWarning[];
    overrideWarnings?: boolean;
    issuedBy?: string;
    notes?: string;
  }
): Promise<IssuedCertificate> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery<ResultSetHeader>(
    `INSERT INTO issued_certificates 
     (id, group_id, student_id, template_id, certificate_number, issue_date, expiry_date,
      source_type, status, variables_data, warnings, override_warnings, issued_by, issued_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'group_journal', 'issued', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.groupId,
      data.studentId,
      data.templateId,
      data.certificateNumber,
      data.issueDate,
      data.expiryDate || null,
      data.variablesData ? JSON.stringify(data.variablesData) : null,
      data.warnings ? JSON.stringify(data.warnings) : null,
      data.overrideWarnings || false,
      data.issuedBy || null,
      now,
      data.notes || null,
      now,
      now,
    ]
  );

  return (await getIssuedCertificateById(id))!;
}

/**
 * Создать standalone сертификат (для импорта или ручного добавления)
 */
export async function createStandaloneCertificate(
  data: {
    studentId: string;
    certificateNumber: string;
    issueDate: Date;
    expiryDate?: Date | null;
    // Данные курса
    courseName: string;
    courseCode?: string;
    courseHours?: number;
    // Данные группы (опционально)
    groupCode?: string;
    groupStartDate?: Date;
    groupEndDate?: Date;
    // Источник
    sourceType: 'manual' | 'import';
    // Файлы
    pdfFileUrl?: string;
    // Прочее
    issuedBy?: string;
    notes?: string;
  }
): Promise<IssuedCertificate> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery<ResultSetHeader>(
    `INSERT INTO issued_certificates 
     (id, student_id, certificate_number, issue_date, expiry_date,
      course_name, course_code, course_hours, group_code, group_start_date, group_end_date,
      source_type, status, pdf_file_url, issued_by, issued_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.studentId,
      data.certificateNumber,
      data.issueDate,
      data.expiryDate || null,
      data.courseName,
      data.courseCode || null,
      data.courseHours || null,
      data.groupCode || null,
      data.groupStartDate || null,
      data.groupEndDate || null,
      data.sourceType,
      data.pdfFileUrl || null,
      data.issuedBy || null,
      now,
      data.notes || null,
      now,
      now,
    ]
  );

  return (await getIssuedCertificateById(id))!;
}

/**
 * Проверить существование сертификата по номеру
 */
export async function getCertificateByNumber(
  certificateNumber: string
): Promise<IssuedCertificate | null> {
  const rows = await executeQuery<IssuedCertificateRow[]>(
    `SELECT ic.*, 
            s.full_name as student_full_name,
            s.organization as student_organization,
            s.position as student_position
     FROM issued_certificates ic
     LEFT JOIN students s ON ic.student_id = s.id
     WHERE ic.certificate_number = ?
     LIMIT 1`,
    [certificateNumber]
  );

  return rows.length > 0 ? mapRowToIssuedCertificate(rows[0]) : null;
}

/**
 * Обновить файлы сертификата
 */
export async function updateCertificateFiles(
  id: string,
  docxFileUrl: string,
  pdfFileUrl: string
): Promise<void> {
  await executeQuery<ResultSetHeader>(
    `UPDATE issued_certificates 
     SET docx_file_url = ?, pdf_file_url = ?, updated_at = ?
     WHERE id = ?`,
    [docxFileUrl, pdfFileUrl, new Date(), id]
  );
}

/**
 * Отозвать сертификат
 */
export async function revokeCertificate(
  id: string,
  revokedBy: string,
  reason: string
): Promise<IssuedCertificate | null> {
  const now = new Date();

  await executeQuery<ResultSetHeader>(
    `UPDATE issued_certificates 
     SET status = 'revoked', revoked_by = ?, revoked_at = ?, revoke_reason = ?, updated_at = ?
     WHERE id = ?`,
    [revokedBy, now, reason, now, id]
  );

  return getIssuedCertificateById(id);
}

/**
 * Удалить сертификат (только черновики)
 */
export async function deleteCertificate(id: string): Promise<boolean> {
  // Сначала проверяем статус
  const cert = await getIssuedCertificateById(id);
  if (!cert) {
    return false;
  }

  if (cert.status === 'issued') {
    throw new Error('Нельзя удалить выданный сертификат. Используйте отзыв.');
  }

  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM issued_certificates WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

/**
 * Переиздать сертификат (обновить существующий вместо создания нового)
 * Используется для сертификатов со статусом 'draft' или 'revoked'
 */
export async function reissueCertificate(
  existingCertId: string,
  data: {
    templateId: string;
    certificateNumber: string;
    issueDate: Date;
    expiryDate?: Date | null;
    variablesData?: Record<string, string>;
    warnings?: IssueWarning[];
    overrideWarnings?: boolean;
    issuedBy?: string;
    notes?: string;
  }
): Promise<IssuedCertificate> {
  const now = new Date();

  await executeQuery<ResultSetHeader>(
    `UPDATE issued_certificates 
     SET template_id = ?, 
         certificate_number = ?, 
         issue_date = ?, 
         expiry_date = ?,
         status = 'issued', 
         variables_data = ?, 
         warnings = ?, 
         override_warnings = ?, 
         issued_by = ?, 
         issued_at = ?,
         revoked_by = NULL,
         revoked_at = NULL,
         revoke_reason = NULL,
         notes = ?, 
         updated_at = ?
     WHERE id = ?`,
    [
      data.templateId,
      data.certificateNumber,
      data.issueDate,
      data.expiryDate || null,
      data.variablesData ? JSON.stringify(data.variablesData) : null,
      data.warnings ? JSON.stringify(data.warnings) : null,
      data.overrideWarnings || false,
      data.issuedBy || null,
      now,
      data.notes || null,
      now,
      existingCertId,
    ]
  );

  return (await getIssuedCertificateById(existingCertId))!;
}

// ============================================================================
// ПРОВЕРКА ДОПУСКА
// ============================================================================

/**
 * Минимальные требования для получения сертификата
 */
export const ELIGIBILITY_REQUIREMENTS = {
  minAttendancePercent: 75,  // Минимальная посещаемость
  minGrade: 60,              // Минимальный балл (если есть оценки)
  requireAllDisciplines: true, // Требуется посещение всех дисциплин
};

/**
 * Проверить допуск студента к получению сертификата
 */
export async function checkStudentEligibility(
  studentId: string,
  groupId: string
): Promise<StudentEligibility> {
  // Получаем данные студента
  const [studentRow] = await executeQuery<RowDataPacket[]>(
    'SELECT id, full_name FROM students WHERE id = ?',
    [studentId]
  );

  if (!studentRow) {
    throw new Error('Студент не найден');
  }

  // Получаем существующий сертификат
  const existingCert = await getStudentCertificateInGroup(studentId, groupId);

  // Получаем информацию о группе и курсе
  const [groupInfo] = await executeQuery<RowDataPacket[]>(
    `SELECT sg.id, sg.course_id, c.total_hours as course_total_hours
     FROM study_groups sg
     JOIN courses c ON sg.course_id = c.id
     WHERE sg.id = ?`,
    [groupId]
  );

  if (!groupInfo) {
    throw new Error('Группа не найдена');
  }

  // Получаем список дисциплин курса
  const disciplines = await executeQuery<RowDataPacket[]>(
    `SELECT d.id, d.name, d.hours
     FROM disciplines d
     WHERE d.course_id = ?
     ORDER BY d.order_index`,
    [groupInfo.course_id]
  );

  // Получаем суммарную посещаемость студента по занятиям группы
  const [attendanceStats] = await executeQuery<RowDataPacket[]>(
    `SELECT 
       COALESCE(SUM(a.hours_attended), 0) as total_attended_hours,
       COALESCE(SUM(a.max_hours), 0) as total_max_hours,
       COUNT(DISTINCT a.schedule_event_id) as attended_events
     FROM attendance a
     JOIN schedule_events se ON a.schedule_event_id = se.id
     WHERE a.student_id = ? AND se.group_id = ?`,
    [studentId, groupId]
  );

  // Получаем общее количество часов запланированных занятий для группы
  const [scheduledStats] = await executeQuery<RowDataPacket[]>(
    `SELECT 
       COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 45), 0) as scheduled_hours,
       COUNT(*) as total_events
     FROM schedule_events se
     WHERE se.group_id = ?`,
    [groupId]
  );

  // Получаем итоговые оценки студента в группе
  const gradesData = await executeQuery<RowDataPacket[]>(
    `SELECT fg.discipline_id, fg.final_grade, fg.status
     FROM final_grades fg
     WHERE fg.student_id = ? AND fg.group_id = ?`,
    [studentId, groupId]
  );

  // Подсчёт статистики
  const totalAttendedHours = Number(attendanceStats?.total_attended_hours) || 0;

  // Используем максимально возможные часы или часы курса
  let totalHours = Number(scheduledStats?.scheduled_hours) || 0;
  if (totalHours === 0) {
    // Если нет запланированных занятий, используем часы курса
    totalHours = Number(groupInfo.course_total_hours) || 0;
  }

  const totalDisciplines = disciplines.length;
  let gradesSum = 0;
  let gradesCount = 0;
  let completedDisciplines = 0;

  // Создаём набор дисциплин с оценками
  const gradedDisciplineIds = new Set<string>();
  for (const grade of gradesData) {
    if (grade.final_grade !== null) {
      gradesSum += Number(grade.final_grade);
      gradesCount++;
      gradedDisciplineIds.add(grade.discipline_id);
      if (grade.status === 'passed') {
        completedDisciplines++;
      }
    }
  }

  // Если нет итоговых оценок, считаем посещение как выполнение дисциплины
  if (gradesCount === 0 && attendanceStats?.attended_events > 0) {
    // Получаем уникальные дисциплины с посещением
    const attendedDisciplines = await executeQuery<RowDataPacket[]>(
      `SELECT DISTINCT se.discipline_id 
       FROM attendance a
       JOIN schedule_events se ON a.schedule_event_id = se.id
       WHERE a.student_id = ? AND se.group_id = ? AND a.hours_attended > 0`,
      [studentId, groupId]
    );
    completedDisciplines = attendedDisciplines.length;
  }

  // Расчёт процента посещаемости
  const totalAttendancePercent = totalHours > 0
    ? (totalAttendedHours / totalHours) * 100
    : 0;

  const averageGrade = gradesCount > 0 ? gradesSum / gradesCount : null;

  // Проверяем требования
  const warnings: IssueWarning[] = [];

  if (totalAttendancePercent < ELIGIBILITY_REQUIREMENTS.minAttendancePercent) {
    warnings.push({
      type: 'low_attendance',
      message: `Посещаемость ${totalAttendancePercent.toFixed(1)}% ниже минимальной (${ELIGIBILITY_REQUIREMENTS.minAttendancePercent}%)`,
      details: { actual: totalAttendancePercent, required: ELIGIBILITY_REQUIREMENTS.minAttendancePercent }
    });
  }

  if (ELIGIBILITY_REQUIREMENTS.requireAllDisciplines && completedDisciplines < totalDisciplines && totalDisciplines > 0) {
    warnings.push({
      type: 'incomplete_disciplines',
      message: `Пройдено ${completedDisciplines} из ${totalDisciplines} дисциплин`,
      details: { completed: completedDisciplines, total: totalDisciplines }
    });
  }

  if (averageGrade !== null && averageGrade < ELIGIBILITY_REQUIREMENTS.minGrade) {
    warnings.push({
      type: 'low_grade',
      message: `Средний балл ${averageGrade.toFixed(1)} ниже минимального (${ELIGIBILITY_REQUIREMENTS.minGrade})`,
      details: { actual: averageGrade, required: ELIGIBILITY_REQUIREMENTS.minGrade }
    });
  }

  if (gradesCount < totalDisciplines && totalDisciplines > 0) {
    warnings.push({
      type: 'missing_grades',
      message: `Оценки выставлены только по ${gradesCount} из ${totalDisciplines} дисциплин`,
      details: { graded: gradesCount, total: totalDisciplines }
    });
  }

  console.log(`[Eligibility] Student ${studentId}: attendance=${totalAttendancePercent.toFixed(1)}% (${totalAttendedHours}/${totalHours}h), grades=${gradesCount}/${totalDisciplines}, avgGrade=${averageGrade?.toFixed(1) || 'N/A'}`);

  return {
    studentId,
    studentName: studentRow.full_name,
    isEligible: warnings.length === 0,
    warnings,
    attendancePercent: totalAttendancePercent,
    completedDisciplines,
    totalDisciplines,
    averageGrade,
    hasCertificate: existingCert !== null,
    certificateStatus: existingCert?.status,
  };
}
