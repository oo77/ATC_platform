/**
 * Репозиторий для управления сессиями тестирования
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import type {
    TestSession,
    TestSessionWithDetails,
    TestSessionFilters,
    TestSessionStatus,
    TestAnswer,
    SessionQuestionOrder,
    ViolationRecord,
    AnswerData,
    StartTestSessionDTO,
    SaveAnswerDTO,
    TestResultDTO,
    Question,
    SingleChoiceOptions,
    QuestionLanguage,
} from '../types/testing';

// ============================================================================
// ROW TYPES
// ============================================================================

interface TestSessionRow extends RowDataPacket {
    id: string;
    assignment_id: string | null;
    student_id: string | null;
    preview_user_id: string | null;
    attempt_number: number;
    status: TestSessionStatus;
    is_preview: boolean;
    language: QuestionLanguage | null;
    questions_order: string | null;
    current_question_index: number;
    started_at: Date;
    completed_at: Date | null;
    time_spent_seconds: number | null;
    total_points: number | null;
    max_points: number | null;
    score_percent: string | null;
    passed: boolean | null;
    grade: number | null;
    violations: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    updated_at: Date;
    // Extended fields
    student_name?: string;
    student_iin?: string;
    template_name?: string;
    answers_count?: number;
}

interface TestAnswerRow extends RowDataPacket {
    id: string;
    session_id: string;
    question_id: string;
    answer_data: string;
    is_correct: boolean | null;
    points_earned: number;
    answered_at: Date;
    time_spent_seconds: number | null;
}

interface CountRow extends RowDataPacket {
    total: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function parseJsonSafe<T>(json: string | null, defaultValue: T): T {
    if (!json) return defaultValue;
    try {
        return JSON.parse(json) as T;
    } catch {
        return defaultValue;
    }
}

function mapRowToTestSession(row: TestSessionRow): TestSession {
    return {
        id: row.id,
        assignment_id: row.assignment_id,
        student_id: row.student_id,
        preview_user_id: row.preview_user_id || null,
        attempt_number: row.attempt_number,
        status: row.status,
        is_preview: Boolean(row.is_preview),
        language: row.language || null,
        questions_order: parseJsonSafe<SessionQuestionOrder[] | null>(row.questions_order, null),
        current_question_index: row.current_question_index,
        started_at: row.started_at,
        completed_at: row.completed_at,
        time_spent_seconds: row.time_spent_seconds,
        total_points: row.total_points,
        max_points: row.max_points,
        score_percent: row.score_percent ? parseFloat(row.score_percent) : null,
        passed: row.passed !== null ? Boolean(row.passed) : null,
        grade: row.grade,
        violations: parseJsonSafe<ViolationRecord[] | null>(row.violations, null),
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapRowToTestSessionWithDetails(row: TestSessionRow): TestSessionWithDetails {
    return {
        ...mapRowToTestSession(row),
        student_name: row.student_name || '',
        student_iin: row.student_iin || '',
        template_name: row.template_name || '',
        answers_count: row.answers_count || 0,
    };
}

function mapRowToTestAnswer(row: TestAnswerRow): TestAnswer {
    return {
        id: row.id,
        session_id: row.session_id,
        question_id: row.question_id,
        answer_data: parseJsonSafe<AnswerData>(row.answer_data, { selectedOption: '' }),
        is_correct: row.is_correct !== null ? Boolean(row.is_correct) : null,
        points_earned: row.points_earned,
        answered_at: row.answered_at,
        time_spent_seconds: row.time_spent_seconds,
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
// СЕССИИ - ОСНОВНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить сессии с пагинацией и фильтрацией
 */
