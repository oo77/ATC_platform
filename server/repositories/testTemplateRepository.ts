/**
 * Репозиторий для работы с шаблонами тестов
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import type {
    TestTemplate,
    TestTemplateWithDetails,
    TestTemplateFilters,
    CreateTestTemplateDTO,
    UpdateTestTemplateDTO,
    TestTemplateQuestion,
    QuestionsMode,
    ShowResultsMode,
    ProctoringSettings,
    QuestionLanguage,
    LanguageValidation,
} from '../types/testing';
import { QuestionLanguage as QLang, LANGUAGE_LABELS, LANGUAGE_FLAGS } from '../types/testing';
import * as questionRepository from './questionRepository';

// ============================================================================
// ROW TYPES
// ============================================================================

interface TestTemplateRow extends RowDataPacket {
    id: string;
    bank_id: string;
    name: string;
    code: string;
    description: string | null;
    questions_mode: QuestionsMode;
    questions_count: number | null;
    time_limit_minutes: number | null;
    passing_score: number;
    max_attempts: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    questions_per_page: number;
    show_results: ShowResultsMode;
    allow_back: boolean;
    proctoring_enabled: boolean;
    proctoring_settings: string | null;
    allowed_languages: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
    // Extended fields
    bank_name?: string;
    bank_code?: string;
    questions_total?: number;
    created_by_name?: string;
}

interface TemplateQuestionRow extends RowDataPacket {
    id: string;
    template_id: string;
    question_id: string;
    order_index: number;
    points_override: number | null;
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

function mapRowToTestTemplate(row: TestTemplateRow): TestTemplate {
    return {
        id: row.id,
        bank_id: row.bank_id,
        name: row.name,
        code: row.code,
        description: row.description,
        questions_mode: row.questions_mode,
        questions_count: row.questions_count,
        time_limit_minutes: row.time_limit_minutes,
        passing_score: row.passing_score,
        max_attempts: row.max_attempts,
        shuffle_questions: Boolean(row.shuffle_questions),
        shuffle_options: Boolean(row.shuffle_options),
        questions_per_page: row.questions_per_page,
        show_results: row.show_results,
        allow_back: Boolean(row.allow_back),
        proctoring_enabled: Boolean(row.proctoring_enabled),
        proctoring_settings: parseJsonSafe<ProctoringSettings | null>(row.proctoring_settings, null),
        allowed_languages: parseJsonSafe<QuestionLanguage[] | null>(row.allowed_languages, null),
        is_active: Boolean(row.is_active),
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapRowToTestTemplateWithDetails(row: TestTemplateRow): TestTemplateWithDetails {
    return {
        ...mapRowToTestTemplate(row),
        bank_name: row.bank_name || '',
        bank_code: row.bank_code || '',
        questions_total: row.questions_total || 0,
        created_by_name: row.created_by_name,
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
 * Получить шаблоны тестов с пагинацией и фильтрацией
 */
