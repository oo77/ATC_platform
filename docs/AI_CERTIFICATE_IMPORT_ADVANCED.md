# 🚀 Продвинутые возможности AI-импорта сертификатов

## 📋 Дополнительные требования

### 1. Пакетная загрузка (до 10 сертификатов)

### 2. Разрешение конфликтов одинаковых ФИО

### 3. Поиск без организации в сертификате

### 4. Мультиязычность (кириллица/латиница)

---

## 🎯 Проблема 1: Пакетная загрузка

### Требования

- ✅ Загрузка до 10 сертификатов одновременно
- ✅ Параллельная обработка для скорости
- ✅ Индивидуальный статус для каждого файла
- ✅ Возможность отменить/пропустить отдельные файлы
- ✅ Общий прогресс-бар + индивидуальные статусы

### Архитектура

```typescript
interface BatchImportJob {
  id: string;
  totalFiles: number;
  processedFiles: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  status: "processing" | "completed" | "failed" | "cancelled";
  files: BatchFileStatus[];
  createdAt: Date;
  completedAt?: Date;
}

interface BatchFileStatus {
  fileId: string;
  filename: string;
  status:
    | "pending"
    | "processing"
    | "analyzing"
    | "matching"
    | "conflict"
    | "success"
    | "failed"
    | "skipped";
  progress: number; // 0-100
  extractedData?: ExtractedCertificateData;
  matchResult?: StudentMatchResult;
  conflict?: ConflictInfo;
  error?: string;
  certificateId?: string;
}

interface ConflictInfo {
  type: "duplicate_name" | "multiple_matches" | "no_match";
  candidates: Student[];
  requiresManualSelection: boolean;
}
```

### API Endpoints

#### 1. Создание пакетного задания

```typescript
// POST /api/admin/certificates/ai-import/batch/create
interface CreateBatchRequest {
  files: File[]; // До 10 файлов
}

interface CreateBatchResponse {
  jobId: string;
  totalFiles: number;
  estimatedCost: string;
  estimatedTime: number; // секунды
}
```

#### 2. Запуск обработки

```typescript
// POST /api/admin/certificates/ai-import/batch/{jobId}/process
// Запускает параллельную обработку всех файлов
```

#### 3. Получение статуса

```typescript
// GET /api/admin/certificates/ai-import/batch/{jobId}/status
// WebSocket или polling для real-time обновлений
```

#### 4. Разрешение конфликта

```typescript
// POST /api/admin/certificates/ai-import/batch/{jobId}/resolve-conflict
interface ResolveConflictRequest {
  fileId: string;
  selectedStudentId: string;
  overrideData?: Partial<ExtractedCertificateData>;
}
```

### Параллельная обработка

```typescript
// server/utils/ai/batchProcessor.ts

export class BatchCertificateProcessor {
  private static readonly MAX_PARALLEL = 3; // Параллельно обрабатываем 3 файла
  private static readonly RETRY_ATTEMPTS = 2;

  static async processBatch(jobId: string, files: UploadedFile[]) {
    const queue = new PQueue({ concurrency: this.MAX_PARALLEL });

    const results = await Promise.allSettled(
      files.map((file) => queue.add(() => this.processFile(jobId, file))),
    );

    return this.aggregateResults(results);
  }

  private static async processFile(jobId: string, file: UploadedFile) {
    try {
      // 1. Обновить статус: processing
      await this.updateFileStatus(jobId, file.id, "processing", 10);

      // 2. AI-анализ
      await this.updateFileStatus(jobId, file.id, "analyzing", 30);
      const extractedData =
        await CertificateAIProcessor.processCertificate(file);

      // 3. Поиск слушателя
      await this.updateFileStatus(jobId, file.id, "matching", 60);
      const matchResult =
        await AdvancedStudentMatcher.findMatchingStudent(extractedData);

      // 4. Проверка конфликтов
      if (matchResult.hasConflict) {
        await this.updateFileStatus(jobId, file.id, "conflict", 80);
        return {
          status: "conflict",
          extractedData,
          matchResult,
          requiresManualIntervention: true,
        };
      }

      // 5. Автоматическое сохранение (если нет конфликта)
      const certificate = await this.saveCertificate(
        extractedData,
        matchResult.student,
      );
      await this.updateFileStatus(jobId, file.id, "success", 100);

      return {
        status: "success",
        certificateId: certificate.id,
      };
    } catch (error) {
      await this.updateFileStatus(jobId, file.id, "failed", 0);
      return {
        status: "failed",
        error: error.message,
      };
    }
  }
}
```

