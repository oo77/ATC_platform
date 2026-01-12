<template>
  <UiModal
    :is-open="isOpen"
    title="Выберите язык тестирования"
    size="sm"

    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Описание -->
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Выберите язык, на котором хотите проходить тест. 
        После выбора язык изменить будет невозможно.
      </p>

      <!-- Загрузка -->
      <div v-if="loading" class="py-8 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Загрузка доступных языков...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="py-6 text-center">
        <div class="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-sm text-danger">{{ error }}</p>
        <button
          @click="loadLanguages"
          class="mt-3 text-sm text-primary hover:underline"
        >
          Попробовать снова
        </button>
      </div>

      <!-- Список языков -->
      <div v-else class="space-y-3">
        <label
          v-for="lang in languages"
          :key="lang.value"
          @click="selectLanguage(lang.value)"
          :class="[
            'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
            selectedLanguage === lang.value
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4'
          ]"
        >
          <div :class="[
            'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            selectedLanguage === lang.value
              ? 'border-primary bg-primary'
              : 'border-gray-300 dark:border-gray-600'
          ]">
            <div v-if="selectedLanguage === lang.value" class="w-2 h-2 rounded-full bg-white"></div>
          </div>
          
          <span class="text-2xl">{{ lang.flag }}</span>
          
          <div class="flex-1">
            <span class="block font-medium text-gray-900 dark:text-white">{{ lang.label }}</span>
          </div>

          <input
            type="radio"
            :name="'language'"
            :value="lang.value"
            :checked="selectedLanguage === lang.value"
            class="sr-only"
          />
        </label>
      </div>

      <!-- Предупреждение -->
      <div class="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
        <svg class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          <span class="font-medium text-warning">Внимание!</span> 
          После начала теста изменить язык будет невозможно.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UiButton
          variant="outline"
          @click="handleClose"
          :disabled="confirming"
        >
          Отмена
        </UiButton>
        <UiButton
          @click="confirmSelection"
          :disabled="!selectedLanguage || confirming"
          :loading="confirming"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Подтвердить и начать
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  assignmentId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['close', 'confirm']);

const { authFetch } = useAuthFetch();

// Состояние
const loading = ref(false);
const error = ref(null);
const languages = ref([]);
const selectedLanguage = ref(null);
const confirming = ref(false);

// Загрузка доступных языков при открытии модалки
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.assignmentId) {
    selectedLanguage.value = null;
    await loadLanguages();
  }
});

// Загрузка языков
const loadLanguages = async () => {
  if (!props.assignmentId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const response = await authFetch(`/api/tests/assignments/${props.assignmentId}/available-languages`);
    
    if (response.success) {
      languages.value = response.languages || [];
      
      // Если доступен только один язык — автоматически выбираем его
      if (languages.value.length === 1) {
        selectedLanguage.value = languages.value[0].value;
      }
      
      // Если языков нет — ошибка
      if (languages.value.length === 0) {
        error.value = 'Для этого теста нет доступных языков. Обратитесь к администратору.';
      }
    } else {
      error.value = response.message || 'Не удалось загрузить языки';
    }
  } catch (err) {
    console.error('Ошибка загрузки языков:', err);
    error.value = 'Произошла ошибка при загрузке языков';
  } finally {
    loading.value = false;
  }
};

// Выбор языка
const selectLanguage = (lang) => {
  selectedLanguage.value = lang;
};

// Подтверждение выбора
const confirmSelection = () => {
  if (!selectedLanguage.value) return;
  
  confirming.value = true;
  emit('confirm', selectedLanguage.value);
};

// Сброс состояния confirming при закрытии
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    confirming.value = false;
  }
});

// Закрытие
const handleClose = () => {
  if (!confirming.value) {
    emit('close');
  }
};
</script>
