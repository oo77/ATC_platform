/**
 * Репозиторий для работы с вопросами
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import type {
    Question,
    QuestionWithBank,
    QuestionFilters,
    CreateQuestionDTO,
    UpdateQuestionDTO,
    QuestionType,
    QuestionDifficulty,
    QuestionLanguage,
    QuestionOptions,
    QuestionMedia,
    LanguageStats,
    LANGUAGE_LABELS,
    LANGUAGE_FLAGS,
} from '../types/testing';
import { QuestionLanguage as QLang, LANGUAGE_LABELS as LABELS, LANGUAGE_FLAGS as FLAGS } from '../types/testing';

// ============================================================================
// ROW TYPES
// ============================================================================

interface QuestionRow extends RowDataPacket {
    id: string;
    bank_id: string;
    question_type: QuestionType;
    question_text: string;
    question_media: string | null;
    options: string;
    points: number;
    explanation: string | null;
    difficulty: QuestionDifficulty;
    language: QuestionLanguage;
    tags: string | null;
    order_index: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    // Extended fields
    bank_name?: string;
    bank_code?: string;
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

function mapRowToQuestion(row: QuestionRow): Question {
    return {
        id: row.id,
        bank_id: row.bank_id,
        question_type: row.question_type,
        question_text: row.question_text,
        question_media: parseJsonSafe<QuestionMedia[] | null>(row.question_media, null),
        options: parseJsonSafe<QuestionOptions>(row.options, { options: [] }),
        points: row.points,
        explanation: row.explanation,
        difficulty: row.difficulty,
        language: row.language || QLang.RU,
        tags: parseJsonSafe<string[] | null>(row.tags, null),
        order_index: row.order_index,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapRowToQuestionWithBank(row: QuestionRow): QuestionWithBank {
    return {
        ...mapRowToQuestion(row),
        bank_name: row.bank_name || '',
        bank_code: row.bank_code || '',
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
 * Получить вопросы с пагинацией и фильтрацией
 */
