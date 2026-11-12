<template>
  <UiModal
    :is-open="true"
    title="Импорт вопросов из Excel"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Шаг 1: Загрузка файла -->
      <div v-if="step === 1">
        <div class="mb-4">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Формат файла</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Загрузите Excel файл (.xlsx, .xls) с вопросами. Файл должен содержать следующие колонки:
          </p>
          
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <table class="text-xs w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Вопрос</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Вариант A</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Вариант B</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Вариант C</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Вариант D</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Правильный</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Баллы</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Сложность</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Язык</th>
                  <th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Группа</th>
                </tr>
              </thead>
              <tbody class="text-gray-500 dark:text-gray-400">
                <tr>
                  <td class="px-2 py-1">Что такое СИЗ?</td>
                  <td class="px-2 py-1">Средства защиты</td>
                  <td class="px-2 py-1">Система измерения</td>
                  <td class="px-2 py-1">Инструкция</td>
                  <td class="px-2 py-1">Стандарт</td>
                  <td class="px-2 py-1">A</td>
                  <td class="px-2 py-1">1</td>
                  <td class="px-2 py-1">easy</td>
                  <td class="px-2 py-1">ru</td>
                  <td class="px-2 py-1">1</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Правильный ответ:</strong> A, B, C или D (буква правильного варианта)</p>
            <p><strong>Сложность:</strong> easy, medium или hard (необязательно, по умолчанию medium)</p>
            <p><strong>Баллы:</strong> число от 1 до 100 (необязательно, по умолчанию 1)</p>
            <p><strong>Язык:</strong> ru, uz (узб. кир.), uzlat (узб. лат.), kaakir (каракалп. кир.), kaalat (каракалп. лат.) или en — необязательно, по умолчанию язык, выбранный ниже</p>
            <p><strong>Варианты:</strong> буквы в начале текста («A) …», «B. …») убираются автоматически — тест сам подставляет буквы.</p>
            <p><strong>Группа:</strong> номер (1, 2, 3…), необязательно. Вопросы с одним номером на разных языках связываются как переводы друг друга, и студент сможет переключать язык во время теста. Номера действуют в пределах банка: языки можно загружать разными файлами, главное — одинаковые номера групп. Порядок вариантов и правильный ответ в связанных вопросах должны совпадать.</p>
          </div>

          <!-- Язык по умолчанию -->
          <div class="mt-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Язык по умолчанию для импортируемых вопросов
            </label>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label
                v-for="lang in TEST_LANGUAGES"
                :key="lang.value"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input type="radio" v-model="defaultLanguage" :value="lang.value" class="w-4 h-4 text-primary" />
                <span class="text-sm"><span class="font-semibold text-xs text-gray-500">{{ lang.flag }}</span> {{ lang.label }}</span>
              </label>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Этот язык будет применён ко всем вопросам, у которых не указан язык в файле
            </p>
          </div>

          <button
            @click="downloadTemplate"
            class="mt-4 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать шаблон
          </button>
        </div>

        <!-- Зона загрузки файла -->
        <div
          @drop.prevent="onFileDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="onFileSelect"
          />

          <div v-if="!selectedFile">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Перетащите файл сюда или
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="text-primary hover:text-primary/80"
              >
                выберите файл
              </button>
            </p>
            <p class="mt-1 text-xs text-gray-500">Excel файл (.xlsx, .xls)</p>
          </div>

          <div v-else class="flex items-center justify-center gap-3">
            <svg class="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div class="text-left">
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button
              type="button"
              @click="clearFile"
              class="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="fileError" class="mt-2 text-sm text-danger">{{ fileError }}</p>
      </div>

      <!-- Шаг 2: Предпросмотр -->
      <div v-if="step === 2">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">Предпросмотр вопросов</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Найдено {{ parsedQuestions.length }} вопросов для импорта
            </p>
          </div>
          <span
            v-if="invalidQuestionsCount > 0"
            class="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning"
          >
            {{ invalidQuestionsCount }} с ошибками
          </span>
        </div>

        <div class="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-50 dark:bg-gray-800">
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400 w-8">#</th>
                <th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Вопрос</th>
                <th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16">Язык</th>
                <th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16">Группа</th>
                <th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-24">Вариантов</th>
                <th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-20">Ответ</th>
                <th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-20">Статус</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(q, index) in parsedQuestions"
                :key="index"
                :class="{ 'bg-danger/5': !q.valid }"
              >
                <td class="px-4 py-2 text-gray-500 dark:text-gray-400">{{ index + 1 }}</td>
                <td class="px-4 py-2 text-gray-900 dark:text-white">
                  <div class="line-clamp-2">{{ q.question_text || '—' }}</div>
                  <p v-if="q.error" class="text-xs text-danger mt-1">{{ q.error }}</p>
                </td>
                <td class="px-4 py-2 text-center">
                  <span :class="languageBadgeClasses[q.language]">
                    {{ languageFlags[q.language] }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center text-gray-600 dark:text-gray-400">{{ q.group || '—' }}</td>
                <td class="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                  {{ q.optionsCount || 0 }}
                </td>
                <td class="px-4 py-2 text-center">
                  <span
                    v-if="q.correctAnswer"
                    class="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                  >
                    {{ q.correctAnswer }}
                  </span>
                  <span v-else class="text-danger">—</span>
                </td>
                <td class="px-4 py-2 text-center">
                  <span v-if="q.valid" class="text-success">
                    <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span v-else class="text-danger">
                    <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="invalidQuestionsCount > 0" class="mt-4 p-3 bg-warning/10 rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="text-sm text-warning">
              <p class="font-medium">{{ invalidQuestionsCount }} вопросов с ошибками</p>
              <p>Вопросы с ошибками будут пропущены при импорте. Исправьте файл и загрузите снова, или продолжите импорт только валидных вопросов.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Шаг 3: Результат -->
      <div v-if="step === 3">
        <div class="text-center py-6">
          <div v-if="importResult.success" class="text-success">
            <svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Импорт завершён успешно!
            </h4>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Импортировано {{ importResult.imported }} вопросов
            </p>
            <p v-if="importResult.skipped > 0" class="text-sm text-warning">
              Пропущено {{ importResult.skipped }} вопросов с ошибками
            </p>
          </div>
          <div v-else class="text-danger">
            <svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 class="mt-4 text-lg font-medium">Ошибка импорта</h4>
            <p class="mt-2">{{ importResult.error }}</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <UiButton
          v-if="step === 2"
          variant="outline"
          @click="step = 1"
        >
          Назад
        </UiButton>
        <div v-else></div>

        <div class="flex gap-3">
          <UiButton variant="outline" @click="$emit('close')">
            {{ step === 3 ? 'Закрыть' : 'Отмена' }}
          </UiButton>

          <UiButton
            v-if="step === 1"
            :disabled="!selectedFile"
            :loading="parsing"
            @click="parseFile"
          >
            Далее
          </UiButton>

          <UiButton
            v-if="step === 2"
            :disabled="validQuestionsCount === 0"
            :loading="importing"
            @click="importQuestions"
          >
            Импортировать ({{ validQuestionsCount }})
          </UiButton>

          <UiButton
            v-if="step === 3 && importResult.success"
            @click="$emit('imported')"
          >
            Готово
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import {
  TEST_LANGUAGES,
  TEST_LANGUAGE_FLAGS,
  isTestLanguage,
} from '../../../shared/utils/testLanguages';
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps({
  bankId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close', 'imported']);

const { authFetch } = useAuthFetch();

// Состояние
const step = ref(1);
const isDragging = ref(false);
const selectedFile = ref(null);
const fileError = ref('');
const parsing = ref(false);
const importing = ref(false);
const parsedQuestions = ref([]);
const defaultLanguage = ref('ru');
const importResult = ref({
  success: false,
  imported: 0,
  skipped: 0,
  error: '',
});

// Константы для языков
const languageFlags = TEST_LANGUAGE_FLAGS;

const languageBadgeClasses = {
  ru: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  uz: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  uzlat: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  kaakir: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  kaalat: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  en: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

// Вычисляемые свойства
const validQuestionsCount = computed(() => {
  return parsedQuestions.value.filter(q => q.valid).length;
});

const invalidQuestionsCount = computed(() => {
  return parsedQuestions.value.filter(q => !q.valid).length;
});

// Утилиты
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Обработка файла
const onFileDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  validateAndSetFile(file);
};

const onFileSelect = (e) => {
  const file = e.target.files[0];
  validateAndSetFile(file);
};

const validateAndSetFile = (file) => {
  fileError.value = '';
  
  if (!file) return;

  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
    fileError.value = 'Неверный формат файла. Загрузите Excel файл (.xlsx или .xls)';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    fileError.value = 'Файл слишком большой. Максимальный размер 5MB';
    return;
  }

  selectedFile.value = file;
};

const clearFile = () => {
  selectedFile.value = null;
  fileError.value = '';
};

// Парсинг файла
const parseFile = async () => {
  if (!selectedFile.value) return;

  parsing.value = true;
  fileError.value = '';

  try {
    const data = await readFileAsArrayBuffer(selectedFile.value);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      fileError.value = 'Файл пустой или не содержит данных';
      return;
    }

    // Пропускаем заголовок
    const dataRows = rows.slice(1);
    
    parsedQuestions.value = dataRows
      .map((row, index) => parseRow(row, index + 2))
      .filter((q) => q.question_text || q.optionA || q.optionB); // пропускаем пустые строки
    validateGroups(parsedQuestions.value);

    if (parsedQuestions.value.length === 0) {
      fileError.value = 'Не найдено вопросов для импорта';
      return;
    }

    step.value = 2;
  } catch (err) {
    console.error('Ошибка парсинга файла:', err);
    fileError.value = 'Ошибка чтения файла. Убедитесь, что файл не повреждён';
  } finally {
    parsing.value = false;
  }
};

// Проверка групп переводов: один язык на группу и совпадающие варианты/правильный ответ
const validateGroups = (list) => {
  const groups = new Map();
  for (const q of list) {
    if (!q.valid || !q.group) continue;
    if (!groups.has(q.group)) groups.set(q.group, []);
    groups.get(q.group).push(q);
  }
  for (const [group, items] of groups) {
    const first = items[0];
    const seen = new Set();
    for (const q of items) {
      if (seen.has(q.language)) {
        q.valid = false;
        q.error = `В группе ${group} уже есть вопрос на языке ${q.language.toUpperCase()}`;
        continue;
      }
      seen.add(q.language);
      if (q !== first && (q.correctAnswer !== first.correctAnswer || q.optionsCount !== first.optionsCount)) {
        q.valid = false;
        q.error = `Группа ${group}: число вариантов или правильный ответ не совпадает с первым вопросом группы (строка ${first.rowNumber})`;
      }
    }
  }
};

const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Убираем букву варианта в начале текста («A) …», «B. …», «В) …»), если она совпадает
// со столбцом: буквы ставит сам тест, а при перемешивании вариантов они бы съехали
// (латинские A–D, русские А–Г; кириллические «В»/«С» похожи на латинские B/C)
const OPTION_LETTERS = [['A', 'А'], ['B', 'Б', 'В'], ['C', 'В', 'С'], ['D', 'Г']];
const stripOptionLetter = (value, index) => {
  const text = String(value ?? '').trim();
  // «A)» — всегда, «A.» — только если дальше пробел (не трогаем «A.B. Smith»)
  const match = text.match(/^(\S)\s*(?:\)|\.(?=\s))\s*(.+)$/s);
  if (match && OPTION_LETTERS[index].includes(match[1].toUpperCase())) {
    return match[2].trim();
  }
  return text;
};

