<template>
  <UiModal
    :is-open="isOpen"
    title="Результаты тестирования"
    size="xl"
    @close="$emit('close')"
  >
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p class="text-sm text-gray-500">Загрузка результатов...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-4">
        <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Ошибка загрузки</h3>
      <p class="text-sm text-gray-500">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="data" class="space-y-6">
      <!-- Header info -->
      <div class="bg-gray-50 dark:bg-meta-4 rounded-lg p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Студент -->
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Студент</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ data.session.studentName || 'Н/Д' }}</p>
            <p v-if="data.session.studentPinfl" class="text-xs text-gray-400">{{ data.session.studentPinfl }}</p>
          </div>
          <!-- Тест -->
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Тест</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ data.template.name }}</p>
            <p v-if="data.context.groupName" class="text-xs text-gray-400">{{ data.context.groupName }}</p>
          </div>
          <!-- Дата -->
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Дата прохождения</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDate(data.session.completedAt || data.session.startedAt) }}
            </p>
            <p class="text-xs text-gray-400">Попытка #{{ data.session.attemptNumber }}</p>
          </div>
          <!-- Время -->
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Затрачено времени</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDuration(data.session.timeSpentSeconds) }}
            </p>
            <p v-if="data.template.timeLimitMinutes" class="text-xs text-gray-400">
              из {{ data.template.timeLimitMinutes }} мин.
            </p>
          </div>
        </div>
      </div>

      <!-- Score card -->
      <div 
        class="rounded-lg p-6 text-center"
        :class="data.session.passed ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'"
      >
        <div class="text-4xl font-bold mb-2" :class="data.session.passed ? 'text-success' : 'text-danger'">
          {{ Math.round(data.session.scorePercent || 0) }}%
        </div>
        <p class="text-lg font-medium" :class="data.session.passed ? 'text-success' : 'text-danger'">
          {{ data.session.passed ? 'Тест сдан' : 'Тест не сдан' }}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ data.stats.earnedPoints }} из {{ data.stats.totalPoints }} баллов
          (проходной: {{ data.template.passingScore }}%)
        </p>
        <div class="flex justify-center gap-6 mt-4 text-sm">
          <span class="inline-flex items-center gap-1 text-success">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ data.stats.correctAnswers }} правильно
          </span>
          <span class="inline-flex items-center gap-1 text-danger">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ data.stats.incorrectAnswers }} неправильно
          </span>
          <span v-if="data.stats.unanswered > 0" class="inline-flex items-center gap-1 text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ data.stats.unanswered }} без ответа
          </span>
        </div>
      </div>

      <!-- Answers list -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Ответы на вопросы</h3>
        <div class="space-y-4">
          <div 
            v-for="(answer, index) in data.answers" 
            :key="answer.questionId"
            class="border rounded-lg overflow-hidden"
            :class="getAnswerBorderClass(answer)"
          >
            <!-- Question header -->
            <div 
              class="p-4 flex items-start gap-3"
              :class="getAnswerBgClass(answer)"
            >
              <div 
                class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                :class="getAnswerBadgeClass(answer)"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400">
                    {{ getQuestionTypeName(answer.questionType) }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ answer.pointsEarned }}/{{ answer.questionPoints }} баллов
                  </span>
                  <span v-if="answer.timeSpentSeconds" class="text-xs text-gray-400">
                    {{ formatDuration(answer.timeSpentSeconds) }}
                  </span>
                </div>
                <p class="text-sm text-gray-900 dark:text-white whitespace-pre-line">{{ answer.questionText }}</p>
              </div>
              <!-- Status icon -->
              <div class="flex-shrink-0">
                <svg v-if="answer.isCorrect === true" class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="answer.isCorrect === false" class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <!-- Answer details -->
            <div class="p-4 bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark">
              <!-- Single/Multiple choice -->
              <div v-if="answer.questionType === 'single' || answer.questionType === 'multiple'">
                <div class="space-y-2">
                  <div 
                    v-for="option in getOptions(answer.questionOptions)" 
                    :key="option.id"
                    class="flex items-center gap-2 p-2 rounded"
                    :class="getOptionClass(answer, option)"
                  >
                    <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs"
                      :class="getOptionIconClass(answer, option)"
                    >
                      <svg v-if="isOptionSelected(answer.studentAnswer, option.id)" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="4" />
                      </svg>
                    </span>
                    <span class="text-sm" :class="option.correct ? 'text-success font-medium' : ''">
                      {{ option.text }}
                    </span>
                    <span v-if="option.correct" class="ml-auto text-xs text-success">✓ Правильный</span>
                  </div>
                </div>
              </div>

              <!-- Text answer -->
              <div v-else-if="answer.questionType === 'text'">
                <div class="space-y-3">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Ответ студента:</p>
                    <p class="text-sm p-2 bg-gray-50 dark:bg-meta-4 rounded" :class="answer.isCorrect ? 'text-success' : 'text-danger'">
                      {{ getTextAnswer(answer.studentAnswer) || '(нет ответа)' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Правильные ответы:</p>
                    <p class="text-sm text-success">
                      {{ getCorrectTextAnswers(answer.questionOptions) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Order answer -->
              <div v-else-if="answer.questionType === 'order'">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 mb-2">Ответ студента:</p>
                    <div class="space-y-1">
                      <div 
                        v-for="(itemId, idx) in getOrderAnswer(answer.studentAnswer)" 
                        :key="idx"
                        class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-meta-4 rounded text-sm"
                      >
                        <span class="w-5 h-5 rounded bg-gray-200 dark:bg-strokedark text-xs flex items-center justify-center">
                          {{ idx + 1 }}
                        </span>
                        {{ getOrderOptionText(answer.questionOptions, itemId) }}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 mb-2">Правильный порядок:</p>
                    <div class="space-y-1">
                      <div 
                        v-for="option in getCorrectOrder(answer.questionOptions)" 
                        :key="option.id"
                        class="flex items-center gap-2 p-2 bg-success/10 rounded text-sm text-success"
                      >
                        <span class="w-5 h-5 rounded bg-success/20 text-xs flex items-center justify-center">
                          {{ option.correctOrder }}
                        </span>
                        {{ option.text }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Match answer -->
              <div v-else-if="answer.questionType === 'match'">
                <div class="space-y-2">
                  <div 
                    v-for="pair in getMatchPairs(answer.questionOptions)" 
                    :key="pair.id"
                    class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-meta-4 rounded text-sm"
                  >
                    <span class="font-medium">{{ pair.left }}</span>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span :class="isMatchCorrect(answer.studentAnswer, pair) ? 'text-success' : 'text-danger'">
                      {{ getMatchedRight(answer.studentAnswer, pair.left) || '(не выбрано)' }}
                    </span>
                    <span v-if="!isMatchCorrect(answer.studentAnswer, pair)" class="text-xs text-success ml-auto">
                      Правильно: {{ pair.right }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Explanation -->
              <div v-if="answer.questionExplanation" class="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p class="text-xs text-primary font-medium mb-1">Пояснение:</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ answer.questionExplanation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UiButton @click="$emit('close')">Закрыть</UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  sessionId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['close']);

const { authFetch } = useAuthFetch();

const loading = ref(false);
const error = ref(null);
const data = ref(null);

// Форматирование даты
const formatDate = (dateStr) => {
  if (!dateStr) return 'Н/Д';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Форматирование длительности
const formatDuration = (seconds) => {
  if (!seconds) return '0 сек';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins === 0) return `${secs} сек`;
  if (secs === 0) return `${mins} мин`;
  return `${mins} мин ${secs} сек`;
};

// Название типа вопроса
const getQuestionTypeName = (type) => {
  const names = {
    single: 'Один ответ',
    multiple: 'Несколько ответов',
    text: 'Текстовый',
    order: 'Порядок',
    match: 'Соответствие',
  };
  return names[type] || type;
};

// Классы для рамки ответа
const getAnswerBorderClass = (answer) => {
  if (answer.isCorrect === true) return 'border-success/30';
  if (answer.isCorrect === false) return 'border-danger/30';
  return 'border-stroke dark:border-strokedark';
};

// Классы для фона заголовка ответа
const getAnswerBgClass = (answer) => {
  if (answer.isCorrect === true) return 'bg-success/5';
  if (answer.isCorrect === false) return 'bg-danger/5';
  return 'bg-gray-50 dark:bg-meta-4';
};

// Классы для бейджа номера
const getAnswerBadgeClass = (answer) => {
  if (answer.isCorrect === true) return 'bg-success text-white';
  if (answer.isCorrect === false) return 'bg-danger text-white';
  return 'bg-gray-200 dark:bg-strokedark text-gray-600 dark:text-gray-400';
};

// Получить опции для single/multiple
const getOptions = (questionOptions) => {
  if (!questionOptions) return [];
  return questionOptions.options || [];
};

// Проверить, выбрана ли опция
const isOptionSelected = (studentAnswer, optionId) => {
  if (!studentAnswer) return false;
  
  // Single choice
  if (studentAnswer.selectedOption) {
    return studentAnswer.selectedOption === optionId;
  }
  
  // Multiple choice
  if (studentAnswer.selectedOptions) {
    return studentAnswer.selectedOptions.includes(optionId);
  }
  
  return false;
};

// Классы для варианта ответа
const getOptionClass = (answer, option) => {
  const isSelected = isOptionSelected(answer.studentAnswer, option.id);
  
  if (option.correct && isSelected) {
    return 'bg-success/10 border border-success/30';
  }
  if (option.correct && !isSelected) {
    return 'bg-success/5 border border-success/20';
  }
  if (!option.correct && isSelected) {
    return 'bg-danger/10 border border-danger/30';
  }
  return 'bg-gray-50 dark:bg-meta-4';
};

// Классы для иконки выбора
const getOptionIconClass = (answer, option) => {
  const isSelected = isOptionSelected(answer.studentAnswer, option.id);
  
  if (option.correct && isSelected) {
    return 'border-success bg-success text-white';
  }
  if (option.correct && !isSelected) {
    return 'border-success text-success';
  }
  if (!option.correct && isSelected) {
    return 'border-danger bg-danger text-white';
  }
  return 'border-gray-300 dark:border-strokedark';
};

// Получить текстовый ответ
const getTextAnswer = (studentAnswer) => {
  if (!studentAnswer) return null;
  return studentAnswer.text || null;
};

// Получить правильные текстовые ответы
const getCorrectTextAnswers = (questionOptions) => {
  if (!questionOptions || !questionOptions.correctAnswers) return 'Н/Д';
  return questionOptions.correctAnswers.join(' | ');
};

// Получить порядок ответа
const getOrderAnswer = (studentAnswer) => {
  if (!studentAnswer || !studentAnswer.orderedOptions) return [];
  return studentAnswer.orderedOptions;
};

// Получить текст опции порядка
const getOrderOptionText = (questionOptions, optionId) => {
  if (!questionOptions || !questionOptions.options) return optionId;
  const option = questionOptions.options.find(o => o.id === optionId);
  return option ? option.text : optionId;
};

// Получить правильный порядок
const getCorrectOrder = (questionOptions) => {
  if (!questionOptions || !questionOptions.options) return [];
  return [...questionOptions.options].sort((a, b) => a.correctOrder - b.correctOrder);
};

// Получить пары для match
const getMatchPairs = (questionOptions) => {
  if (!questionOptions || !questionOptions.pairs) return [];
  return questionOptions.pairs;
};

// Проверить правильность соответствия
const isMatchCorrect = (studentAnswer, pair) => {
  if (!studentAnswer || !studentAnswer.matches) return false;
  const match = studentAnswer.matches.find(m => m.left === pair.left);
  return match && match.right === pair.right;
};

// Получить сопоставленное правое значение
const getMatchedRight = (studentAnswer, leftText) => {
  if (!studentAnswer || !studentAnswer.matches) return null;
  const match = studentAnswer.matches.find(m => m.left === leftText);
  return match ? match.right : null;
};

// Загрузка данных
const loadDetails = async () => {
  if (!props.sessionId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const response = await authFetch(`/api/tests/sessions/${props.sessionId}/details`);
    
    if (response.success) {
      data.value = response;
    } else {
      error.value = response.message || 'Не удалось загрузить данные';
    }
  } catch (err) {
    console.error('Error loading session details:', err);
    error.value = 'Ошибка при загрузке данных';
  } finally {
    loading.value = false;
  }
};

// Watch для загрузки при открытии
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.sessionId) {
    loadDetails();
  } else {
    data.value = null;
    error.value = null;
  }
});

// Первоначальная загрузка если уже открыто
onMounted(() => {
  if (props.isOpen && props.sessionId) {
    loadDetails();
  }
});
</script>
