<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"
        ></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Загрузка результатов...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="text-center py-16">
      <div
        class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-4"
      >
        <svg
          class="w-8 h-8 text-danger"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Ошибка загрузки
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ error }}</p>
      <UiButton @click="navigateTo('/tests/my')">Вернуться к тестам</UiButton>
    </div>

    <!-- Контент -->
    <template v-else-if="results">
      <!-- Хлебные крошки -->
      <nav
        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6"
      >
        <NuxtLink to="/tests/my" class="hover:text-primary transition-colors">
          Мои тесты
        </NuxtLink>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span class="text-black dark:text-white truncate max-w-xs">
          {{ results.assignment?.template_name || 'Результаты теста' }}
        </span>
      </nav>

      <!-- Заголовок -->
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-title-md2 font-bold text-black dark:text-white">
            Результаты теста
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ results.assignment?.template_name }}
          </p>
        </div>
        <UiButton variant="outline" @click="navigateTo('/tests/my')">
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          К списку тестов
        </UiButton>
      </div>

      <!-- Карточки с итоговой статистикой -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <!-- Лучший результат -->
        <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-5">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-success/10"
            >
              <svg
                class="w-5 h-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >Лучший результат</span
            >
          </div>
          <p
            :class="[
              'text-3xl font-bold',
              overallPassed ? 'text-success' : 'text-danger',
            ]"
          >
            {{ bestScore !== null ? Math.round(bestScore) + '%' : '—' }}
          </p>
        </div>

        <!-- Попыток использовано -->
        <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-5">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
            >
              <svg
                class="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >Попытки</span
            >
          </div>
          <p class="text-3xl font-bold text-black dark:text-white">
            {{ results.results?.length || 0 }}
            <span class="text-sm font-normal text-gray-500"
              >/ {{ results.assignment?.max_attempts || '∞' }}</span
            >
          </p>
        </div>

        <!-- Проходной балл -->
        <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-5">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10"
            >
              <svg
                class="w-5 h-5 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >Проходной балл</span
            >
          </div>
          <p class="text-3xl font-bold text-black dark:text-white">
            {{ results.assignment?.passing_score || '—' }}%
          </p>
        </div>

        <!-- Статус -->
        <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-5">
          <div class="flex items-center gap-3 mb-2">
            <div
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-full',
                overallPassed ? 'bg-success/10' : 'bg-danger/10',
              ]"
            >
              <svg
                :class="['w-5 h-5', overallPassed ? 'text-success' : 'text-danger']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  v-if="overallPassed"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >Итог</span
            >
          </div>
          <p
            :class="[
              'text-xl font-bold',
              overallPassed ? 'text-success' : 'text-danger',
            ]"
          >
            {{ overallPassed ? 'Сдан' : 'Не сдан' }}
          </p>
        </div>
      </div>

      <!-- Список попыток -->
      <div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
        <div class="p-6 border-b border-stroke dark:border-strokedark">
          <h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            <svg
              class="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            История попыток
          </h3>
        </div>

        <div v-if="results.results?.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
          <svg
            class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="text-lg font-medium">Нет завершённых попыток</p>
          <p class="mt-1 text-sm">Вы ещё не проходили этот тест</p>
        </div>

        <div v-else class="divide-y divide-stroke dark:divide-strokedark">
          <div
            v-for="(attempt, index) in results.results"
            :key="attempt.student_id + '_' + index"
            class="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <!-- Попытка -->
              <div class="flex items-center gap-4">
                <div
                  :class="[
                    'flex h-12 w-12 min-w-12 items-center justify-center rounded-xl font-bold text-lg',
                    attempt.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  ]"
                >
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        attempt.passed
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger',
                      ]"
                    >
                      {{ attempt.passed ? 'Сдан' : 'Не сдан' }}
                    </span>
                    <span
                      v-if="index === bestAttemptIndex && results.results.length > 1"
                      class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      Лучший
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ formatDate(attempt.last_attempt_at) }}
                  </p>
                </div>
              </div>

              <!-- Результат -->
              <div class="flex items-center gap-6 text-sm">
                <div class="text-right">
                  <div
                    :class="[
                      'text-2xl font-bold',
                      attempt.passed ? 'text-success' : 'text-danger',
                    ]"
                  >
                    {{ attempt.best_score !== null ? Math.round(attempt.best_score) + '%' : '—' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Результат</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Уведомления -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const { authFetch } = useAuthFetch();

const loading = ref(true);
const error = ref(null);
const results = ref(null);

const notification = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

const bestScore = computed(() => {
  if (!results.value?.results?.length) return null;
  const scores = results.value.results
    .map((r) => r.best_score)
    .filter((s) => s !== null && s !== undefined);
  return scores.length > 0 ? Math.max(...scores) : null;
});

const bestAttemptIndex = computed(() => {
  if (!results.value?.results?.length || bestScore.value === null) return -1;
  return results.value.results.findIndex(
    (r) => r.best_score !== null && Math.round(r.best_score) === Math.round(bestScore.value)
  );
});

const overallPassed = computed(() => {
  if (!results.value?.results?.length) return false;
  return results.value.results.some((r) => r.passed);
});

const totalAttempts = computed(() => results.value?.results?.length || 0);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadResults = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch(
      `/api/tests/assignments/${route.params.id}/results`
    );

    if (response.success) {
      results.value = response;
    } else {
      error.value = response.message || "Не удалось загрузить результаты";
    }
  } catch (err) {
    console.error("Ошибка загрузки результатов:", err);
    error.value = "Произошла ошибка при загрузке результатов";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadResults();
});
</script>
