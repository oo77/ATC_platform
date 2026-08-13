<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 via-white to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-primary/10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
        <p class="text-slate-500 dark:text-slate-400 font-semibold">Загрузка...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center">
        <div class="bg-danger/10 p-5 rounded-full inline-block mb-4">
          <AlertTriangle class="w-10 h-10 text-danger" />
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Экзамен недоступен</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-6">{{ error }}</p>
        <UiButton class="w-full font-bold" @click="navigateTo('/attestation')">Вернуться к аттестации</UiButton>
      </div>
    </div>

    <!-- Брифинг перед стартом -->
    <div v-else-if="stage === 'briefing'" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 max-w-xl w-full animate-in fade-in zoom-in-95 duration-500">
        <div class="text-center mb-8">
          <div class="bg-primary/10 p-5 rounded-2xl inline-flex mb-4">
            <ShieldCheck class="w-10 h-10 text-primary" />
          </div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ brief.templateName || "Аттестационный тест" }}</h1>
          <p class="text-slate-500 dark:text-slate-400 font-semibold mt-1">{{ brief.groupName }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-8">
          <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
            <div class="rounded-xl bg-warning/10 p-2.5 text-warning shrink-0"><Clock class="w-5 h-5" /></div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Время</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">
                {{ brief.timeLimitMinutes ? `${brief.timeLimitMinutes} мин` : "Без лимита" }}
              </p>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
            <div class="rounded-xl bg-success/10 p-2.5 text-success shrink-0"><Target class="w-5 h-5" /></div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Проходной балл</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">{{ brief.passingScore }}%</p>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
            <div class="rounded-xl bg-info/10 p-2.5 text-info shrink-0"><RotateCcw class="w-5 h-5" /></div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Попытки</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">{{ brief.attemptsUsed }} / {{ brief.maxAttempts }}</p>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
            <div class="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0"><MapPin class="w-5 h-5" /></div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Место</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm truncate">{{ brief.location || "—" }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start gap-3 mb-8">
          <Info class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p class="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
            После начала теста таймер запускается автоматически и не останавливается. Убедитесь, что у вас стабильное подключение
            к интернету. При случайном закрытии страницы ваш прогресс сохраняется — вы сможете продолжить с того же места.
          </p>
        </div>

        <UiButton class="w-full h-12 font-bold text-base gap-2" :loading="starting" @click="beginExam">
          <Play class="w-5 h-5" /> Начать экзамен
        </UiButton>
      </div>
    </div>

    <!-- Результат -->
    <div v-else-if="stage === 'completed'" class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 max-w-lg w-full animate-in fade-in zoom-in-95 duration-500">
        <div class="text-center mb-8">
          <div :class="['w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 relative', session?.passed ? 'bg-success/10' : 'bg-danger/10']">
            <component :is="session?.passed ? CheckCircle2 : XCircle" :class="['w-12 h-12', session?.passed ? 'text-success' : 'text-danger']" />
            <div :class="['absolute inset-0 rounded-full border-2 animate-ping opacity-20', session?.passed ? 'border-success' : 'border-danger']"></div>
          </div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {{ session?.passed ? "Экзамен сдан!" : "Экзамен не сдан" }}
          </h2>
          <p class="text-slate-500 dark:text-slate-400 font-semibold">
            {{ session?.passed ? "Поздравляем с успешным прохождением аттестации" : "Вы не набрали проходной балл" }}
          </p>
        </div>

        <div class="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 mb-6 text-center">
          <div :class="['text-6xl font-black mb-1', session?.passed ? 'text-success' : 'text-danger']">
            {{ session?.score_percent !== null ? Math.round(session.score_percent) : 0 }}%
          </div>
          <div class="text-sm text-slate-400 font-bold uppercase tracking-wider">Ваш результат</div>

          <div class="grid grid-cols-3 gap-3 mt-6">
            <div class="bg-white dark:bg-slate-900 rounded-xl p-3">
              <p class="text-lg font-bold text-slate-900 dark:text-white">{{ session?.total_points || 0 }}/{{ session?.max_points || 0 }}</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Баллов</p>
            </div>
            <div class="bg-white dark:bg-slate-900 rounded-xl p-3">
              <p class="text-lg font-bold text-slate-900 dark:text-white">{{ answeredCount }}/{{ questions.length }}</p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Отвечено</p>
            </div>
            <div class="bg-white dark:bg-slate-900 rounded-xl p-3">
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {{ session?.time_spent_seconds != null ? formatTimer(session.time_spent_seconds) : "—" }}
              </p>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Время</p>
            </div>
          </div>
        </div>

        <UiButton class="w-full h-12 font-bold" @click="navigateTo('/attestation')">К списку аттестации</UiButton>
      </div>
    </div>

    <!-- Прохождение теста -->
    <div v-else class="flex flex-col min-h-screen">
      <header class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck class="w-5 h-5 text-primary" />
              </div>
              <div class="min-w-0">
                <h1 class="font-bold text-slate-900 dark:text-white truncate">{{ brief.templateName || "Аттестационный тест" }}</h1>
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{{ brief.groupName }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <div class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Target class="w-3.5 h-3.5 text-slate-400" /> {{ brief.passingScore }}%
              </div>
              <div
                v-if="remainingTime !== null"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-bold tabular-nums transition-colors',
                  timerDanger ? 'bg-danger/10 text-danger animate-pulse' : timerWarning ? 'bg-warning/10 text-warning' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                ]"
              >
                <Clock class="w-4 h-4" />
                {{ formatTimer(remainingTime) }}
              </div>
            </div>
          </div>

          <!-- Question navigator -->
          <div class="mt-4 flex items-center gap-2">
            <div class="flex-1 flex flex-wrap gap-1.5">
              <button
                v-for="(q, idx) in questions"
                :key="q.id"
                @click="goTo(idx)"
                :class="[
                  'h-8 w-8 shrink-0 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200',
                  idx === currentIndex
                    ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110'
                    : answers[q.id] !== undefined && answers[q.id] !== null
                      ? 'bg-success/15 text-success hover:bg-success/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
                ]"
              >
                {{ idx + 1 }}
              </button>
            </div>
            <span class="hidden md:inline text-xs font-bold text-slate-400 shrink-0 ml-2">
              {{ answeredCount }}/{{ questions.length }} отвечено
            </span>
          </div>
          <div class="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div class="h-full rounded-full bg-linear-to-r from-primary to-info transition-all duration-500" :style="{ width: `${progressPercent}%` }"></div>
          </div>
        </div>
      </header>

      <main class="flex-1 py-8 md:py-12">
        <div class="max-w-3xl mx-auto px-4" v-if="currentQuestion">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs font-black uppercase tracking-widest text-primary">Вопрос {{ currentIndex + 1 }} из {{ questions.length }}</span>
            <span class="text-xs font-bold text-slate-400">• {{ currentQuestion.points }} балл(ов)</span>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <p class="text-xl font-bold text-slate-900 dark:text-white leading-relaxed mb-8">{{ currentQuestion.question_text }}</p>

            <div class="space-y-3">
              <label
                v-for="opt in currentQuestion.options?.options || []"
                :key="opt.id"
                :class="[
                  'flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200',
                  selectedOption === opt.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                ]"
              >
                <div
                  :class="[
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    selectedOption === opt.id ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600',
                  ]"
                >
                  <div v-if="selectedOption === opt.id" class="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <input type="radio" :name="currentQuestion.id" :value="opt.id" v-model="selectedOption" @change="submitAnswer" class="sr-only" />
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ opt.text }}</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between mt-6 gap-3">
            <UiButton variant="outline" class="gap-2 font-bold" :disabled="currentIndex === 0" @click="goTo(currentIndex - 1)">
              <ChevronLeft class="w-4 h-4" /> Назад
            </UiButton>
            <UiButton v-if="currentIndex < questions.length - 1" class="gap-2 font-bold" @click="goTo(currentIndex + 1)">
              Далее <ChevronRight class="w-4 h-4" />
            </UiButton>
            <UiButton v-else variant="primary" class="gap-2 font-bold bg-success! hover:bg-success/90!" @click="requestFinish">
              <Flag class="w-4 h-4" /> Завершить экзамен
            </UiButton>
          </div>
        </div>
      </main>
    </div>

    <!-- Подтверждение завершения -->
    <UiConfirmModal
      :is-open="showFinishConfirm"
      title="Завершить экзамен?"
      :message="unansweredCount > 0 ? 'Вы уверены, что хотите завершить экзамен?' : 'Все вопросы отвечены. Завершить экзамен и получить результат?'"
      :warning="unansweredCount > 0 ? `Осталось без ответа: ${unansweredCount} из ${questions.length} вопросов. После завершения изменить ответы будет невозможно.` : ''"
      confirm-text="Завершить"
      cancel-text="Продолжить тест"
      variant="warning"
      :loading="finishing"
      @confirm="finishExam"
      @cancel="showFinishConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  ShieldCheck,
  Clock,
  Target,
  RotateCcw,
  MapPin,
  Info,
  Play,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
} from "lucide-vue-next";

