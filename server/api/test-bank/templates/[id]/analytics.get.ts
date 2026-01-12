/**
 * API endpoint для получения аналитики по шаблону теста
 * GET /api/test-bank/templates/:id/analytics
 * 
 * Возвращает:
 * - Статистику прохождений (общее количество, средний балл, процент сдачи)
 * - Список всех сессий
 * - Статистику по вопросам (процент правильных ответов)
 */

import { executeQuery } from '../../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

interface SessionRow extends RowDataPacket {
    session_id: string;
    student_id: string;
    student_name: string;
    student_pinfl: string;
    group_code: string;
    group_name: string;
    score_percent: number;
    total_points: number;
    max_points: number;
    passed: boolean;
    grade: number;
    time_spent_seconds: number;
    completed_at: Date;
    attempt_number: number;
}

interface QuestionStatsRow extends RowDataPacket {
    question_id: string;
    question_text: string;
    question_type: string;
    total_answers: number;
    correct_count: number;
    avg_time_seconds: number;
}

interface SummaryRow extends RowDataPacket {
    total_sessions: number;
    unique_students: number;
    avg_score: number;
    pass_rate: number;
    avg_time_seconds: number;
    best_score: number;
    worst_score: number;
    total_completed: number;
}

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        // Проверяем существование шаблона
        const templateCheck = await executeQuery<RowDataPacket[]>(
            'SELECT id, name FROM test_templates WHERE id = ?',
            [id]
        );

        if (templateCheck.length === 0) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        // Получаем сводную статистику
        const summaryRows = await executeQuery<SummaryRow[]>(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT ts.student_id) as unique_students,
                ROUND(AVG(ts.score_percent), 1) as avg_score,
                ROUND(SUM(CASE WHEN ts.passed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as pass_rate,
                ROUND(AVG(ts.time_spent_seconds)) as avg_time_seconds,
                MAX(ts.score_percent) as best_score,
                MIN(ts.score_percent) as worst_score,
                COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as total_completed
            FROM test_sessions ts
            JOIN test_assignments ta ON ts.assignment_id = ta.id
            WHERE ta.test_template_id = ?
              AND ts.status = 'completed'
              AND ts.is_preview = false
        `, [id]);

        const summary = summaryRows[0] ? {
            totalSessions: summaryRows[0].total_sessions || 0,
            uniqueStudents: summaryRows[0].unique_students || 0,
            averageScore: summaryRows[0].avg_score || 0,
            passRate: summaryRows[0].pass_rate || 0,
            averageTimeSeconds: summaryRows[0].avg_time_seconds || 0,
            bestScore: summaryRows[0].best_score || 0,
            worstScore: summaryRows[0].worst_score || 0,
        } : {
            totalSessions: 0,
            uniqueStudents: 0,
            averageScore: 0,
            passRate: 0,
            averageTimeSeconds: 0,
            bestScore: 0,
            worstScore: 0,
        };

        // Получаем список сессий с данными студентов
        const sessionRows = await executeQuery<SessionRow[]>(`
            SELECT 
                ts.id as session_id,
                ts.student_id,
                s.full_name as student_name,
                s.pinfl as student_pinfl,
                sg.code as group_code,
                sg.code as group_name,
                ts.score_percent,
                ts.total_points,
                ts.max_points,
                ts.passed,
                ts.grade,
                ts.time_spent_seconds,
                ts.completed_at,
                ts.attempt_number
            FROM test_sessions ts
            JOIN test_assignments ta ON ts.assignment_id = ta.id
            LEFT JOIN students s ON ts.student_id = s.id
            LEFT JOIN study_groups sg ON ta.group_id = sg.id
            WHERE ta.test_template_id = ?
              AND ts.status = 'completed'
              AND ts.is_preview = false
            ORDER BY ts.completed_at DESC
            LIMIT 100
        `, [id]);

        const sessions = sessionRows.map(row => ({
            sessionId: row.session_id,
            studentId: row.student_id,
            studentName: row.student_name || 'Н/Д',
            studentPinfl: row.student_pinfl || '',
            groupCode: row.group_code || '',
            groupName: row.group_name || '',
            score: Math.round(row.score_percent || 0),
            totalPoints: row.total_points || 0,
            maxPoints: row.max_points || 0,
            passed: row.passed,
            grade: row.grade,
            timeSpentSeconds: row.time_spent_seconds || 0,
            completedAt: row.completed_at,
            attemptNumber: row.attempt_number,
        }));

        // Получаем статистику по вопросам
        const questionStatsRows = await executeQuery<QuestionStatsRow[]>(`
            SELECT 
                q.id as question_id,
                q.question_text,
                q.question_type,
                COUNT(an.id) as total_answers,
                SUM(CASE WHEN an.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
                ROUND(AVG(an.time_spent_seconds)) as avg_time_seconds
            FROM test_answers an
            JOIN questions q ON an.question_id = q.id
            JOIN test_sessions ts ON an.session_id = ts.id
            JOIN test_assignments ta ON ts.assignment_id = ta.id
            WHERE ta.test_template_id = ?
              AND ts.status = 'completed'
              AND ts.is_preview = false
            GROUP BY q.id, q.question_text, q.question_type
            ORDER BY (SUM(CASE WHEN an.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(an.id), 0)) ASC
        `, [id]);

        const questionStats = questionStatsRows.map(row => ({
            questionId: row.question_id,
            questionText: row.question_text.length > 100
                ? row.question_text.substring(0, 100) + '...'
                : row.question_text,
            questionType: row.question_type,
            totalAnswers: row.total_answers,
            correctCount: row.correct_count,
            correctRate: row.total_answers > 0
                ? Math.round((row.correct_count / row.total_answers) * 100)
                : 0,
            averageTimeSeconds: row.avg_time_seconds || 0,
        }));

        // Распределение оценок
        const gradeDistribution = {
            excellent: sessions.filter(s => s.score >= 90).length,
            good: sessions.filter(s => s.score >= 70 && s.score < 90).length,
            satisfactory: sessions.filter(s => s.score >= 50 && s.score < 70).length,
            unsatisfactory: sessions.filter(s => s.score < 50).length,
        };

        return {
            success: true,
            templateId: id,
            templateName: templateCheck[0]?.name,
            summary,
            sessions,
            questionStats,
            gradeDistribution,
        };

    } catch (error) {
        console.error('Ошибка получения аналитики шаблона:', error);
        return {
            success: false,
            message: 'Ошибка при получении аналитики',
        };
    }
});
