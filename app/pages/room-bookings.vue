<template>
  <div class="mx-auto max-w-screen-2xl">
    <UiPageHeader
      title="Бронь аудиторий"
      description="Планирование: какой курс занимает аудиторию, в какие дни и с каким инструктором. Группа и число слушателей указываются позже"
    >
      <template #actions>
        <UiButton v-if="canEdit" variant="primary" :start-icon="Plus" @click="openCreate">Забронировать</UiButton>
      </template>
    </UiPageHeader>

    <!-- Фильтры -->
    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <select v-model="filters.classroomId" class="rb-input" @change="load">
        <option value="">Все аудитории</option>
        <option v-for="r in options.classrooms" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <select v-model="filters.courseId" class="rb-input" @change="load">
        <option value="">Все курсы</option>
        <option v-for="c in options.courses" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select v-model="filters.scope" class="rb-input" @change="load">
        <option value="upcoming">Действующие и будущие</option>
        <option value="all">Все, включая прошедшие</option>
      </select>
    </div>

    <div v-if="loading" class="h-40 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />

    <div
      v-else-if="!bookings.length"
      class="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]"
    >
      <DoorOpen class="mb-3 h-10 w-10 text-gray-400" />
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">Броней пока нет</h2>
      <p class="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        Забронируйте аудиторию под курс на нужные дни — расписание не даст поставить в эти дни занятия других курсов.
      </p>
      <UiButton v-if="canEdit" class-name="mt-5" variant="primary" :start-icon="Plus" @click="openCreate">Забронировать</UiButton>
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <table class="w-full min-w-[900px] text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-400">
          <tr>
            <th class="px-4 py-3 font-medium">Аудитория</th>
            <th class="px-4 py-3 font-medium">Курс</th>
            <th class="px-4 py-3 font-medium">Даты</th>
            <th class="px-4 py-3 font-medium">Дни</th>
            <th class="px-4 py-3 font-medium">Инструктор</th>
            <th class="px-4 py-3 font-medium">Группа</th>
            <th class="px-4 py-3 font-medium">Кто забронировал</th>
            <th v-if="canEdit" class="px-4 py-3 text-right font-medium">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          <tr v-for="b in bookings" :key="b.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ b.classroomName }}</td>
            <td class="px-4 py-3">
              <div class="text-gray-900 dark:text-white">{{ b.courseName }}</div>
              <div v-if="b.note" class="text-xs text-gray-500 dark:text-gray-400">{{ b.note }}</div>
            </td>
            <td class="whitespace-nowrap px-4 py-3">{{ period(b) }}</td>
            <td class="whitespace-nowrap px-4 py-3">{{ weekdaysText(b.weekdays) }}</td>
            <td class="px-4 py-3">{{ b.instructorName || "—" }}</td>
            <td class="px-4 py-3">
              <span v-if="b.groupCode">{{ b.groupCode }}</span>
              <span v-else class="text-gray-400">не назначена</span>
            </td>
            <td class="px-4 py-3">
              {{ b.createdByName || "—" }}
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ fmt(b.createdDay) }}</div>
            </td>
            <td v-if="canEdit" class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <button class="rb-icon-btn" title="Изменить" @click="openEdit(b)"><Pencil class="h-4 w-4" /></button>
                <button class="rb-icon-btn hover:!text-danger" title="Снять бронь" @click="toDelete = b"><Trash2 class="h-4 w-4" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Создание / изменение -->
    <UiModal :is-open="modalOpen" :title="editingId ? 'Изменить бронь' : 'Забронировать аудиторию'" @close="modalOpen = false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="rb-label">Аудитория <span class="text-danger">*</span></span>
            <select v-model="form.classroomId" required class="rb-input">
              <option value="" disabled>Выберите</option>
              <option v-for="r in options.classrooms" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="rb-label">Инструктор</span>
            <select v-model="form.instructorId" class="rb-input">
              <option value="">Пока не назначен</option>
              <option v-for="i in options.instructors" :key="i.id" :value="i.id">{{ i.fullName }}</option>
            </select>
          </label>
        </div>

        <label class="block">
          <span class="rb-label">Курс <span class="text-danger">*</span></span>
          <select v-model="form.courseId" required class="rb-input" @change="onCourseChange">
            <option value="" disabled>Выберите</option>
            <option v-for="c in options.courses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="rb-label">С даты <span class="text-danger">*</span></span>
            <input v-model="form.dateFrom" type="date" required class="rb-input" @change="syncDateTo" />
          </label>
          <label class="block">
            <span class="rb-label">По дату <span class="text-danger">*</span></span>
            <input v-model="form.dateTo" type="date" required :min="form.dateFrom" class="rb-input" />
          </label>
        </div>

        <div>
          <span class="rb-label">Дни недели <span class="text-danger">*</span></span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in WEEKDAYS"
              :key="d.n"
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm transition-colors"
              :class="form.weekdays.includes(d.n)
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5'"
              @click="toggleDay(d.n)"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <label class="block">
          <span class="rb-label">Группа (когда станет известна)</span>
          <select v-model="form.groupId" class="rb-input" :disabled="!form.courseId">
            <option value="">Пока не назначена</option>
            <option v-for="g in groupsForCourse" :key="g.id" :value="g.id">{{ g.code }}</option>
          </select>
        </label>

        <label class="block">
          <span class="rb-label">Примечание</span>
          <input v-model="form.note" type="text" maxlength="500" placeholder="Например: ориентировочно 15 слушателей" class="rb-input" />
        </label>

        <div class="flex justify-end gap-3 pt-2">
          <UiButton variant="outline" type="button" @click="modalOpen = false">Отмена</UiButton>
          <UiButton variant="primary" type="submit" :loading="saving">{{ editingId ? "Сохранить" : "Забронировать" }}</UiButton>
        </div>
      </form>
    </UiModal>

    <UiConfirmModal
      :is-open="!!toDelete"
      title="Снять бронь?"
      :message="`Бронь аудитории «${toDelete?.classroomName ?? ''}» под курс «${toDelete?.courseName ?? ''}» (${toDelete ? period(toDelete) : ''}) будет удалена.`"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { DoorOpen, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { usePermissions } from "~/composables/usePermissions";
import { Permission } from "~/types/permissions";

definePageMeta({ layout: "default", title: "Бронь аудиторий" });
useHead({ title: "Бронь аудиторий" });

interface Booking {
  id: string;
  classroomId: string;
  classroomName: string;
  courseId: string;
  courseName: string;
  instructorId: string | null;
  instructorName: string | null;
  groupId: string | null;
  groupCode: string | null;
  dateFrom: string;
  dateTo: string;
  weekdays: number[];
  note: string | null;
  createdByName: string | null;
  createdDay: string;
}

const { authFetch } = useAuthFetch();
const notification = useNotification();
const { hasPermission } = usePermissions();
const canEdit = computed(() => hasPermission(Permission.SCHEDULE_UPDATE));

const WEEKDAYS = [
  { n: 1, label: "Пн" },
  { n: 2, label: "Вт" },
  { n: 3, label: "Ср" },
  { n: 4, label: "Чт" },
  { n: 5, label: "Пт" },
  { n: 6, label: "Сб" },
  { n: 7, label: "Вс" },
];

const bookings = ref<Booking[]>([]);
const loading = ref(true);
const options = reactive<{
  classrooms: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  instructors: { id: string; fullName: string }[];
  groups: { id: string; code: string; courseId: string }[];
}>({ classrooms: [], courses: [], instructors: [], groups: [] });
const filters = reactive({ classroomId: "", courseId: "", scope: "upcoming" });

const errorText = (e: any, fallback: string) => e?.data?.statusMessage || e?.statusMessage || fallback;

const load = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.classroomId) params.set("classroomId", filters.classroomId);
    if (filters.courseId) params.set("courseId", filters.courseId);
    if (filters.scope === "all") params.set("scope", "all");
    const res = await authFetch<{ bookings: Booking[] }>(`/api/schedule/bookings?${params}`);
    bookings.value = res.bookings;
  } catch (e) {
    notification.show({ type: "error", title: "Ошибка", message: errorText(e, "Не удалось загрузить брони") });
  } finally {
    loading.value = false;
  }
};

