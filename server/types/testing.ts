/**
 * Типы для системы тестирования студентов
 */

// ============================================================================
// Enums
// ============================================================================

export enum QuestionType {
  SINGLE = "single",
  MULTIPLE = "multiple",
  TEXT = "text",
  ORDER = "order",
  MATCH = "match",
}

export enum QuestionDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum QuestionLanguage {
  EN = "en",
  RU = "ru",
  UZ = "uz",
}

// Константы для отображения языков в UI
export const LANGUAGE_LABELS: Record<QuestionLanguage, string> = {
  [QuestionLanguage.EN]: "English",
  [QuestionLanguage.RU]: "Русский",
  [QuestionLanguage.UZ]: "O'zbek",
};

export const LANGUAGE_FLAGS: Record<QuestionLanguage, string> = {
  [QuestionLanguage.EN]: "🇬🇧",
  [QuestionLanguage.RU]: "🇷🇺",
  [QuestionLanguage.UZ]: "🇺🇿",
};

export enum QuestionsMode {
  ALL = "all",
  RANDOM = "random",
  MANUAL = "manual",
}

export enum ShowResultsMode {
  IMMEDIATELY = "immediately",
  AFTER_DEADLINE = "after_deadline",
  MANUAL = "manual",
  NEVER = "never",
}

export enum TestAssignmentStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TestSessionStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  TIMEOUT = "timeout",
  CANCELLED = "cancelled",
  VIOLATION = "violation",
}

// ============================================================================
// Question Options Formats
// ============================================================================