---

## 🎯 Проблема 2: Конфликт одинаковых ФИО

### Сценарий

```
Сертификат: "Иванов Иван" (без отчества)

База данных:
1. Иванов Иван Петрович - Аэропорт Ташкент
2. Иванов Иван Сергеевич - Аэропорт Самарканд
3. Иванов Иван Александрович - Аэропорт Бухара
```

### Решение: Модальное окно разрешения конфликтов

```vue
<!-- app/components/database/ai-import/ConflictResolutionModal.vue -->
<template>
  <div class="modal">
    <div class="modal-header">
      <h3>⚠️ Найдено несколько слушателей с похожим ФИО</h3>
      <p class="text-sm text-gray-600">
        Сертификат: <strong>{{ extractedData.fullName }}</strong>
      </p>
    </div>

    <div class="modal-body">
      <!-- Извлечённые данные из сертификата -->
      <div class="certificate-data bg-blue-50 p-4 rounded mb-4">
        <h4 class="font-semibold mb-2">📄 Данные из сертификата:</h4>
        <ul class="space-y-1 text-sm">
          <li><strong>ФИО:</strong> {{ extractedData.fullName }}</li>
          <li><strong>Номер:</strong> {{ extractedData.certificateNumber }}</li>
          <li><strong>Курс:</strong> {{ extractedData.courseName }}</li>
          <li><strong>Дата:</strong> {{ extractedData.issueDate }}</li>
          <li v-if="extractedData.organization">
            <strong>Организация:</strong> {{ extractedData.organization }}
          </li>
          <li v-if="extractedData.position">
            <strong>Должность:</strong> {{ extractedData.position }}
          </li>
        </ul>
      </div>

      <!-- Список кандидатов -->
      <div class="candidates">
        <h4 class="font-semibold mb-3">
          👥 Выберите слушателя из базы данных:
        </h4>

        <div class="space-y-2">
          <div
            v-for="candidate in candidates"
            :key="candidate.id"
            @click="selectCandidate(candidate)"
            :class="[
              'candidate-card p-4 border-2 rounded cursor-pointer transition',
              selectedCandidate?.id === candidate.id
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 hover:border-primary/50',
            ]"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h5 class="font-semibold text-lg">
                    {{ candidate.full_name }}
                  </h5>
                  <span
                    v-if="candidate.matchScore"
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      candidate.matchScore >= 0.9
                        ? 'bg-green-100 text-green-800'
                        : candidate.matchScore >= 0.7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800',
                    ]"
                  >
                    Совпадение: {{ (candidate.matchScore * 100).toFixed(0) }}%
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span class="font-medium">ПИНФЛ:</span>
                    {{ candidate.pinfl }}
                  </div>
                  <div>
                    <span class="font-medium">Должность:</span>
                    {{ candidate.position }}
                  </div>
                  <div class="col-span-2">
                    <span class="font-medium">Организация:</span>
                    {{ candidate.organization }}
                  </div>
                  <div v-if="candidate.department" class="col-span-2">
                    <span class="font-medium">Отдел:</span>
                    {{ candidate.department }}
                  </div>
                </div>

                <!-- Причина совпадения -->
                <div
                  v-if="candidate.matchReason"
                  class="mt-2 text-xs text-gray-500"
                >
                  💡 {{ candidate.matchReason }}
                </div>
              </div>

              <!-- Чекбокс -->
              <div class="ml-4">
                <div
                  :class="[
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    selectedCandidate?.id === candidate.id
                      ? 'border-primary bg-primary'
                      : 'border-gray-300',
                  ]"
                >
                  <svg
                    v-if="selectedCandidate?.id === candidate.id"
                    class="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопка "Создать нового слушателя" -->
        <button
          @click="createNewStudent"
          class="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded hover:border-primary hover:bg-primary/5 transition"
        >
          <div class="flex items-center justify-center gap-2 text-gray-600">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="font-medium">Создать нового слушателя</span>
          </div>
        </button>
      </div>
    </div>

    <div class="modal-footer flex justify-between">
      <button @click="skip" class="btn-secondary">
        Пропустить этот сертификат
      </button>
      <button
        @click="confirm"
        :disabled="!selectedCandidate"
        class="btn-primary"
      >
        Подтвердить выбор
      </button>
    </div>
  </div>
</template>
```

