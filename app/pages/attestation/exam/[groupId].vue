<template>
  <div class="min-h-screen bg-gray-100 dark:bg-boxdark-2">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Загрузка теста...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Ошибка</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <UiButton @click="navigateTo('/attestation')">Вернуться к аттестации</UiButton>
      </div>
    </div>

    <div v-else-if="isCompleted" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div class="text-center mb-8">
          <div :class="['w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4', session?.passed ? 'bg-success/10' : 'bg-danger/10']">
            <span :class="['text-3xl font-bold', session?.passed ? 'text-success' : 'text-danger']">{{ session?.passed ? '✓' : '✕' }}</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ session?.passed ? "Экзамен сдан!" : "Экзамен не сдан" }}
          </h2>
        </div>
        <div class="bg-gray-50 dark:bg-meta-4 rounded-xl p-6 mb-6 text-center">
          <div :class="['text-5xl font-bold mb-1', session?.passed ? 'text-success' : 'text-danger']">
            {{ session?.score_percent !== null ? Math.round(session.score_percent) : 0 }}%
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Ваш результат</div>
        </div>
        <UiButton class="w-full" @click="navigateTo('/attestation')">К списку аттестации</UiButton>
      </div>
    </div>

    <div v-else class="flex flex-col min-h-screen">
      <header class="bg-white dark:bg-boxdark shadow-sm sticky top-0 z-50">
        <div class="max-w-3xl mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="font-semibold text-gray-900 dark:text-white">{{ templateSettings?.name || "Аттестационный тест" }}</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Вопрос {{ currentIndex + 1 }} из {{ questions.length }}</p>
            </div>
            <div v-if="remainingTime !== null" :class="['flex items-center gap-2 px-4 py-2 rounded-lg font-medium', timerWarning ? 'bg-danger/10 text-danger animate-pulse' : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300']">
              <span class="tabular-nums">{{ formatTimer(remainingTime) }}</span>
            </div>
          </div>
          <div class="w-full h-2 bg-gray-200 dark:bg-meta-4 rounded-full overflow-hidden mt-3">
            <div class="h-full bg-primary transition-all duration-300" :style="{ width: `${progressPercent}%` }"></div>
          </div>
        </div>
      </header>

      <main class="flex-1 py-6">
        <div class="max-w-3xl mx-auto px-4" v-if="currentQuestion">
          <div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6">
            <p class="text-lg font-medium text-gray-900 dark:text-white mb-6">{{ currentQuestion.question_text }}</p>
            <div class="space-y-3">
              <label
                v-for="opt in currentQuestion.options?.options || []"
                :key="opt.id"
                :class="[
                  'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                  selectedOption === opt.id ? 'border-primary bg-primary/5' : 'border-stroke dark:border-strokedark hover:border-primary/50',
                ]"
              >
                <input type="radio" :name="currentQuestion.id" :value="opt.id" v-model="selectedOption" @change="submitAnswer" class="accent-primary" />
                <span>{{ opt.text }}</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between mt-6">
            <UiButton variant="outline" :disabled="currentIndex === 0" @click="goTo(currentIndex - 1)">Назад</UiButton>
            <UiButton v-if="currentIndex < questions.length - 1" @click="goTo(currentIndex + 1)">Далее</UiButton>
            <UiButton v-else :loading="finishing" @click="finishExam">Завершить экзамен</UiButton>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

definePageMeta({ layout: "default" });

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useToast();

const groupId = route.params.groupId;
const sessionId = ref(route.query.session || null);

const loading = ref(true);
const error = ref("");
const session = ref(null);
const templateSettings = ref(null);
const questions = ref([]);
const answers = ref({});
const currentIndex = ref(0);
const finishing = ref(false);
const remainingTime = ref(null);
let timerInterval = null;

const isCompleted = computed(() => session.value?.status === "completed");
const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const selectedOption = computed({
  get: () => (currentQuestion.value ? answers.value[currentQuestion.value.id] : null),
  set: (val) => {
    if (currentQuestion.value) answers.value[currentQuestion.value.id] = val;
  },
});
const progressPercent = computed(() =>
  questions.value.length ? (Object.keys(answers.value).length / questions.value.length) * 100 : 0
);
const timerWarning = computed(() => remainingTime.value !== null && remainingTime.value < 60);

const formatTimer = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const goTo = (index) => {
  if (index < 0 || index >= questions.value.length) return;
  currentIndex.value = index;
};

const submitAnswer = async () => {
  if (!currentQuestion.value || !sessionId.value) return;
  try {
    await authFetch(`/api/attestation/sessions/${sessionId.value}/answer`, {
      method: "POST",
      body: {
        question_id: currentQuestion.value.id,
        answer_data: { selectedOption: selectedOption.value },
        question_index: currentIndex.value,
      },
    });
  } catch (e) {
    toast.error("Не удалось сохранить ответ");
  }
};

const loadSession = async () => {
  try {
    const res = await authFetch(`/api/attestation/sessions/${sessionId.value}?include_questions=true&include_answers=true`);
    if (!res.success) {
      error.value = res.message || "Сессия не найдена";
      return;
    }
    session.value = res.session;
    templateSettings.value = res.templateSettings;
    questions.value = res.questions || [];
    currentIndex.value = res.session.current_question_index || 0;

    (res.answers || []).forEach((a) => {
      answers.value[a.question_id] = a.answer_data?.selectedOption;
    });

    if (session.value.status === "in_progress" && templateSettings.value?.time_limit_minutes) {
      const startedAt = new Date(session.value.started_at).getTime();
      const limitMs = templateSettings.value.time_limit_minutes * 60 * 1000;
      const elapsed = Date.now() - startedAt;
      remainingTime.value = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
      timerInterval = setInterval(() => {
        if (remainingTime.value > 0) {
          remainingTime.value -= 1;
        } else {
          clearInterval(timerInterval);
          finishExam();
        }
      }, 1000);
    }
  } catch (e) {
    error.value = "Не удалось загрузить сессию";
  } finally {
    loading.value = false;
  }
};

const finishExam = async () => {
  finishing.value = true;
  try {
    const res = await authFetch(`/api/attestation/sessions/${sessionId.value}/finish`, { method: "POST" });
    if (res.success) {
      session.value = { ...session.value, status: "completed", ...res.results };
    } else {
      toast.error(res.message || "Не удалось завершить экзамен");
    }
  } finally {
    finishing.value = false;
  }
};

onMounted(async () => {
  if (!sessionId.value) {
    const startRes = await authFetch("/api/attestation/sessions/start", { method: "POST", body: { group_id: groupId } });
    if (!startRes.success) {
      error.value = startRes.message || "Не удалось начать тест";
      loading.value = false;
      return;
    }
    sessionId.value = startRes.session.id;
  }
  await loadSession();
});

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