const parseRow = (row, rowNumber) => {
  // Определяем язык: из файла или по умолчанию
  let lang = String(row[8] || '').trim().toLowerCase();
  if (!isTestLanguage(lang)) {
    lang = defaultLanguage.value;
  }

  const question = {
    question_text: String(row[0] || '').trim(),
    optionA: stripOptionLetter(row[1], 0),
    optionB: stripOptionLetter(row[2], 1),
    optionC: stripOptionLetter(row[3], 2),
    optionD: stripOptionLetter(row[4], 3),
    correctAnswer: String(row[5] || '').trim().toUpperCase(),
    points: parseInt(row[6]) || 1,
    difficulty: String(row[7] || 'medium').trim().toLowerCase(),
    language: lang,
    group: String(row[9] ?? '').trim(),
    valid: true,
    error: '',
    optionsCount: 0,
    rowNumber,
  };

  // Подсчёт вариантов
  const options = [question.optionA, question.optionB, question.optionC, question.optionD].filter(o => o);
  question.optionsCount = options.length;

  // Валидация
  if (!question.question_text) {
    question.valid = false;
    question.error = 'Отсутствует текст вопроса';
    return question;
  }

  if (question.optionsCount < 2) {
    question.valid = false;
    question.error = 'Минимум 2 варианта ответа';
    return question;
  }

  if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    question.valid = false;
    question.error = 'Неверный правильный ответ (должен быть A, B, C или D)';
    return question;
  }

  // Проверяем, что указанный правильный ответ существует
  const correctIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[question.correctAnswer];
  if (correctIndex >= question.optionsCount) {
    question.valid = false;
    question.error = `Вариант ${question.correctAnswer} не заполнен`;
    return question;
  }

  if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
    question.difficulty = 'medium';
  }

  if (question.points < 1 || question.points > 100) {
    question.points = 1;
  }

  return question;
};

