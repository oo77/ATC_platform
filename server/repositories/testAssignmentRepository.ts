/**
 * Репозиторий для управления назначениями тестов
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
    TestAssignment,
    TestAssignmentWithDetails,
    TestAssignmentFilters,
    TestAssignmentStatus,
    CreateTestAssignmentDTO,
} from '../types/testing';

// ============================================================================
// ROW TYPES
// ============================================================================

interface TestAssignmentRow extends RowDataPacket {
    id: string;
    schedule_event_id: string;
    test_template_id: string;
    group_id: string;
    time_limit_override: number | null;
    passing_score_override: number | null;
    start_date: Date | null;
    end_date: Date | null;
    status: TestAssignmentStatus;
    assigned_by: string | null;
    created_at: Date;
    updated_at: Date;
    // Extended fields
    template_name?: string;
    template_code?: string;
    group_name?: string;
    event_date?: Date;
    event_start_time?: string;
    sessions_count?: number;
    completed_count?: number;
}

interface CountRow extends RowDataPacket {
    total: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToTestAssignment(row: TestAssignmentRow): TestAssignment {
    return {
        id: row.id,
        schedule_event_id: row.schedule_event_id,
        test_template_id: row.test_template_id,
        group_id: row.group_id,
        time_limit_override: row.time_limit_override,
        passing_score_override: row.passing_score_override,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        assigned_by: row.assigned_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapRowToTestAssignmentWithDetails(row: TestAssignmentRow): TestAssignmentWithDetails {
    return {
        ...mapRowToTestAssignment(row),
        template_name: row.template_name || '',
        template_code: row.template_code || '',
        group_name: row.group_name || '',
        event_date: row.event_date || new Date(),
        event_start_time: row.event_start_time || '',
        sessions_count: row.sessions_count || 0,
        completed_count: row.completed_count || 0,
    };
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить назначения с пагинацией и фильтрацией
 */
export async function getTestAssignments(
    filters: TestAssignmentFilters = {},
    pagination: PaginationParams = {}
): Promise<PaginatedResult<TestAssignmentWithDetails>> {
    const { page = 1, limit = 20 } = pagination;
    const { group_id, test_template_id, status, from_date, to_date } = filters;

    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (group_id) {
        conditions.push('ta.group_id = ?');
        queryParams.push(group_id);
    }

    if (test_template_id) {
        conditions.push('ta.test_template_id = ?');
        queryParams.push(test_template_id);
    }

    if (status) {
        conditions.push('ta.status = ?');
        queryParams.push(status);
    }

    if (from_date) {
        conditions.push('DATE(se.start_time) >= ?');
        queryParams.push(from_date);
    }

    if (to_date) {
        conditions.push('DATE(se.start_time) <= ?');
        queryParams.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Получаем общее количество
    const countQuery = `
    SELECT COUNT(*) as total 
    FROM test_assignments ta
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    ${whereClause}
  `;
    const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Получаем данные
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT 
      ta.*,
      tt.name as template_name,
      tt.code as template_code,
      sg.code as group_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_start_time,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id) as sessions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.status = 'completed') as completed_count
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    ${whereClause}
    ORDER BY se.start_time DESC
    LIMIT ? OFFSET ?
  `;

    const rows = await executeQuery<TestAssignmentRow[]>(dataQuery, [...queryParams, limit, offset]);

    return {
        data: rows.map(mapRowToTestAssignmentWithDetails),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить назначение по ID
 */
export async function getTestAssignmentById(id: string): Promise<TestAssignmentWithDetails | null> {
    const rows = await executeQuery<TestAssignmentRow[]>(
        `SELECT 
      ta.*,
      tt.name as template_name,
      tt.code as template_code,
      sg.code as group_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_start_time,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id) as sessions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.status = 'completed') as completed_count
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    WHERE ta.id = ?
    LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestAssignmentWithDetails(rows[0]);
}

/**
 * Получить назначение по schedule_event_id
 */