export async function getQuestions(
    filters: QuestionFilters = {},
    pagination: PaginationParams = {}
): Promise<PaginatedResult<QuestionWithBank>> {
    const { page = 1, limit = 20 } = pagination;
    const { bank_id, question_type, difficulty, language, languages, is_active, search, tags } = filters;

    // Строим WHERE условия
    const conditions: string[] = [];
    const queryParams: any[] = [];


    if (bank_id) {
        conditions.push('q.bank_id = ?');
        queryParams.push(bank_id);
    }

    if (question_type) {
        conditions.push('q.question_type = ?');
        queryParams.push(question_type);
    }

    if (difficulty) {
        conditions.push('q.difficulty = ?');
        queryParams.push(difficulty);
    }

    if (is_active !== undefined) {
        conditions.push('q.is_active = ?');
        queryParams.push(is_active);
    }

    if (search) {
        conditions.push('q.question_text LIKE ?');
        queryParams.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
        // Поиск по тегам через JSON
        const tagConditions = tags.map(() => 'JSON_CONTAINS(q.tags, ?)');
        conditions.push(`(${tagConditions.join(' OR ')})`);
        tags.forEach(tag => queryParams.push(JSON.stringify(tag)));
    }

    // Фильтр по одному языку
    if (language) {
        conditions.push('q.language = ?');
        queryParams.push(language);
    }

    // Фильтр по нескольким языкам
    if (languages && languages.length > 0) {
        const placeholders = languages.map(() => '?').join(', ');
        conditions.push(`q.language IN (${placeholders})`);
        queryParams.push(...languages);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Получаем общее количество
    const countQuery = `SELECT COUNT(*) as total FROM questions q ${whereClause}`;
    const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Получаем данные с пагинацией
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT 
      q.*,
      qb.name as bank_name,
      qb.code as bank_code
    FROM questions q
    LEFT JOIN question_banks qb ON q.bank_id = qb.id
    ${whereClause}
    ORDER BY q.order_index ASC, q.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const rows = await executeQuery<QuestionRow[]>(dataQuery, [...queryParams, limit, offset]);

    return {
        data: rows.map(mapRowToQuestionWithBank),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить вопросы банка (без пагинации)
 */
export async function getQuestionsByBankId(
    bankId: string,
    activeOnly: boolean = false
): Promise<Question[]> {
    let query = `
    SELECT * FROM questions 
    WHERE bank_id = ?
  `;
    const params: any[] = [bankId];

    if (activeOnly) {
        query += ' AND is_active = TRUE';
    }

    query += ' ORDER BY order_index ASC, created_at ASC';

    const rows = await executeQuery<QuestionRow[]>(query, params);
    return rows.map(mapRowToQuestion);
}

/**
 * Получить вопрос по ID
 */
export async function getQuestionById(id: string): Promise<QuestionWithBank | null> {
    const rows = await executeQuery<QuestionRow[]>(
        `SELECT 
      q.*,
      qb.name as bank_name,
      qb.code as bank_code
    FROM questions q
    LEFT JOIN question_banks qb ON q.bank_id = qb.id
    WHERE q.id = ?
    LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToQuestionWithBank(rows[0]);
}

/**
 * Получить случайные вопросы из банка
 */
export async function getRandomQuestionsFromBank(
    bankId: string,
    count: number,
    options: { activeOnly?: boolean; language?: QuestionLanguage } = {}
): Promise<Question[]> {
    const { activeOnly = true, language } = options;

    let query = `
    SELECT * FROM questions 
    WHERE bank_id = ?
  `;
    const params: any[] = [bankId];

    if (activeOnly) {
        query += ' AND is_active = TRUE';
    }

    if (language) {
        query += ' AND language = ?';
        params.push(language);
    }

    query += ' ORDER BY RAND() LIMIT ?';
    params.push(count);

    const rows = await executeQuery<QuestionRow[]>(query, params);
    return rows.map(mapRowToQuestion);
}

/**
 * Получить вопросы по списку ID
 */
export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
    if (ids.length === 0) {
        return [];
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await executeQuery<QuestionRow[]>(
        `SELECT * FROM questions WHERE id IN (${placeholders})`,
        ids
    );

    return rows.map(mapRowToQuestion);
}

/**
 * Создать вопрос
 */
export async function createQuestion(data: CreateQuestionDTO): Promise<Question> {
    const id = uuidv4();
    const now = new Date();

    await executeQuery(
        `INSERT INTO questions (
      id, bank_id, question_type, question_text, question_media, options,
      points, explanation, difficulty, language, tags, order_index, is_active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.bank_id,
            data.question_type,
            data.question_text,
            data.question_media ? JSON.stringify(data.question_media) : null,
            JSON.stringify(data.options),
            data.points || 1,
            data.explanation || null,
            data.difficulty || 'medium',
            data.language || QLang.RU,
            data.tags ? JSON.stringify(data.tags) : null,
            data.order_index || 0,
            data.is_active !== false,
            now,
            now,
        ]
    );

    const question = await getQuestionById(id);
    if (!question) {
        throw new Error('Failed to create question');
    }

    return question;
}

/**
 * Обновить вопрос
 */
export async function updateQuestion(
    id: string,
    data: UpdateQuestionDTO
): Promise<Question | null> {
    // Проверяем существование
    const existing = await getQuestionById(id);
    if (!existing) {
        return null;
    }

    // Строим UPDATE запрос динамически
    const updates: string[] = [];
    const params: any[] = [];

    if (data.question_type !== undefined) {
        updates.push('question_type = ?');
        params.push(data.question_type);
    }
    if (data.question_text !== undefined) {
        updates.push('question_text = ?');
        params.push(data.question_text);
    }
    if (data.question_media !== undefined) {
        updates.push('question_media = ?');
        params.push(data.question_media ? JSON.stringify(data.question_media) : null);
    }
    if (data.options !== undefined) {
        updates.push('options = ?');
        params.push(JSON.stringify(data.options));
    }
    if (data.points !== undefined) {
        updates.push('points = ?');
        params.push(data.points);
    }
    if (data.explanation !== undefined) {
        updates.push('explanation = ?');
        params.push(data.explanation || null);
    }
    if (data.difficulty !== undefined) {
        updates.push('difficulty = ?');
        params.push(data.difficulty);
    }
    if (data.tags !== undefined) {
        updates.push('tags = ?');
        params.push(data.tags ? JSON.stringify(data.tags) : null);
    }
    if (data.order_index !== undefined) {
        updates.push('order_index = ?');
        params.push(data.order_index);
    }
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active);
    }
    if (data.language !== undefined) {
        updates.push('language = ?');
        params.push(data.language);
    }

    if (updates.length === 0) {
        return existing;
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await executeQuery(
        `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
        params
    );

    return getQuestionById(id);
}

/**
 * Удалить вопрос
 */
export async function deleteQuestion(id: string): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM questions WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

/**
 * Массовое создание вопросов (для импорта)
 */
export async function bulkCreateQuestions(
    questions: CreateQuestionDTO[]
): Promise<{ created: number; errors: Array<{ index: number; error: string }> }> {
    const result = {
        created: 0,
        errors: [] as Array<{ index: number; error: string }>,
    };

    if (questions.length === 0) {
        return result;
    }

    await executeTransaction(async (connection: PoolConnection) => {
        for (let i = 0; i < questions.length; i++) {
            const data = questions[i];
            try {
                const id = uuidv4();
                const now = new Date();

                await connection.execute(
                    `INSERT INTO questions (
            id, bank_id, question_type, question_text, question_media, options,
            points, explanation, difficulty, language, tags, order_index, is_active,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        data.bank_id,
                        data.question_type,
                        data.question_text,
                        data.question_media ? JSON.stringify(data.question_media) : null,
                        JSON.stringify(data.options),
                        data.points || 1,
                        data.explanation || null,
                        data.difficulty || 'medium',
                        data.language || QLang.RU,
                        data.tags ? JSON.stringify(data.tags) : null,
                        data.order_index || i,
                        data.is_active !== false,
                        now,
                        now,
                    ]
                );
                result.created++;
            } catch (error) {
                result.errors.push({
                    index: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    });

    return result;
}

/**
 * Получить следующий order_index для банка
 */
export async function getNextOrderIndex(bankId: string): Promise<number> {
    const rows = await executeQuery<RowDataPacket[]>(
        'SELECT MAX(order_index) as max_order FROM questions WHERE bank_id = ?',
        [bankId]
    );

    const maxOrder = rows[0]?.max_order;
    return (maxOrder || 0) + 1;
}

/**
 * Обновить порядок вопросов
 */
export async function updateQuestionsOrder(
    orderedIds: Array<{ id: string; order_index: number }>
): Promise<void> {
    if (orderedIds.length === 0) {
        return;
    }

    await executeTransaction(async (connection: PoolConnection) => {
        for (const item of orderedIds) {
            await connection.execute(
                'UPDATE questions SET order_index = ?, updated_at = ? WHERE id = ?',
                [item.order_index, new Date(), item.id]
            );
        }
    });
}

/**
 * Получить количество вопросов в банке
 */
export async function getQuestionsCountByBankId(
    bankId: string,
    activeOnly: boolean = false
): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM questions WHERE bank_id = ?';
    const params: any[] = [bankId];

    if (activeOnly) {
        query += ' AND is_active = TRUE';
    }

    const rows = await executeQuery<CountRow[]>(query, params);
    return rows[0]?.total || 0;
}

/**
 * Копировать вопрос в другой банк
 */
export async function copyQuestionToBank(
    questionId: string,
    targetBankId: string
): Promise<Question> {
    const original = await getQuestionById(questionId);
    if (!original) {
        throw new Error('Question not found');
    }

    const nextOrder = await getNextOrderIndex(targetBankId);

    return createQuestion({
        bank_id: targetBankId,
        question_type: original.question_type,
        question_text: original.question_text,
        question_media: original.question_media || undefined,
        options: original.options,
        points: original.points,
        explanation: original.explanation || undefined,
        difficulty: original.difficulty,
        language: original.language,
        tags: original.tags || undefined,
        order_index: nextOrder,
        is_active: original.is_active,
    });
}

/**
 * Получить количество вопросов по языку в банке
 */
export async function getQuestionCountByLanguage(
    bankId: string,
    language: QuestionLanguage,
    activeOnly: boolean = true
): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM questions WHERE bank_id = ? AND language = ?';
    const params: any[] = [bankId, language];

    if (activeOnly) {
        query += ' AND is_active = TRUE';
    }

    const rows = await executeQuery<CountRow[]>(query, params);
    return rows[0]?.total || 0;
}

