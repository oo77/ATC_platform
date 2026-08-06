<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 pointer-events-none"
      >
      <div
        class="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all transform"
      >
        <!-- Top Gradient Glow Line -->
        <div class="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

        <!-- Header -->
        <div class="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center space-x-2.5">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg class="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Синхронизация слушателей
              </h3>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Course Planner ➔ ИНН, службы, должности и фотографии
              </p>
            </div>
          </div>
          <button
            v-if="!isSyncing"
            @click="closeModal"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Content -->
        <div class="p-5 space-y-4">
          <!-- Initial State (Before Start) -->
          <div v-if="!isSyncing && !result" class="text-center py-2 space-y-3">
            <div class="w-12 h-12 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">
                Запустить обновление данных?
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Автоматическое сопоставление организаций по ИНН, обновление слушателей, их служб/должностей (на 3 языках) и фото.
              </p>
            </div>
          </div>

          <!-- Syncing Progress State -->
          <div v-if="isSyncing" class="space-y-4">
            <!-- Progress Bar Card -->
            <div class="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span class="flex items-center space-x-2 truncate pr-2">
                  <span class="relative flex h-2 w-2 flex-shrink-0">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="truncate">{{ currentStatusText }}</span>
                </span>
                <span class="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                  {{ progressPercentage }}%
                </span>
              </div>

              <!-- Bar Container -->
              <div class="relative w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: `${progressPercentage}%` }"
                ></div>
              </div>
            </div>

            <!-- Steps List -->
            <div class="space-y-2">
              <div
                v-for="(step, idx) in steps"
                :key="idx"
                class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all"
                :class="[
                  step.status === 'completed'
                    ? 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                    : step.status === 'active'
                    ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 shadow-sm'
                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                ]"
              >
                <div class="flex items-center space-x-2.5 truncate">
                  <span v-if="step.status === 'completed'" class="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">✓</span>
                  <span v-else-if="step.status === 'active'" class="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                  <span v-else class="text-slate-400 flex-shrink-0">○</span>
                  <span class="truncate">{{ step.title }}</span>
                </div>
                <span v-if="step.status === 'completed'" class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">Готово</span>
                <span v-else-if="step.status === 'active'" class="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold animate-pulse flex-shrink-0">В процессе</span>
              </div>
            </div>
          </div>

          <!-- Result State -->
          <div v-if="result" class="space-y-3">
            <div
              class="p-3 rounded-xl border flex items-center space-x-3 text-xs"
              :class="result.success ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 border-rose-200 text-rose-900'"
            >
              <div class="text-xl flex-shrink-0">
                {{ result.success ? '🎉' : '⚠️' }}
              </div>
              <div class="flex-1">
                <h4 class="font-bold text-xs">
                  {{ result.success ? 'Синхронизация успешно завершена!' : 'Ошибка синхронизации' }}
                </h4>
                <p class="text-[11px] opacity-90 mt-0.5">
                  {{ result.message || result.error }}
                </p>
              </div>
            </div>

            <!-- Stats Grid -->
            <div v-if="result.success" class="grid grid-cols-4 gap-2">
              <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Всего</span>
                <span class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{{ result.total }}</span>
              </div>
              <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Создано</span>
                <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">+{{ result.created }}</span>
              </div>
              <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 text-center">
                <span class="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">Обновлено</span>
                <span class="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">{{ result.updated }}</span>
              </div>
              <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-800/40 text-center">
                <span class="text-[10px] text-purple-600 dark:text-purple-400 block font-medium">Орг ИНН</span>
                <span class="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">{{ result.matchedOrgs }}</span>
              </div>
            </div>

            <!-- Errors List if any -->
            <div v-if="result.errors && result.errors.length > 0" class="max-h-24 overflow-y-auto p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1 text-[11px]">
              <h5 class="font-bold text-rose-800 dark:text-rose-300 text-[10px] uppercase">
                Предупреждения ({{ result.errors.length }}):
              </h5>
              <div v-for="(err, i) in result.errors" :key="i" class="text-rose-700 dark:text-rose-400 flex justify-between">
                <span class="truncate pr-2">• {{ err.name }}</span>
                <span class="font-mono text-[10px] text-rose-500 flex-shrink-0">{{ err.error }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2.5">
          <button
            v-if="!isSyncing && !result"
            @click="closeModal"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            v-if="!isSyncing && !result"
            @click="startSync"
            class="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow hover:shadow-md transition-all flex items-center space-x-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Запустить обновление</span>
          </button>

          <button
            v-if="result"
            @click="finishSync"
            class="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg shadow transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useAuthFetch } from "~/composables/useAuthFetch";

interface SyncStep {
  id: number;
  title: string;
  status: "pending" | "active" | "completed";
}

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "synced"): void;
}>();

const { authFetch } = useAuthFetch();

const isSyncing = ref(false);
const progressPercentage = ref(0);
const currentStatusText = ref("Инициализация соединения...");
const result = ref<any>(null);

const steps = reactive<SyncStep[]>([
  { id: 1, title: "1. Подключение к БД / API Course Planner", status: "pending" },
  { id: 2, title: "2. Сопоставление организаций по ИНН", status: "pending" },
  { id: 3, title: "3. Обновление слушателей, фото и языков (UZ/EN/RU)", status: "pending" },
]);

function closeModal() {
  if (isSyncing.value) return;
  resetState();
  emit("close");
}

function finishSync() {
  const hasChanges = result.value?.success;
  resetState();
  emit("close");
  if (hasChanges) {
    emit("synced");
  }
}

function resetState() {
  isSyncing.value = false;
  progressPercentage.value = 0;
  result.value = null;
  steps.forEach((s) => (s.status = "pending"));
}

async function startSync() {
  isSyncing.value = true;
  result.value = null;
  progressPercentage.value = 5;

  // Step 1: Connecting
  if (steps[0]) steps[0].status = "active";
  currentStatusText.value = "Подключение к базам данных...";
  await new Promise((r) => setTimeout(r, 400));

  progressPercentage.value = 25;
  if (steps[0]) steps[0].status = "completed";
  if (steps[1]) steps[1].status = "active";
  currentStatusText.value = "Сопоставление организаций по ИНН...";
  await new Promise((r) => setTimeout(r, 400));

  // Step 2 -> 3: Syncing
  progressPercentage.value = 55;
  if (steps[1]) steps[1].status = "completed";
  if (steps[2]) steps[2].status = "active";
  currentStatusText.value = "Запись слушателей и фотографий...";

  try {
    const res: any = await authFetch("/api/students/sync-planner", {
      method: "POST",
    });

    progressPercentage.value = 100;
    if (steps[2]) steps[2].status = "completed";
    currentStatusText.value = "Синхронизация завершена!";
    await new Promise((r) => setTimeout(r, 300));

    result.value = res;
  } catch (err: any) {
    result.value = {
      success: false,
      error: err.data?.message || err.message || "Не удалось выполнить синхронизацию",
    };
  } finally {
    isSyncing.value = false;
  }
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spinSlow 8s linear infinite;
}
</style>