export async function getTestAssignmentByScheduleEventId(
    scheduleEventId: string
): Promise<TestAssignmentWithDetails | null> {
    const rows = await executeQuery<TestAssignmentRow[]>(
        `SELECT 
      ta.*,
      tt.name as template_name,
      tt.code as template_code,
      sg.code as group_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_start_time,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id) as sessions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.status = 'completed') as completed_count
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    WHERE ta.schedule_event_id = ?
    LIMIT 1`,
        [scheduleEventId]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestAssignmentWithDetails(rows[0]);
}

/**
 * Проверить существование хотя бы одного назначения для события
 */
export async function testAssignmentExistsForEvent(scheduleEventId: string): Promise<boolean> {
    const rows = await executeQuery<RowDataPacket[]>(
        'SELECT 1 FROM test_assignments WHERE schedule_event_id = ? LIMIT 1',
        [scheduleEventId]
    );
    return rows.length > 0;
}

/**
 * Проверить существование конкретного назначения (занятие + шаблон теста)
 * Используется для предотвращения дублирования одного и того же теста на одном занятии
 */
export async function testAssignmentExistsForEventAndTemplate(
    scheduleEventId: string,
    testTemplateId: string
): Promise<boolean> {
    const rows = await executeQuery<RowDataPacket[]>(
        'SELECT 1 FROM test_assignments WHERE schedule_event_id = ? AND test_template_id = ? LIMIT 1',
        [scheduleEventId, testTemplateId]
    );
    return rows.length > 0;
}

/**
 * Создать назначение теста
 */
export async function createTestAssignment(
    data: CreateTestAssignmentDTO,
    userId?: string
): Promise<TestAssignmentWithDetails> {
    const id = uuidv4();
    const now = new Date();

    // Преобразуем даты из строк в Date объекты, если нужно
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (data.start_date) {
        startDate = typeof data.start_date === 'string'
            ? new Date(data.start_date)
            : data.start_date;
    }

    if (data.end_date) {
        endDate = typeof data.end_date === 'string'
            ? new Date(data.end_date)
            : data.end_date;
    }

    await executeQuery(
        `INSERT INTO test_assignments (
      id, schedule_event_id, test_template_id, group_id,
      time_limit_override, passing_score_override, start_date, end_date,
      status, assigned_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.schedule_event_id,
            data.test_template_id,
            data.group_id,
            data.time_limit_override || null,
            data.passing_score_override || null,
            startDate,
            endDate,
            'scheduled',
            userId || null,
            now,
            now,
        ]
    );

    const result = await getTestAssignmentById(id);
    if (!result) {
        throw new Error('Failed to create test assignment');
    }

    return result;
}

/**
 * Обновить назначение теста
 */
export async function updateTestAssignment(
    id: string,
    data: {
        time_limit_override?: number | null;
        passing_score_override?: number | null;
        start_date?: Date | null;
        end_date?: Date | null;
        status?: TestAssignmentStatus;
    }
): Promise<TestAssignmentWithDetails | null> {
    const existing = await getTestAssignmentById(id);
    if (!existing) {
        return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.time_limit_override !== undefined) {
        updates.push('time_limit_override = ?');
        params.push(data.time_limit_override);
    }
    if (data.passing_score_override !== undefined) {
        updates.push('passing_score_override = ?');
        params.push(data.passing_score_override);
    }
    if (data.start_date !== undefined) {
        updates.push('start_date = ?');
        params.push(data.start_date);
    }
    if (data.end_date !== undefined) {
        updates.push('end_date = ?');
        params.push(data.end_date);
    }
    if (data.status !== undefined) {
        updates.push('status = ?');
        params.push(data.status);
    }

    if (updates.length === 0) {
        return existing;
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await executeQuery(
        `UPDATE test_assignments SET ${updates.join(', ')} WHERE id = ?`,
        params
    );

    return getTestAssignmentById(id);
}

/**
 * Удалить назначение теста
 */
export async function deleteTestAssignment(id: string): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM test_assignments WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

/**
 * Обновить статус назначения
 */
export async function updateTestAssignmentStatus(
    id: string,
    status: TestAssignmentStatus
): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'UPDATE test_assignments SET status = ?, updated_at = ? WHERE id = ?',
        [status, new Date(), id]
    );

    return result.affectedRows > 0;
}

// ============================================================================
// ФУНКЦИИ ДЛЯ СТУДЕНТОВ
// ============================================================================

/**
 * Получить назначения для студента (доступные тесты)
 */
export async function getStudentAssignments(
    studentId: string,
    filters: {
        status?: TestAssignmentStatus;
        upcoming?: boolean;
    } = {}
): Promise<Array<{
    id: string;
    schedule_event_id: string;
    test_template_id: string;
    group_id: string;
    template_name: string;
    template_code: string;
    group_name: string;
    discipline_name: string | null;
    event_date: Date | null;
    event_time: string | null;
    status: TestAssignmentStatus;
    start_date: Date | null;
    end_date: Date | null;
    time_limit: number | null;
    passing_score: number;
    max_attempts: number;
    questions_count: number;
    attempts_used: number;
    best_score: number | null;
    passed: boolean;
    has_active_session: boolean;
    active_session_id: string | null;
}>> {
    const { status, upcoming } = filters;

    const conditions: string[] = [];
    const queryParams: any[] = [];

    // Студент ID для подзапросов
    queryParams.push(studentId);
    queryParams.push(studentId);
    queryParams.push(studentId);
    queryParams.push(studentId);

    // Получаем группы студента
    conditions.push(`
    ta.group_id IN (
      SELECT sgs.group_id 
      FROM study_group_students sgs 
      WHERE sgs.student_id = ?
    )
  `);
    queryParams.push(studentId);

    if (status) {
        conditions.push('ta.status = ?');
        queryParams.push(status);
    }

    if (upcoming) {
        conditions.push('(ta.end_date IS NULL OR ta.end_date >= NOW())');
        conditions.push("ta.status IN ('scheduled', 'in_progress')");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
    SELECT 
      ta.id,
      ta.schedule_event_id,
      ta.test_template_id,
      ta.group_id,
      ta.status,
      ta.status,
      ta.start_date,
      ta.end_date,
      sg.end_date as group_end_date,
      tt.name as template_name,
      tt.code as template_code,
      tt.max_attempts,
      COALESCE(ta.time_limit_override, tt.time_limit_minutes) as time_limit,
      COALESCE(ta.passing_score_override, tt.passing_score) as passing_score,
      sg.code as group_name,
      d.name as discipline_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_time,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = 1) as questions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ?) as attempts_used,
      (SELECT MAX(ts.score_percent) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ? AND ts.status = 'completed') as best_score,
      (SELECT MAX(ts.passed) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ? AND ts.status = 'completed') as passed,
      (SELECT ts.id FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ? AND ts.status = 'in_progress' LIMIT 1) as active_session_id
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN ta.status = 'in_progress' THEN 0
        WHEN ta.status = 'scheduled' THEN 1
        ELSE 2
      END,
      se.start_time DESC
  `;

    const rows = await executeQuery<RowDataPacket[]>(query, queryParams);

    // Возвращаем Date объекты напрямую
    // При сериализации в JSON они станут ISO строками с 'Z' (UTC)
    // Клиент автоматически конвертирует в локальное время браузера

    return rows.map((row: any) => {
        let endDate = row.end_date ? new Date(row.end_date) : null;
        const groupEndDate = row.group_end_date ? new Date(row.group_end_date) : null;

        // Если курс завершен раньше дедлайна теста (или дедлайна нет), используем дату завершения курса
        if (groupEndDate && (!endDate || groupEndDate < endDate)) {
            endDate = groupEndDate;
        }

        return {
            id: row.id,
            schedule_event_id: row.schedule_event_id,
            test_template_id: row.test_template_id,
            group_id: row.group_id,
            template_name: row.template_name || '',
            template_code: row.template_code || '',
            group_name: row.group_name || '',
            discipline_name: row.discipline_name || null,
            event_date: row.event_date || null,
            event_time: row.event_time || null,
            status: row.status,
            // Date объекты сериализуются в ISO UTC строки ("2026-01-06T09:40:00.000Z")
            // Клиент должен использовать new Date() для парсинга
            start_date: row.start_date || null,
            end_date: endDate,
            time_limit: row.time_limit || null,
            passing_score: row.passing_score || 60,
            max_attempts: row.max_attempts || 1,
            questions_count: row.questions_count || 0,
            attempts_used: row.attempts_used || 0,
            best_score: row.best_score !== null ? parseFloat(row.best_score) : null,
            passed: Boolean(row.passed),
            has_active_session: !!row.active_session_id,
            active_session_id: row.active_session_id || null,
        };
    });
}

/**
 * Получить назначения группы
 */
export async function getGroupAssignments(
    groupId: string,
    filters: {
        status?: TestAssignmentStatus;
        from_date?: Date;
        to_date?: Date;
    } = {}
): Promise<TestAssignmentWithDetails[]> {
    const conditions: string[] = ['ta.group_id = ?'];
    const queryParams: any[] = [groupId];

    if (filters.status) {
        conditions.push('ta.status = ?');
        queryParams.push(filters.status);
    }

    if (filters.from_date) {
        conditions.push('DATE(se.start_time) >= ?');
        queryParams.push(filters.from_date);
    }

    if (filters.to_date) {
        conditions.push('DATE(se.start_time) <= ?');
        queryParams.push(filters.to_date);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
    SELECT 
      ta.*,
      tt.name as template_name,
      tt.code as template_code,
      sg.code as group_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_start_time,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id) as sessions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.status = 'completed') as completed_count
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    ${whereClause}
    ORDER BY se.start_time DESC
  `;

    const rows = await executeQuery<TestAssignmentRow[]>(query, queryParams);

    return rows.map(mapRowToTestAssignmentWithDetails);
}