### Автоматическое определение конфликтов

```typescript
// server/utils/ai/conflictDetector.ts

export class ConflictDetector {
  /**
   * Проверяет наличие конфликтов при сопоставлении
   */
  static async detectConflicts(
    extractedData: ExtractedCertificateData,
    matchResult: StudentMatchResult,
  ): Promise<ConflictInfo | null> {
    // 1. Если найден точный ПИНФЛ - конфликта нет
    if (matchResult.matchMethod === "exact_pinfl") {
      return null;
    }

    // 2. Если найдено несколько кандидатов с одинаковым именем
    if (matchResult.alternatives && matchResult.alternatives.length > 1) {
      return {
        type: "multiple_matches",
        candidates: matchResult.alternatives,
        requiresManualSelection: true,
        reason: "Найдено несколько слушателей с похожим ФИО",
      };
    }

    // 3. Если уверенность AI низкая (< 0.8)
    if (matchResult.confidence < 0.8) {
      const similarStudents = await this.findSimilarStudents(extractedData);

      if (similarStudents.length > 0) {
        return {
          type: "duplicate_name",
          candidates: similarStudents,
          requiresManualSelection: true,
          reason: "Низкая уверенность AI в сопоставлении",
        };
      }
    }

    // 4. Если слушатель не найден
    if (!matchResult.student) {
      return {
        type: "no_match",
        candidates: [],
        requiresManualSelection: true,
        reason: "Слушатель не найден в базе данных",
      };
    }

    return null;
  }

  /**
   * Поиск похожих слушателей для разрешения конфликта
   */
  private static async findSimilarStudents(
    extractedData: ExtractedCertificateData,
  ): Promise<Student[]> {
    const { fullName, organization, position } = extractedData;

    // Разбиваем ФИО на части
    const nameParts = fullName.trim().split(/\s+/);
    const lastName = nameParts[0];
    const firstName = nameParts[1] || "";

    // Поиск по фамилии и имени (без отчества)
    const candidates = await db("students")
      .where(function () {
        this.where("full_name", "LIKE", `${lastName} ${firstName}%`).orWhere(
          "full_name",
          "LIKE",
          `${lastName}%${firstName}%`,
        );
      })
      .limit(10);

    // Сортируем по релевантности
    return candidates
      .map((student) => ({
        ...student,
        matchScore: this.calculateMatchScore(extractedData, student),
        matchReason: this.getMatchReason(extractedData, student),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Расчёт score совпадения
   */
  private static calculateMatchScore(
    extracted: ExtractedCertificateData,
    student: Student,
  ): number {
    let score = 0;

    // Совпадение имени (базовый score)
    const nameScore = this.compareNames(extracted.fullName, student.full_name);
    score += nameScore * 0.4;

    // Совпадение организации (если есть в сертификате)
    if (extracted.organization && student.organization) {
      const orgScore = this.compareStrings(
        extracted.organization,
        student.organization,
      );
      score += orgScore * 0.3;
    }

    // Совпадение должности (если есть в сертификате)
    if (extracted.position && student.position) {
      const posScore = this.compareStrings(
        extracted.position,
        student.position,
      );
      score += posScore * 0.3;
    }

    return Math.min(score, 1.0);
  }

  private static getMatchReason(
    extracted: ExtractedCertificateData,
    student: Student,
  ): string {
    const reasons = [];

    if (this.compareNames(extracted.fullName, student.full_name) > 0.9) {
      reasons.push("Точное совпадение ФИО");
    }

    if (
      extracted.organization &&
      student.organization &&
      this.compareStrings(extracted.organization, student.organization) > 0.8
    ) {
      reasons.push("Совпадает организация");
    }

    if (
      extracted.position &&
      student.position &&
      this.compareStrings(extracted.position, student.position) > 0.8
    ) {
      reasons.push("Совпадает должность");
    }

    return reasons.join(", ") || "Частичное совпадение имени";
  }
}
```

