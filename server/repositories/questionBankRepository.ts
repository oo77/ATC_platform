/**
 * Репозиторий для работы с банками вопросов
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
    QuestionBank,
    QuestionBankWithStats,
    QuestionBankFilters,
    CreateQuestionBankDTO,
    UpdateQuestionBankDTO,
} from '../types/testing';

// ============================================================================
// ROW TYPES
// ============================================================================

interface QuestionBankRow extends RowDataPacket {
    id: string;
    name: string;
    code: string;
    description: string | null;
    category: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
    // Extended fields
    questions_count?: number;
    templates_count?: number;
    created_by_name?: string;
}

interface CountRow extends RowDataPacket {
    total: number;
}

interface CategoryRow extends RowDataPacket {
    category: string;
    count: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToQuestionBank(row: QuestionBankRow): QuestionBank {
    return {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        category: row.category,
        is_active: Boolean(row.is_active),
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapRowToQuestionBankWithStats(row: QuestionBankRow): QuestionBankWithStats {
    return {
        ...mapRowToQuestionBank(row),
        questions_count: row.questions_count || 0,
        templates_count: row.templates_count || 0,
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
 * Получить все банки вопросов с пагинацией и фильтрацией
 */
export async function getQuestionBanks(
    filters: QuestionBankFilters = {},
    pagination: PaginationParams = {}
): Promise<PaginatedResult<QuestionBankWithStats>> {
    const { page = 1, limit = 20 } = pagination;
    const { search, category, is_active } = filters;

    // Строим WHERE условия
    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (search) {
        conditions.push('(qb.name LIKE ? OR qb.description LIKE ? OR qb.code LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (category) {
        conditions.push('qb.category = ?');
        queryParams.push(category);
    }

    if (is_active !== undefined) {
        conditions.push('qb.is_active = ?');
        queryParams.push(is_active);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Получаем общее количество
    const countQuery = `SELECT COUNT(*) as total FROM question_banks qb ${whereClause}`;
    const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Получаем данные с пагинацией
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT 
      qb.*,
      u.name as created_by_name,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id) as questions_count,
      (SELECT COUNT(*) FROM test_templates tt WHERE tt.bank_id = qb.id) as templates_count
    FROM question_banks qb
    LEFT JOIN users u ON qb.created_by = u.id
    ${whereClause}
    ORDER BY qb.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const rows = await executeQuery<QuestionBankRow[]>(dataQuery, [...queryParams, limit, offset]);

    return {
        data: rows.map(mapRowToQuestionBankWithStats),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Получить банк вопросов по ID
 */
export async function getQuestionBankById(id: string): Promise<QuestionBankWithStats | null> {
    const rows = await executeQuery<QuestionBankRow[]>(
        `SELECT 
      qb.*,
      u.name as created_by_name,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id) as questions_count,
      (SELECT COUNT(*) FROM test_templates tt WHERE tt.bank_id = qb.id) as templates_count
    FROM question_banks qb
    LEFT JOIN users u ON qb.created_by = u.id
    WHERE qb.id = ?
    LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToQuestionBankWithStats(rows[0]);
}

/**
 * Получить банк вопросов по коду
 */
export async function getQuestionBankByCode(code: string): Promise<QuestionBank | null> {
    const rows = await executeQuery<QuestionBankRow[]>(
        'SELECT * FROM question_banks WHERE code = ? LIMIT 1',
        [code]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToQuestionBank(rows[0]);
}

/**
 * Проверить существование кода банка
 */
export async function questionBankCodeExists(code: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT 1 FROM question_banks WHERE code = ?';
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
 * Создать банк вопросов
 */
export async function createQuestionBank(
    data: CreateQuestionBankDTO,
    userId?: string
): Promise<QuestionBankWithStats> {
    const id = uuidv4();
    const now = new Date();

    await executeQuery(
        `INSERT INTO question_banks (id, name, code, description, category, is_active, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.name,
            data.code,
            data.description || null,
            data.category || null,
            data.is_active !== false,
            userId || null,
            now,
            now,
        ]
    );

    const bank = await getQuestionBankById(id);
    if (!bank) {
        throw new Error('Failed to create question bank');
    }

    return bank;
}

/**
 * Обновить банк вопросов
 */
export async function updateQuestionBank(
    id: string,
    data: UpdateQuestionBankDTO
): Promise<QuestionBankWithStats | null> {
    // Проверяем существование
    const existing = await getQuestionBankById(id);
    if (!existing) {
        return null;
    }

    // Строим UPDATE запрос динамически
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
    if (data.category !== undefined) {
        updates.push('category = ?');
        params.push(data.category || null);
    }
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active);
    }

    if (updates.length === 0) {
        return existing;
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(id);

    await executeQuery(
        `UPDATE question_banks SET ${updates.join(', ')} WHERE id = ?`,
        params
    );

    return getQuestionBankById(id);
}

/**
 * Удалить банк вопросов
 */
export async function deleteQuestionBank(id: string): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM question_banks WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

/**
 * Получить список категорий банков
 */
export async function getQuestionBankCategories(): Promise<Array<{ category: string; count: number }>> {
    const rows = await executeQuery<CategoryRow[]>(
        `SELECT category, COUNT(*) as count 
     FROM question_banks 
     WHERE category IS NOT NULL AND category != ''
     GROUP BY category 
     ORDER BY count DESC, category ASC`
    );

    return rows.map(row => ({
        category: row.category,
        count: row.count,
    }));
}

/**
 * Получить активные банки для выбора (для форм)
 */
export async function getActiveBanksForSelect(): Promise<Array<{ id: string; name: string; code: string; questions_count: number }>> {
    const rows = await executeQuery<QuestionBankRow[]>(
        `SELECT 
      qb.id, 
      qb.name, 
      qb.code,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id AND q.is_active = TRUE) as questions_count
    FROM question_banks qb
    WHERE qb.is_active = TRUE
    ORDER BY qb.name ASC`
    );

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        code: row.code,
        questions_count: row.questions_count || 0,
    }));
}
