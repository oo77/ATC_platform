<template>
  <UiModal
    :is-open="isOpen"
    title="Скачать расписание в Excel"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Пояснение -->
      <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
          Расписание занятий и экзаменов на неделю
        </p>
        <p class="mt-1 text-xs text-blue-600 dark:text-blue-300">
          Форма для утверждения: дни недели × академические часы, колонки —
          аудитории. Ячейки групп залиты цветом группы, как в календаре.
        </p>
      </div>

      <!-- Выбор недели -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Неделя
        </label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="p-3 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
            title="Предыдущая неделя"
            @click="shiftWeek(-1)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <input
            v-model="date"
            type="date"
            class="flex-1 rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
          <button
            type="button"
            class="p-3 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
            title="Следующая неделя"
            @click="shiftWeek(1)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <p
          v-if="weekLabel"
          class="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          Период отчёта:
          <span class="font-semibold text-black dark:text-white">{{
            weekLabel
          }}</span>
          <button
            type="button"
            class="ml-2 text-primary hover:underline text-xs"
            @click="setToday"
          >
            текущая неделя
          </button>
        </p>
      </div>

      <!-- Утверждающий -->
      <div class="space-y-3">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Блок «УТВЕРЖДАЮ»
        </p>
        <input
          v-model="approverPosition"
          type="text"
          maxlength="200"
          placeholder="Должность"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
        <input
          v-model="approverName"
          type="text"
          maxlength="100"
          placeholder="Фамилия И.О."
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button
          type="button"
          :disabled="!isValidDate || exporting"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          @click="download"
        >
          <svg
            v-if="exporting"
            class="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {{ exporting ? "Формирование..." : "Скачать Excel" }}
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { formatDateOnly } from "~/utils/dateTime";

interface Props {
  isOpen: boolean;
  /** Дата, которая сейчас открыта в календаре — неделя выбирается по ней */
  initialDate?: Date | null;
}

const props = withDefaults(defineProps<Props>(), { initialDate: null });

const emit = defineEmits<{
  close: [];
  exported: [filename: string];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const STORAGE_KEY = "schedule-export-approver";
const DEFAULT_POSITION = "Директор ООО «Airports Training Center»";
const DEFAULT_NAME = "Мусаев О.М.";

const date = ref("");
const approverPosition = ref(DEFAULT_POSITION);
const approverName = ref(DEFAULT_NAME);
const exporting = ref(false);

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/** YYYY-MM-DD → локальная дата (без сдвига часового пояса) */
const parseYmd = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const isValidDate = computed(() => parseYmd(date.value) !== null);

/** Понедельник и воскресенье выбранной недели */
const week = computed(() => {
  const d = parseYmd(date.value);
  if (!d) return null;
  const offset = (d.getDay() + 6) % 7;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
});

const weekLabel = computed(() => {
  if (!week.value) return "";
  const { start, end } = week.value;
  const sm = MONTHS_GENITIVE[start.getMonth()];
  const em = MONTHS_GENITIVE[end.getMonth()];
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.getDate()} ${sm} ${start.getFullYear()} — ${end.getDate()} ${em} ${end.getFullYear()}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${start.getDate()} ${sm} — ${end.getDate()} ${em} ${end.getFullYear()}`;
  }
  return `${start.getDate()} — ${end.getDate()} ${em} ${end.getFullYear()}`;
});

const shiftWeek = (direction: number) => {
  const d = parseYmd(date.value) ?? new Date();
  date.value = formatDateOnly(
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + direction * 7),
  );
};

const setToday = () => {
  date.value = formatDateOnly(new Date());
};

// Подпись утверждающего запоминаем в браузере
const loadApprover = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (typeof saved.position === "string" && saved.position.trim()) {
      approverPosition.value = saved.position;
    }
    if (typeof saved.name === "string" && saved.name.trim()) {
      approverName.value = saved.name;
    }
  } catch {
    // localStorage недоступен — остаются значения по умолчанию
  }
};

const saveApprover = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        position: approverPosition.value,
        name: approverName.value,
      }),
    );
  } catch {
    // не критично
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return;
    date.value = formatDateOnly(props.initialDate ?? new Date());
    loadApprover();
  },
);

const download = async () => {
  if (!week.value) return;

  exporting.value = true;
  try {
    const params = new URLSearchParams({
      date: formatDateOnly(week.value.start),
      approverPosition: approverPosition.value.trim(),
      approverName: approverName.value.trim(),
    });

    const blob = await authFetch<Blob>(
      `/api/schedule/export?${params.toString()}`,
      { responseType: "blob" },
    );

    const filename = `Расписание_занятий_и_экзаменов_${formatDateOnly(
      week.value.start,
    )}_${formatDateOnly(week.value.end)}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    saveApprover();
    notification.show({
      type: "success",
      title: "Файл сформирован",
      message: `Расписание на ${weekLabel.value} скачано`,
    });
    emit("exported", filename);
    emit("close");
  } catch (error: any) {
    console.error("Error exporting schedule:", error);
    const forbidden = error?.statusCode === 403 || error?.status === 403;
    notification.show({
      type: "error",
      title: "Ошибка",
      message: forbidden
        ? "Недостаточно прав для выгрузки расписания"
        : "Не удалось сформировать Excel-файл расписания",
    });
  } finally {
    exporting.value = false;
  }
};
</script>