---

## 🎯 Проблема 3: Поиск без организации

### Математические методы оптимизации

#### 1. Индексация с использованием Trigram

```sql
-- Создание trigram индекса для быстрого нечёткого поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_students_full_name_trgm ON students
USING gin (full_name gin_trgm_ops);

CREATE INDEX idx_students_position_trgm ON students
USING gin (position gin_trgm_ops);
```

```typescript
// Быстрый нечёткий поиск с trigram
const candidates = await db.raw(
  `
  SELECT 
    *,
    similarity(full_name, ?) as name_similarity,
    similarity(position, ?) as position_similarity
  FROM students
  WHERE 
    full_name % ?  -- Оператор % использует trigram индекс
    OR position % ?
  ORDER BY 
    (similarity(full_name, ?) * 0.7 + similarity(position, ?) * 0.3) DESC
  LIMIT 20
`,
  [fullName, position, fullName, position, fullName, position],
);
```

#### 2. Phonetic Matching (Soundex/Metaphone)

```typescript
// server/utils/ai/phoneticMatcher.ts

export class PhoneticMatcher {
  /**
   * Soundex для русского языка (адаптированный)
   */
  static russianSoundex(name: string): string {
    // Упрощённая версия Soundex для кириллицы
    const cleaned = name.toUpperCase().replace(/[^А-ЯЁ]/g, "");

    const soundexMap: Record<string, string> = {
      Б: "1",
      П: "1",
      Ф: "1",
      В: "1",
      Г: "2",
      К: "2",
      Х: "2",
      Д: "3",
      Т: "3",
      Л: "4",
      М: "5",
      Н: "5",
      Р: "6",
      С: "7",
      З: "7",
      Ц: "7",
      Ж: "8",
      Ш: "8",
      Щ: "8",
      Ч: "8",
    };

    let code = cleaned[0] || "";
    let prev = soundexMap[cleaned[0]] || "";

    for (let i = 1; i < cleaned.length && code.length < 4; i++) {
      const curr = soundexMap[cleaned[i]] || "";
      if (curr && curr !== prev) {
        code += curr;
        prev = curr;
      }
    }

    return code.padEnd(4, "0");
  }

  /**
   * Поиск по фонетическому сходству
   */
  static async findByPhonetic(fullName: string): Promise<Student[]> {
    const parts = fullName.split(/\s+/);
    const soundexCodes = parts.map((part) => this.russianSoundex(part));

    // Поиск слушателей с похожим звучанием
    const candidates = await db("students")
      .select("*")
      .where(function () {
        soundexCodes.forEach((code) => {
          this.orWhereRaw("? = ANY(string_to_array(full_name, ' '))", [code]);
        });
      });

    return candidates;
  }
}
```

#### 3. Levenshtein Distance (расстояние редактирования)

```typescript
// server/utils/ai/stringMatcher.ts

export class StringMatcher {
  /**
   * Расстояние Левенштейна (количество операций для преобразования)
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Инициализация матрицы
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Заполнение матрицы
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // удаление
          matrix[i][j - 1] + 1, // вставка
          matrix[i - 1][j - 1] + cost, // замена
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Нормализованное сходство (0-1)
   */
  static similarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  /**
   * Jaro-Winkler Distance (лучше для коротких строк)
   */
  static jaroWinklerSimilarity(str1: string, str2: string): number {
    // Реализация Jaro-Winkler
    // ... (полная реализация)

    return 0.0; // placeholder
  }
}
```

#### 4. Комбинированный умный поиск

