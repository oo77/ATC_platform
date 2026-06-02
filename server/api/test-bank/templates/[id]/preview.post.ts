/**
 * API endpoint для создания preview-сессии теста
 * POST /api/test-bank/templates/:id/preview
 * 
 * body.language - выбранный язык (если не указан, берётся первый из allowed_languages)
 */

import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import { getTestTemplateById } from '../../../../repositories/testTemplateRepository';

interface QuestionRow extends RowDataPacket {
    id: string;
    question_text: string;
    question_type: string;
    question_media: string | null;
    options: string;
    points: number;
    difficulty: string;
    language: string;
}

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        const body = await readBody(event);

        if (!id) {
            return {
                success: false,
                message: 'ID шаблона не указан',
            };
        }

        const template = await getTestTemplateById(id);

        if (!template) {
            return {
                success: false,
                message: 'Шаблон теста не найден',
            };
        }

        const allowedLanguages = template.allowed_languages?.length > 0 
            ? template.allowed_languages 
            : ['ru'];
        
        // Выбранный язык - если не указан, берём первый из разрешённых
        const selectedLanguage = body?.language || allowedLanguages[0];

        // Проверяем что выбранный язык разрешён
        if (!allowedLanguages.includes(selectedLanguage)) {
            return {
                success: false,
                message: `Язык "${selectedLanguage}" не поддерживается. Доступные: ${allowedLanguages.join(', ')}`,
            };
        }

        // Определяем сколько вопросов брать
        const questionsMode = template.questions_mode;
        const questionsCount = questionsMode === 'all' 
            ? 1000  // Все вопросы - берём с запасом
            : (template.questions_count || 20);

        // Получаем вопросы ТОЛЬКО на выбранном языке
        const questionsQuery = `
            SELECT q.id, q.question_text, q.question_type, q.question_media,
                   q.options, q.points, q.difficulty, q.language
            FROM questions q
            WHERE q.bank_id = ? AND q.language = ?
            ORDER BY RAND()
            LIMIT ?
        `;

        const questionRows = await executeQuery<QuestionRow[]>(questionsQuery, [
            template.bank_id,
            selectedLanguage,
            questionsCount,
        ]);

        if (questionRows.length === 0) {
            return {
                success: false,
                message: `На языке "${selectedLanguage}" нет вопросов в банке`,
            };
        }

        // Формируем порядок вопросов (с возможным перемешиванием)
        const questionsOrder = questionRows.map(q => {
            const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            let shuffledOptions: string[] | undefined;

            // Если нужно перемешивать варианты ответов
            if (options?.options && template.shuffle_options) {
                shuffledOptions = [...options.options.map((o: any) => o.id)];
                // Fisher-Yates shuffle
                for (let i = shuffledOptions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
                }
            }

            return {
                questionId: q.id,
                shuffledOptions,
            };
        });

        // Если нужно перемешать вопросы
        if (template.shuffle_questions) {
            for (let i = questionsOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questionsOrder[i], questionsOrder[j]] = [questionsOrder[j], questionsOrder[i]];
            }
        }

        // Создаём preview-сессию
        const sessionId = uuidv4();
        const now = new Date();

        await executeQuery(
            `INSERT INTO test_sessions (
                id, assignment_id, student_id, attempt_number, status, is_preview, preview_user_id,
                language, questions_order, current_question_index, started_at,
                ip_address, user_agent, created_at, updated_at
            ) VALUES (?, NULL, NULL, 1, 'in_progress', TRUE, NULL, ?, ?, 0, ?, NULL, NULL, ?, ?)`,
            [
                sessionId,
                selectedLanguage,  // Сохраняем выбранный язык в сессии
                JSON.stringify(questionsOrder),
                now,
                now,
                now,
            ]
        );

        return {
            success: true,
            session_id: sessionId,
            template: {
                name: template.name,
                passing_score: template.passing_score,
                time_limit_minutes: template.time_limit_minutes,
            },
        };

    } catch (error) {
        console.error('Ошибка создания preview-сессии:', error);
        return {
            success: false,
            message: 'Ошибка при создании preview-сессии',
        };
    }
});