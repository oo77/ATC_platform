<template>
  <UiModal
    :is-open="isOpen"
    title="Группа из Course Planner"
    size="lg"
    @close="$emit('close')"
  >
    <!-- Шаг 1: список групп планера -->
    <div v-if="!selected" class="space-y-3">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Поиск по названию группы, курсу или коду…"
          class="w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700"
        />
      </div>

      <div v-if="loadingList" class="flex items-center justify-center py-10 text-sm text-gray-500">
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Загрузка групп из Course Planner…
      </div>
      <div
        v-else-if="listError"
        class="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500"
      >
        {{ listError }}
      </div>
      <div v-else-if="groups.length === 0" class="py-10 text-center text-sm text-gray-500">
        Группы не найдены
      </div>
      <ul v-else class="max-h-[420px] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        <li v-for="g in groups" :key="g.id">
          <button
            type="button"
            class="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
            :disabled="!!g.linkedGroup"
            @click="selectGroup(g)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ g.name }}</p>
              <p class="truncate text-xs text-gray-500">
                <span v-if="g.course">{{ g.course.code ? `${g.course.code} · ` : "" }}{{ g.course.name }}</span>
                <span v-else>Курс не указан</span>
              </p>
              <p class="mt-0.5 text-xs text-gray-400">
                {{ formatRange(g.startDate, g.endDate) }}
                <span v-if="g.location"> · {{ g.location }}</span>
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <UiBadge size="sm" color="light">{{ g.studentCount }} чел.</UiBadge>
              <UiBadge v-if="g.linkedGroup" size="sm" color="warning">Связана: {{ g.linkedGroup.code }}</UiBadge>
              <UiBadge v-else size="sm" :color="statusColor(g.status)">{{ statusLabel(g.status) }}</UiBadge>
            </div>
          </button>
        </li>
      </ul>
      <div v-if="totalPages > 1" class="flex items-center justify-between text-xs text-gray-500">
        <span>Страница {{ page }} из {{ totalPages }}</span>
        <div class="flex gap-2">
          <UiButton size="xs" variant="outline" :disabled="page <= 1" @click="page--">Назад</UiButton>
          <UiButton size="xs" variant="outline" :disabled="page >= totalPages" @click="page++">Вперёд</UiButton>
        </div>
      </div>
    </div>

    <!-- Шаг 2: предпросмотр выбранной группы -->
    <div v-else class="space-y-4">
      <button type="button" class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" @click="resetSelection">
        <ArrowLeft class="h-3.5 w-3.5" /> К списку групп
      </button>

      <div v-if="loadingPreview" class="flex items-center justify-center py-10 text-sm text-gray-500">
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Сопоставление с данными ATC…
      </div>
      <div
        v-else-if="previewError"
        class="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500"
      >
        {{ previewError }}
      </div>

      <template v-else-if="preview">
        <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <p class="text-base font-semibold text-gray-900 dark:text-white">{{ preview.plannerGroup.name }}</p>
          <dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-xs text-gray-500">Курс в планере</dt>
              <dd>{{ preview.plannerGroup.course?.name || "—" }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500">Программа в ATC</dt>
              <dd v-if="preview.course" class="text-success-600">
                {{ preview.course.name }}
                <span class="text-xs text-gray-400">(по {{ preview.course.matchedBy === "code" ? "коду" : "названию" }})</span>
              </dd>
              <dd v-else class="text-warning-600">Не найдена — выберите вручную</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500">Даты</dt>
              <dd>{{ formatRange(preview.startDate, preview.endDate) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500">Место</dt>
              <dd>{{ preview.classroom || "—" }}</dd>
            </div>
          </dl>
        </div>

        <div
          v-if="preview.linkedGroup"
          class="rounded-lg bg-warning-50 p-3 text-sm text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
        >
          Эта группа уже связана с группой ATC {{ preview.linkedGroup.code }}.
        </div>

        <div>
          <div class="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold text-gray-900 dark:text-white">Слушатели: {{ preview.students.length }}</span>
            <UiBadge size="sm" color="success">в ATC: {{ counts.existing }}</UiBadge>
            <UiBadge v-if="counts.new" size="sm" color="info">будут созданы: {{ counts.new }}</UiBadge>
            <UiBadge v-if="counts.invalid" size="sm" color="error">ошибка ПИНФЛ: {{ counts.invalid }}</UiBadge>
          </div>
          <ul class="max-h-[220px] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            <li v-for="s in preview.students" :key="s.pinfl" class="flex items-center justify-between gap-3 px-3 py-2">
              <div class="min-w-0">
                <p class="truncate">{{ s.name }}</p>
                <p class="truncate text-xs text-gray-400">{{ s.pinfl }}<span v-if="s.organization"> · {{ s.organization }}</span></p>
              </div>
              <UiBadge size="sm" :color="s.status === 'existing' ? 'success' : s.status === 'new' ? 'info' : 'error'">
                {{ s.status === "existing" ? "в ATC" : s.status === "new" ? "новый" : "ошибка" }}
              </UiBadge>
            </li>
            <li v-if="preview.students.length === 0" class="px-3 py-4 text-center text-gray-400">
              В группе планера нет поимённого списка (возможно, только брони мест) — слушателей можно добавить позже синхронизацией
            </li>
          </ul>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="$emit('close')">Отмена</UiButton>
        <UiButton
          v-if="selected"
          :loading="applying"
          :disabled="!preview || !!preview.linkedGroup || loadingPreview"
          @click="apply"
        >
          Заполнить форму
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Search, Loader2, ArrowLeft } from "lucide-vue-next";

export interface PlannerGroupListItem {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  studentCount: number;
  course: { name: string; code: string | null } | null;
  linkedGroup: { id: string; code: string } | null;
}

export interface PlannerGroupPreview {
  plannerGroup: { id: string; name: string; course: { name: string; code: string | null } | null };
  course: { id: string; name: string; code: string; matchedBy: "code" | "name" } | null;
  startDate: string | null;
  endDate: string | null;
  classroom: string | null;
  students: Array<{ pinfl: string; name: string; organization: string | null; status: "existing" | "new" | "invalid"; studentId: string | null }>;
  linkedGroup: { id: string; code: string } | null;
}

export interface PlannerGroupApplied {
  preview: PlannerGroupPreview;
  studentIds: string[];
  created: number;
  errors: Array<{ pinfl: string; name: string; error: string }>;
}

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: []; apply: [data: PlannerGroupApplied] }>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

const search = ref("");
const page = ref(1);
const totalPages = ref(1);
const groups = ref<PlannerGroupListItem[]>([]);
const loadingList = ref(false);
const listError = ref("");

const selected = ref<PlannerGroupListItem | null>(null);
const preview = ref<PlannerGroupPreview | null>(null);
const loadingPreview = ref(false);
const previewError = ref("");
const applying = ref(false);

const counts = computed(() => {
  const c = { existing: 0, new: 0, invalid: 0 };
  for (const s of preview.value?.students || []) c[s.status]++;
  return c;
});

const errorMessage = (e: any, fallback: string) => e?.data?.message || e?.message || fallback;

const loadGroups = async () => {
  loadingList.value = true;
  listError.value = "";
  try {
    const res = await authFetch<{ success: boolean; groups: PlannerGroupListItem[]; totalPages: number }>(
      "/api/course-planner/groups",
      { params: { search: search.value || undefined, page: page.value, limit: 30 } },
    );
    groups.value = res.groups || [];
    totalPages.value = res.totalPages || 1;
  } catch (e: any) {
    listError.value = errorMessage(e, "Не удалось загрузить группы из Course Planner");
    groups.value = [];
  } finally {
    loadingList.value = false;
  }
};

const selectGroup = async (g: PlannerGroupListItem) => {
  selected.value = g;
  preview.value = null;
  previewError.value = "";
  loadingPreview.value = true;
  try {
    const res = await authFetch<{ success: boolean; preview: PlannerGroupPreview }>(
      `/api/course-planner/groups/${encodeURIComponent(g.id)}/preview`,
    );
    preview.value = res.preview;
  } catch (e: any) {
    previewError.value = errorMessage(e, "Не удалось получить группу из Course Planner");
  } finally {
    loadingPreview.value = false;
  }
};

const resetSelection = () => {
  selected.value = null;
  preview.value = null;
  previewError.value = "";
};

const apply = async () => {
  if (!preview.value || !selected.value) return;
  applying.value = true;
  try {
    const res = await authFetch<{
      success: boolean;
      studentIds: string[];
      created: number;
      errors: PlannerGroupApplied["errors"];
    }>(`/api/course-planner/groups/${encodeURIComponent(selected.value.id)}/import-students`, { method: "POST" });
    emit("apply", {
      preview: preview.value,
      studentIds: res.studentIds || [],
      created: res.created || 0,
      errors: res.errors || [],
    });
  } catch (e: any) {
    toast.error(errorMessage(e, "Не удалось подготовить слушателей"));
  } finally {
    applying.value = false;
  }
};

const formatDate = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("ru-RU") : "—");
const formatRange = (a: string | null, b: string | null) => (a || b ? `${formatDate(a)} — ${formatDate(b)}` : "Даты не указаны");

const statusLabel = (s: string) =>
  ({ Planning: "Планирование", Confirmed: "Подтверждена", "In Progress": "Идёт", Finished: "Завершена", Cancelled: "Отменена" } as Record<string, string>)[s] || s;
const statusColor = (s: string) =>
  (({ Planning: "light", Confirmed: "primary", "In Progress": "success", Finished: "dark", Cancelled: "error" } as const) as Record<string, any>)[s] || "light";

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    loadGroups();
  }, 300);
});
watch(page, () => loadGroups());
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetSelection();
      search.value = "";
      page.value = 1;
      loadGroups();
    }
  },
);
</script>
