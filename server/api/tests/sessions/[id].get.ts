/**
 * API endpoint для получения текущего состояния сессии
 * GET /api/tests/sessions/:id
 */

import { getTestSessionById, getSessionAnswers } from '../../../repositories/testSessionRepository';
import { getQuestionsByIds } from '../../../repositories/questionRepository';
import { getTestAssignmentById } from '../../../repositories/testAssignmentRepository';
import { getTestTemplateById } from '../../../repositories/testTemplateRepository';
import { executeQuery } from '../../../utils/db';
import { requireTestSessionAccess } from "../../../utils/resourceAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireTestSessionAccess(event, getRouterParam(event, "id") || "", "read");

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
                        use_five_point_scale: template.use_five_point_scale,
                        proctoring_enabled: template.proctoring_enabled,
                        proctoring_settings: template.proctoring_settings,
                        show_results: template.show_results,
                    };
                }
            }
        }

        // Если запрошены вопросы
        let questions = undefined;
        let availableLanguages: string[] | undefined = undefined;
        if (query.include_questions === 'true' && session.questions_order) {
            const questionIds = session.questions_order.map(q => q.questionId);
            const questionsList = await getQuestionsByIds(questionIds);

            // Переводы вопросов (для переключения языка во время теста)
            const requestedLang = typeof query.language === 'string' ? query.language : null;
            const translations = new Map<string, any>(); // questionId -> вопрос на выбранном языке
            const groupRows: any[] = [];
            if (questionIds.length > 0) {
                const ph = questionIds.map(() => '?').join(', ');
                const base: any[] = await executeQuery(
                    `SELECT id, translation_group_id FROM questions WHERE id IN (${ph})`,
                    questionIds
                );
                const gids = base.map(r => r.translation_group_id).filter(Boolean);
                if (gids.length > 0) {
                    const gph = gids.map(() => '?').join(', ');
                    const sib: any[] = await executeQuery(
                        `SELECT id, language, translation_group_id, question_text, options
                         FROM questions WHERE is_active = TRUE AND translation_group_id IN (${gph})`,
                        gids
                    );
                    groupRows.push(...sib);
                }
                // язык -> сколько вопросов сессии имеют перевод
                const gidByQuestion = new Map(base.map(r => [r.id, r.translation_group_id]));
                const perLang = new Map<string, number>();
                for (const qid of questionIds) {
                    const gid = gidByQuestion.get(qid);
                    if (!gid) continue;
                    const langs = new Set(groupRows.filter(r => r.translation_group_id === gid).map(r => r.language));
                    langs.forEach(l => perLang.set(l, (perLang.get(l) || 0) + 1));
                    if (requestedLang) {
                        const tr = groupRows.find(r => r.translation_group_id === gid && r.language === requestedLang);
                        if (tr) translations.set(qid, tr);
                    }
                }
                // Язык доступен для переключения, только если переведены ВСЕ вопросы сессии
                availableLanguages = [...perLang.entries()]
                    .filter(([, n]) => n === questionIds.length)
                    .map(([l]) => l);
            }

            // Проверяем, нужно ли включать правильные ответы (только для preview)
            const includeCorrectAnswers = query.include_correct_answers === 'true' && session.is_preview;

            // Маппим вопросы с перемешанными вариантами
            questions = session.questions_order.map(qo => {
                const question = questionsList.find(q => q.id === qo.questionId);
                if (!question) return null;

                // Подставляем перевод: id вопроса и вариантов остаются прежними
                const tr = translations.get(question.id);
                let questionText = question.question_text;
                let sourceOptions: any = question.options;
                if (tr) {
                    questionText = tr.question_text;
                    const trOpts = (typeof tr.options === 'string' ? JSON.parse(tr.options) : tr.options)?.options || [];
                    const origOpts = (question.options as any)?.options;
                    if (Array.isArray(origOpts)) {
                        sourceOptions = {
                            ...(question.options as any),
                            options: origOpts.map((o: any) => ({
                                ...o,
                                text: trOpts.find((t: any) => t.id === o.id)?.text ?? o.text,
                            })),
                        };
                    }
                }

                // Для preview-режима отправляем правильные ответы
                const cleanOptions = { ...sourceOptions } as any;
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
                    question_text: questionText,
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
            available_languages: availableLanguages,
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
