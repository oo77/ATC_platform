<template>
  <div class="space-y-5">
    <!-- Месяц, фильтр и выгрузка -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            title="Предыдущий месяц"
            @click="shiftMonth(-1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="min-w-[9.5rem] px-2 text-center text-sm font-bold text-slate-900 dark:text-white">
            {{ monthLabel }}
          </span>
          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            title="Следующий месяц"
            @click="shiftMonth(1)"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
        <button
          v-if="month !== thisMonth"
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
          @click="setMonth(thisMonth)"
        >
          Текущий месяц
        </button>

        <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <input
            v-model="onlyConducted"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-800"
          />
          Только проведённые занятия
        </label>
      </div>

      <UiButton
        variant="success"
        size="sm"
        class-name="font-bold"
        :loading="exporting"
        :disabled="!data || !data.instructors.length"
        @click="downloadExcel"
      >
        <template #iconLeft><FileSpreadsheet class="h-4 w-4" /></template>
        Скачать Excel
      </UiButton>
    </div>

    <!-- Загрузка -->
    <div v-if="loading && !data" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-[108px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
        ></div>
      </div>
      <div class="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 py-10 text-center"
    >
      <AlertCircle class="h-8 w-8 text-danger" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ error }}</p>
      <UiButton variant="outline" size="sm" @click="load">Повторить</UiButton>
    </div>

    <template v-else-if="data">
      <!-- Ключевые показатели -->
      <div
        class="grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-4"
        :class="{ 'opacity-60': loading }"
      >
        <div
          v-for="tile in tiles"
          :key="tile.label"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              :class="tile.iconClass"
            >
              <component :is="tile.icon" class="h-4 w-4" />
            </div>
            <p class="text-[11px] font-bold uppercase leading-tight tracking-wider text-slate-500 dark:text-slate-400">
              {{ tile.label }}
            </p>
          </div>
          <p class="mt-3 text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
            {{ tile.value }}
          </p>
          <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ tile.hint }}</p>
        </div>
      </div>

      <div
        v-if="data.summary.unassignedEvents"
        class="flex items-center gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-2.5 text-sm font-medium text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500"
      >
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {{ data.summary.unassignedEvents }}
        {{ plural(data.summary.unassignedEvents, ['занятие', 'занятия', 'занятий']) }}
        в этом месяце без инструктора — в отчёт не вошли
      </div>

      <!-- Пусто -->
      <div
        v-if="!data.instructors.length"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <CalendarX class="h-6 w-6 text-slate-400" />
        </div>
        <p class="font-bold text-slate-900 dark:text-white">Занятий не было</p>
        <p class="mt-1 text-sm text-slate-500">
          {{ onlyConducted ? 'В этом месяце пока нет проведённых занятий' : 'На этот месяц в расписании нет занятий с инструкторами' }}
        </p>
      </div>

      <!-- Инструкторы -->
      <div
        v-else
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"
        >
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserSquare2 class="h-4 w-4" />
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">Инструкторы</h4>
            <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {{ data.instructors.length }}
            </span>
          </div>
          <div class="flex w-full items-center gap-2 sm:w-auto">
            <div class="relative flex-1 sm:w-72 sm:flex-none">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="query"
                type="search"
                placeholder="Поиск: ФИО, группа, программа"
                class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <select
              v-model="sortBy"
              class="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Сортировка"
            >
              <option value="hours">По часам</option>
              <option value="name">По ФИО</option>
            </select>
          </div>
        </div>

        <div
          v-if="!view.length"
          class="px-5 py-10 text-center text-sm font-medium text-slate-500"
        >
          Ничего не найдено по запросу «{{ query.trim() }}»
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800" :class="{ 'opacity-60': loading }">
          <div v-for="vi in view" :key="vi.instructor.id">
            <!-- Строка инструктора -->
            <button
              type="button"
              class="grid w-full grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto] dark:hover:bg-slate-800/40"
              :aria-expanded="isOpen(vi)"
              @click="toggle(vi)"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    :to="`/instructors/${vi.instructor.id}`"
                    class="text-sm font-bold text-slate-900 hover:text-primary dark:text-white"
                    @click.stop
                  >
                    {{ vi.instructor.fullName }}
                  </NuxtLink>
                  <span
                    v-if="!vi.instructor.isActive"
                    class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800"
                  >
                    неактивен
                  </span>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    v-for="g in vi.instructor.groups"
                    :key="g.id ?? 'none'"
                    class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    :title="g.courseName ?? ''"
                  >
                    {{ g.code }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-6">
                <div class="text-right">
                  <p class="text-xl font-black tabular-nums leading-none text-slate-900 dark:text-white">
                    {{ vi.instructor.days }}
                  </p>
                  <p class="mt-1 text-[11px] font-semibold text-slate-500">
                    {{ plural(vi.instructor.days, ['день', 'дня', 'дней']) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xl font-black tabular-nums leading-none text-slate-900 dark:text-white">
                    {{ vi.instructor.events }}
                  </p>
                  <p class="mt-1 text-[11px] font-semibold text-slate-500">
                    {{ plural(vi.instructor.events, ['занятие', 'занятия', 'занятий']) }}
                  </p>
                </div>
                <div class="min-w-[7.5rem] text-right">
                  <p class="text-xl font-black tabular-nums leading-none text-primary">
                    {{ fmtHours(vi.instructor.hours.total) }}
                  </p>
                  <p class="mt-1 whitespace-nowrap text-[11px] font-semibold text-slate-500" :title="hoursTitle(vi.instructor.hours)">
                    ак. ч · {{ hoursShort(vi.instructor.hours) }}
                  </p>
                </div>
                <ChevronDown
                  class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180': isOpen(vi) }"
                />
              </div>
            </button>

            <!-- Группы инструктора -->
            <div v-if="isOpen(vi)" class="px-5 pb-5">
              <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table class="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr class="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                      <th class="px-4 py-2.5">Группа</th>
                      <th class="px-4 py-2.5">Программа</th>
                      <th class="px-4 py-2.5">Занятия в месяце</th>
                      <th class="px-4 py-2.5 text-right">Дней</th>
                      <th class="px-4 py-2.5 text-right">Занятий</th>
                      <th class="px-4 py-2.5 text-right" title="Теория / практика / проверка знаний / прочее">Т / П / ПЗ / Пр</th>
                      <th class="px-4 py-2.5 text-right">Ак. ч</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr v-for="g in vi.groups" :key="g.id ?? 'none'">
                      <td class="whitespace-nowrap px-4 py-3 font-mono text-sm font-bold">
                        <NuxtLink
                          v-if="g.id"
                          :to="`/groups/${g.id}`"
                          class="text-slate-900 hover:text-primary dark:text-white"
                        >
                          {{ g.code }}
                        </NuxtLink>
                        <span v-else class="text-slate-500">{{ g.code }}</span>
                      </td>
                      <td class="min-w-[18rem] px-4 py-3 text-slate-700 dark:text-slate-300">
                        {{ g.courseName || '—' }}
                      </td>
                      <td class="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                        {{ formatRange(g.firstDay, g.lastDay) }}
                      </td>
                      <td class="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{{ g.days }}</td>
                      <td class="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{{ g.events }}</td>
                      <td class="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums text-slate-500">
                        {{ fmtHours(g.hours.theory) }} / {{ fmtHours(g.hours.practice) }} /
                        {{ fmtHours(g.hours.assessment) }} / {{ fmtHours(g.hours.other) }}
                      </td>
                      <td class="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        {{ fmtHours(g.hours.total) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  AlertCircle, AlertTriangle, BookOpen, CalendarDays, CalendarX, ChevronDown, ChevronLeft,
  ChevronRight, Clock, FileSpreadsheet, Search, UserSquare2, Users,
} from "lucide-vue-next";
import type {
  InstructorMonthlyLoad,
  LoadGroup,
  LoadHours,
  LoadInstructor,
} from "~/../server/types/instructorMonthlyLoad";

const { authFetch } = useAuthFetch();
const notification = useNotification();

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const pad2 = (n: number) => String(n).padStart(2, "0");
const toMonth = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

const thisMonth = toMonth(new Date());
const month = ref(thisMonth);
const onlyConducted = ref(false);
const data = ref<InstructorMonthlyLoad | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const exporting = ref(false);
const query = ref("");
const sortBy = ref<"hours" | "name">("hours");

const monthLabel = computed(() => {
  const [y, m] = month.value.split("-").map(Number) as [number, number];
  return `${MONTH_NAMES[m - 1]} ${y}`;
});

const setMonth = (value: string) => {
  month.value = value;
};

const shiftMonth = (step: number) => {
  const [y, m] = month.value.split("-").map(Number) as [number, number];
  setMonth(toMonth(new Date(y, m - 1 + step, 1)));
};

const params = () =>
  `?month=${month.value}${onlyConducted.value ? "&conducted=1" : ""}`;

// ---------------------------------------------------------------- загрузка

let requestId = 0;
const load = async () => {
  const id = ++requestId;
  loading.value = true;
  error.value = null;
  try {
    const res = await authFetch<{ success: boolean; data: InstructorMonthlyLoad }>(
      `/api/instructors/monthly-load${params()}`,
    );
    // Пока ответ шёл, могли переключить месяц — показываем только последний
    if (id === requestId) data.value = res.data;
  } catch (err) {
    if (id !== requestId) return;
    console.error("Ошибка загрузки нагрузки инструкторов:", err);
    error.value = "Не удалось загрузить нагрузку инструкторов";
  } finally {
    if (id === requestId) loading.value = false;
  }
};

watch([month, onlyConducted], load, { immediate: true });

const downloadExcel = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const blob = await authFetch<Blob>(`/api/instructors/monthly-load-export${params()}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Нагрузка инструкторов ${monthLabel.value}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Ошибка выгрузки нагрузки инструкторов:", err);
    notification.error("Не удалось сформировать Excel-отчёт");
  } finally {
    exporting.value = false;
  }
};

// ---------------------------------------------------------------- показатели

const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

/** 36 → «36», 36.5 → «36,5» */
const fmtHours = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });

const hoursShort = (h: LoadHours) => {
  const parts = [
    h.theory && `Т ${fmtHours(h.theory)}`,
    h.practice && `П ${fmtHours(h.practice)}`,
    h.assessment && `ПЗ ${fmtHours(h.assessment)}`,
    h.other && `Пр ${fmtHours(h.other)}`,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
};

const hoursTitle = (h: LoadHours) =>
  `Теория: ${fmtHours(h.theory)}, практика: ${fmtHours(h.practice)}, проверка знаний: ${fmtHours(h.assessment)}, прочее: ${fmtHours(h.other)}`;

const tiles = computed(() => {
  const s = data.value?.summary;
  if (!s) return [];
  return [
    {
      label: "Вели занятия",
      value: s.instructors,
      hint: plural(s.instructors, ["инструктор", "инструктора", "инструкторов"]),
      icon: Users,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Академических часов",
      value: fmtHours(s.hours.total),
      hint: hoursShort(s.hours),
      icon: Clock,
      iconClass: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
    },
    {
      label: "Занятий",
      value: s.events,
      hint: onlyConducted.value ? "проведено" : "по расписанию",
      icon: CalendarDays,
      iconClass: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
    },
    {
      label: "Групп",
      value: s.groups,
      hint: `по ${s.programs} ${plural(s.programs, ["программе", "программам", "программам"])}`,
      icon: BookOpen,
      iconClass: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-500",
    },
  ];
});

// ---------------------------------------------------------------- поиск и раскрытие

interface ViewInstructor {
  instructor: LoadInstructor;
  groups: LoadGroup[];
  autoOpen: boolean;
}

const q = computed(() => query.value.trim().toLowerCase());
const has = (value: string | null | undefined) => !!value && value.toLowerCase().includes(q.value);

const view = computed<ViewInstructor[]>(() => {
  const list = [...(data.value?.instructors ?? [])];
  if (sortBy.value === "name") {
    list.sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
  }
  if (!q.value) {
    return list.map((instructor) => ({ instructor, groups: instructor.groups, autoOpen: false }));
  }
  const result: ViewInstructor[] = [];
  for (const instructor of list) {
    if (has(instructor.fullName)) {
      result.push({ instructor, groups: instructor.groups, autoOpen: false });
      continue;
    }
    const groups = instructor.groups.filter((g) => has(g.code) || has(g.courseName));
    if (groups.length) result.push({ instructor, groups, autoOpen: true });
  }
  return result;
});

/** Ручное раскрытие поверх автоматического (по поиску) */
const opened = ref<Record<string, boolean>>({});
watch([q, () => data.value], () => {
  opened.value = {};
});

const isOpen = (vi: ViewInstructor) => opened.value[vi.instructor.id] ?? vi.autoOpen;
const toggle = (vi: ViewInstructor) => {
  opened.value[vi.instructor.id] = !isOpen(vi);
};

// ---------------------------------------------------------------- форматирование

const dmy = (ymd: string) => {
  const [, m, d] = ymd.split("-");
  return `${d}.${m}`;
};

/** «05.10 – 24.10», «05.10» */
const formatRange = (from: string, to: string) =>
  from === to ? dmy(from) : `${dmy(from)} – ${dmy(to)}`;
</script>
