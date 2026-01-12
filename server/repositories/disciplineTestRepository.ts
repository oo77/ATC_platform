/**
 * Репозиторий для связи тестов с дисциплинами
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
    DisciplineTest,
    DisciplineTestWithDetails,
} from '../types/testing';

// ============================================================================
// ROW TYPES
// ============================================================================

interface DisciplineTestRow extends RowDataPacket {
    id: string;
    discipline_id: string;
    test_template_id: string;
    is_required: boolean;
    order_index: number;
    notes: string | null;
    created_at: Date;
    // Extended fields
    template_name?: string;
    template_code?: string;
    bank_name?: string;
    questions_count?: number;
    time_limit_minutes?: number | null;
    passing_score?: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToDisciplineTest(row: DisciplineTestRow): DisciplineTest {
    return {
        id: row.id,
        discipline_id: row.discipline_id,
        test_template_id: row.test_template_id,
        is_required: Boolean(row.is_required),
        order_index: row.order_index,
        notes: row.notes,
        created_at: row.created_at,
    };
}

function mapRowToDisciplineTestWithDetails(row: DisciplineTestRow): DisciplineTestWithDetails {
    return {
        ...mapRowToDisciplineTest(row),
        template_name: row.template_name || '',
        template_code: row.template_code || '',
        bank_name: row.bank_name || '',
        questions_count: row.questions_count || 0,
        time_limit_minutes: row.time_limit_minutes || null,
        passing_score: row.passing_score || 60,
    };
}

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить все тесты дисциплины
 */
export async function getDisciplineTests(disciplineId: string): Promise<DisciplineTestWithDetails[]> {
    const rows = await executeQuery<DisciplineTestRow[]>(
        `SELECT 
      dt.*,
      tt.name as template_name,
      tt.code as template_code,
      tt.time_limit_minutes,
      tt.passing_score,
      qb.name as bank_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_count
    FROM discipline_tests dt
    LEFT JOIN test_templates tt ON dt.test_template_id = tt.id
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    WHERE dt.discipline_id = ?
    ORDER BY dt.order_index ASC, dt.created_at ASC`,
        [disciplineId]
    );

    return rows.map(mapRowToDisciplineTestWithDetails);
}

/**
 * Получить связь по ID
 */
export async function getDisciplineTestById(id: string): Promise<DisciplineTestWithDetails | null> {
    const rows = await executeQuery<DisciplineTestRow[]>(
        `SELECT 
      dt.*,
      tt.name as template_name,
      tt.code as template_code,
      tt.time_limit_minutes,
      tt.passing_score,
      qb.name as bank_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_count
    FROM discipline_tests dt
    LEFT JOIN test_templates tt ON dt.test_template_id = tt.id
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    WHERE dt.id = ?
    LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {
        return null;
    }

    return mapRowToDisciplineTestWithDetails(rows[0]);
}

/**
 * Проверить существование связи дисциплина-тест
 */
export async function disciplineTestExists(
    disciplineId: string,
    testTemplateId: string
): Promise<boolean> {
    const rows = await executeQuery<RowDataPacket[]>(
        'SELECT 1 FROM discipline_tests WHERE discipline_id = ? AND test_template_id = ? LIMIT 1',
        [disciplineId, testTemplateId]
    );
    return rows.length > 0;
}

/**
 * Привязать тест к дисциплине
 */
export async function createDisciplineTest(data: {
    discipline_id: string;
    test_template_id: string;
    is_required?: boolean;
    order_index?: number;
    notes?: string;
}): Promise<DisciplineTestWithDetails> {
    const id = uuidv4();
    const now = new Date();

    // Получаем следующий order_index если не указан
    let orderIndex = data.order_index;
    if (orderIndex === undefined) {
        const rows = await executeQuery<RowDataPacket[]>(
            'SELECT MAX(order_index) as max_order FROM discipline_tests WHERE discipline_id = ?',
            [data.discipline_id]
        );
        orderIndex = (rows[0]?.max_order || 0) + 1;
    }

    await executeQuery(
        `INSERT INTO discipline_tests (id, discipline_id, test_template_id, is_required, order_index, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            data.discipline_id,
            data.test_template_id,
            data.is_required || false,
            orderIndex,
            data.notes || null,
            now,
        ]
    );

    const result = await getDisciplineTestById(id);
    if (!result) {
        throw new Error('Failed to create discipline test');
    }

    return result;
}

/**
 * Обновить связь дисциплина-тест
 */
export async function updateDisciplineTest(
    id: string,
    data: {
        is_required?: boolean;
        order_index?: number;
        notes?: string;
    }
): Promise<DisciplineTestWithDetails | null> {
    const existing = await getDisciplineTestById(id);
    if (!existing) {
        return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.is_required !== undefined) {
        updates.push('is_required = ?');
        params.push(data.is_required);
    }
    if (data.order_index !== undefined) {
        updates.push('order_index = ?');
        params.push(data.order_index);
    }
    if (data.notes !== undefined) {
        updates.push('notes = ?');
        params.push(data.notes || null);
    }

    if (updates.length === 0) {
        return existing;
    }

    params.push(id);

    await executeQuery(
        `UPDATE discipline_tests SET ${updates.join(', ')} WHERE id = ?`,
        params
    );

    return getDisciplineTestById(id);
}

/**
 * Удалить связь дисциплина-тест
 */
export async function deleteDisciplineTest(id: string): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM discipline_tests WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
}

/**
 * Удалить тест из дисциплины по template_id
 */
export async function removeDisciplineTestByTemplateId(
    disciplineId: string,
    testTemplateId: string
): Promise<boolean> {
    const result = await executeQuery<ResultSetHeader>(
        'DELETE FROM discipline_tests WHERE discipline_id = ? AND test_template_id = ?',
        [disciplineId, testTemplateId]
    );

    return result.affectedRows > 0;
}

/**
 * Получить дисциплины, к которым привязан шаблон теста
 */
export async function getDisciplinesByTestTemplateId(testTemplateId: string): Promise<Array<{
    discipline_id: string;
    discipline_name: string;
    course_name: string;
    is_required: boolean;
}>> {
    const rows = await executeQuery<RowDataPacket[]>(
        `SELECT 
      dt.discipline_id,
      d.name as discipline_name,
      c.name as course_name,
      dt.is_required
    FROM discipline_tests dt
    LEFT JOIN disciplines d ON dt.discipline_id = d.id
    LEFT JOIN courses c ON d.course_id = c.id
    WHERE dt.test_template_id = ?
    ORDER BY c.name ASC, d.name ASC`,
        [testTemplateId]
    );

    return rows.map(row => ({
        discipline_id: row.discipline_id,
        discipline_name: row.discipline_name || '',
        course_name: row.course_name || '',
        is_required: Boolean(row.is_required),
    }));
}

/**
 * Получить количество тестов дисциплины
 */
export async function getDisciplineTestsCount(disciplineId: string): Promise<number> {
    const rows = await executeQuery<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM discipline_tests WHERE discipline_id = ?',
        [disciplineId]
    );

    return rows[0]?.total || 0;
}
