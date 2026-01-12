<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок шага -->
    <div class="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-6 dark:from-indigo-900/20 dark:to-purple-900/20">
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500 shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Настройка курса
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Укажите для какого курса импортируются сертификаты и их срок действия
          </p>
        </div>
      </div>
    </div>

    <!-- Выбор источника курса -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
      <h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        📚 Для какого курса импортируются сертификаты?
      </h4>
      
      <div class="space-y-4">
        <!-- Выбор существующего курса -->
        <label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <input
            type="radio"
            v-model="localConfig.courseSource"
            value="existing"
            class="mt-1 h-5 w-5 text-primary focus:ring-primary"
          />
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">Выбрать существующий курс</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Данные курса будут взяты из базы данных
            </p>
            
            <!-- Выпадающий список курсов -->
            <div v-if="localConfig.courseSource === 'existing'" class="mt-4">
              <select
                v-model="localConfig.courseId"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                :disabled="loadingCourses"
              >
                <option value="">{{ loadingCourses ? 'Загрузка...' : 'Выберите курс' }}</option>
                <option
                  v-for="course in courses"
                  :key="course.id"
                  :value="course.id"
                >
                  {{ course.name }} {{ course.code ? `(${course.code})` : '' }} {{ course.hours ? `— ${course.hours} ч.` : '' }}
                </option>
              </select>
            </div>
          </div>
        </label>

        <!-- Ручной ввод -->
        <label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <input
            type="radio"
            v-model="localConfig.courseSource"
            value="manual"
            class="mt-1 h-5 w-5 text-primary focus:ring-primary"
          />
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">Указать название курса вручную</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Для импорта исторических сертификатов, когда курс не зарегистрирован в системе
            </p>
            
            <!-- Поля ручного ввода -->
            <div v-if="localConfig.courseSource === 'manual'" class="mt-4 space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Название курса <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="localConfig.courseName"
                  type="text"
                  placeholder="Например: Курс повышения квалификации"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Код курса (опционально)
                  </label>
                  <input
                    v-model="localConfig.courseCode"
                    type="text"
                    placeholder="Например: ATC25"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Количество часов (опционально)
                  </label>
                  <input
                    v-model.number="localConfig.courseHours"
                    type="number"
                    min="1"
                    placeholder="72"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Срок действия сертификатов -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
      <h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        📅 Срок действия сертификатов
      </h4>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Применяется ко всем импортируемым сертификатам
      </p>
      
      <div class="space-y-4">
        <!-- Бессрочный -->
        <label class="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <input
            type="radio"
            v-model="localConfig.validityType"
            value="unlimited"
            class="h-5 w-5 text-primary focus:ring-primary"
          />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Бессрочный</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Сертификаты не истекают
            </p>
          </div>
        </label>

        <!-- С ограничением -->
        <label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <input
            type="radio"
            v-model="localConfig.validityType"
            value="months"
            class="mt-1 h-5 w-5 text-primary focus:ring-primary"
          />
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">Указать срок действия</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Дата истечения рассчитывается от даты выдачи
            </p>
            
            <!-- Выбор количества месяцев -->
            <div v-if="localConfig.validityType === 'months'" class="mt-4">
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-600 dark:text-gray-400">Срок действия:</span>
                <select
                  v-model.number="localConfig.validityMonths"
                  class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option :value="6">6 месяцев</option>
                  <option :value="12">12 месяцев (1 год)</option>
                  <option :value="18">18 месяцев</option>
                  <option :value="24">24 месяца (2 года)</option>
                  <option :value="36">36 месяцев (3 года)</option>
                  <option :value="60">60 месяцев (5 лет)</option>
                </select>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Для каждого сертификата: expiry_date = issue_date + {{ localConfig.validityMonths }} месяцев
              </p>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Кнопка Далее -->
    <div class="flex items-center justify-end">
      <button
        @click="handleNext"
        :disabled="!isValid"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Далее
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';

const emit = defineEmits(['next', 'update:config']);

const props = defineProps({
  config: {
    type: Object,
    default: () => ({
      courseSource: 'manual',
      courseId: '',
      courseName: '',
      courseCode: '',
      courseHours: null,
      validityType: 'unlimited',
      validityMonths: 12,
    }),
  },
});

// Локальное состояние конфигурации
const localConfig = reactive({
  courseSource: props.config.courseSource || 'manual',
  courseId: props.config.courseId || '',
  courseName: props.config.courseName || '',
  courseCode: props.config.courseCode || '',
  courseHours: props.config.courseHours || null,
  validityType: props.config.validityType || 'unlimited',
  validityMonths: props.config.validityMonths || 12,
});

// Список курсов
const courses = ref([]);
const loadingCourses = ref(false);

const { authFetch } = useAuthFetch();

// Загрузка курсов
const loadCourses = async () => {
  loadingCourses.value = true;
  try {
    const response = await authFetch('/api/courses?limit=100&isActive=true');
    if (response.success && response.courses) {
      courses.value = response.courses;
    }
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error);
  } finally {
    loadingCourses.value = false;
  }
};

onMounted(() => {
  loadCourses();
});

// Валидация
const isValid = computed(() => {
  if (localConfig.courseSource === 'existing') {
    return !!localConfig.courseId;
  } else if (localConfig.courseSource === 'manual') {
    return !!localConfig.courseName && localConfig.courseName.trim().length > 0;
  }
  return false;
});

// При смене источника курса сбрасываем связанные поля
watch(() => localConfig.courseSource, (newSource) => {
  if (newSource === 'existing') {
    localConfig.courseName = '';
    localConfig.courseCode = '';
    localConfig.courseHours = null;
  } else {
    localConfig.courseId = '';
  }
});

// Синхронизация с родителем
watch(localConfig, (value) => {
  emit('update:config', { ...value });
}, { deep: true });

// Обработчик кнопки Далее
const handleNext = () => {
  if (!isValid.value) return;
  
  // Если выбран существующий курс, заполняем данные из него
  if (localConfig.courseSource === 'existing' && localConfig.courseId) {
    const selectedCourse = courses.value.find(c => c.id === localConfig.courseId);
    if (selectedCourse) {
      localConfig.courseName = selectedCourse.name;
      localConfig.courseCode = selectedCourse.code || '';
      localConfig.courseHours = selectedCourse.hours || null;
    }
  }
  
  emit('next', { ...localConfig });
};
</script>
