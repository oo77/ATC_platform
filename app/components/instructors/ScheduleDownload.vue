<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
  >
    <div class="mb-4">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        Расписание по группам
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        Выберите группу — скачается Excel с днями, в которые инструктор ведёт в ней занятия.
      </p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-8">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
      ></div>
    </div>

    <div v-else-if="error" class="text-center py-6">
      <p class="text-danger mb-3">{{ error }}</p>
      <button @click="load" class="text-sm text-primary hover:underline">
        Попробовать снова
      </button>
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-8 text-sm text-gray-500">
      У инструктора пока нет занятий в группах
    </div>

    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <button
        v-for="group in groups"
        :key="group.id"
        type="button"
        :disabled="downloadingId === group.id"
        class="group flex w-full items-center justify-between gap-4 px-2 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 disabled:opacity-60"
        @click="download(group)"
      >
        <div class="min-w-0">
          <p class="font-medium text-black dark:text-white">
            {{ group.code }}
            <span
              v-if="group.isArchived"
              class="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-gray-800"
              >Архив</span
            >
          </p>
          <p class="text-xs text-gray-500 truncate" :title="group.courseName">
            {{ group.courseName }}
          </p>
          <p class="mt-0.5 text-xs text-gray-500">
            {{ formatRange(group.firstDay, group.lastDay) }} ·
            {{ group.daysCount }} {{ pluralDays(group.daysCount) }} ·
            {{ group.eventsCount }} зан.
          </p>
        </div>
        <span class="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
          <div
            v-if="downloadingId === group.id"
            class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"
          ></div>
          <DownloadIcon v-else class="h-4 w-4" />
          Excel
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Download as DownloadIcon } from "lucide-vue-next";

const props = defineProps<{
  instructorId: string;
  initialLoad?: boolean;
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

interface ScheduleGroup {
  id: string;
  code: string;
  courseName: string;
  isArchived: boolean;
  eventsCount: number;
  daysCount: number;
  firstDay: string;
  lastDay: string;
}

const groups = ref<ScheduleGroup[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const downloadingId = ref<string | null>(null);

const load = async () => {
  if (!props.instructorId) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await authFetch<{ success: boolean; groups: ScheduleGroup[] }>(
      `/api/instructors/${props.instructorId}/schedule-groups`,
    );
    if (res.success) groups.value = res.groups;
  } catch (err) {
    console.error("Error loading schedule groups:", err);
    error.value = "Не удалось загрузить список групп";
  } finally {
    loading.value = false;
  }
};

const download = async (group: ScheduleGroup) => {
  if (downloadingId.value) return;
  downloadingId.value = group.id;
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];
    if (!token) {
      notification.error("Ошибка авторизации");
      return;
    }

    const response = await fetch(
      `/api/instructors/${props.instructorId}/schedule-export?groupId=${encodeURIComponent(group.id)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group.code} ${formatRange(group.firstDay, group.lastDay)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading schedule:", err);
    notification.error("Не удалось скачать расписание");
  } finally {
    downloadingId.value = null;
  }
};

const dmy = (ymd: string) => {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
};

const formatRange = (from: string, to: string) =>
  from === to ? dmy(from) : `${dmy(from)}–${dmy(to)}`;

const pluralDays = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
};

onMounted(() => {
  if (props.initialLoad && props.instructorId) load();
});

defineExpose({
  load,
  hasData: computed(() => groups.value.length > 0),
});
</script>
