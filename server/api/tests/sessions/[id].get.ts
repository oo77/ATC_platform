/**
 * API endpoint для получения текущего состояния сессии
 * GET /api/tests/sessions/:id
 */

import { getTestSessionById, getSessionAnswers } from '../../../repositories/testSessionRepository';
import { getQuestionsByIds } from '../../../repositories/questionRepository';
import { getTestAssignmentById } from '../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../repositories/testTemplateRepository';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const query = getQuery(event);

        if (!id) {
            return {
                success: false,
                message: 'ID сессии не указан',
            };
        }

        const session = await getTestSessionById(id);

        if (!session) {
            return {
                success: false,
                message: 'Сессия не найдена',
            };
        }

        // Загружаем информацию о шаблоне теста (для таймера и прокторинга)
        let templateSettings = null;
        if (session.assignment_id) {
            const assignment = await getTestAssignmentById(session.assignment_id);
            if (assignment) {
                const template = await getTestTemplateById(assignment.test_template_id);
                if (template) {
                    templateSettings = {
                        name: template.name,
                        time_limit_minutes: assignment.time_limit_override || template.time_limit_minutes,
                        passing_score: assignment.passing_score_override || template.passing_score,
                        allow_back: template.allow_back,
                        proctoring_enabled: template.proctoring_enabled,
                        proctoring_settings: template.proctoring_settings,
                        show_results: template.show_results,
                    };
                }
            }
        }

        // Если запрошены вопросы
        let questions = undefined;
        if (query.include_questions === 'true' && session.questions_order) {
            const questionIds = session.questions_order.map(q => q.questionId);
            const questionsList = await getQuestionsByIds(questionIds);

            // Проверяем, нужно ли включать правильные ответы (только для preview)
            const includeCorrectAnswers = query.include_correct_answers === 'true' && session.is_preview;

            // Маппим вопросы с перемешанными вариантами
            questions = session.questions_order.map(qo => {
                const question = questionsList.find(q => q.id === qo.questionId);
                if (!question) return null;

                // Для preview-режима отправляем правильные ответы
                const cleanOptions = { ...question.options } as any;
                if (cleanOptions.options) {
                    cleanOptions.options = cleanOptions.options.map((o: any) => ({
                        id: o.id,
                        text: o.text,
                        // Включаем correct только для preview
                        ...(includeCorrectAnswers ? { correct: o.correct } : {}),
                    }));

                    // Применяем перемешанный порядок
                    if (qo.shuffledOptions) {
                        cleanOptions.options = qo.shuffledOptions.map((optId: string) =>
                            cleanOptions.options.find((o: any) => o.id === optId)
                        ).filter(Boolean);
                    }
                }

                return {
                    id: question.id,
                    question_type: question.question_type,
                    question_text: question.question_text,
                    question_media: question.question_media,
                    options: cleanOptions,
                    points: question.points,
                    difficulty: question.difficulty,
                    // Добавляем explanation для preview
                    ...(includeCorrectAnswers && question.explanation ? { explanation: question.explanation } : {}),
                };
            }).filter(Boolean);
        }

        // Если запрошены ответы
        let answers = undefined;
        if (query.include_answers === 'true') {
            const answersList = await getSessionAnswers(id);
            answers = answersList.map(a => ({
                question_id: a.question_id,
                answer_data: a.answer_data,
                answered_at: a.answered_at,
            }));
        }

        return {
            success: true,
            session: {
                id: session.id,
                status: session.status,
                is_preview: session.is_preview,
                current_question_index: session.current_question_index,
                started_at: session.started_at,
                completed_at: session.completed_at,
                time_spent_seconds: session.time_spent_seconds,
                template_name: session.template_name || templateSettings?.name,
                // Результаты только если тест завершён
                ...(session.status === 'completed' ? {
                    total_points: session.total_points,
                    max_points: session.max_points,
                    score_percent: session.score_percent,
                    passed: session.passed,
                    grade: session.grade,
                } : {}),
            },
            templateSettings,
            questions,
            answers,
            questions_count: session.questions_order?.length || 0,
        };
    } catch (error) {
        console.error('Ошибка получения сессии:', error);

        return {
            success: false,
            message: 'Ошибка при получении сессии',
        };
    }
});