// Импорт вопросов
const importQuestions = async () => {
  const validQuestions = parsedQuestions.value.filter(q => q.valid);
  
  if (validQuestions.length === 0) return;

  importing.value = true;

  try {
    const questionsToImport = validQuestions.map(q => {
      const options = [];
      if (q.optionA) options.push({ id: 'a', text: q.optionA, correct: q.correctAnswer === 'A' });
      if (q.optionB) options.push({ id: 'b', text: q.optionB, correct: q.correctAnswer === 'B' });
      if (q.optionC) options.push({ id: 'c', text: q.optionC, correct: q.correctAnswer === 'C' });
      if (q.optionD) options.push({ id: 'd', text: q.optionD, correct: q.correctAnswer === 'D' });

      return {
        bank_id: props.bankId,
        question_type: 'single',
        question_text: q.question_text,
        options: { options },
        language: q.language,
        group: q.group || null,
        points: q.points,
        difficulty: q.difficulty,
        is_active: true,
      };
    });

    const response = await authFetch('/api/test-bank/questions/import', {
      method: 'POST',
      body: { questions: questionsToImport },
    });

    if (response.success) {
      importResult.value = {
        success: true,
        imported: response.imported || validQuestions.length,
        skipped: invalidQuestionsCount.value,
        error: '',
      };
    } else {
      importResult.value = {
        success: false,
        imported: 0,
        skipped: 0,
        error: response.message || 'Ошибка при импорте вопросов',
      };
    }

    step.value = 3;
  } catch (err) {
    console.error('Ошибка импорта:', err);
    importResult.value = {
      success: false,
      imported: 0,
      skipped: 0,
      error: 'Произошла ошибка при импорте',
    };
    step.value = 3;
  } finally {
    importing.value = false;
  }
};