export async function getTestTemplates(
    filters: TestTemplateFilters = {},
    pagination: PaginationParams = {}
): Promise<PaginatedResult<TestTemplateWithDetails>> {
    const { page = 1, limit = 20 } = pagination;
    const { bank_id, is_active, search } = filters;

    // Строим WHERE условия
    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (bank_id) {
        conditions.push('tt.bank_id = ?');
        queryParams.push(bank_id);
    }

    if (is_active !== undefined) {
        conditions.push('tt.is_active = ?');
        queryParams.push(is_active);
    }

    if (search) {
        conditions.push('(tt.name LIKE ? OR tt.code LIKE ? OR tt.description LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Получаем общее количество
    const countQuery = `SELECT COUNT(*) as total FROM test_templates tt ${whereClause}`;
    const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Получаем данные с пагинацией
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT 
      tt.*,
      qb.name as bank_name,
      qb.code as bank_code,
      u.name as created_by_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_total
    FROM test_templates tt
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    LEFT JOIN users u ON tt.created_by = u.id
    ${whereClause}
    ORDER BY tt.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const rows = await executeQuery<TestTemplateRow[]>(dataQuery, [...queryParams, limit, offset]);

    return {
        data: rows.map(mapRowToTestTemplateWithDetails),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить шаблон по ID
 */
export async function getTestTemplateById(id: string): Promise<TestTemplateWithDetails | null> {
    const rows = await executeQuery<TestTemplateRow[]>(
        `SELECT 
      tt.*,
      qb.name as bank_name,
      qb.code as bank_code,
      u.name as created_by_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_total
    FROM test_templates tt
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    LEFT JOIN users u ON tt.created_by = u.id
    WHERE tt.id = ?
    LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestTemplateWithDetails(rows[0]);
}

/**
 * Получить шаблон по коду
 */
export async function getTestTemplateByCode(code: string): Promise<TestTemplate | null> {
    const rows = await executeQuery<TestTemplateRow[]>(
        'SELECT * FROM test_templates WHERE code = ? LIMIT 1',
        [code]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToTestTemplate(rows[0]);
}

/**
 * Проверить существование кода шаблона
 */
export async function testTemplateCodeExists(code: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT 1 FROM test_templates WHERE code = ?';
    const params: any[] = [code];

    if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
    }

    query += ' LIMIT 1';

    const rows = await executeQuery<RowDataPacket[]>(query, params);
    return rows.length > 0;
}

/**
 * Создать шаблон теста
 */
export async function createTestTemplate(
    data: CreateTestTemplateDTO,
    userId?: string
): Promise<TestTemplateWithDetails> {
    const id = uuidv4();
    const now = new Date();

    await executeQuery(
        `INSERT INTO test_templates (
      id, bank_id, name, code, description, questions_mode, questions_count,
      time_limit_minutes, passing_score, max_attempts, shuffle_questions,
      shuffle_options, questions_per_page, show_results, allow_back,
      proctoring_enabled, proctoring_settings, allowed_languages, is_active, created_by,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.bank_id,
            data.name,
            data.code,
            data.description || null,
            data.questions_mode || 'all',
            data.questions_count || null,
            data.time_limit_minutes || null,
            data.passing_score || 60,
            data.max_attempts || 1,
            data.shuffle_questions !== false,
            data.shuffle_options !== false,
            data.questions_per_page || 1,
            data.show_results || 'immediately',
            data.allow_back !== false,
            data.proctoring_enabled || false,
            data.proctoring_settings ? JSON.stringify(data.proctoring_settings) : null,
            data.allowed_languages ? JSON.stringify(data.allowed_languages) : null,
            data.is_active !== false,
            userId || null,
            now,
            now,
        ]
    );

    const template = await getTestTemplateById(id);
    if (!template) {
        throw new Error('Failed to create test template');
    }

    return template;
}

/**
 * Обновить шаблон теста
 */
export async function updateTestTemplate(
    id: string,
    data: UpdateTestTemplateDTO
): Promise<TestTemplateWithDetails | null> {
    const existing = await getTestTemplateById(id);
    if (!existing) {
        return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
    }
    if (data.code !== undefined) {
        updates.push('code = ?');
        params.push(data.code);
    }
    if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description || null);
    }
    if (data.questions_mode !== undefined) {
        updates.push('questions_mode = ?');
        params.push(data.questions_mode);
    }
    if (data.questions_count !== undefined) {
        updates.push('questions_count = ?');
        params.push(data.questions_count);
    }
    if (data.time_limit_minutes !== undefined) {
        updates.push('time_limit_minutes = ?');
        params.push(data.time_limit_minutes);
    }
    if (data.passing_score !== undefined) {
        updates.push('passing_score = ?');
        params.push(data.passing_score);
    }
    if (data.max_attempts !== undefined) {
        updates.push('max_attempts = ?');
        params.push(data.max_attempts);
    }
    if (data.shuffle_questions !== undefined) {
        updates.push('shuffle_questions = ?');
        params.push(data.shuffle_questions);
    }
    if (data.shuffle_options !== undefined) {
        updates.push('shuffle_options = ?');
        params.push(data.shuffle_options);
    }
    if (data.questions_per_page !== undefined) {
        updates.push('questions_per_page = ?');
        params.push(data.questions_per_page);
    }
    if (data.show_results !== undefined) {
        updates.push('show_results = ?');
        params.push(data.show_results);
    }
    if (data.allow_back !== undefined) {
        updates.push('allow_back = ?');
        params.push(data.allow_back);
    }
    if (data.proctoring_enabled !== undefined) {
        updates.push('proctoring_enabled = ?');
        params.push(data.proctoring_enabled);
    }
    if (data.proctoring_settings !== undefined) {
        updates.push('proctoring_settings = ?');
        params.push(data.proctoring_settings ? JSON.stringify(data.proctoring_settings) : null);
    }
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active);
    }
    if (data.allowed_languages !== undefined) {
        updates.push('allowed_languages = ?');
        params.push(data.allowed_languages ? JSON.stringify(data.allowed_languages) : null);
    }

    if (updates.length === 0) {
        return existing;
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await executeQuery(
        `UPDATE test_templates SET ${updates.join(', ')} WHERE id = ?`,
        params
    );

    return getTestTemplateById(id);
}

/**
 * Удалить шаблон теста
 */
export async function deleteTestTemplate(id: string): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM test_templates WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

// ============================================================================
// ВОПРОСЫ ШАБЛОНА (для режима manual)
// ============================================================================

/**
 * Получить вопросы шаблона (для manual режима)
 */
export async function getTemplateQuestions(templateId: string): Promise<TestTemplateQuestion[]> {
    const rows = await executeQuery<TemplateQuestionRow[]>(
        `SELECT * FROM test_template_questions 
     WHERE template_id = ?
     ORDER BY order_index ASC`,
        [templateId]
    );

    return rows.map(row => ({
        id: row.id,
        template_id: row.template_id,
        question_id: row.question_id,
        order_index: row.order_index,
        points_override: row.points_override,
    }));
}

/**
 * Добавить вопрос в шаблон
 */
export async function addQuestionToTemplate(
    templateId: string,
    questionId: string,
    orderIndex?: number,
    pointsOverride?: number
): Promise<TestTemplateQuestion> {
    const id = uuidv4();

    // Получаем следующий order_index если не указан
    let order: number;
    if (orderIndex === undefined) {
        const rows = await executeQuery<RowDataPacket[]>(
            'SELECT MAX(order_index) as max_order FROM test_template_questions WHERE template_id = ?',
            [templateId]
        );
        order = (rows[0]?.max_order || 0) + 1;
    } else {
        order = orderIndex;
    }

    await executeQuery(
        `INSERT INTO test_template_questions (id, template_id, question_id, order_index, points_override)
     VALUES (?, ?, ?, ?, ?)`,
        [id, templateId, questionId, order, pointsOverride || null]
    );

    return {
        id,
        template_id: templateId,
        question_id: questionId,
        order_index: order,
        points_override: pointsOverride || null,
    };
}

/**
 * Удалить вопрос из шаблона
 */
export async function removeQuestionFromTemplate(
    templateId: string,
    questionId: string
): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM test_template_questions WHERE template_id = ? AND question_id = ?',
        [templateId, questionId]
    );

    return result.affectedRows > 0;
}