export interface SingleChoiceOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface SingleChoiceOptions {
  options: SingleChoiceOption[];
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface MultipleChoiceOptions {
  options: MultipleChoiceOption[];
}

export interface TextAnswerOptions {
  correctAnswers: string[];
  caseSensitive: boolean;
  partialMatch: boolean;
}

export interface OrderOption {
  id: string;
  text: string;
  correctOrder: number;
}

export interface OrderOptions {
  options: OrderOption[];
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchOptions {
  pairs: MatchPair[];
}

export type QuestionOptions =
  | SingleChoiceOptions
  | MultipleChoiceOptions
  | TextAnswerOptions
  | OrderOptions
  | MatchOptions;

// ============================================================================
// Question Media
// ============================================================================

export interface QuestionMedia {
  type: "image" | "video" | "audio";
  url: string;
  caption?: string;
}

// ============================================================================
// Answer Data Formats
// ============================================================================

export interface SingleChoiceAnswer {
  selectedOption: string;
}

export interface MultipleChoiceAnswer {
  selectedOptions: string[];
}

export interface TextAnswer {
  text: string;
}

export interface OrderAnswer {
  orderedOptions: string[];
}

export interface MatchAnswer {
  matches: { left: string; right: string }[];
}

export type AnswerData =
  | SingleChoiceAnswer
  | MultipleChoiceAnswer
  | TextAnswer
  | OrderAnswer
  | MatchAnswer;

// ============================================================================
// Proctoring Settings
// ============================================================================

export interface ProctoringSettings {
  blockTabSwitch?: boolean;
  blockCopyPaste?: boolean;
  blockRightClick?: boolean;
  maxViolations?: number;
  autoSubmitOnViolation?: boolean;
}

// ============================================================================
// Violation Record
// ============================================================================

export interface ViolationRecord {
  type:
    | "tab_switch"
    | "visibility_change"
    | "copy_paste"
    | "right_click"
    | "other";
  timestamp: string;
  details?: string;
}

// ============================================================================
// Session Question Order
// ============================================================================

export interface SessionQuestionOrder {
  questionId: string;
  shuffledOptions?: string[];
}

// ============================================================================
// Database Models
// ============================================================================

export interface QuestionBank {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: string;
  bank_id: string;
  question_type: QuestionType;
  question_text: string;
  question_media: QuestionMedia[] | null;
  options: QuestionOptions;
  points: number;
  explanation: string | null;
  difficulty: QuestionDifficulty;
  language: QuestionLanguage; // Язык вопроса
  tags: string[] | null;
  order_index: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TestTemplate {
  id: string;
  bank_id: string;
  name: string;
  code: string;
  description: string | null;
  questions_mode: QuestionsMode;
  questions_count: number | null;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  questions_per_page: number;
  show_results: ShowResultsMode;
  allow_back: boolean;
  proctoring_enabled: boolean;
  proctoring_settings: ProctoringSettings | null;
  allowed_languages: QuestionLanguage[] | null; // Разрешённые языки (null = все)
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestTemplateQuestion {
  id: string;
  template_id: string;
  question_id: string;
  order_index: number;
  points_override: number | null;
}

export interface DisciplineTest {
  id: string;
  discipline_id: string;
  test_template_id: string;
  is_required: boolean;
  order_index: number;
  notes: string | null;
  created_at: Date;
}

export interface TestAssignment {
  id: string;
  schedule_event_id: string;
  test_template_id: string;
  group_id: string;
  time_limit_override: number | null;
  passing_score_override: number | null;
  start_date: Date | null;
  end_date: Date | null;
  status: TestAssignmentStatus;
  assigned_by: string | null;
  allowed_student_ids: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestSession {
  id: string;
  assignment_id: string | null;
  student_id: string | null;
  preview_user_id: string | null;
  attempt_number: number;
  status: TestSessionStatus;
  is_preview: boolean;
  language: QuestionLanguage | null; // Выбранный язык тестирования
  questions_order: SessionQuestionOrder[] | null;
  current_question_index: number;
  started_at: Date;
  completed_at: Date | null;
  time_spent_seconds: number | null;
  total_points: number | null;
  max_points: number | null;
  score_percent: number | null;
  passed: boolean | null;
  grade: number | null;
  violations: ViolationRecord[] | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_data: AnswerData;
  is_correct: boolean | null;
  points_earned: number;
  answered_at: Date;
  time_spent_seconds: number | null;
}

// ============================================================================
// Extended Models (with joins)
// ============================================================================

export interface QuestionBankWithStats extends QuestionBank {
  questions_count: number;
  templates_count: number;
  created_by_name?: string;
}

export interface QuestionWithBank extends Question {
  bank_name: string;
  bank_code: string;
}

export interface TestTemplateWithDetails extends TestTemplate {
  bank_name: string;
  bank_code: string;
  questions_total: number;
  created_by_name?: string;
}

export interface TestAssignmentWithDetails extends TestAssignment {
  template_name: string;
  template_code: string;
  group_name: string;
  event_date: Date;
  event_start_time: string;
  sessions_count: number;
  completed_count: number;
}

export interface TestSessionWithDetails extends TestSession {
  student_name: string;
  student_iin: string;
  template_name: string;
  answers_count: number;
}

export interface DisciplineTestWithDetails extends DisciplineTest {
  template_name: string;
  template_code: string;
  bank_name: string;
  questions_count: number;
  time_limit_minutes: number | null;
  passing_score: number;
}

// ============================================================================
// DTOs for API
// ============================================================================

export interface CreateQuestionBankDTO {
  name: string;
  code: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface UpdateQuestionBankDTO {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface CreateQuestionDTO {
  bank_id: string;
  question_type: QuestionType;
  question_text: string;
  question_media?: QuestionMedia[];
  options: QuestionOptions;
  points?: number;
  explanation?: string;
  difficulty?: QuestionDifficulty;
  language?: QuestionLanguage; // Язык вопроса (по умолчанию 'ru')
  tags?: string[];
  order_index?: number;
  is_active?: boolean;
}

export interface UpdateQuestionDTO {
  question_type?: QuestionType;
  question_text?: string;
  question_media?: QuestionMedia[];
  options?: QuestionOptions;
  points?: number;
  explanation?: string;
  difficulty?: QuestionDifficulty;
  language?: QuestionLanguage; // Язык вопроса
  tags?: string[];
  order_index?: number;
  is_active?: boolean;
}

export interface CreateTestTemplateDTO {
  bank_id: string;
  name: string;
  code: string;
  description?: string;
  questions_mode?: QuestionsMode;
  questions_count?: number;
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  questions_per_page?: number;
  show_results?: ShowResultsMode;
  allow_back?: boolean;
  proctoring_enabled?: boolean;
  proctoring_settings?: ProctoringSettings;
  allowed_languages?: QuestionLanguage[]; // Разрешённые языки тестирования
  is_active?: boolean;
}

export interface UpdateTestTemplateDTO {
  bank_id?: string;
  name?: string;
  code?: string;
  description?: string;
  questions_mode?: QuestionsMode;
  questions_count?: number;
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  questions_per_page?: number;
  show_results?: ShowResultsMode;
  allow_back?: boolean;
  proctoring_enabled?: boolean;
  proctoring_settings?: ProctoringSettings;
  allowed_languages?: QuestionLanguage[]; // Разрешённые языки тестирования
  is_active?: boolean;
}

export interface CreateTestAssignmentDTO {
  schedule_event_id: string;
  test_template_id: string;
  group_id: string;
  time_limit_override?: number;
  passing_score_override?: number;
  start_date?: string | Date;
  end_date?: string | Date;
  allowed_student_ids?: string[] | null;
}

export interface StartTestSessionDTO {
  assignment_id: string | null;
  student_id: string | null;
  preview_user_id?: string | null;
  language: QuestionLanguage; // ОБЯЗАТЕЛЬНО: выбранный язык тестирования
  ip_address?: string;
  user_agent?: string;
  is_preview?: boolean;
}

export interface StartPreviewSessionDTO {
  template_id: string;
  user_id: string;
  language?: QuestionLanguage; // Язык предпросмотра (опционально, если не указан — 'ru')
  ip_address?: string;
  user_agent?: string;
}

export interface SaveAnswerDTO {
  session_id: string;
  question_id: string;
  answer_data: AnswerData;
  time_spent_seconds?: number;
}

export interface TestResultDTO {
  session_id: string;
  total_points: number;
  max_points: number;
  score_percent: number;
  passed: boolean;
  grade: number;
  answers_count: number;
  correct_count: number;
  time_spent_seconds: number;
}

// ============================================================================
// Filter types
// ============================================================================

export interface QuestionBankFilters {
  search?: string;
  category?: string;
  is_active?: boolean;
}

export interface QuestionFilters {
  bank_id?: string;
  question_type?: QuestionType;
  difficulty?: QuestionDifficulty;
  language?: QuestionLanguage; // Фильтр по языку
  languages?: QuestionLanguage[]; // Фильтр по нескольким языкам
  is_active?: boolean;
  search?: string;
  tags?: string[];
}

export interface TestTemplateFilters {
  bank_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface TestAssignmentFilters {
  group_id?: string;
  test_template_id?: string;
  status?: TestAssignmentStatus;
  from_date?: Date;
  to_date?: Date;
}

export interface TestSessionFilters {
  assignment_id?: string;
  student_id?: string;
  status?: TestSessionStatus;
  language?: QuestionLanguage; // Фильтр по языку сессии
}

// ============================================================================
// Language Stats
// ============================================================================

/**
 * Статистика по языкам в банке вопросов
 */
export interface LanguageStats {
  language: QuestionLanguage;
  count: number;
  label: string;
  flag: string;
}

/**
 * Валидация достаточности вопросов по языкам
 */
export interface LanguageValidation {
  language: QuestionLanguage;
  required: number;
  available: number;
  isValid: boolean;
  label: string;
  flag: string;
}