```typescript
// server/utils/ai/advancedStudentMatcher.ts

export class AdvancedStudentMatcher {
  /**
   * Многоуровневый поиск слушателя
   */
  static async findMatchingStudent(
    extractedData: ExtractedCertificateData,
  ): Promise<StudentMatchResult> {
    // Уровень 1: Точный поиск по ПИНФЛ (если есть)
    if (extractedData.pinfl) {
      const student = await this.findByPinfl(extractedData.pinfl);
      if (student) {
        return {
          student,
          confidence: 1.0,
          matchMethod: "exact_pinfl",
          explanation: "Точное совпадение по ПИНФЛ",
          hasConflict: false,
        };
      }
    }

    // Уровень 2: Точное совпадение ФИО + организация
    if (extractedData.organization) {
      const students = await this.findByNameAndOrganization(
        extractedData.fullName,
        extractedData.organization,
      );

      if (students.length === 1) {
        return {
          student: students[0],
          confidence: 0.95,
          matchMethod: "exact_name_org",
          explanation: "Точное совпадение ФИО и организации",
          hasConflict: false,
        };
      } else if (students.length > 1) {
        return {
          student: null,
          confidence: 0,
          matchMethod: "none",
          explanation: "Найдено несколько кандидатов",
          hasConflict: true,
          alternatives: students,
        };
      }
    }

    // Уровень 3: Нечёткий поиск (комбинация методов)
    const candidates = await this.fuzzySearch(extractedData);

    if (candidates.length === 0) {
      return {
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "Слушатель не найден",
        hasConflict: true,
        alternatives: [],
      };
    }

    // Сортируем по score
    candidates.sort((a, b) => b.matchScore - a.matchScore);

    const bestMatch = candidates[0];

    // Если лучший кандидат имеет высокий score и значительно лучше остальных
    if (
      bestMatch.matchScore >= 0.9 &&
      (candidates.length === 1 || candidates[1].matchScore < 0.7)
    ) {
      return {
        student: bestMatch,
        confidence: bestMatch.matchScore,
        matchMethod: "fuzzy_ai",
        explanation: bestMatch.matchReason,
        hasConflict: false,
      };
    }

    // Иначе - конфликт, требуется ручной выбор
    return {
      student: null,
      confidence: bestMatch.matchScore,
      matchMethod: "none",
      explanation: "Требуется ручной выбор из нескольких кандидатов",
      hasConflict: true,
      alternatives: candidates.slice(0, 5), // Топ-5 кандидатов
    };
  }

  /**
   * Нечёткий поиск с использованием всех методов
   */
  private static async fuzzySearch(
    extractedData: ExtractedCertificateData,
  ): Promise<StudentWithScore[]> {
    const { fullName, position } = extractedData;

    // 1. Trigram поиск (быстрый, но приблизительный)
    const trigramCandidates = await this.trigramSearch(fullName, position);

    // 2. Phonetic поиск (для опечаток и разных написаний)
    const phoneticCandidates = await PhoneticMatcher.findByPhonetic(fullName);

    // 3. Объединяем и убираем дубликаты
    const allCandidates = this.mergeCandidates(
      trigramCandidates,
      phoneticCandidates,
    );

    // 4. Рассчитываем детальный score для каждого
    const scoredCandidates = allCandidates.map((student) => ({
      ...student,
      matchScore: this.calculateDetailedScore(extractedData, student),
      matchReason: this.getMatchReason(extractedData, student),
    }));

    // 5. Фильтруем слишком низкие score
    return scoredCandidates.filter((c) => c.matchScore >= 0.5);
  }

  /**
   * Детальный расчёт score с учётом всех факторов
   */
  private static calculateDetailedScore(
    extracted: ExtractedCertificateData,
    student: Student,
  ): number {
    let score = 0;
    let weights = 0;

    // 1. Сходство ФИО (вес: 0.5)
    const nameScore = this.compareNames(extracted.fullName, student.full_name);
    score += nameScore * 0.5;
    weights += 0.5;

    // 2. Сходство должности (вес: 0.2, если есть)
    if (extracted.position && student.position) {
      const posScore = StringMatcher.similarity(
        extracted.position.toLowerCase(),
        student.position.toLowerCase(),
      );
      score += posScore * 0.2;
      weights += 0.2;
    }

    // 3. Сходство организации (вес: 0.3, если есть)
    if (extracted.organization && student.organization) {
      const orgScore = StringMatcher.similarity(
        extracted.organization.toLowerCase(),
        student.organization.toLowerCase(),
      );
      score += orgScore * 0.3;
      weights += 0.3;
    }

    // Нормализуем по фактическим весам
    return weights > 0 ? score / weights : 0;
  }

  /**
   * Сравнение имён с учётом разных форматов
   */
  private static compareNames(name1: string, name2: string): number {
    // Нормализация
    const norm1 = this.normalizeName(name1);
    const norm2 = this.normalizeName(name2);

    // Точное совпадение
    if (norm1 === norm2) return 1.0;

    // Разбиваем на части
    const parts1 = norm1.split(/\s+/);
    const parts2 = norm2.split(/\s+/);

    // Сравниваем фамилию и имя (игнорируем отчество)
    const lastNameScore = StringMatcher.similarity(parts1[0], parts2[0]);
    const firstNameScore =
      parts1[1] && parts2[1]
        ? StringMatcher.similarity(parts1[1], parts2[1])
        : 0;

    // Взвешенное среднее
    return lastNameScore * 0.6 + firstNameScore * 0.4;
  }

  private static normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, " ").replace(/ё/g, "е");
  }
}
```

