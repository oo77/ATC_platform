<template>
  <UiModal :is-open="isOpen" title="Синхронизация с Course Planner" size="lg" @close="$emit('close')">
    <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-gray-500">
      <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Получение данных из Course Planner…
    </div>

    <div
      v-else-if="error"
      class="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500"
    >
      {{ error }}
    </div>

    <div v-else-if="diff" class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <p class="font-semibold text-gray-900 dark:text-white">{{ diff.plannerGroup.name }}</p>
          <p class="text-xs text-gray-500">
            {{ diff.plannerGroup.course?.name || "Курс не указан" }}
          </p>
        </div>
        <p class="text-xs text-gray-400">
          Последняя синхронизация: {{ syncedAt ? new Date(syncedAt).toLocaleString("ru-RU") : "—" }}
        </p>
      </div>

      <div
        v-if="diff.courseMismatch"
        class="rounded-lg bg-warning-50 p-3 text-xs text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
      >
        В Course Planner у группы другая программа: «{{ diff.plannerCourse?.name }}». Программа автоматически не меняется —
        при необходимости измените её через «Редактировать».
      </div>

      <div v-if="nothingToDo" class="flex items-center gap-2 rounded-lg bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/15 dark:text-success-500">
        <CheckCircle2 class="h-4 w-4" /> Группа совпадает с Course Planner.
      </div>

      <!-- Поля группы -->
      <section v-if="diff.fieldChanges.length">
        <label class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <input v-model="opts.updateFields" type="checkbox" class="h-4 w-4 rounded accent-primary" />
          Обновить данные группы
        </label>
        <table class="w-full text-sm">
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="ch in diff.fieldChanges" :key="ch.field">
              <td class="py-1.5 pr-3 text-gray-500">{{ ch.label }}</td>
              <td class="py-1.5 pr-3 text-gray-400 line-through">{{ fmt(ch.field, ch.current) }}</td>
              <td class="py-1.5 font-medium text-gray-900 dark:text-white">{{ fmt(ch.field, ch.planner) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Новые слушатели -->
      <section v-if="diff.studentsToAdd.length">
        <label class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <input v-model="opts.addStudents" type="checkbox" class="h-4 w-4 rounded accent-primary" />
          Добавить слушателей из планера ({{ diff.studentsToAdd.length }})
        </label>
        <ul class="max-h-[180px] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          <li v-for="s in diff.studentsToAdd" :key="s.pinfl" class="flex items-center justify-between gap-3 px-3 py-1.5">
            <span class="truncate">{{ s.name }} <span class="text-xs text-gray-400">{{ s.pinfl }}</span></span>
            <UiBadge size="sm" :color="s.status === 'existing' ? 'success' : 'info'">
              {{ s.status === "existing" ? "в ATC" : "будет создан" }}
            </UiBadge>
          </li>
        </ul>
      </section>

      <!-- Слушатели, которых нет в планере -->
      <section v-if="diff.studentsNotInPlanner.length">
        <label class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <input v-model="opts.removeMissing" type="checkbox" class="h-4 w-4 rounded accent-primary" />
          Исключить из группы тех, кого нет в планере ({{ diff.studentsNotInPlanner.length }})
        </label>
        <p v-if="opts.removeMissing" class="mb-2 text-xs text-error-600">
          Слушатели будут удалены из группы ATC вместе с привязкой к ней.
        </p>
        <ul class="max-h-[150px] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          <li v-for="s in diff.studentsNotInPlanner" :key="s.studentId" class="px-3 py-1.5">
            {{ s.fullName }} <span class="text-xs text-gray-400">{{ s.pinfl }}</span>
          </li>
        </ul>
      </section>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <UiButton variant="danger-ghost" size="sm" :disabled="applying" @click="unlink">Отвязать от планера</UiButton>
        <div class="flex gap-3">
          <UiButton variant="outline" @click="$emit('close')">Закрыть</UiButton>
          <UiButton :loading="applying" :disabled="!diff || nothingSelected" @click="applySync">Применить</UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { Loader2, CheckCircle2 } from "lucide-vue-next";

interface Diff {
  plannerGroup: { id: string; name: string; course: { name: string } | null };
  plannerCourse: { id: string; name: string } | null;
  courseMismatch: boolean;
  fieldChanges: Array<{ field: "startDate" | "endDate" | "classroom"; label: string; current: string | null; planner: string | null }>;
  studentsToAdd: Array<{ pinfl: string; name: string; status: "existing" | "new" }>;
  studentsNotInPlanner: Array<{ studentId: string; fullName: string; pinfl: string }>;
}

const props = defineProps<{ isOpen: boolean; groupId: string }>();
const emit = defineEmits<{ close: []; synced: []; unlinked: [] }>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

const loading = ref(false);
const applying = ref(false);
const error = ref("");
const diff = ref<Diff | null>(null);
const syncedAt = ref<string | null>(null);
const opts = reactive({ updateFields: true, addStudents: true, removeMissing: false });

const nothingToDo = computed(
  () => !!diff.value && !diff.value.fieldChanges.length && !diff.value.studentsToAdd.length && !diff.value.studentsNotInPlanner.length,
);
const nothingSelected = computed(() => {
  const d = diff.value;
  if (!d) return true;
  return !(
    (opts.updateFields && d.fieldChanges.length) ||
    (opts.addStudents && d.studentsToAdd.length) ||
    (opts.removeMissing && d.studentsNotInPlanner.length)
  );
});

const errorMessage = (e: any, fallback: string) => e?.data?.message || e?.message || fallback;

const fmt = (field: string, v: string | null) => {
  if (!v) return "—";
  if (field === "classroom") return v;
  return new Date(`${v}T00:00:00`).toLocaleDateString("ru-RU");
};

const load = async () => {
  loading.value = true;
  error.value = "";
  diff.value = null;
  try {
    const res = await authFetch<{ success: boolean; diff: Diff; plannerSyncedAt: string | null }>(
      `/api/groups/${props.groupId}/planner-sync`,
    );
    diff.value = res.diff;
    syncedAt.value = res.plannerSyncedAt;
    opts.updateFields = true;
    opts.addStudents = true;
    opts.removeMissing = false;
  } catch (e: any) {
    error.value = errorMessage(e, "Не удалось получить данные из Course Planner");
  } finally {
    loading.value = false;
  }
};

const applySync = async () => {
  applying.value = true;
  try {
    const res = await authFetch<{
      success: boolean;
      result: {
        updatedFields: string[];
        added: number;
        created: number;
        removed: number;
        conflicts: Array<{ studentName: string; conflictGroupCode: string }>;
        errors: Array<{ name: string; pinfl: string; error: string }>;
      };
    }>(`/api/groups/${props.groupId}/planner-sync`, { method: "POST", body: { ...opts } });

    const r = res.result;
    const parts: string[] = [];
    if (r.updatedFields.length) parts.push(`обновлено: ${r.updatedFields.join(", ").toLowerCase()}`);
    if (r.added) parts.push(`добавлено слушателей: ${r.added}${r.created ? ` (новых в базе: ${r.created})` : ""}`);
    if (r.removed) parts.push(`исключено: ${r.removed}`);
    toast.success(parts.length ? `Синхронизация выполнена — ${parts.join("; ")}` : "Синхронизация выполнена");

    if (r.conflicts.length) {
      toast.warning(
        `Не добавлены из-за пересечения занятий: ${r.conflicts.slice(0, 3).map((c) => `${c.studentName} (${c.conflictGroupCode})`).join(", ")}${r.conflicts.length > 3 ? "…" : ""}`,
      );
    }
    if (r.errors.length) {
      toast.warning(`Пропущено слушателей: ${r.errors.length} (${r.errors[0]?.error})`);
    }
    emit("synced");
    emit("close");
  } catch (e: any) {
    toast.error(errorMessage(e, "Ошибка синхронизации"));
  } finally {
    applying.value = false;
  }
};

const unlink = async () => {
  if (!confirm("Отвязать группу от Course Planner? Данные группы и слушатели не изменятся.")) return;
  applying.value = true;
  try {
    await authFetch(`/api/groups/${props.groupId}/planner-link`, { method: "DELETE" });
    toast.success("Группа отвязана от Course Planner");
    emit("unlinked");
    emit("close");
  } catch (e: any) {
    toast.error(errorMessage(e, "Не удалось отвязать группу"));
  } finally {
    applying.value = false;
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) load();
  },
);
</script>
