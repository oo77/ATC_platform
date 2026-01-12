/**
 * API endpoint для импорта вопросов из Excel
 * POST /api/test-bank/questions/import
 * 
 * Поддерживает два формата:
 * 1. Новый формат (из компонента импорта): { questions: CreateQuestionDTO[] }
 * 2. Старый формат (Excel): { bank_id, questions: ImportedQuestion[] }
 */

import { bulkCreateQuestions } from '../../../repositories/questionRepository';
import { getQuestionBankById } from '../../../repositories/questionBankRepository';
import { QuestionType, QuestionLanguage } from '../../../types/testing';
import type { CreateQuestionDTO, SingleChoiceOptions } from '../../../types/testing';

// Старый формат (из Excel)
interface LegacyImportedQuestion {
    question: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    optionD?: string;
    correct: string; // A, B, C, D
    points?: number;
    difficulty?: string;
    explanation?: string;
    language?: string; // en, ru, uz
}

// Новый формат (из компонента)
interface NewImportedQuestion {
    bank_id: string;
    question_type: QuestionType;
    question_text: string;
    options: SingleChoiceOptions;
    points?: number;
    difficulty?: string;
    explanation?: string;
    language?: QuestionLanguage;
    is_active?: boolean;
}

type ImportedQuestion = LegacyImportedQuestion | NewImportedQuestion;

function isNewFormat(q: ImportedQuestion): q is NewImportedQuestion {
    return 'question_text' in q && 'bank_id' in q;
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<{
            bank_id?: string;
            questions: ImportedQuestion[];
        }>(event);

        if (!body.questions?.length) {
            return {
                success: false,
                message: 'Список вопросов пуст',
            };
        }

        // Определяем формат по первому вопросу
        const firstQuestion = body.questions[0];
        const isNew = isNewFormat(firstQuestion);

        // Получаем bank_id из первого вопроса или из тела запроса
        const bankId = isNew ? (firstQuestion as NewImportedQuestion).bank_id : body.bank_id;

        if (!bankId) {
            return {
                success: false,
                message: 'ID банка обязателен',
            };
        }

        // Проверяем существование банка
        const bank = await getQuestionBankById(bankId);
        if (!bank) {
            return {
                success: false,
                message: 'Банк вопросов не найден',
            };
        }

        let questionsToCreate: CreateQuestionDTO[];

        if (isNew) {
            // Новый формат - просто приводим к CreateQuestionDTO
            questionsToCreate = (body.questions as NewImportedQuestion[]).map((q, index) => ({
                bank_id: q.bank_id,
                question_type: q.question_type || 'single',
                question_text: q.question_text,
                options: q.options,
                points: q.points || 1,
                difficulty: (q.difficulty as any) || 'medium',
                explanation: q.explanation,
                language: q.language,
                order_index: index,
                is_active: q.is_active !== false,
            }));
        } else {
            // Старый формат - конвертируем
            questionsToCreate = (body.questions as LegacyImportedQuestion[]).map((q, index) => {
                const options: SingleChoiceOptions = {
                    options: [
                        { id: 'a', text: q.optionA, correct: q.correct.toUpperCase() === 'A' },
                        { id: 'b', text: q.optionB, correct: q.correct.toUpperCase() === 'B' },
                    ],
                };

                if (q.optionC) {
                    options.options.push({ id: 'c', text: q.optionC, correct: q.correct.toUpperCase() === 'C' });
                }
                if (q.optionD) {
                    options.options.push({ id: 'd', text: q.optionD, correct: q.correct.toUpperCase() === 'D' });
                }

                return {
                    bank_id: bankId,
                    question_type: QuestionType.SINGLE,
                    question_text: q.question,
                    options,
                    points: q.points || 1,
                    difficulty: (q.difficulty as any) || 'medium',
                    explanation: q.explanation,
                    language: q.language as QuestionLanguage | undefined,
                    order_index: index,
                    is_active: true,
                };
            });
        }

        // Массовое создание
        const result = await bulkCreateQuestions(questionsToCreate);

        return {
            success: true,
            message: `Импортировано ${result.created} вопросов`,
            imported: result.created,
            errors: result.errors,
        };
    } catch (error) {
        console.error('Ошибка импорта вопросов:', error);

        return {
            success: false,
            message: 'Ошибка при импорте вопросов',
        };
    }
});
