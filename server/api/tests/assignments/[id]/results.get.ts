/**
 * API endpoint для получения результатов назначения (для студента)
 * GET /api/tests/assignments/:id/results
 */

import { getTestAssignmentById } from '../../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../../repositories/testTemplateRepository';
import { getStudentByUserId } from '../../../../repositories/studentRepository';
import { executeQuery } from '../../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID назначения не указан',
            };
        }

        // Получаем текущего пользователя
        const userId = event.context.user?.id;
        if (!userId) {
            return {
                success: false,
                message: 'Не авторизован',
            };
        }

        // Проверяем существование назначения
        const assignment = await getTestAssignmentById(id);
        if (!assignment) {
            return {
                success: false,
                message: 'Назначение не найдено',
            };
        }

        // Получаем шаблон для дополнительных данных
        const template = await getTestTemplateById(assignment.test_template_id);

        // Получаем студента
        const student = await getStudentByUserId(userId);

        // Получаем результаты — только для текущего студента если это студент,
        // иначе возвращаем все (для преподавателей)
        let results;
        if (student) {
            // Каждая попытка студента отдельной строкой
            const rows = await executeQuery<RowDataPacket[]>(
                `SELECT
                    ts.id as session_id,
                    ts.student_id,
                    s.full_name as student_name,
                    s.pinfl as student_iin,
                    ts.attempt_number,
                    ts.score_percent as best_score,
                    ts.completed_at as last_attempt_at,
                    ts.passed,
                    ts.time_spent_seconds,
                    ts.total_points,
                    ts.max_points
                FROM test_sessions ts
                LEFT JOIN students s ON ts.student_id = s.id
                WHERE ts.assignment_id = ?
                  AND ts.student_id = ?
                  AND ts.status = 'completed'
                  AND ts.is_preview = false
                ORDER BY ts.attempt_number ASC`,
                [id, student.id]
            );

            results = rows.map(row => ({
                session_id: row.session_id,
                student_id: row.student_id,
                student_name: row.student_name || '',
                student_iin: row.student_iin || '',
                attempts: row.attempt_number,
                best_score: row.best_score ? parseFloat(row.best_score) : null,
                last_attempt_at: row.last_attempt_at,
                passed: Boolean(row.passed),
                time_spent_seconds: row.time_spent_seconds,
            }));
        } else {
            // Для преподавателей/администраторов — все результаты
            const { getAssignmentResults } = await import('../../../../repositories/testSessionRepository');
            results = await getAssignmentResults(id);
        }

        return {
            success: true,
            assignment: {
                ...assignment,
                template_name: template?.name || '',
                passing_score: assignment.passing_score_override || template?.passing_score || 60,
                max_attempts: template?.max_attempts || null,
            },
            results,
        };

    } catch (error) {
        console.error('Ошибка получения результатов:', error);

        return {
            success: false,
            message: 'Ошибка при получении результатов',
        };
    }
});