definePageMeta({ layout: "blank" });

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useToast();

const groupId = route.params.groupId;
const sessionIdFromQuery = route.query.session || null;

const loading = ref(true);
const error = ref("");
const stage = ref("briefing"); // briefing | in_progress | completed
const starting = ref(false);
const finishing = ref(false);
const showFinishConfirm = ref(false);

const brief = ref({});
const sessionId = ref(sessionIdFromQuery);
const session = ref(null);
const questions = ref([]);
const answers = ref({});
const currentIndex = ref(0);
const remainingTime = ref(null);
let timerInterval = null;

const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const selectedOption = computed({
  get: () => (currentQuestion.value ? answers.value[currentQuestion.value.id] : null),
  set: (val) => {
    if (currentQuestion.value) answers.value[currentQuestion.value.id] = val;
  },
});
const answeredCount = computed(() => Object.values(answers.value).filter((v) => v !== undefined && v !== null).length);
const unansweredCount = computed(() => questions.value.length - answeredCount.value);
const progressPercent = computed(() => (questions.value.length ? (answeredCount.value / questions.value.length) * 100 : 0));
const timerWarning = computed(() => remainingTime.value !== null && remainingTime.value < 300);
const timerDanger = computed(() => remainingTime.value !== null && remainingTime.value < 60);