export async function getTestSessions(
    filters: TestSessionFilters = {},
    pagination: PaginationParams = {}
): Promise<PaginatedResult<TestSessionWithDetails>> {
    const { page = 1, limit = 20 } = pagination;
    const { assignment_id, student_id, status } = filters;

    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (assignment_id) {
        conditions.push('ts.assignment_id = ?');
        queryParams.push(assignment_id);
    }

    if (student_id) {
        conditions.push('ts.student_id = ?');
        queryParams.push(student_id);
    }

    if (status) {
        conditions.push('ts.status = ?');
        queryParams.push(status);
    }

    // Фильтр по языку сессии
    if (filters.language) {
        conditions.push('ts.language = ?');
        queryParams.push(filters.language);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Получаем общее количество
    const countQuery = `SELECT COUNT(*) as total FROM test_sessions ts ${whereClause}`;
    const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Получаем данные
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT 
      ts.*,
      s.full_name as student_name,
      s.pinfl as student_iin,
      tt.name as template_name,
      (SELECT COUNT(*) FROM test_answers ta WHERE ta.session_id = ts.id) as answers_count
    FROM test_sessions ts
    LEFT JOIN students s ON ts.student_id = s.id
    LEFT JOIN test_assignments tass ON ts.assignment_id = tass.id
    LEFT JOIN test_templates tt ON tass.test_template_id = tt.id
    ${whereClause}
    ORDER BY ts.started_at DESC
    LIMIT ? OFFSET ?
  `;

    const rows = await executeQuery<TestSessionRow[]>(dataQuery, [...queryParams, limit, offset]);

    return {
        data: rows.map(mapRowToTestSessionWithDetails),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить сессию по ID
 */
export async function getTestSessionById(id: string): Promise<TestSessionWithDetails | null> {
    const rows = await executeQuery<TestSessionRow[]>(
        `SELECT 
      ts.*,
      s.full_name as student_name,
      s.pinfl as student_iin,
      tt.name as template_name,
      (SELECT COUNT(*) FROM test_answers ta WHERE ta.session_id = ts.id) as answers_count
    FROM test_sessions ts
    LEFT JOIN students s ON ts.student_id = s.id
    LEFT JOIN test_assignments tass ON ts.assignment_id = tass.id
    LEFT JOIN test_templates tt ON tass.test_template_id = tt.id
    WHERE ts.id = ?
    LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestSessionWithDetails(rows[0]);
}

/**
 * Получить активную сессию студента для назначения
 */
export async function getActiveSessionForStudent(
    assignmentId: string,
    studentId: string
): Promise<TestSession | null> {
    const rows = await executeQuery<TestSessionRow[]>(
        `SELECT * FROM test_sessions 
     WHERE assignment_id = ? AND student_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC
     LIMIT 1`,
        [assignmentId, studentId]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestSession(rows[0]);
}

/**
 * Получить количество попыток студента
 */
export async function getStudentAttemptCount(
    assignmentId: string,
    studentId: string
): Promise<number> {
    const rows = await executeQuery<CountRow[]>(
        'SELECT COUNT(*) as total FROM test_sessions WHERE assignment_id = ? AND student_id = ?',
        [assignmentId, studentId]
    );

    return rows[0]?.total || 0;
}

/**
 * Создать новую сессию (начать тест)
 */
export async function createTestSession(
    data: StartTestSessionDTO,
    questionsOrder: SessionQuestionOrder[]
): Promise<TestSession> {
    const id = uuidv4();
    const now = new Date();

    // Для preview-сессий не считаем попытки
    let attemptNumber = 1;
    if (!data.is_preview && data.assignment_id && data.student_id) {
        const attemptCount = await getStudentAttemptCount(data.assignment_id, data.student_id);
        attemptNumber = attemptCount + 1;
    }

    await executeQuery(
        `INSERT INTO test_sessions (
      id, assignment_id, student_id, attempt_number, status, is_preview, preview_user_id,
      language, questions_order, current_question_index, started_at,
      ip_address, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.assignment_id || null,
            data.student_id || null,
            attemptNumber,
            'in_progress',
            data.is_preview || false,
            data.preview_user_id || null,
            data.language || null,
            JSON.stringify(questionsOrder),
            0,
            now,
            data.ip_address || null,
            data.user_agent || null,
            now,
            now,
        ]
    );

    const session = await getTestSessionById(id);
    if (!session) {
        throw new Error('Failed to create test session');
    }

    return session;
}

/**
 * Обновить текущий индекс вопроса
 */
export async function updateCurrentQuestionIndex(
    sessionId: string,
    index: number
): Promise<void> {
    await executeQuery(
        'UPDATE test_sessions SET current_question_index = ?, updated_at = ? WHERE id = ?',
        [index, new Date(), sessionId]
    );
}

/**
 * Добавить нарушение
 */
export async function addViolation(
    sessionId: string,
    violation: ViolationRecord
): Promise<void> {
    // Получаем текущие нарушения
    const rows = await executeQuery<TestSessionRow[]>(
        'SELECT violations FROM test_sessions WHERE id = ?',
        [sessionId]
    );

    if (rows.length === 0) {
        return;
    }

    const violations = parseJsonSafe<ViolationRecord[]>(rows[0].violations, []);
    violations.push(violation);

    await executeQuery(
        'UPDATE test_sessions SET violations = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(violations), new Date(), sessionId]
    );
}

/**
 * Обновить статус сессии
 */
export async function updateSessionStatus(
    sessionId: string,
    status: TestSessionStatus
): Promise<void> {
    const updates: string[] = ['status = ?', 'updated_at = ?'];
    const params: any[] = [status, new Date()];

    if (status === 'completed' || status === 'timeout' || status === 'violation') {
        updates.push('completed_at = ?');
        params.push(new Date());
    }

    params.push(sessionId);

    await executeQuery(
        `UPDATE test_sessions SET ${updates.join(', ')} WHERE id = ?`,
        params
    );
}

/**
 * Завершить сессию с результатами
 */
export async function finishSession(
    sessionId: string,
    results: {
        total_points: number;
        max_points: number;
        score_percent: number;
        passed: boolean;
        grade: number;
        time_spent_seconds: number;
    }
): Promise<void> {
    await executeQuery(
        `UPDATE test_sessions SET 
      status = 'completed',
      completed_at = ?,
      total_points = ?,
      max_points = ?,
      score_percent = ?,
      passed = ?,
      grade = ?,
      time_spent_seconds = ?,
      updated_at = ?
    WHERE id = ?`,
        [
            new Date(),
            results.total_points,
            results.max_points,
            results.score_percent,
            results.passed,
            results.grade,
            results.time_spent_seconds,
            new Date(),
            sessionId,
        ]
    );
}

// ============================================================================
// ОТВЕТЫ
// ============================================================================

/**
 * Получить все ответы сессии
 */
export async function getSessionAnswers(sessionId: string): Promise<TestAnswer[]> {
    const rows = await executeQuery<TestAnswerRow[]>(
        'SELECT * FROM test_answers WHERE session_id = ? ORDER BY answered_at ASC',
        [sessionId]
    );

    return rows.map(mapRowToTestAnswer);
}

/**
 * Получить ответ на конкретный вопрос
 */
export async function getAnswerForQuestion(
    sessionId: string,
    questionId: string
): Promise<TestAnswer | null> {
    const rows = await executeQuery<TestAnswerRow[]>(
        'SELECT * FROM test_answers WHERE session_id = ? AND question_id = ? LIMIT 1',
        [sessionId, questionId]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestAnswer(rows[0]);
}

/**
 * Сохранить ответ (создать или обновить)
 */
export async function saveAnswer(
    data: SaveAnswerDTO,
    question: Question
): Promise<TestAnswer> {
    const now = new Date();

    // Проверяем правильность ответа
    const { isCorrect, pointsEarned } = validateAnswer(question, data.answer_data);

    // Проверяем существующий ответ
    const existing = await getAnswerForQuestion(data.session_id, data.question_id);

    if (existing) {
        // Обновляем
        await executeQuery(
            `UPDATE test_answers SET 
        answer_data = ?,
        is_correct = ?,
        points_earned = ?,
        answered_at = ?,
        time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?
      WHERE id = ?`,
            [
                JSON.stringify(data.answer_data),
                isCorrect,
                pointsEarned,
                now,
                data.time_spent_seconds || 0,
                existing.id,
            ]
        );

        return {
            ...existing,
            answer_data: data.answer_data,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            answered_at: now,
        };
    } else {
        // Создаём
        const id = uuidv4();

        await executeQuery(
            `INSERT INTO test_answers (
        id, session_id, question_id, answer_data,
        is_correct, points_earned, answered_at, time_spent_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.session_id,
                data.question_id,
                JSON.stringify(data.answer_data),
                isCorrect,
                pointsEarned,
                now,
                data.time_spent_seconds || null,
            ]
        );

        return {
            id,
            session_id: data.session_id,
            question_id: data.question_id,
            answer_data: data.answer_data,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            answered_at: now,
            time_spent_seconds: data.time_spent_seconds || null,
        };
    }
}

// ============================================================================
// ВАЛИДАЦИЯ ОТВЕТОВ
// ============================================================================

/**
 * Проверить правильность ответа
 */
function validateAnswer(
    question: Question,
    answerData: AnswerData
): { isCorrect: boolean; pointsEarned: number } {
    switch (question.question_type) {
        case 'single':
            return validateSingleChoice(question, answerData);
        // TODO: Добавить остальные типы вопросов
        default:
            return { isCorrect: false, pointsEarned: 0 };
    }
}

/**
 * Проверка single choice
 */
function validateSingleChoice(
    question: Question,
    answerData: AnswerData
): { isCorrect: boolean; pointsEarned: number } {
    const options = question.options as SingleChoiceOptions;
    const answer = answerData as { selectedOption?: string };

    if (!answer.selectedOption || !options.options) {
        return { isCorrect: false, pointsEarned: 0 };
    }

    const correctOption = options.options.find(o => o.correct);
    const isCorrect = answer.selectedOption === correctOption?.id;

    return {
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
    };
}

// ============================================================================
// ПОДСЧЁТ РЕЗУЛЬТАТОВ
// ============================================================================

/**
 * Подсчитать результаты сессии
 */
export async function calculateSessionResults(sessionId: string): Promise<TestResultDTO> {
    const session = await getTestSessionById(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }

    const answers = await getSessionAnswers(sessionId);

    // Получаем информацию о назначении и шаблоне
    const assignmentRows = await executeQuery<RowDataPacket[]>(
        `SELECT 
      ta.passing_score_override,
      tt.passing_score
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    WHERE ta.id = ?`,
        [session.assignment_id]
    );

    const passingScore = assignmentRows[0]?.passing_score_override || assignmentRows[0]?.passing_score || 60;

    // Подсчитываем баллы
    let totalPoints = 0;
    let maxPoints = 0;
    let correctCount = 0;

    for (const answer of answers) {
        if (answer.is_correct) {
            totalPoints += answer.points_earned;
            correctCount++;
        }
    }

    // Получаем максимальные баллы из вопросов
    const questionsOrder = session.questions_order || [];
    const questionIds = questionsOrder.map(q => q.questionId);

    if (questionIds.length > 0) {
        const placeholders = questionIds.map(() => '?').join(', ');
        const questionRows = await executeQuery<RowDataPacket[]>(
            `SELECT SUM(points) as total_points FROM questions WHERE id IN (${placeholders})`,
            questionIds
        );
        maxPoints = questionRows[0]?.total_points || 0;
    }

    const scorePercent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
    const passed = scorePercent >= passingScore;
    const grade = Math.round(scorePercent);

    // Время прохождения
    const timeSpentSeconds = session.started_at
        ? Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000)
        : 0;

    return {
        session_id: sessionId,
        total_points: totalPoints,
        max_points: maxPoints,
        score_percent: scorePercent,
        passed,
        grade,
        answers_count: answers.length,
        correct_count: correctCount,
        time_spent_seconds: timeSpentSeconds,
    };
}