const loadOptions = async () => {
  try {
    Object.assign(options, await authFetch("/api/schedule/bookings/options"));
  } catch (e) {
    notification.show({ type: "error", title: "Ошибка", message: errorText(e, "Не удалось загрузить справочники") });
  }
};

// ── Отображение ──
const fmt = (ymd: string) => (ymd ? `${ymd.slice(8, 10)}.${ymd.slice(5, 7)}.${ymd.slice(0, 4)}` : "");
const period = (b: { dateFrom: string; dateTo: string }) =>
  b.dateFrom === b.dateTo ? fmt(b.dateFrom) : `${fmt(b.dateFrom)} – ${fmt(b.dateTo)}`;

const weekdaysText = (days: number[]) => {
  const names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const sorted = [...days].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j++;
    if (j - i >= 2) parts.push(`${names[sorted[i]! - 1]}–${names[sorted[j]! - 1]}`);
    else for (let k = i; k <= j; k++) parts.push(names[sorted[k]! - 1]!);
    i = j + 1;
  }
  return parts.join(", ");
};

// ── Форма ──
const modalOpen = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const toDelete = ref<Booking | null>(null);

const emptyForm = () => ({
  classroomId: "",
  courseId: "",
  instructorId: "",
  groupId: "",
  dateFrom: "",
  dateTo: "",
  weekdays: [1, 2, 3, 4, 5] as number[],
  note: "",
});
const form = reactive(emptyForm());