/**
 * Получить статистику по языкам в банке
 */
export async function getQuestionStatsByLanguage(
    bankId: string,
    activeOnly: boolean = true
): Promise<LanguageStats[]> {
    let query = `
    SELECT language, COUNT(*) as count 
    FROM questions 
    WHERE bank_id = ?
  `;
    const params: any[] = [bankId];

    if (activeOnly) {
        query += ' AND is_active = TRUE';
    }

    query += ' GROUP BY language ORDER BY count DESC';

    interface LangRow extends RowDataPacket {
        language: QuestionLanguage;
        count: number;
    }

    const rows = await executeQuery<LangRow[]>(query, params);

    return rows.map(row => ({
        language: row.language,
        count: row.count,
        label: LABELS[row.language] || row.language,
        flag: FLAGS[row.language] || '',
    }));
}

/**
 * Получить всю статистику по языкам (включая языки с 0 вопросов)
 */
export async function getFullLanguageStats(
    bankId: string,
    activeOnly: boolean = true
): Promise<LanguageStats[]> {
    const stats = await getQuestionStatsByLanguage(bankId, activeOnly);

    // Добавляем языки с 0 вопросами
    const allLanguages: QuestionLanguage[] = [QLang.RU, QLang.UZ, QLang.EN];
    const existingLanguages = new Set(stats.map(s => s.language));

    for (const lang of allLanguages) {
        if (!existingLanguages.has(lang)) {
            stats.push({
                language: lang,
                count: 0,
                label: LABELS[lang],
                flag: FLAGS[lang],
            });
        }
    }

    // Сортируем: RU первый, затем UZ, затем EN
    const order = { [QLang.RU]: 0, [QLang.UZ]: 1, [QLang.EN]: 2 };
    stats.sort((a, b) => order[a.language] - order[b.language]);

    return stats;
}
