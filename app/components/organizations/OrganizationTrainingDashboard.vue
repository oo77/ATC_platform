<template>
  <div class="space-y-5">
    <!-- Период и выгрузка -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Период</span>
        <div
          v-if="years.length > 1"
          class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        >
          <button
            v-for="option in yearOptions"
            :key="option.value ?? 'all'"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
            :class="
              year === option.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            "
            @click="setYear(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <span
          v-if="data?.summary.firstDate"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          <CalendarDays class="h-4 w-4 text-slate-400" />
          {{ formatRange(data.summary.firstDate, data.summary.lastDate) }}
        </span>
      </div>

      <UiButton
        variant="success"
        size="sm"
        class-name="font-bold"
        :loading="exporting"
        :disabled="!data || !data.programs.length"
        @click="downloadExcel"
      >
        <template #iconLeft><FileSpreadsheet class="h-4 w-4" /></template>
        Скачать Excel
      </UiButton>
    </div>

    <!-- Загрузка -->
    <div v-if="loading && !data" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div
          v-for="i in 5"
          :key="i"
          class="h-[108px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
        ></div>
      </div>
      <div class="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
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
        class="grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-5"
        :class="{ 'opacity-60': loading }"
      >
        <div
          v-for="tile in tiles"
          :key="tile.label"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          :class="tile.wide ? 'col-span-2 lg:col-span-1' : ''"
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

      <!-- Нет обучения -->
      <div
        v-if="!data.programs.length"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <GraduationCap class="h-6 w-6 text-slate-400" />
        </div>
        <p class="font-bold text-slate-900 dark:text-white">Обучения пока не было</p>
        <p class="mt-1 text-sm text-slate-500">
          {{ year ? `В ${year} году сотрудники организации не учились` : 'Сотрудники организации ещё не проходили обучение' }}
        </p>
      </div>

      <template v-else>
        <!-- Итоги обучения -->
        <div
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">Итоги обучения</h4>
            <p class="text-xs font-medium text-slate-500">
              {{ data.summary.students }} {{ plural(data.summary.students, ['слушатель', 'слушателя', 'слушателей']) }}
            </p>
          </div>
          <OrganizationsTrainingStackBar :counts="data.summary" size="lg" />
          <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <div v-for="item in legend" :key="item.key" class="flex items-center gap-2 text-sm">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="item.dot"></span>
              <span class="whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">{{ item.label }}</span>
              <span class="font-bold tabular-nums text-slate-900 dark:text-white">{{ data.summary[item.key] }}</span>
              <span class="text-xs tabular-nums text-slate-400">
                {{ pct(data.summary[item.key], data.summary.students) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Программы -->
        <div
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"
          >
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen class="h-4 w-4" />
              </div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">Обучение по программам</h4>
              <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {{ data.programs.length }}
              </span>
            </div>
            <div class="flex w-full items-center gap-2 sm:w-auto">
              <div class="relative flex-1 sm:w-80 sm:flex-none">
                <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="query"
                  type="search"
                  placeholder="Поиск: программа, группа, ФИО"
                  title="Поиск по программе, коду группы, ФИО, ПИНФЛ или номеру сертификата"
                  class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
                :title="allOpen ? 'Свернуть все программы' : 'Развернуть все программы'"
                @click="toggleAll"
              >
                <component :is="allOpen ? ChevronsDownUp : ChevronsUpDown" class="h-4 w-4" />
                <span class="hidden sm:inline">{{ allOpen ? 'Свернуть всё' : 'Развернуть всё' }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="!view.length"
            class="px-5 py-10 text-center text-sm font-medium text-slate-500"
          >
            Ничего не найдено по запросу «{{ query.trim() }}»
          </div>

          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            <div v-for="vp in view" :key="vp.program.id">
              <!-- Строка программы -->
              <button
                type="button"
                class="grid w-full grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto] dark:hover:bg-slate-800/40"
                :aria-expanded="isProgramOpen(vp)"
                @click="toggleProgram(vp)"
              >
                <div class="min-w-0">
                  <div class="flex items-start gap-2">
                    <span
                      v-if="vp.program.code"
                      class="mt-px shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {{ vp.program.code }}
                    </span>
                    <p
                      class="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white"
                      :title="vp.program.name"
                    >
                      {{ vp.program.name }}
                    </p>
                  </div>
                  <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span class="inline-flex items-center gap-1.5">
                      <CalendarDays class="h-3.5 w-3.5" />
                      {{ formatRange(vp.program.firstDate, vp.program.lastDate) }}
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <Layers class="h-3.5 w-3.5" />
                      {{ vp.program.groups.length }}
                      {{ plural(vp.program.groups.length, ['группа', 'группы', 'групп']) }}
                    </span>
                    <span v-if="vp.program.hours" class="inline-flex items-center gap-1.5">
                      <Clock class="h-3.5 w-3.5" />
                      {{ vp.program.hours }} ч
                    </span>
                    <span
                      v-for="name in vp.program.certificateNames"
                      :key="name"
                      class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary"
                      title="Выданный сертификат"
                    >
                      <Award class="h-3 w-3" />
                      {{ name }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-6">
                  <div class="text-right">
                    <p class="text-xl font-black tabular-nums leading-none text-slate-900 dark:text-white">
                      {{ vp.program.counts.students }}
                    </p>
                    <p class="mt-1 text-[11px] font-semibold text-slate-500">
                      {{ plural(vp.program.counts.students, ['слушатель', 'слушателя', 'слушателей']) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-black tabular-nums leading-none text-success-600 dark:text-success-500">
                      {{ vp.program.counts.certified }}
                    </p>
                    <p class="mt-1 whitespace-nowrap text-[11px] font-semibold text-slate-500">
                      с сертификатом · {{ pct(vp.program.counts.certified, vp.program.counts.students) }}%
                    </p>
                  </div>
                  <ChevronDown
                    class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
                    :class="{ 'rotate-180': isProgramOpen(vp) }"
                  />
                </div>

                <OrganizationsTrainingStackBar :counts="vp.program.counts" class="md:col-span-2" />
              </button>

              <!-- Группы программы -->
              <div v-if="isProgramOpen(vp)" class="px-5 pb-5">
                <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table class="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr class="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                        <th class="px-4 py-2.5">Группа</th>
                        <th class="px-4 py-2.5">Даты обучения</th>
                        <th class="px-4 py-2.5">Статус</th>
                        <th class="px-4 py-2.5 text-right">Слушателей</th>
                        <th class="px-4 py-2.5">Сертификаты</th>
                        <th class="w-10 px-2 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      <template v-for="vg in vp.groups" :key="vg.group.id">
                        <tr
                          class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          :class="{ 'bg-slate-50/70 dark:bg-slate-800/30': isGroupOpen(vg) }"
                          @click="toggleGroup(vg)"
                        >
                          <td class="whitespace-nowrap px-4 py-3 font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {{ vg.group.code }}
                          </td>
                          <td class="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                            {{ formatRange(vg.group.startDate, vg.group.endDate) }}
                            <span v-if="durationDays(vg.group)" class="text-xs text-slate-400">
                              · {{ durationDays(vg.group) }} {{ plural(durationDays(vg.group)!, ['день', 'дня', 'дней']) }}
                            </span>
                          </td>
                          <td class="px-4 py-3">
                            <span
                              class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold"
                              :class="GROUP_STATUS[vg.group.status].class"
                            >
                              <span
                                class="h-1.5 w-1.5 rounded-full"
                                :class="[GROUP_STATUS[vg.group.status].dot, { 'animate-pulse': vg.group.status === 'active' }]"
                              ></span>
                              {{ GROUP_STATUS[vg.group.status].label }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                            {{ vg.group.counts.students }}
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                              <OrganizationsTrainingStackBar :counts="vg.group.counts" size="sm" class="w-20! shrink-0" />
                              <span class="whitespace-nowrap text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300">
                                {{ vg.group.counts.certified }} из {{ vg.group.counts.students }}
                              </span>
                              <span
                                v-for="name in vg.group.certificateNames"
                                :key="name"
                                class="whitespace-nowrap rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary"
                              >
                                {{ name }}
                              </span>
                            </div>
                          </td>
                          <td class="px-2 py-3 text-center">
                            <ChevronDown
                              class="mx-auto h-4 w-4 text-slate-400 transition-transform duration-200"
                              :class="{ 'rotate-180': isGroupOpen(vg) }"
                            />
                          </td>
                        </tr>

                        <!-- Слушатели группы -->
                        <tr v-if="isGroupOpen(vg)">
                          <td colspan="6" class="bg-slate-50/70 px-4 pb-4 pt-1 dark:bg-slate-800/30">
                            <ul class="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                              <li
                                v-for="(s, i) in vg.students"
                                :key="s.id"
                                class="grid grid-cols-[2rem_minmax(0,1.3fr)_minmax(0,1fr)_9.5rem] items-center gap-3 px-3 py-2"
                              >
                                <span class="text-xs tabular-nums text-slate-400">{{ i + 1 }}</span>
                                <div class="min-w-0">
                                  <p class="truncate text-sm font-semibold text-slate-900 dark:text-white" :title="s.fullName">
                                    {{ s.fullName }}
                                  </p>
                                  <p class="truncate text-xs text-slate-500" :title="s.position">{{ s.position }}</p>
                                </div>
                                <div class="min-w-0 text-xs">
                                  <template v-if="s.certificate">
                                    <div class="flex flex-wrap items-center gap-1.5">
                                      <span
                                        v-if="s.certificate.name"
                                        class="rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary"
                                      >
                                        {{ s.certificate.name }}
                                      </span>
                                      <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                        {{ s.certificate.number }}
                                      </span>
                                    </div>
                                    <p v-if="s.certificate.issueDate" class="mt-0.5 text-slate-400">
                                      выдан {{ dmy(s.certificate.issueDate) }}
                                    </p>
                                  </template>
                                  <span v-else class="text-slate-400">—</span>
                                </div>
                                <span
                                  class="inline-flex items-center justify-self-end gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold"
                                  :class="studentBadge(s, vg.group.status).class"
                                >
                                  <component :is="studentBadge(s, vg.group.status).icon" class="h-3 w-3" />
                                  {{ studentBadge(s, vg.group.status).label }}
                                </span>
                              </li>
                            </ul>
                            <p
                              v-if="vg.students.length < vg.group.students.length"
                              class="mt-2 text-xs text-slate-500"
                            >
                              Показаны совпадения: {{ vg.students.length }} из {{ vg.group.students.length }}
                            </p>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Users, GraduationCap, Award, FileBadge, BookOpen, CalendarDays, Layers, Clock,
  ChevronDown, ChevronsDownUp, ChevronsUpDown, Search, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Hourglass, CircleDashed,
} from "lucide-vue-next";
import type {
  GroupStatus,
  OrganizationTraining,
  TrainingGroup,
  TrainingProgram,
  TrainingStudent,
} from "~/../server/types/organizationTraining";

const props = defineProps<{
  organizationId: string;
  organizationName: string;
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const data = ref<OrganizationTraining | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const exporting = ref(false);
const year = ref<number | null>(null);
const query = ref("");

// ---------------------------------------------------------------- загрузка

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params = year.value ? `?year=${year.value}` : "";
    const res = await authFetch<{ success: boolean; data: OrganizationTraining }>(
      `/api/organizations/${props.organizationId}/training${params}`,
    );
    data.value = res.data;
  } catch (err) {
    console.error("Ошибка загрузки аналитики обучения:", err);
    error.value = "Не удалось загрузить аналитику обучения";
  } finally {
    loading.value = false;
  }
};

watch(() => props.organizationId, load, { immediate: true });

const years = computed(() => data.value?.years ?? []);
const yearOptions = computed(() => [
  { value: null as number | null, label: "Всё время" },
  ...years.value.map((y) => ({ value: y as number | null, label: String(y) })),
]);

const setYear = (value: number | null) => {
  if (year.value === value) return;
  year.value = value;
  load();
};

const downloadExcel = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const params = year.value ? `?year=${year.value}` : "";
    const blob = await authFetch<Blob>(
      `/api/organizations/${props.organizationId}/training-export${params}`,
      { responseType: "blob" },
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Обучение ${props.organizationName}${year.value ? ` ${year.value}` : ""}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Ошибка выгрузки отчёта об обучении:", err);
    notification.error("Не удалось сформировать Excel-отчёт");
  } finally {
    exporting.value = false;
  }
};

// ---------------------------------------------------------------- показатели

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

const tiles = computed(() => {
  const d = data.value;
  if (!d) return [];
  const s = d.summary;
  const certificateKinds = new Set(d.programs.flatMap((p) => p.certificateNames)).size;
  return [
    {
      label: "Сотрудников в базе",
      value: d.employees,
      hint: "числятся в организации",
      icon: Users,
      iconClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      label: "Прошли обучение",
      value: s.students,
      hint: `${pct(s.students, d.employees)}% сотрудников`,
      icon: GraduationCap,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Получили сертификат",
      value: s.certified,
      hint: `${pct(s.certified, s.students)}% от обучавшихся`,
      icon: Award,
      iconClass: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
    },
    {
      label: "Выдано сертификатов",
      value: s.certificates,
      hint: certificateKinds
        ? `${certificateKinds} ${plural(certificateKinds, ["вид", "вида", "видов"])} сертификатов`
        : "пока не выдавались",
      icon: FileBadge,
      iconClass: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
    },
    {
      label: "Программ обучения",
      value: s.programs,
      hint: `в ${s.groups} ${plural(s.groups, ["группе", "группах", "группах"])}`,
      icon: BookOpen,
      iconClass: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-500",
      wide: true,
    },
  ];
});

const legend = [
  { key: "certified", label: "С сертификатом", dot: "bg-success-600" },
  { key: "noCertificate", label: "Сертификат не выдан", dot: "bg-warning-500 dark:bg-warning-600" },
  { key: "inTraining", label: "Проходят обучение", dot: "bg-blue-light-600" },
] as const;

// ---------------------------------------------------------------- поиск и раскрытие

interface ViewGroup {
  group: TrainingGroup;
  students: TrainingStudent[];
  autoOpen: boolean;
}
interface ViewProgram {
  program: TrainingProgram;
  groups: ViewGroup[];
  autoOpen: boolean;
}

const q = computed(() => query.value.trim().toLowerCase());

const has = (value: string | null | undefined) => !!value && value.toLowerCase().includes(q.value);

const studentMatches = (s: TrainingStudent) =>
  has(s.fullName) || has(s.pinfl) || has(s.certificate?.number) || has(s.certificate?.name);

const view = computed<ViewProgram[]>(() => {
  const programs = data.value?.programs ?? [];
  if (!q.value) {
    return programs.map((program) => ({
      program,
      groups: program.groups.map((group) => ({ group, students: group.students, autoOpen: false })),
      autoOpen: programs.length === 1,
    }));
  }

  const result: ViewProgram[] = [];
  for (const program of programs) {
    if (has(program.name) || has(program.code) || program.certificateNames.some(has)) {
      result.push({
        program,
        groups: program.groups.map((group) => ({ group, students: group.students, autoOpen: false })),
        autoOpen: false,
      });
      continue;
    }
    const groups: ViewGroup[] = [];
    for (const group of program.groups) {
      if (has(group.code)) {
        groups.push({ group, students: group.students, autoOpen: false });
        continue;
      }
      const students = group.students.filter(studentMatches);
      if (students.length) groups.push({ group, students, autoOpen: true });
    }
    if (groups.length) result.push({ program, groups, autoOpen: true });
  }
  return result;
});

/** Ручное раскрытие/скрытие поверх автоматического (по поиску) */
const openPrograms = ref<Record<string, boolean>>({});
const openGroups = ref<Record<string, boolean>>({});

watch([q, () => data.value], () => {
  openPrograms.value = {};
  openGroups.value = {};
});

const isProgramOpen = (vp: ViewProgram) => openPrograms.value[vp.program.id] ?? vp.autoOpen;
const toggleProgram = (vp: ViewProgram) => {
  openPrograms.value[vp.program.id] = !isProgramOpen(vp);
};

const isGroupOpen = (vg: ViewGroup) => openGroups.value[vg.group.id] ?? vg.autoOpen;
const toggleGroup = (vg: ViewGroup) => {
  openGroups.value[vg.group.id] = !isGroupOpen(vg);
};

const allOpen = computed(() => view.value.length > 0 && view.value.every(isProgramOpen));
const toggleAll = () => {
  const next = !allOpen.value;
  for (const vp of view.value) openPrograms.value[vp.program.id] = next;
};

// ---------------------------------------------------------------- форматирование

const dmy = (ymd: string | null) => {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
};

/** «05.10 – 06.10.2026», «28.12.2025 – 10.01.2026», «05.10.2026» */
const formatRange = (from: string | null, to: string | null) => {
  if (!from && !to) return "—";
  if (!from || !to || from === to) return dmy(from ?? to);
  if (from.slice(0, 4) === to.slice(0, 4)) return `${dmy(from).slice(0, 5)} – ${dmy(to)}`;
  return `${dmy(from)} – ${dmy(to)}`;
};

const durationDays = (g: TrainingGroup) => {
  if (!g.startDate || !g.endDate) return null;
  const days = (Date.parse(g.endDate) - Date.parse(g.startDate)) / 86_400_000 + 1;
  return days > 0 ? Math.round(days) : null;
};

const GROUP_STATUS: Record<GroupStatus, { label: string; class: string; dot: string }> = {
  completed: {
    label: "Завершена",
    class: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  active: {
    label: "Идёт обучение",
    class: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-500",
    dot: "bg-blue-light-500",
  },
  planned: {
    label: "Запланирована",
    class: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
};

const studentBadge = (s: TrainingStudent, groupStatus: GroupStatus) => {
  if (s.state === "certified") {
    return {
      label: "Сертификат выдан",
      icon: CheckCircle2,
      class: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500",
    };
  }
  if (s.certificate?.status === "revoked") {
    return {
      label: "Отозван",
      icon: XCircle,
      class: "bg-danger/10 text-danger",
    };
  }
  if (s.state === "no_certificate") {
    return {
      label: "Не выдан",
      icon: CircleDashed,
      class: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500",
    };
  }
  return {
    label: groupStatus === "planned" ? "Зачислен" : "Обучается",
    icon: Hourglass,
    class: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-500",
  };
};
</script>