/**
 * Получить результаты сессий по назначению
 */
export async function getAssignmentResults(assignmentId: string): Promise<Array<{
    student_id: string;
    student_name: string;
    student_iin: string;
    attempts: number;
    best_score: number | null;
    last_attempt_at: Date | null;
    passed: boolean;
}>> {
    const rows = await executeQuery<RowDataPacket[]>(
        `SELECT 
      ts.student_id,
      s.full_name as student_name,
      s.pinfl as student_iin,
      COUNT(*) as attempts,
      MAX(ts.score_percent) as best_score,
      MAX(ts.started_at) as last_attempt_at,
      MAX(ts.passed) as passed
    FROM test_sessions ts
    LEFT JOIN students s ON ts.student_id = s.id
    WHERE ts.assignment_id = ?
    GROUP BY ts.student_id, s.full_name, s.pinfl
    ORDER BY s.full_name ASC`,
        [assignmentId]
    );

    return rows.map(row => ({
        student_id: row.student_id,
        student_name: row.student_name || '',
        student_iin: row.student_iin || '',
        attempts: row.attempts,
        best_score: row.best_score ? parseFloat(row.best_score) : null,
        last_attempt_at: row.last_attempt_at,
        passed: Boolean(row.passed),
    }));
}

/**
 * Получить сессии студента
 */
export async function getStudentSessions(
    studentId: string,
    filters: {
        status?: TestSessionStatus;
        limit?: number;
    } = {}
): Promise<TestSessionWithDetails[]> {
    const conditions: string[] = ['ts.student_id = ?'];
    const queryParams: any[] = [studentId];

    if (filters.status) {
        conditions.push('ts.status = ?');
        queryParams.push(filters.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitClause = filters.limit ? `LIMIT ${filters.limit}` : '';

    const query = `
    SELECT 
      ts.*,
      s.full_name as student_name,
      s.pinfl as student_iin,
      tt.name as template_name,
      (SELECT COUNT(*) FROM test_answers ta WHERE ta.session_id = ts.id) as answers_count
    FROM test_sessions ts
    LEFT JOIN students s ON ts.student_id = s.id
    LEFT JOIN test_assignments tass ON ts.assignment_id = tass.id
    LEFT JOIN test_templates tt ON tass.test_template_id = tt.id
    ${whereClause}
    ORDER BY ts.started_at DESC
    ${limitClause}
  `;

    const rows = await executeQuery<TestSessionRow[]>(query, queryParams);

    return rows.map(mapRowToTestSessionWithDetails);
}