/**
 * Обновить порядок вопросов в шаблоне
 */
export async function updateTemplateQuestionsOrder(
    templateId: string,
    orderedQuestionIds: string[]
): Promise<void> {
    await executeTransaction(async (connection: PoolConnection) => {
        for (let i = 0; i < orderedQuestionIds.length; i++) {
            await connection.execute(
                'UPDATE test_template_questions SET order_index = ? WHERE template_id = ? AND question_id = ?',
                [i, templateId, orderedQuestionIds[i]]
            );
        }
    });
}

/**
 * Заменить все вопросы шаблона
 */
export async function setTemplateQuestions(
    templateId: string,
    questions: Array<{ questionId: string; pointsOverride?: number }>
): Promise<void> {
    await executeTransaction(async (connection: PoolConnection) => {
        // Удаляем все текущие вопросы
        await connection.execute(
            'DELETE FROM test_template_questions WHERE template_id = ?',
            [templateId]
        );

        // Добавляем новые
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const id = uuidv4();
            await connection.execute(
                `INSERT INTO test_template_questions (id, template_id, question_id, order_index, points_override)
         VALUES (?, ?, ?, ?, ?)`,
                [id, templateId, q.questionId, i, q.pointsOverride || null]
            );
        }
    });
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить активные шаблоны для выбора (для форм)
 */