---

## 🎯 Проблема 4: Мультиязычность (кириллица/латиница)

### Транслитерация и нормализация

```typescript
// server/utils/ai/transliterator.ts

export class Transliterator {
  // Карта транслитерации кириллица → латиница
  private static readonly CYRILLIC_TO_LATIN: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    // Узбекские специфичные
    ў: "o'",
    қ: "q",
    ғ: "g'",
    ҳ: "h",
  };

  // Карта транслитерации латиница → кириллица
  private static readonly LATIN_TO_CYRILLIC: Record<string, string> = {
    a: "а",
    b: "б",
    v: "в",
    g: "г",
    d: "д",
    e: "е",
    zh: "ж",
    z: "з",
    i: "и",
    y: "й",
    k: "к",
    l: "л",
    m: "м",
    n: "н",
    o: "о",
    p: "п",
    r: "р",
    s: "с",
    t: "т",
    u: "у",
    f: "ф",
    kh: "х",
    ts: "ц",
    ch: "ч",
    sh: "ш",
    shch: "щ",
    yu: "ю",
    ya: "я",
    // Узбекские
    "o'": "ў",
    q: "қ",
    "g'": "ғ",
    h: "ҳ",
  };

  /**
   * Определяет алфавит строки
   */
  static detectAlphabet(text: string): "cyrillic" | "latin" | "mixed" {
    const cyrillicCount = (text.match(/[а-яёА-ЯЁўқғҳ]/g) || []).length;
    const latinCount = (text.match(/[a-zA-Z]/g) || []).length;

    if (cyrillicCount > 0 && latinCount === 0) return "cyrillic";
    if (latinCount > 0 && cyrillicCount === 0) return "latin";
    return "mixed";
  }

  /**
   * Транслитерация кириллица → латиница
   */
  static cyrillicToLatin(text: string): string {
    return text
      .toLowerCase()
      .split("")
      .map((char) => this.CYRILLIC_TO_LATIN[char] || char)
      .join("");
  }

  /**
   * Транслитерация латиница → кириллица
   */
  static latinToCyrillic(text: string): string {
    let result = text.toLowerCase();

    // Сначала заменяем длинные комбинации
    const sorted = Object.keys(this.LATIN_TO_CYRILLIC).sort(
      (a, b) => b.length - a.length,
    );

    for (const latin of sorted) {
      const cyrillic = this.LATIN_TO_CYRILLIC[latin];
      result = result.replace(new RegExp(latin, "g"), cyrillic);
    }

    return result;
  }

  /**
   * Генерирует все возможные варианты написания
   */
  static generateVariants(text: string): string[] {
    const alphabet = this.detectAlphabet(text);
    const variants = [text];

    if (alphabet === "cyrillic" || alphabet === "mixed") {
      variants.push(this.cyrillicToLatin(text));
    }

    if (alphabet === "latin" || alphabet === "mixed") {
      variants.push(this.latinToCyrillic(text));
    }

    // Убираем дубликаты
    return [...new Set(variants)];
  }
}
```

