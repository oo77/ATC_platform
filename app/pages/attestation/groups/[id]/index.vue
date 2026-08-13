<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка информации о группе...
        </p>
      </div>
    </div>

    <!-- Группа не найдена -->
    <div v-else-if="!group" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6">
          <ShieldCheck class="w-12 h-12 text-slate-400" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">Группа не найдена</h3>
        <p class="mt-2 text-slate-500 dark:text-gray-400">
          Возможно, группа была удалена или вы используете неверную ссылку.
        </p>
        <UiButton class="mt-8 shadow-lg" @click="navigateTo('/attestation')">
          Вернуться к списку групп
        </UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div class="mb-6">
          <NuxtLink
            to="/attestation"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            Назад к списку групп
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <!-- Left: Title & Info -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {{ group.code }}
              </h1>
              <div
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                :class="statusClass"
              >
                {{ statusText }}
              </div>
            </div>

            <p class="text-lg font-bold text-slate-700 dark:text-slate-300">{{ group.name }}</p>

            <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div
                v-if="group.examStart"
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                <CalendarIcon class="w-4 h-4 text-slate-400" />
                {{ formatDateTime(group.examStart) }} — {{ formatDateTime(group.examEnd) }}
              </div>
              <div
                v-if="group.location"
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                <MapPin class="w-4 h-4 text-slate-400" />
                {{ group.location }}
              </div>
            </div>
          </div>

          <!-- Right: Action Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="navigateTo(`/attestation/groups/${groupId}/edit`)"
            >
              <Settings class="w-4 h-4" />
              Редактировать
            </UiButton>

            <UiButton
              variant="primary"
              size="sm"
              class="h-10 px-4 gap-2 font-bold shadow-sm"
              :loading="generatingProtocol"
              @click="generateProtocol"
            >
              <FileText class="w-4 h-4" />
              {{ group.protocolFileId ? "Обновить протокол" : "Сформировать протокол" }}
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Инструкторов</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ instructors.length }}
              </h3>
            </div>
            <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
              <Users class="w-6 h-6" />
            </div>
          </div>
          <p class="mt-4 text-xs text-slate-400 font-medium">Включены в группу аттестации</p>
        </div>

        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Комиссия</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ commission.length }}
              </h3>
            </div>
            <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
              <Gavel class="w-6 h-6" />
            </div>
          </div>
          <p class="mt-4 text-xs text-slate-400 font-medium">
            {{ chairman ? `Председатель: ${chairman.fullName}` : "Председатель не назначен" }}
          </p>
        </div>

        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Сдали</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ passedCount }} / {{ results.length }}
              </h3>
            </div>
            <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
              <CheckCircle2 class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-full rounded-full bg-success transition-all duration-500"
                :style="{ width: `${passedPercent}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Тест</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                {{ group.templateName || "Не назначен" }}
              </h3>
            </div>
            <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
              <FileCheck class="w-6 h-6" />
            </div>
          </div>
          <p class="mt-4 text-xs text-slate-400 font-medium whitespace-nowrap">
            Проходной балл: {{ group.passingScore ?? "—" }}%
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
        <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="space-y-6">
        <!-- OVERVIEW -->
        <div
          v-show="activeTab === 'overview'"
          class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="lg:col-span-2 space-y-6">
            <div
              class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutDashboard class="w-5 h-5 text-primary" />
                  Информация о группе
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Код группы</label>
                    <p class="text-lg font-bold text-slate-900 dark:text-white">{{ group.code }}</p>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Статус</label>
                    <div>
                      <span :class="['inline-flex items-center rounded-full px-3 py-1 text-sm font-bold', statusClass]">
                        {{ statusText }}
                      </span>
                    </div>
                  </div>
                  <div class="space-y-1" v-if="group.examStart">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Дата экзамена</label>
                    <p class="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                      {{ formatDateTime(group.examStart) }}
                      <ChevronRight class="w-4 h-4 text-slate-300" />
                      {{ formatDateTime(group.examEnd) }}
                    </p>
                  </div>
                  <div class="space-y-1" v-if="group.location">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Место проведения</label>
                    <p class="text-slate-900 dark:text-white font-semibold">{{ group.location }}</p>
                  </div>
                  <div
                    v-if="group.description"
                    class="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Описание</label>
                    <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{{ group.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Commission summary -->
          <div class="space-y-6">
            <div
              class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div class="border-b border-slate-100 dark:border-slate-800 p-6">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gavel class="w-5 h-5 text-info" />
                  Комиссия
                </h3>
              </div>
              <div class="p-4">
                <div
                  v-if="commission.length === 0"
                  class="p-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium"
                >
                  Комиссия ещё не назначена
                </div>
                <div v-else class="space-y-1">
                  <div
                    v-for="c in commission"
                    :key="c.id"
                    class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div
                      class="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-info/20 to-info/5 text-info flex items-center justify-center font-bold text-xs border border-info/10"
                    >
                      {{ getInitials(c.fullName) }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-900 dark:text-white text-sm truncate">{{ c.fullName }}</p>
                      <p class="text-xs text-slate-500 font-medium truncate">{{ roleLabel(c.role) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INSTRUCTORS -->
        <div v-show="activeTab === 'instructors'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            <div v-if="instructors.length === 0" class="p-16 text-center">
              <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full inline-block mb-4">
                <Users class="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p class="text-slate-500 font-medium">В этой группе пока нет инструкторов</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50 dark:bg-slate-800/50">
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Инструктор</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Должность</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Результат</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-for="ins in instructors"
                    :key="ins.id"
                    class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="h-9 w-9 rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10"
                        >
                          {{ getInitials(ins.fullName) }}
                        </div>
                        <p class="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                          {{ ins.fullName }}
                        </p>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {{ ins.positionSnapshot || "—" }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span
                        :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', decisionBadgeClass(resultFor(ins.instructorId)?.decision)]"
                      >
                        {{ decisionLabel(resultFor(ins.instructorId)?.decision) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RESULTS -->
        <div v-show="activeTab === 'results'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            <div v-if="results.length === 0" class="p-16 text-center">
              <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full inline-block mb-4">
                <ClipboardList class="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p class="text-slate-500 font-medium">Результаты появятся после прохождения теста</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50 dark:bg-slate-800/50">
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Инструктор</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Балл</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Попыток</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Решение</th>
                    <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Действия</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr
                    v-for="r in results"
                    :key="r.id"
                    class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="h-9 w-9 rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10"
                        >
                          {{ getInitials(r.fullName) }}
                        </div>
                        <p class="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{{ r.fullName }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                      {{ r.scorePercent !== null ? Math.round(r.scorePercent) + "%" : "—" }}
                    </td>
                    <td class="px-6 py-4 text-center text-sm font-semibold text-slate-500">{{ r.attempts }}</td>
                    <td class="px-6 py-4">
                      <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', decisionBadgeClass(r.decision)]">
                        {{ decisionLabel(r.decision) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          class="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg text-xs font-bold text-success hover:bg-success/10 transition-all"
                          @click="decide(r, 'passed')"
                        >
                          <CheckCircle2 class="w-3.5 h-3.5" /> Сдал
                        </button>
                        <button
                          class="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg text-xs font-bold text-danger hover:bg-danger/10 transition-all"
                          @click="decide(r, 'failed')"
                        >
                          <XCircle class="w-3.5 h-3.5" /> Не сдал
                        </button>
                        <button
                          class="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-all"
                          @click="r.evaluationSheetUrl ? window.open(r.evaluationSheetUrl, '_blank') : generateEvaluationSheet(r)"
                        >
                          <FileText class="w-3.5 h-3.5" /> Лист
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Settings,
  FileText,
  Users,
  Gavel,
  CheckCircle2,
  XCircle,
  FileCheck,
  LayoutDashboard,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
} from "lucide-vue-next";

definePageMeta({ layout: "default" });

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useToast();

const groupId = route.params.id;

const loading = ref(true);
const group = ref(null);
const instructors = ref([]);
const commission = ref([]);
const results = ref([]);
const activeTab = ref("overview");
const generatingProtocol = ref(false);

const tabs = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "instructors", label: "Инструкторы", icon: Users },
  { id: "results", label: "Результаты", icon: ClipboardList },
];

const chairman = computed(() => commission.value.find((c) => c.role === "chairman") || null);
const passedCount = computed(() => results.value.filter((r) => r.decision === "passed").length);
const passedPercent = computed(() =>
  results.value.length ? Math.round((passedCount.value / results.value.length) * 100) : 0
);

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
};

const formatDateTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClass = computed(() => {
  const map = {
    draft: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    scheduled: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-warning/10 text-warning border-warning/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-danger/10 text-danger border-danger/20",
  };
  return group.value ? map[group.value.status] || map.draft : "";
});

const statusText = computed(() => {
  const map = {
    draft: "Черновик",
    scheduled: "Запланирована",
    in_progress: "Идёт экзамен",
    completed: "Завершена",
    cancelled: "Отменена",
  };
  return group.value ? map[group.value.status] || group.value.status : "";
});

const roleLabel = (role) => ({ chairman: "Председатель комиссии", secretary: "Секретарь", member: "Член комиссии" }[role] || "Член комиссии");

const decisionLabel = (d) => ({ passed: "Сдан", failed: "Не сдан" }[d] || "Ожидает");
const decisionBadgeClass = (d) => {
  if (d === "passed") return "bg-success/10 text-success";
  if (d === "failed") return "bg-danger/10 text-danger";
  return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
};

const resultFor = (instructorId) => results.value.find((r) => r.instructorId === instructorId);

const load = async () => {
  loading.value = true;
  try {
    const [groupRes, resultsRes] = await Promise.all([
      authFetch(`/api/attestation/groups/${groupId}`),
      authFetch(`/api/attestation/groups/${groupId}/results`),
    ]);
    if (groupRes.success) {
      group.value = groupRes.group;
      instructors.value = groupRes.instructors || [];
      commission.value = groupRes.commission || [];
    } else {
      toast.error(groupRes.message || "Группа не найдена");
    }
    if (resultsRes.success) results.value = resultsRes.results || [];
  } finally {
    loading.value = false;
  }
};

const decide = async (result, decision) => {
  const res = await authFetch(`/api/attestation/results/${result.id}/decide`, {
    method: "POST",
    body: { decision },
  });
  if (res.success) {
    const idx = results.value.findIndex((r) => r.id === result.id);
    if (idx >= 0) results.value[idx] = { ...results.value[idx], decision };
    toast.success("Решение сохранено");
  } else {
    toast.error(res.message || "Не удалось сохранить решение");
  }
};

const generateEvaluationSheet = async (result) => {
  const res = await authFetch(`/api/attestation/results/${result.id}/documents/evaluation-sheet`, { method: "POST" });
  if (res.success) {
    const idx = results.value.findIndex((r) => r.id === result.id);
    if (idx >= 0) results.value[idx] = { ...results.value[idx], evaluationSheetFileId: res.file.id, evaluationSheetUrl: res.file.url };
    window.open(res.file.url, "_blank");
  } else {
    toast.error(res.message || "Не удалось сформировать оценочный лист");
  }
};

const generateProtocol = async () => {
  generatingProtocol.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/documents/protocol`, { method: "POST" });
    if (res.success) {
      group.value.protocolFileId = res.file.id;
      window.open(res.file.url, "_blank");
    } else {
      toast.error(res.message || "Не удалось сформировать протокол");
    }
  } finally {
    generatingProtocol.value = false;
  }
};

onMounted(load);
</script>
