
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../utils/db';

export type NotificationType =
    | 'TEST_UPCOMING'
    | 'TEST_TODAY'
    | 'TEST_OVERDUE'
    | 'DEADLINE_WARNING'
    | 'DEADLINE_CRITICAL'
    | 'SCHEDULE_CHANGE'
    | 'GRADE_POSTED';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface CreateNotificationDTO {
    studentId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}

export interface UpcomingDeadline {
    student_id: string;
    assignment_id: string;
    end_date: string | Date;
    test_name: string;
    days_left: number;
}

/**
 * Создать уведомление для студента
 */
export async function createStudentNotification(dto: CreateNotificationDTO) {
    const id = uuidv4();

    await executeQuery(
        `INSERT INTO student_notifications (
      id, student_id, type, priority, title, message, link, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            id,
            dto.studentId,
            dto.type,
            dto.priority,
            dto.title,
            dto.message,
            dto.link || null,
            dto.metadata ? JSON.stringify(dto.metadata) : null
        ]
    );

    return id;
}

/**
 * Создать массовое уведомление (для группы студентов)
 */
export async function createManyStudentNotifications(studentIds: string[], dto: Omit<CreateNotificationDTO, 'studentId'>) {
    if (studentIds.length === 0) return;

    const values: any[] = [];
    const placeholders: string[] = [];

    for (const studentId of studentIds) {
        const id = uuidv4();
        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        values.push(
            id,
            studentId,
            dto.type,
            dto.priority,
            dto.title,
            dto.message,
            dto.link || null,
            dto.metadata ? JSON.stringify(dto.metadata) : null
        );
    }

    await executeQuery(
        `INSERT INTO student_notifications (
      id, student_id, type, priority, title, message, link, metadata, created_at
    ) VALUES ${placeholders.join(', ')}`,
        values
    );
}

/**
 * Отметить уведомление как прочитанное
 */
export async function markNotificationAsRead(id: string, studentId: string) {
    await executeQuery(
        'UPDATE student_notifications SET is_read = TRUE WHERE id = ? AND student_id = ?',
        [id, studentId]
    );
}

/**
 * Отметить все уведомления как прочитанные
 */
export async function markAllNotificationsAsRead(studentId: string) {
    await executeQuery(
        'UPDATE student_notifications SET is_read = TRUE WHERE student_id = ?',
        [studentId]
    );
}

/**
 * Получить уведомления студента
 */
export async function getStudentNotifications(studentId: string, unreadOnly = false, limit = 50) {
    let query = `SELECT * FROM student_notifications WHERE student_id = ?`;
    const params: any[] = [studentId];

    if (unreadOnly) {
        query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    return executeQuery(query, params);
}

/**
 * Получить ближайшие дедлайны (для всех или конкретного студента)
 */
export async function getUpcomingDeadlines(studentId?: string): Promise<UpcomingDeadline[]> {
    let query = `
    SELECT 
      s.id as student_id,
      ta.id as assignment_id,
      ta.end_date,
      tt.name as test_name,
      DATEDIFF(ta.end_date, NOW()) as days_left
    FROM test_assignments ta
    JOIN study_group_students sgs ON ta.group_id = sgs.group_id
    JOIN students s ON sgs.student_id = s.id
    JOIN test_templates tt ON ta.test_template_id = tt.id
    WHERE 
      ta.status IN ('scheduled', 'in_progress')
      AND ta.end_date > NOW()
      AND ta.end_date < DATE_ADD(NOW(), INTERVAL 7 DAY)
  `;

    const params: any[] = [];
    if (studentId) {
        query += ` AND s.id = ?`;
        params.push(studentId);
    }

    // Исключаем те, которые студент уже сдал
    query += `
    AND NOT EXISTS (
      SELECT 1 FROM test_sessions ts 
      WHERE ts.assignment_id = ta.id 
      AND ts.student_id = s.id 
      AND ts.status = 'completed' 
      AND ts.passed = 1
    )
  `;

    query += ` ORDER BY ta.end_date ASC`;

    const rows = await executeQuery<any[]>(query, params);
    return rows as UpcomingDeadline[];
}

// Алиас для обратной совместимости, если где-то используется объект
export const studentNotificationService = {
    create: createStudentNotification,
    createMany: createManyStudentNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    getUnread: (sid: string, lim = 10) => getStudentNotifications(sid, true, lim),
    getAll: (sid: string, p = 1, l = 20) => getStudentNotifications(sid, false, l),
    getUpcomingDeadlines
};