### Поиск с учётом транслитерации

```typescript
// server/utils/ai/multilingualMatcher.ts

export class MultilingualMatcher {
  /**
   * Поиск слушателя с учётом разных алфавитов
   */
  static async findStudent(fullName: string): Promise<Student[]> {
    // Генерируем все варианты написания
    const nameVariants = Transliterator.generateVariants(fullName);

    console.log("🔍 Поиск по вариантам:", nameVariants);

    // Поиск по всем вариантам
    const results = await db("students")
      .where(function () {
        nameVariants.forEach((variant) => {
          this.orWhere("full_name", "LIKE", `%${variant}%`);
        });
      })
      .limit(20);

    // Рассчитываем score для каждого результата
    return results
      .map((student) => {
        const scores = nameVariants.map((variant) =>
          StringMatcher.similarity(variant, student.full_name.toLowerCase()),
        );

        return {
          ...student,
          matchScore: Math.max(...scores),
          matchedVariant: nameVariants[scores.indexOf(Math.max(...scores))],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Нормализация имени для сравнения
   */
  static normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/ё/g, "е")
      .replace(/o'/g, "ў")
      .replace(/g'/g, "ғ");
  }

  /**
   * Сравнение имён с учётом транслитерации
   */
  static compareNames(name1: string, name2: string): number {
    const variants1 = Transliterator.generateVariants(name1);
    const variants2 = Transliterator.generateVariants(name2);

    let maxScore = 0;

    // Сравниваем все комбинации вариантов
    for (const v1 of variants1) {
      for (const v2 of variants2) {
        const score = StringMatcher.similarity(
          this.normalizeName(v1),
          this.normalizeName(v2),
        );
        maxScore = Math.max(maxScore, score);
      }
    }

    return maxScore;
  }
}
```

---

## 📊 Итоговая архитектура поиска

