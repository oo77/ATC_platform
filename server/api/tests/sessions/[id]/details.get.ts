/**
 * API endpoint для получения детальной информации о сессии тестирования
 * GET /api/tests/sessions/:id/details
 * 
 * Возвращает полную информацию о сессии включая:
 * - Данные сессии (студент, шаблон теста, результаты)
 * - Список всех ответов с вопросами и правильными ответами
 */

import { executeQuery } from '../../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import type {
    QuestionType,
    QuestionOptions,
    AnswerData,
    QuestionMedia,
} from '../../../../types/testing';

interface SessionRow extends RowDataPacket {
    id: string;
    assignment_id: string | null;
    student_id: string | null;
    student_name: string | null;
    student_pinfl: string | null;
    attempt_number: number;
    status: string;
    is_preview: boolean;
    started_at: Date;
    completed_at: Date | null;
    time_spent_seconds: number | null;
    total_points: number | null;
    max_points: number | null;
    score_percent: number | null;
    passed: boolean | null;
    grade: number | null;
    violations: string | null;
    template_id: string | null;
    template_name: string | null;
    template_code: string | null;
    passing_score: number | null;
    time_limit_minutes: number | null;
    group_name: string | null;
    event_date: Date | null;
}

interface AnswerRow extends RowDataPacket {
    answer_id: string;
    question_id: string;
    question_text: string;
    question_type: QuestionType;
    question_options: string | null;
    question_media: string | null;
    question_explanation: string | null;
    question_points: number;
    answer_data: string | null;
    is_correct: boolean | null;
    points_earned: number;
    answered_at: Date;
    time_spent_seconds: number | null;
}

interface SessionDetailAnswer {
    questionId: string;
    questionText: string;
    questionType: QuestionType;
    questionOptions: QuestionOptions | null;
    questionMedia: QuestionMedia[] | null;
    questionExplanation: string | null;
    questionPoints: number;
    studentAnswer: AnswerData | null;
    isCorrect: boolean | null;
    pointsEarned: number;
    answeredAt: Date;
    timeSpentSeconds: number | null;
}

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');

        if (!id) {
            return {
                success: false,
                message: 'ID сессии не указан',
            };
        }

        // Получаем данные сессии с информацией о студенте и шаблоне
        const sessionRows = await executeQuery<SessionRow[]>(`
            SELECT 
                ts.id,
                ts.assignment_id,
                ts.student_id,
                s.full_name as student_name,
                s.pinfl as student_pinfl,
                ts.attempt_number,
                ts.status,
                ts.is_preview,
                ts.started_at,
                ts.completed_at,
                ts.time_spent_seconds,
                ts.total_points,
                ts.max_points,
                ts.score_percent,
                ts.passed,
                ts.grade,
                ts.violations,
                tt.id as template_id,
                tt.name as template_name,
                tt.code as template_code,
                tt.passing_score,
                tt.time_limit_minutes,
                sg.code as group_name,
                DATE(se.start_time) as event_date
            FROM test_sessions ts
            LEFT JOIN students s ON ts.student_id = s.id
            LEFT JOIN test_assignments ta ON ts.assignment_id = ta.id
            LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
            LEFT JOIN study_groups sg ON ta.group_id = sg.id
            LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
            WHERE ts.id = ?
            LIMIT 1
        `, [id]);

        if (sessionRows.length === 0) {
            return {
                success: false,
                message: 'Сессия не найдена',
            };
        }

        const sessionRow = sessionRows[0]!;

        // Получаем все ответы с информацией о вопросах
        const answerRows = await executeQuery<AnswerRow[]>(`
            SELECT 
                ta.id as answer_id,
                ta.question_id,
                q.question_text,
                q.question_type,
                q.options as question_options,
                q.question_media,
                q.explanation as question_explanation,
                q.points as question_points,
                ta.answer_data,
                ta.is_correct,
                ta.points_earned,
                ta.answered_at,
                ta.time_spent_seconds
            FROM test_answers ta
            JOIN questions q ON ta.question_id = q.id
            WHERE ta.session_id = ?
            ORDER BY ta.answered_at ASC
        `, [id]);

        // Парсим JSON поля
        const parseJson = <T>(jsonStr: string | null, defaultVal: T): T => {
            if (!jsonStr) return defaultVal;
            try {
                return JSON.parse(jsonStr) as T;
            } catch {
                return defaultVal;
            }
        };

        // Формируем ответы с деталями
        const answers: SessionDetailAnswer[] = answerRows.map(row => ({
            questionId: row.question_id,
            questionText: row.question_text,
            questionType: row.question_type,
            questionOptions: parseJson<QuestionOptions | null>(row.question_options, null),
            questionMedia: parseJson<QuestionMedia[] | null>(row.question_media, null),
            questionExplanation: row.question_explanation,
            questionPoints: row.question_points,
            studentAnswer: parseJson<AnswerData | null>(row.answer_data, null),
            isCorrect: row.is_correct,
            pointsEarned: row.points_earned,
            answeredAt: row.answered_at,
            timeSpentSeconds: row.time_spent_seconds,
        }));

        // Формируем объект сессии
        const session = {
            id: sessionRow.id,
            assignmentId: sessionRow.assignment_id,
            studentId: sessionRow.student_id,
            studentName: sessionRow.student_name,
            studentPinfl: sessionRow.student_pinfl,
            attemptNumber: sessionRow.attempt_number,
            status: sessionRow.status,
            isPreview: sessionRow.is_preview,
            startedAt: sessionRow.started_at,
            completedAt: sessionRow.completed_at,
            timeSpentSeconds: sessionRow.time_spent_seconds,
            totalPoints: sessionRow.total_points,
            maxPoints: sessionRow.max_points,
            scorePercent: sessionRow.score_percent,
            passed: sessionRow.passed,
            grade: sessionRow.grade,
            violations: parseJson<any[]>(sessionRow.violations, []),
        };

        // Формируем объект шаблона
        const template = {
            id: sessionRow.template_id,
            name: sessionRow.template_name,
            code: sessionRow.template_code,
            passingScore: sessionRow.passing_score,
            timeLimitMinutes: sessionRow.time_limit_minutes,
        };

        // Дополнительная информация
        const context = {
            groupName: sessionRow.group_name,
            eventDate: sessionRow.event_date,
        };

        // Статистика по ответам
        const stats = {
            totalQuestions: answers.length,
            answeredQuestions: answers.filter(a => a.studentAnswer !== null).length,
            correctAnswers: answers.filter(a => a.isCorrect === true).length,
            incorrectAnswers: answers.filter(a => a.isCorrect === false).length,
            unanswered: answers.filter(a => a.studentAnswer === null).length,
            totalPoints: session.maxPoints || 0,
            earnedPoints: session.totalPoints || 0,
        };

        return {
            success: true,
            session,
            template,
            context,
            answers,
            stats,
        };

    } catch (error) {
        console.error('Ошибка получения деталей сессии:', error);
        return {
            success: false,
            message: 'Ошибка при получении деталей сессии',
        };
    }
});
