<template>
  <div class="mx-auto max-w-screen-2xl">
    <UiPageHeader
      title="Проведение тестирования"
      description="Выберите тест на день, нажмите на слушателя и укажите компьютер — тест откроется на нём автоматически"
    >
      <template #actions>
        <span
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          :class="live ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400'"
        >
          <span class="h-2 w-2 rounded-full" :class="live ? 'bg-success-500' : 'animate-pulse bg-gray-400'" />
          {{ live ? "В реальном времени" : "Подключение…" }}
        </span>
        <input v-model="date" type="date" class="tr-input w-auto" aria-label="Дата тестирования" @change="onDateChange" />
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <!-- ===================== ТЕСТЫ И СЛУШАТЕЛИ ===================== -->
      <section class="min-w-0 space-y-4">
        <div v-if="loadingAssignments" class="h-24 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />

        <div
          v-else-if="!assignments.length"
          class="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-white/[0.03]"
        >
          <CalendarX2 class="mb-3 h-10 w-10 text-gray-400" />
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">На {{ dateLabel }} тестов нет</h2>
          <p class="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Тесты назначаются группам в расписании. Выберите другую дату.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            v-for="a in assignments"
            :key="a.id"
            type="button"
            class="rounded-xl border bg-white p-4 text-left transition-colors dark:bg-white/[0.03]"
            :class="a.id === selectedId
              ? 'border-brand-500 ring-2 ring-brand-500/20'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'"
            @click="selectAssignment(a.id)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-semibold text-gray-900 dark:text-white">{{ a.templateName || "Тест" }}</p>
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Группа {{ a.groupCode || "—" }}<span v-if="a.eventStart"> · {{ time(a.eventStart) }}–{{ time(a.eventEnd) }}</span>
                </p>
              </div>
              <span class="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium tabular-nums text-gray-700 dark:bg-white/5 dark:text-gray-300">
                {{ a.completedCount }}/{{ a.studentsCount }} сдали
              </span>
            </div>
          </button>
        </div>

        <!-- Слушатели выбранного теста -->
        <div v-if="selectedId" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div class="min-w-0">
              <h2 class="truncate font-semibold text-gray-900 dark:text-white">{{ studentsInfo?.assignment.templateName || "Слушатели" }}</h2>
              <p v-if="studentsInfo" class="text-xs text-gray-500 dark:text-gray-400">
                Группа {{ studentsInfo.assignment.groupCode }} · попыток: {{ studentsInfo.assignment.maxAttempts }}
                <span v-if="studentsInfo.assignment.timeLimitMinutes"> · {{ studentsInfo.assignment.timeLimitMinutes }} мин</span>
              </p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Нажмите на слушателя, чтобы выбрать компьютер</p>
          </div>

          <div v-if="loadingStudents && !studentsInfo" class="h-40 animate-pulse" />
          <p v-else-if="studentsInfo && !studentsInfo.students.length" class="px-4 py-10 text-center text-sm text-gray-500">
            В группе нет слушателей
          </p>
          <ul v-else-if="studentsInfo" class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="(st, i) in studentsInfo.students" :key="st.id">
              <button
                type="button"
                class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors enabled:hover:bg-gray-50 disabled:cursor-not-allowed dark:enabled:hover:bg-white/[0.03]"
                :disabled="!!blockReason(st)"
                :title="blockReason(st) || 'Выбрать компьютер'"
                @click="openPicker(st)"
              >
                <span class="w-6 shrink-0 text-right text-sm tabular-nums text-gray-400">{{ i + 1 }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium text-gray-900 dark:text-white">{{ st.fullName }}</span>
                  <span class="block text-xs text-gray-500 dark:text-gray-400">
                    Попыток {{ st.attemptsUsed }}/{{ studentsInfo.assignment.maxAttempts }}
                    <span v-if="blockReason(st)" class="text-warning-600 dark:text-warning-400"> · {{ blockReason(st) }}</span>
                  </span>
                </span>
                <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="studentBadge(st).cls">
                  {{ studentBadge(st).text }}
                </span>
                <Monitor v-if="!blockReason(st)" class="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- ===================== КОМПЬЮТЕРЫ ===================== -->
      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Компьютеры</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">В сети {{ onlineCount }} из {{ workstations.length }}</p>
            </div>
            <UiButton size="sm" variant="outline" :start-icon="Plus" @click="openEdit(null)">Добавить</UiButton>
          </div>

          <p v-if="!workstations.length" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Компьютеров пока нет. Откройте платформу на компьютерах класса — они появятся ниже в «Новых подключениях».
          </p>

          <ul v-else class="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            <li v-for="w in workstations" :key="w.id" class="flex items-start gap-3 px-4 py-3" :class="!w.isActive && 'opacity-50'">
              <span
                class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
                :class="w.device ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'"
              >
                {{ w.number }}
                <span
                  class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900"
                  :class="w.device ? 'bg-success-500' : 'bg-gray-300 dark:bg-gray-600'"
                />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {{ w.name }} <span class="font-normal text-gray-500 tabular-nums dark:text-gray-400">· {{ w.ipAddress }}</span>
                </p>
                <p class="truncate text-xs" :class="stationLine(w).cls">{{ stationLine(w).text }}</p>
              </div>
              <div class="flex shrink-0 items-center">
                <button v-if="w.device" class="tr-icon-btn" title="Показать номер на экране компьютера" @click="identify(w)">
                  <ScanEye class="h-4 w-4" />
                </button>
                <button v-if="canRelease(w)" class="tr-icon-btn" title="Освободить компьютер" @click="release(w)">
                  <LogOut class="h-4 w-4" />
                </button>
                <button class="tr-icon-btn" title="Изменить" @click="openEdit(w)"><Pencil class="h-4 w-4" /></button>
                <button class="tr-icon-btn hover:!text-error-500" title="Удалить" @click="toDelete = w"><Trash2 class="h-4 w-4" /></button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Подключённые, но ещё не названные -->
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Новые подключения</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Открыли платформу, но ещё не названы компьютером</p>
            </div>
            <UiButton v-if="visibleNew.length > 1" size="sm" variant="soft" :loading="bulkSaving" @click="addAll">
              Добавить все
            </UiButton>
          </div>
          <p v-if="!visibleNew.length" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Нет новых подключений</p>
          <ul v-else class="max-h-[40vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            <li v-for="d in visibleNew" :key="d.ip" class="flex items-center gap-3 px-4 py-2.5">
              <span class="h-2 w-2 shrink-0 rounded-full bg-success-500" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium tabular-nums text-gray-900 dark:text-white">{{ d.ip }}</p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ deviceWho(d) }}</p>
              </div>
              <UiButton size="xs" variant="outline" @click="openEdit(null, d.ip)">Добавить</UiButton>
            </li>
          </ul>
          <button
            v-if="hiddenExternal"
            type="button"
            class="w-full border-t border-gray-100 px-4 py-2 text-xs text-gray-500 hover:text-brand-500 dark:border-gray-800"
            @click="showExternal = !showExternal"
          >
            {{ showExternal ? "Скрыть внешние адреса" : `Показать внешние адреса (${hiddenExternal})` }}
          </button>
        </div>
      </aside>
    </div>

    <!-- ===================== ВЫБОР КОМПЬЮТЕРА ===================== -->
    <UiModal :is-open="!!picking" :title="picking ? `Компьютер для: ${picking.fullName}` : ''" size="lg" @close="picking = null">
      <div v-if="picking && studentsInfo" class="space-y-4">
        <div v-if="studentsInfo.languages.length > 1" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Язык теста:</span>
          <button
            v-for="lang in studentsInfo.languages"
            :key="lang"
            type="button"
            class="rounded-lg border px-3 py-1.5 text-sm transition-colors"
            :class="lang === pickLanguage
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
              : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'"
            @click="pickLanguage = lang"
          >
            {{ testLanguageLabel(lang) }}
          </button>
        </div>
        <p v-else-if="!studentsInfo.languages.length" class="text-sm text-error-600">В тесте нет вопросов ни на одном языке</p>

        <p v-if="!workstations.length" class="py-6 text-center text-sm text-gray-500">Сначала добавьте компьютеры класса</p>
        <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          <button
            v-for="w in workstations"
            :key="w.id"
            type="button"
            class="flex flex-col items-center rounded-xl border p-3 text-center transition-colors enabled:hover:border-brand-500 enabled:hover:bg-brand-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:enabled:hover:bg-brand-500/10"
            :class="w.device ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-700'"
            :disabled="!!pickDisabled(w) || assigning || !pickLanguage"
            :title="pickDisabled(w) || ''"
            @click="assign(w)"
          >
            <span class="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{{ w.number }}</span>
            <span class="mt-0.5 w-full truncate text-xs text-gray-500 dark:text-gray-400">{{ w.name }}</span>
            <span class="mt-1 w-full truncate text-[11px]" :class="pickHint(w).cls">{{ pickHint(w).text }}</span>
          </button>
        </div>
      </div>
    </UiModal>

    <!-- ===================== КОМПЬЮТЕР: ДОБАВИТЬ / ИЗМЕНИТЬ ===================== -->
    <UiModal :is-open="!!editing" :title="editing?.id ? 'Компьютер' : 'Новый компьютер'" size="sm" @close="editing = null">
      <form v-if="editing" id="tr-edit" class="space-y-4" @submit.prevent="saveEdit">
        <div class="grid grid-cols-[100px_1fr] gap-3">
          <label class="block">
            <span class="mb-1 block text-sm text-gray-700 dark:text-gray-300">Номер</span>
            <input v-model.number="editing.number" type="number" min="1" required class="tr-input" @input="syncName" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm text-gray-700 dark:text-gray-300">Название</span>
            <input v-model="editing.name" type="text" maxlength="100" required class="tr-input" @input="nameTouched = true" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm text-gray-700 dark:text-gray-300">IP-адрес</span>
          <input v-model.trim="editing.ipAddress" type="text" required placeholder="192.168.31.20" class="tr-input tabular-nums" />
          <span class="mt-1 block text-xs text-gray-500">Статический адрес компьютера в локальной сети</span>
        </label>
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="outline" @click="editing = null">Отмена</UiButton>
          <UiButton type="submit" form="tr-edit" :loading="saving">Сохранить</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmModal
      :is-open="!!toDelete"
      title="Удалить компьютер?"
      :item-name="toDelete ? `${toDelete.name} (${toDelete.ipAddress})` : ''"
      message="Компьютер пропадёт из списка. Если он снова подключится, его можно будет добавить заново."
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { CalendarX2, LogOut, Monitor, Pencil, Plus, ScanEye, Trash2 } from "lucide-vue-next";
import { testLanguageLabel } from "#shared/utils/testLanguages";

definePageMeta({ layout: "default", title: "Проведение тестирования" });
useHead({ title: "Проведение тестирования" });

// ----------------------------------------------------------------------------
// Типы
// ----------------------------------------------------------------------------

interface Device {
  ip: string;
  connections: number;
  path: string | null;
  userName: string | null;
  userRole: string | null;
}
interface Seat {
  id: string;
  workstationId: string;
  assignmentId: string;
  studentId: string;
  status: "pending" | "claimed";
  studentName: string;
  templateName: string;
  sessionStatus: string | null;
  scorePercent: number | null;
  passed: boolean | null;
}
interface Workstation {
  id: string;
  number: number;
  name: string;
  ipAddress: string;
  isActive: boolean;
  seat: Seat | null;
}
interface WorkstationView extends Workstation {
  device: Device | null;
}
interface Assignment {
  id: string;
  templateName: string;
  groupCode: string;
  eventStart: string | null;
  eventEnd: string | null;
  studentsCount: number;
  completedCount: number;
}
interface Student {
  id: string;
  fullName: string;
  hasAccount: boolean;
  attemptsUsed: number;
  lastStatus: string | null;
  lastScore: number | null;
  lastPassed: boolean | null;
  activeSessionId: string | null;
}
interface StudentsInfo {
  assignment: { id: string; templateName: string; groupCode: string; maxAttempts: number; timeLimitMinutes: number | null };
  languages: string[];
  students: Student[];
}

const { authFetch } = useAuthFetch();
const notification = useNotification();
const token = useCookie<string | null>("auth_token");

// ----------------------------------------------------------------------------
// Дата и тесты
// ----------------------------------------------------------------------------

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const date = ref(todayIso());
const dateLabel = computed(() =>
  new Date(`${date.value}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
);
const time = (v: string | null) =>
  v ? new Date(v).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "";

const assignments = ref<Assignment[]>([]);
const loadingAssignments = ref(true);
const selectedId = ref<string | null>(null);
const studentsInfo = ref<StudentsInfo | null>(null);
const loadingStudents = ref(false);

const errorText = (e: any, fallback: string) => e?.data?.message || e?.message || fallback;

async function loadAssignments() {
  loadingAssignments.value = true;
  try {
    const res = await authFetch<{ assignments: Assignment[] }>(`/api/testing-room/assignments?date=${date.value}`);
    assignments.value = res.assignments;
    if (!assignments.value.some((a) => a.id === selectedId.value)) {
      selectedId.value = assignments.value.length === 1 ? assignments.value[0]!.id : null;
      studentsInfo.value = null;
      if (selectedId.value) await loadStudents();
    }
  } catch (e) {
    notification.error(errorText(e, "Не удалось загрузить тесты"));
  } finally {
    loadingAssignments.value = false;
  }
}

async function loadStudents() {
  if (!selectedId.value) return;
  const id = selectedId.value;
  loadingStudents.value = true;
  try {
    const res = await authFetch<StudentsInfo>(`/api/testing-room/assignments/${id}/students`);
    if (selectedId.value === id) studentsInfo.value = res;
  } catch (e) {
    notification.error(errorText(e, "Не удалось загрузить слушателей"));
  } finally {
    loadingStudents.value = false;
  }
}

function selectAssignment(id: string) {
  if (selectedId.value === id) return;
  selectedId.value = id;
  studentsInfo.value = null;
  loadStudents();
}

function onDateChange() {
  selectedId.value = null;
  studentsInfo.value = null;
  loadAssignments();
}

// ----------------------------------------------------------------------------
// Компьютеры и подключения
// ----------------------------------------------------------------------------

const rawWorkstations = ref<Workstation[]>([]);
const presence = ref<Device[]>([]);
const showExternal = ref(false);

const workstations = computed<WorkstationView[]>(() => {
  const byIp = new Map(presence.value.map((d) => [d.ip, d]));
  return rawWorkstations.value.map((w) => ({ ...w, device: byIp.get(w.ipAddress) || null }));
});
const onlineCount = computed(() => workstations.value.filter((w) => w.device).length);
const activeSeats = computed(() => rawWorkstations.value.map((w) => w.seat).filter(Boolean) as Seat[]);

function isPrivateIp(ip: string) {
  if (ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return /^(fc|fd|fe80)/i.test(ip);
}
const newDevices = computed(() => {
  const registered = new Set(rawWorkstations.value.map((w) => w.ipAddress));
  return presence.value.filter((d) => !registered.has(d.ip));
});
const visibleNew = computed(() => newDevices.value.filter((d) => showExternal.value || isPrivateIp(d.ip)));
const hiddenExternal = computed(() => newDevices.value.filter((d) => !isPrivateIp(d.ip)).length);

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "администратор",
  MANAGER: "менеджер",
  TEACHER: "инструктор",
  STUDENT: "слушатель",
};
function deviceWho(d: Device) {
  const tabs = d.connections > 1 ? ` · вкладок: ${d.connections}` : "";
  if (d.userName) return `${d.userName} (${ROLE_LABELS[d.userRole || ""] || d.userRole})${tabs}`;
  if (d.path?.startsWith("/testing/kiosk")) return `Ожидает теста${tabs}`;
  return `Никто не вошёл${tabs}`;
}

async function loadState() {
  try {
    const res = await authFetch<{ workstations: Workstation[]; presence: Device[] }>("/api/testing-room/state");
    rawWorkstations.value = res.workstations;
    presence.value = res.presence;
  } catch (e) {
    notification.error(errorText(e, "Не удалось загрузить компьютеры"));
  }
}

function stationLine(w: WorkstationView): { text: string; cls: string } {
  const s = w.seat;
  if (s?.status === "pending") {
    return {
      text: w.device ? `Входит: ${s.studentName}` : `Ждёт подключения: ${s.studentName}`,
      cls: "text-warning-600 dark:text-warning-400",
    };
  }
  if (s?.status === "claimed") {
    if (s.sessionStatus === "in_progress") return { text: `Сдаёт: ${s.studentName}`, cls: "text-brand-600 dark:text-brand-400" };
    const score = s.scorePercent !== null ? ` — ${Math.round(s.scorePercent)}%` : "";
    return {
      text: `${s.passed ? "Сдал" : "Завершил"}: ${s.studentName}${score}`,
      cls: s.passed ? "text-success-600 dark:text-success-400" : "text-gray-600 dark:text-gray-400",
    };
  }
  if (!w.isActive) return { text: "Отключён", cls: "text-gray-500" };
  if (!w.device) return { text: "Не в сети", cls: "text-gray-400 dark:text-gray-500" };
  return { text: w.device.userName ? deviceWho(w.device) : "Свободен", cls: "text-gray-500 dark:text-gray-400" };
}

const canRelease = (w: WorkstationView) =>
  !!w.seat || (w.device?.userRole === "STUDENT");

// ----------------------------------------------------------------------------
// Слушатель → компьютер
// ----------------------------------------------------------------------------

const picking = ref<Student | null>(null);
const pickLanguage = ref<string | null>(null);
const assigning = ref(false);

function seatOf(st: Student) {
  return activeSeats.value.find((s) => s.studentId === st.id && s.assignmentId === selectedId.value) || null;
}
function workstationName(id: string) {
  const w = rawWorkstations.value.find((x) => x.id === id);
  return w ? `№${w.number}` : "";
}

function blockReason(st: Student): string | null {
  if (!st.hasAccount) return "нет учётной записи";
  const max = studentsInfo.value?.assignment.maxAttempts ?? 1;
  if (!st.activeSessionId && st.attemptsUsed >= max) return "попытки исчерпаны";
  return null;
}

function studentBadge(st: Student): { text: string; cls: string } {
  const seat = seatOf(st);
  if (seat?.status === "pending") {
    return { text: `Входит · ${workstationName(seat.workstationId)}`, cls: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400" };
  }
  if (seat?.status === "claimed" && seat.sessionStatus === "in_progress") {
    return { text: `Сдаёт · ${workstationName(seat.workstationId)}`, cls: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" };
  }
  if (st.activeSessionId) {
    return { text: "Сдаёт", cls: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" };
  }
  if (st.lastStatus === "completed" || st.lastStatus === "timeout" || st.lastStatus === "violation") {
    const score = st.lastScore !== null ? ` ${Math.round(st.lastScore)}%` : "";
    return st.lastPassed
      ? { text: `Сдал${score}`, cls: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" }
      : { text: `Не сдал${score}`, cls: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400" };
  }
  return { text: "Не начинал", cls: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400" };
}

function openPicker(st: Student) {
  if (blockReason(st)) return;
  const seat = seatOf(st);
  if (seat?.status === "claimed" && seat.sessionStatus === "in_progress") {
    notification.error(`${st.fullName} уже сдаёт тест за компьютером ${workstationName(seat.workstationId)}`);
    return;
  }
  const langs = studentsInfo.value?.languages || [];
  if (!pickLanguage.value || !langs.includes(pickLanguage.value)) {
    pickLanguage.value = langs.includes("ru") ? "ru" : langs[0] || null;
  }
  picking.value = st;
}

function pickDisabled(w: WorkstationView): string | null {
  if (!w.isActive) return "Компьютер отключён";
  const s = w.seat;
  if (s?.status === "claimed" && s.sessionStatus === "in_progress" && s.studentId !== picking.value?.id) {
    return `Занят: сдаёт ${s.studentName}`;
  }
  if (w.device?.userName && w.device.userRole !== "STUDENT") {
    return `Вошёл сотрудник: ${w.device.userName}`;
  }
  return null;
}

function pickHint(w: WorkstationView): { text: string; cls: string } {
  const reason = pickDisabled(w);
  if (reason) return { text: reason.startsWith("Занят") ? "Занят" : reason.startsWith("Вошёл") ? "Сотрудник" : "Откл.", cls: "text-error-500" };
  if (w.seat?.status === "pending") return { text: `Ждёт: ${w.seat.studentName}`, cls: "text-warning-600" };
  if (!w.device) return { text: "Не в сети", cls: "text-gray-400" };
  return { text: "Свободен", cls: "text-success-600 dark:text-success-400" };
}

async function assign(w: WorkstationView) {
  if (!picking.value || !selectedId.value || !pickLanguage.value) return;
  assigning.value = true;
  const student = picking.value;
  try {
    const res = await authFetch<{ delivered: boolean }>("/api/testing-room/seats", {
      method: "POST",
      body: {
        assignmentId: selectedId.value,
        studentId: student.id,
        workstationId: w.id,
        language: pickLanguage.value,
      },
    });
    notification.success(
      res.delivered
        ? `${student.fullName} → ${w.name}: тест открывается`
        : `${student.fullName} → ${w.name}: компьютер не в сети, тест откроется, когда он подключится`,
    );
    picking.value = null;
    await Promise.all([loadState(), loadStudents()]);
  } catch (e) {
    notification.error(errorText(e, "Не удалось посадить слушателя"));
  } finally {
    assigning.value = false;
  }
}

// ----------------------------------------------------------------------------
// Действия с компьютерами
// ----------------------------------------------------------------------------

async function identify(w: WorkstationView) {
  try {
    await authFetch(`/api/testing-room/workstations/${w.id}/identify`, { method: "POST" });
  } catch (e) {
    notification.error(errorText(e, "Компьютер не отвечает"));
  }
}

async function release(w: WorkstationView) {
  try {
    await authFetch(`/api/testing-room/workstations/${w.id}/release`, { method: "POST" });
    notification.success(`${w.name} освобождён`);
    await Promise.all([loadState(), loadStudents()]);
  } catch (e) {
    notification.error(errorText(e, "Не удалось освободить компьютер"));
  }
}

const editing = ref<{ id: string | null; number: number; name: string; ipAddress: string } | null>(null);
const nameTouched = ref(false);
const saving = ref(false);
const bulkSaving = ref(false);

function nextNumber() {
  return rawWorkstations.value.reduce((m, w) => Math.max(m, w.number), 0) + 1;
}
function openEdit(w: WorkstationView | null, ip = "") {
  nameTouched.value = !!w;
  if (w) {
    editing.value = { id: w.id, number: w.number, name: w.name, ipAddress: w.ipAddress };
  } else {
    const n = nextNumber();
    editing.value = { id: null, number: n, name: `Компьютер ${n}`, ipAddress: ip };
  }
}
function syncName() {
  if (editing.value && !nameTouched.value) editing.value.name = `Компьютер ${editing.value.number}`;
}
async function saveEdit() {
  if (!editing.value) return;
  saving.value = true;
  const { id, ...body } = editing.value;
  try {
    await authFetch(id ? `/api/testing-room/workstations/${id}` : "/api/testing-room/workstations", {
      method: id ? "PUT" : "POST",
      body,
    });
    editing.value = null;
    await loadState();
  } catch (e) {
    notification.error(errorText(e, "Не удалось сохранить компьютер"));
  } finally {
    saving.value = false;
  }
}

async function addAll() {
  bulkSaving.value = true;
  try {
    const res = await authFetch<{ created: unknown[] }>("/api/testing-room/workstations/bulk", {
      method: "POST",
      body: { ips: visibleNew.value.map((d) => d.ip) },
    });
    notification.success(`Добавлено компьютеров: ${res.created.length}`);
    await loadState();
  } catch (e) {
    notification.error(errorText(e, "Не удалось добавить компьютеры"));
  } finally {
    bulkSaving.value = false;
  }
}

const toDelete = ref<WorkstationView | null>(null);
const deleting = ref(false);
async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await authFetch(`/api/testing-room/workstations/${toDelete.value.id}`, { method: "DELETE" });
    toDelete.value = null;
    await loadState();
  } catch (e) {
    notification.error(errorText(e, "Не удалось удалить компьютер"));
  } finally {
    deleting.value = false;
  }
}

// ----------------------------------------------------------------------------
// Реальное время: WebSocket администратора
// ----------------------------------------------------------------------------

const live = ref(false);
let ws: WebSocket | null = null;
let retry = 0;
let stopped = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;

function scheduleRefresh() {
  if (refreshTimer) return;
  refreshTimer = setTimeout(async () => {
    refreshTimer = null;
    await Promise.all([loadState(), loadStudents()]);
  }, 300);
}

function connect() {
  if (stopped) return;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${protocol}://${window.location.host}/_ws/testing-room`);
  ws.onopen = () => {
    retry = 0;
    live.value = true;
    ws?.send(JSON.stringify({ type: "admin-subscribe", token: token.value }));
    pingTimer = setInterval(() => ws?.send(JSON.stringify({ type: "ping" })), 25_000);
    scheduleRefresh(); // пропущенное за время обрыва
  };
  ws.onmessage = (event) => {
    let msg: any;
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (msg.type === "presence") presence.value = msg.devices;
    else if (msg.type === "seats-changed") {
      if (msg.error?.message) notification.error(msg.error.message, "Вход в тест не выполнен", 10000);
      scheduleRefresh();
    } else if (msg.type === "error") {
      live.value = false;
    }
  };
  ws.onclose = () => {
    live.value = false;
    if (pingTimer) clearInterval(pingTimer);
    if (stopped) return;
    retry = Math.min(retry + 1, 5);
    setTimeout(connect, Math.min(1000 * 2 ** (retry - 1), 15_000));
  };
  ws.onerror = () => ws?.close();
}

onMounted(async () => {
  await Promise.all([loadState(), loadAssignments()]);
  connect();
  // Подстраховка, если WebSocket недоступен (например, за прокси без upgrade)
  pollTimer = setInterval(() => {
    if (!live.value) scheduleRefresh();
  }, 15_000);
});

onBeforeUnmount(() => {
  stopped = true;
  ws?.close();
  if (pollTimer) clearInterval(pollTimer);
  if (pingTimer) clearInterval(pingTimer);
  if (refreshTimer) clearTimeout(refreshTimer);
});
</script>

<style scoped>
.tr-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(209 213 219);
  background: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(17 24 39);
  outline: none;
}
.tr-input:focus {
  border-color: var(--color-brand-500, #465fff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-brand-500, #465fff) 20%, transparent);
}
:global(.dark) .tr-input {
  border-color: rgb(75 85 99);
  background: rgb(17 24 39);
  color: white;
}
.tr-icon-btn {
  border-radius: 0.375rem;
  padding: 0.375rem;
  color: rgb(107 114 128);
  transition: background-color 0.15s, color 0.15s;
}
.tr-icon-btn:hover {
  background: rgb(243 244 246);
  color: var(--color-brand-500, #465fff);
}
:global(.dark) .tr-icon-btn:hover {
  background: rgb(55 65 81);
}
</style>