```typescript
// Финальный умный поиск с всеми оптимизациями

export class UltimateStudentMatcher {
  static async findMatchingStudent(
    extractedData: ExtractedCertificateData,
  ): Promise<StudentMatchResult> {
    console.log("🔍 Запуск умного поиска слушателя...");

    // ========================================
    // Уровень 1: Точный поиск (бесплатно, быстро)
    // ========================================

    // 1.1. По ПИНФЛ (если есть)
    if (extractedData.pinfl) {
      const byPinfl = await this.findByPinfl(extractedData.pinfl);
      if (byPinfl) {
        return {
          student: byPinfl,
          confidence: 1.0,
          matchMethod: "exact_pinfl",
          explanation: "✅ Точное совпадение по ПИНФЛ",
          hasConflict: false,
        };
      }
    }

    // 1.2. По ФИО + организация (если обе есть)
    if (extractedData.organization) {
      const byNameOrg = await this.findByNameAndOrganization(
        extractedData.fullName,
        extractedData.organization,
      );

      if (byNameOrg.length === 1) {
        return {
          student: byNameOrg[0],
          confidence: 0.95,
          matchMethod: "exact_name_org",
          explanation: "✅ Точное совпадение ФИО и организации",
          hasConflict: false,
        };
      } else if (byNameOrg.length > 1) {
        // Конфликт: несколько кандидатов
        return this.createConflictResult(byNameOrg);
      }
    }

    // ========================================
    // Уровень 2: Нечёткий поиск (комбинация методов)
    // ========================================

    console.log("📊 Запуск нечёткого поиска...");

    const candidates: StudentWithScore[] = [];

    // 2.1. Trigram поиск (быстрый)
    const trigramResults = await this.trigramSearch(
      extractedData.fullName,
      extractedData.position,
    );
    candidates.push(...trigramResults);

    // 2.2. Phonetic поиск (для опечаток)
    const phoneticResults = await PhoneticMatcher.findByPhonetic(
      extractedData.fullName,
    );
    candidates.push(...phoneticResults);

    // 2.3. Мультиязычный поиск (кириллица/латиница)
    const multilingualResults = await MultilingualMatcher.findStudent(
      extractedData.fullName,
    );
    candidates.push(...multilingualResults);

    // 2.4. Убираем дубликаты
    const uniqueCandidates = this.removeDuplicates(candidates);

    // 2.5. Рассчитываем детальный score
    const scoredCandidates = uniqueCandidates.map((student) => ({
      ...student,
      matchScore: this.calculateDetailedScore(extractedData, student),
      matchReason: this.getMatchReason(extractedData, student),
    }));

    // 2.6. Сортируем и фильтруем
    const topCandidates = scoredCandidates
      .filter((c) => c.matchScore >= 0.5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    if (topCandidates.length === 0) {
      return {
        student: null,
        confidence: 0,
        matchMethod: "none",
        explanation: "❌ Слушатель не найден в базе данных",
        hasConflict: true,
        alternatives: [],
      };
    }

    // ========================================
    // Уровень 3: Принятие решения
    // ========================================

    const bestMatch = topCandidates[0];
    const secondBest = topCandidates[1];

    // 3.1. Если лучший кандидат явно лучше остальных
    if (
      bestMatch.matchScore >= 0.9 &&
      (!secondBest || secondBest.matchScore < 0.7)
    ) {
      return {
        student: bestMatch,
        confidence: bestMatch.matchScore,
        matchMethod: "fuzzy_advanced",
        explanation: `✅ ${bestMatch.matchReason}`,
        hasConflict: false,
      };
    }

    // 3.2. Если есть несколько похожих кандидатов - конфликт
    return this.createConflictResult(topCandidates.slice(0, 5));
  }

  /**
   * Создание результата с конфликтом
   */
  private static createConflictResult(
    candidates: StudentWithScore[],
  ): StudentMatchResult {
    return {
      student: null,
      confidence: candidates[0]?.matchScore || 0,
      matchMethod: "none",
      explanation:
        "⚠️ Найдено несколько похожих слушателей. Требуется ручной выбор.",
      hasConflict: true,
      alternatives: candidates,
    };
  }
}
```

---

## 🎯 Производительность и оптимизация

### Кеширование результатов

```typescript
// server/utils/ai/searchCache.ts

import { LRUCache } from "lru-cache";

export class SearchCache {
  private static cache = new LRUCache<string, StudentMatchResult>({
    max: 1000, // Максимум 1000 записей
    ttl: 1000 * 60 * 60, // 1 час
    updateAgeOnGet: true,
  });

  static getCacheKey(extractedData: ExtractedCertificateData): string {
    return `${extractedData.fullName}|${extractedData.organization || ""}|${extractedData.pinfl || ""}`;
  }

  static get(
    extractedData: ExtractedCertificateData,
  ): StudentMatchResult | undefined {
    const key = this.getCacheKey(extractedData);
    return this.cache.get(key);
  }

  static set(
    extractedData: ExtractedCertificateData,
    result: StudentMatchResult,
  ): void {
    const key = this.getCacheKey(extractedData);
    this.cache.set(key, result);
  }

  static clear(): void {
    this.cache.clear();
  }
}
```

### Метрики производительности

```typescript
// Мониторинг времени выполнения каждого метода

interface SearchMetrics {
  method: string;
  duration: number;
  candidatesFound: number;
  cacheHit: boolean;
}

class PerformanceMonitor {
  private static metrics: SearchMetrics[] = [];

  static async measure<T>(
    method: string,
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;

    console.log(`⏱️ ${method}: ${duration}ms`);

    return { result, duration };
  }

  static getAverageTime(method: string): number {
    const methodMetrics = this.metrics.filter((m) => m.method === method);
    if (methodMetrics.length === 0) return 0;

    const total = methodMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / methodMetrics.length;
  }
}
```

---

**Дата создания:** 2026-02-02  
**Версия:** 1.0  
**Статус:** Готово к реализации
