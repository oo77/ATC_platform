/**
 * API: Создание preview-сессии для предпросмотра теста
 * POST /api/test-bank/templates/:id/preview
 */

import { defineEventHandler, createError, getRouterParam } from 'h3';
import { getTestTemplateById } from '../../../../repositories/testTemplateRepository';
import { createTestSession } from '../../../../repositories/testSessionRepository';
import { getQuestionsByBankId } from '../../../../repositories/questionRepository';
import type { StartPreviewSessionDTO, SessionQuestionOrder } from '../../../../types/testing';
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
    try {
        // Проверка авторизации
        const user = event.context.user;
        if (!user) {
            throw createError({
                statusCode: 401,
                message: 'Необходима авторизация',
            });
        }

        // Проверка прав доступа (только ADMIN, MANAGER, TEACHER)
        const allowedRoles = ['ADMIN', 'MANAGER', 'TEACHER'];
        if (!allowedRoles.includes(user.role)) {
            throw createError({
                statusCode: 403,
                message: 'Недостаточно прав для предпросмотра теста',
            });
        }

        const templateId = getRouterParam(event, 'id');
        if (!templateId) {
            throw createError({
                statusCode: 400,
                message: 'ID шаблона не указан',
            });
        }

        // Получаем шаблон теста
        const template = await getTestTemplateById(templateId);
        if (!template) {
            throw createError({
                statusCode: 404,
                message: 'Шаблон теста не найден',
            });
        }

        // Получаем вопросы из банка (activeOnly = true)
        const allQuestions = await getQuestionsByBankId(template.bank_id, true);

        if (allQuestions.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'В банке вопросов нет активных вопросов',
            });
        }

        // Формируем список вопросов согласно настройкам шаблона
        let selectedQuestions = [...allQuestions];

        if (template.questions_mode === 'random' && template.questions_count) {
            // Случайная выборка
            selectedQuestions = shuffleArray(selectedQuestions).slice(0, template.questions_count);
        } else if (template.questions_mode === 'all') {
            // Все вопросы
            selectedQuestions = allQuestions;
        }
        // TODO: Для режима 'manual' нужно получить вопросы из test_template_questions

        // Перемешиваем вопросы если нужно
        if (template.shuffle_questions) {
            selectedQuestions = shuffleArray(selectedQuestions);
        }

        // Формируем порядок вопросов
        const questionsOrder: SessionQuestionOrder[] = selectedQuestions.map((q) => ({
            questionId: q.id,
            shuffledOptions: template.shuffle_options
                ? shuffleArray(
                    (q.options as any)?.options?.map((opt: any) => opt.id) || []
                )
                : undefined,
        }));

        // Создаём preview-сессию (без привязки к assignment и student)
        const session = await createTestSession(
            {
                assignment_id: null, // Preview-сессии не привязаны к assignment
                student_id: null, // Preview запускает преподаватель/админ, не студент
                preview_user_id: user.id, // ID пользователя, запустившего preview
                is_preview: true,
                ip_address: event.node.req.socket.remoteAddress,
                user_agent: event.node.req.headers['user-agent'],
            },
            questionsOrder
        );

        return {
            success: true,
            session_id: session.id,
            template: {
                id: template.id,
                name: template.name,
                time_limit_minutes: template.time_limit_minutes,
                passing_score: template.passing_score,
                allow_back: template.allow_back,
                proctoring_enabled: false, // Отключаем прокторинг для preview
            },
            questions_count: questionsOrder.length,
        };
    } catch (error: any) {
        console.error('Ошибка создания preview-сессии:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Ошибка создания preview-сессии',
        });
    }
});

/**
 * Перемешать массив (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