export async function getActiveTemplatesForSelect(bankId?: string): Promise<Array<{
    id: string;
    name: string;
    code: string;
    bank_name: string;
    questions_count: number;
    time_limit_minutes: number | null;
}>> {
    let query = `
    SELECT 
      tt.id, 
      tt.name, 
      tt.code,
      tt.time_limit_minutes,
      qb.name as bank_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_count
    FROM test_templates tt
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    WHERE tt.is_active = TRUE
  `;
    const params: any[] = [];

    if (bankId) {
        query += ' AND tt.bank_id = ?';
        params.push(bankId);
    }

    query += ' ORDER BY tt.name ASC';

    const rows = await executeQuery<RowDataPacket[]>(query, params);

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        code: row.code,
        bank_name: row.bank_name || '',
        questions_count: row.questions_count || 0,
        time_limit_minutes: row.time_limit_minutes,
    }));
}

/**
 * Получить шаблоны по банку
 */
export async function getTemplatesByBankId(bankId: string): Promise<TestTemplate[]> {
    const rows = await executeQuery<TestTemplateRow[]>(
        'SELECT * FROM test_templates WHERE bank_id = ? ORDER BY name ASC',
        [bankId]
    );

    return rows.map(mapRowToTestTemplate);
}

// ============================================================================
// ФУНКЦИИ ВАЛИДАЦИИ ЯЗЫКОВ
// ============================================================================

/**
 * Проверить достаточность вопросов по языкам для шаблона
 */
export async function validateLanguagesQuestionCount(
    bankId: string,
    languages: QuestionLanguage[],
    minCount: number
): Promise<{ isValid: boolean; validations: LanguageValidation[] }> {
    const validations: LanguageValidation[] = [];
    let allValid = true;

    for (const lang of languages) {
        const count = await questionRepository.getQuestionCountByLanguage(bankId, lang, true);
        const isValid = count >= minCount;

        if (!isValid) {
            allValid = false;
        }

        validations.push({
            language: lang,
            required: minCount,
            available: count,
            isValid,
            label: LANGUAGE_LABELS[lang],
            flag: LANGUAGE_FLAGS[lang],
        });
    }

    return { isValid: allValid, validations };
}

/**
 * Получить доступные языки для шаблона (языки с достаточным количеством вопросов)
 */
export async function getAvailableLanguagesForTemplate(
    templateId: string
): Promise<QuestionLanguage[]> {
    const template = await getTestTemplateById(templateId);
    if (!template) {
        return [];
    }

    // Если allowed_languages не указаны, возвращаем все языки с вопросами
    const languageStats = await questionRepository.getQuestionStatsByLanguage(template.bank_id, true);

    if (!template.allowed_languages || template.allowed_languages.length === 0) {
        // Возвращаем все языки, у которых есть достаточно вопросов
        const minQuestions = template.questions_mode === 'random' && template.questions_count
            ? template.questions_count
            : 1;

        return languageStats
            .filter(stat => stat.count >= minQuestions)
            .map(stat => stat.language);
    }

    // Фильтруем только разрешённые языки
    const minQuestions = template.questions_mode === 'random' && template.questions_count
        ? template.questions_count
        : 1;

    const availableLanguages: QuestionLanguage[] = [];
    for (const lang of template.allowed_languages) {
        const stat = languageStats.find(s => s.language === lang);
        if (stat && stat.count >= minQuestions) {
            availableLanguages.push(lang);
        }
    }

    return availableLanguages;
}