// Скачивание шаблона
const downloadTemplate = () => {
  const templateData = [
    ['Вопрос', 'Вариант A', 'Вариант B', 'Вариант C', 'Вариант D', 'Правильный', 'Баллы', 'Сложность', 'Язык', 'Группа'],
    ['Что такое СИЗ?', 'Средства индивидуальной защиты', 'Система измерения защиты', 'Специальная инструкция защиты', 'Стандарт измерения защиты', 'A', 1, 'easy', 'ru', 1],
    ['Какой огнетушитель используется при пожаре класса E?', 'Водный', 'Порошковый', 'Углекислотный', 'Пенный', 'C', 2, 'medium', 'ru'],
    ['Xavfsizlik texnikasi nima?', 'Ishlab chiqarishda xavfsizlik qoidalari', 'Texnik xizmat ko\'rsatish', 'Sifat nazorati', 'Ishlab chiqarish rejasi', 'A', 1, 'easy', 'uz', 1],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Вопросы');

  // Устанавливаем ширину колонок
  ws['!cols'] = [
    { wch: 40 }, // Вопрос
    { wch: 30 }, // Вариант A
    { wch: 30 }, // Вариант B
    { wch: 30 }, // Вариант C
    { wch: 30 }, // Вариант D
    { wch: 12 }, // Правильный
    { wch: 8 },  // Баллы
    { wch: 12 }, // Сложность
    { wch: 8 },  // Язык
    { wch: 8 },  // Группа
  ];

  XLSX.writeFile(wb, 'questions_template.xlsx');
};
</script>
