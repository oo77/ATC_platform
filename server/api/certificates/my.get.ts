/**
 * API Endpoint: GET /api/certificates/my
 * 
 * Получение сертификатов текущего авторизованного пользователя (студента)
 * Поддерживает все типы сертификатов: group_journal, import, manual
 */

import { H3Event } from 'h3'
import { requirePermission, getStudentByUserId } from '../../utils/permissions'
import { Permission } from '../../types/permissions'
import { executeQuery } from '../../utils/db'
import { logActivity } from '../../utils/activityLogger'

interface StudentCertificate {
  id: string
  certificateNumber: string
  courseName: string
  courseCode: string | null
  courseHours: number | null
  groupCode: string | null
  status: 'issued' | 'revoked'
  sourceType: 'group_journal' | 'import' | 'manual'
  issuedAt: string
  expiresAt: string | null
  fileUrl: string | null
}

interface CertificateRow {
  id: string
  certificate_number: string
  issue_date: string
  expiry_date: string | null
  status: string
  source_type: string
  pdf_file_url: string | null
  // Данные курса - из связи или standalone
  linked_course_name: string | null
  linked_course_code: string | null
  standalone_course_name: string | null
  standalone_course_code: string | null
  standalone_course_hours: number | null
  // Данные группы - из связи или standalone
  linked_group_code: string | null
  standalone_group_code: string | null
}

export default defineEventHandler(async (event: H3Event) => {
  console.log('[API] GET /api/certificates/my - Запрос сертификатов текущего пользователя')

  // Проверяем разрешение на просмотр своих сертификатов
  const context = await requirePermission(event, Permission.CERTIFICATES_VIEW_OWN)

  // Получаем student_id текущего пользователя
  const student = await getStudentByUserId(context.userId)

  if (!student) {
    // Если пользователь не является студентом, возвращаем пустой список
    console.log(`[API] Пользователь ${context.userId} не связан со студентом`)
    return {
      success: true,
      certificates: [],
    }
  }

  console.log(`[API] Получение сертификатов для студента ${student.id} (${student.fullName})`)

  try {
    // Получаем сертификаты студента из объединённой таблицы issued_certificates
    // Используем LEFT JOIN для получения данных из связанных таблиц (для group_journal сертификатов)
    const certificates = await executeQuery<CertificateRow[]>(`
      SELECT 
        ic.id,
        ic.certificate_number,
        ic.issue_date,
        ic.expiry_date,
        ic.status,
        ic.source_type,
        ic.pdf_file_url,
        -- Данные курса из связи (для group_journal)
        c.name as linked_course_name,
        c.code as linked_course_code,
        -- Standalone данные курса (для import/manual)
        ic.course_name as standalone_course_name,
        ic.course_code as standalone_course_code,
        ic.course_hours as standalone_course_hours,
        -- Данные группы из связи
        g.code as linked_group_code,
        -- Standalone данные группы
        ic.group_code as standalone_group_code
      FROM issued_certificates ic
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE ic.student_id = ?
        AND ic.status = 'issued'
      ORDER BY ic.issue_date DESC
    `, [student.id])

    // Маппинг с приоритетом: данные из связей > standalone данные
    const result: StudentCertificate[] = certificates.map(cert => ({
      id: cert.id,
      certificateNumber: cert.certificate_number,
      // Приоритет: linked > standalone > пустая строка
      courseName: cert.linked_course_name || cert.standalone_course_name || 'Не указан',
      courseCode: cert.linked_course_code || cert.standalone_course_code || null,
      courseHours: cert.standalone_course_hours || null,
      groupCode: cert.linked_group_code || cert.standalone_group_code || null,
      status: cert.status as 'issued' | 'revoked',
      sourceType: cert.source_type as 'group_journal' | 'import' | 'manual',
      issuedAt: cert.issue_date,
      expiresAt: cert.expiry_date,
      fileUrl: cert.pdf_file_url,
    }))

    // Логируем действие
    await logActivity(
      event,
      'VIEW',
      'ISSUED_CERTIFICATE',
      undefined,
      undefined,
      { message: `Просмотр своих сертификатов (${result.length} шт.)` }
    )

    console.log(`[API] Найдено ${result.length} сертификатов для студента ${student.id}`)

    return {
      success: true,
      certificates: result,
    }
  } catch (error: any) {
    console.error('[API] Ошибка получения сертификатов:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Ошибка при получении сертификатов',
    })
  }
})