const groupsForCourse = computed(() => options.groups.filter((g) => g.courseId === form.courseId));

const openCreate = () => {
  editingId.value = null;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
};

const openEdit = (b: Booking) => {
  editingId.value = b.id;
  Object.assign(form, {
    classroomId: b.classroomId,
    courseId: b.courseId,
    instructorId: b.instructorId ?? "",
    groupId: b.groupId ?? "",
    dateFrom: b.dateFrom,
    dateTo: b.dateTo,
    weekdays: [...b.weekdays],
    note: b.note ?? "",
  });
  modalOpen.value = true;
};

const onCourseChange = () => {
  if (form.groupId && !groupsForCourse.value.some((g) => g.id === form.groupId)) form.groupId = "";
};
const syncDateTo = () => {
  if (!form.dateTo || form.dateTo < form.dateFrom) form.dateTo = form.dateFrom;
};
const toggleDay = (n: number) => {
  form.weekdays = form.weekdays.includes(n) ? form.weekdays.filter((d) => d !== n) : [...form.weekdays, n].sort((a, b) => a - b);
};

const save = async () => {
  if (!form.weekdays.length) {
    notification.show({ type: "error", title: "Ошибка", message: "Выберите хотя бы один день недели" });
    return;
  }
  saving.value = true;
  try {
    const body = {
      classroomId: form.classroomId,
      courseId: form.courseId,
      instructorId: form.instructorId || null,
      groupId: form.groupId || null,
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      weekdays: form.weekdays,
      note: form.note || null,
    };
    await authFetch(editingId.value ? `/api/schedule/bookings/${editingId.value}` : "/api/schedule/bookings", {
      method: editingId.value ? "PUT" : "POST",
      body,
    });
    notification.show({ type: "success", title: "Готово", message: editingId.value ? "Бронь обновлена" : "Аудитория забронирована" });
    modalOpen.value = false;
    await load();
  } catch (e) {
    notification.show({ type: "error", title: "Не удалось сохранить бронь", message: errorText(e, "Ошибка сохранения") });
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  const b = toDelete.value;
  toDelete.value = null;
  if (!b) return;
  try {
    await authFetch(`/api/schedule/bookings/${b.id}`, { method: "DELETE" });
    notification.show({ type: "success", title: "Готово", message: "Бронь снята" });
    await load();
  } catch (e) {
    notification.show({ type: "error", title: "Ошибка", message: errorText(e, "Не удалось снять бронь") });
  }
};

onMounted(async () => {
  await Promise.all([loadOptions(), load()]);
});
</script>

<style scoped>
.rb-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55 65 81);
}
:global(.dark) .rb-label {
  color: rgb(209 213 219);
}
.rb-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(209 213 219);
  background: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(17 24 39);
  outline: none;
}
.rb-input:focus {
  border-color: var(--color-primary, #465fff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary, #465fff) 20%, transparent);
}
:global(.dark) .rb-input {
  border-color: rgb(75 85 99);
  background: rgb(17 24 39);
  color: white;
}
.rb-icon-btn {
  border-radius: 0.375rem;
  padding: 0.375rem;
  color: rgb(75 85 99);
  transition: background-color 0.15s, color 0.15s;
}
.rb-icon-btn:hover {
  background: rgb(243 244 246);
  color: var(--color-primary, #465fff);
}
:global(.dark) .rb-icon-btn:hover {
  background: rgb(55 65 81);
}
</style>