const formatTimer = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

const loadBrief = async () => {
  const res = await authFetch("/api/attestation/my");
  if (res.success) {
    const item = (res.items || []).find((i) => i.groupId === groupId);
    if (item) {
      brief.value = item;
      return true;
    }
  }
  return false;
};

const loadSession = async () => {
  const res = await authFetch(`/api/attestation/sessions/${sessionId.value}?include_questions=true&include_answers=true`);
  if (!res.success) {
    error.value = res.message || "Сессия не найдена";
    return;
  }
  session.value = res.session;
  questions.value = res.questions || [];
  currentIndex.value = res.session.current_question_index || 0;

  (res.answers || []).forEach((a) => {
    answers.value[a.question_id] = a.answer_data?.selectedOption;
  });

  if (session.value.status === "completed") {
    stage.value = "completed";
    return;
  }

  stage.value = "in_progress";

  if (brief.value.timeLimitMinutes) {
    const startedAt = new Date(session.value.started_at).getTime();
    const limitMs = brief.value.timeLimitMinutes * 60 * 1000;
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
};

const beginExam = async () => {
  starting.value = true;
  try {
    const startRes = await authFetch("/api/attestation/sessions/start", { method: "POST", body: { group_id: groupId } });
    if (!startRes.success) {
      toast.error(startRes.message || "Не удалось начать тест");
      return;
    }
    sessionId.value = startRes.session.id;
    await loadSession();
  } finally {
    starting.value = false;
  }
};

const requestFinish = () => {
  showFinishConfirm.value = true;
};

const finishExam = async () => {
  finishing.value = true;
  try {
    const res = await authFetch(`/api/attestation/sessions/${sessionId.value}/finish`, { method: "POST" });
    if (res.success) {
      session.value = { ...session.value, status: "completed", ...res.results };
      stage.value = "completed";
      showFinishConfirm.value = false;
    } else {
      toast.error(res.message || "Не удалось завершить экзамен");
    }
  } finally {
    finishing.value = false;
  }
};

const handleBeforeUnload = (e) => {
  if (stage.value === "in_progress") {
    e.preventDefault();
    e.returnValue = "";
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const ok = await loadBrief();
    if (!ok) {
      error.value = "Эта аттестация вам недоступна";
      return;
    }

    if (sessionId.value) {
      await loadSession();
    } else if (brief.value.activeSessionId) {
      sessionId.value = brief.value.activeSessionId;
      await loadSession();
    } else {
      stage.value = "briefing";
    }
  } finally {
    loading.value = false;
  }
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>
