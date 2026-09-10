<template>
  <UiModal :is-open="isOpen" title="Выбор инструкторов в группу" size="lg" @close="handleClose">
    <div class="p-5 space-y-4">
      <!-- Search and Bulk Actions Bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div class="relative flex-1">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по ФИО, специальности или телефону..."
            class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-9 text-sm outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            @click="searchQuery = ''"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="text-xs font-bold px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            @click="toggleSelectAll"
          >
            {{ allFilteredSelected ? "Снять выбор" : "Выбрать всех" }}
          </button>
          <span class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary">
            Выбрано: {{ selectedIds.length }}
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-12 flex flex-col items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"></div>
        <p class="text-xs font-medium text-slate-500 mt-3">Загрузка списка инструкторов...</p>
      </div>

      <!-- Empty: All Already Added -->
      <div
        v-else-if="availableInstructors.length === 0"
        class="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center"
      >
        <div class="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
          <Users class="w-5 h-5" />
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Все активные инструкторы уже в группе</p>
        <p class="text-xs text-slate-500 mt-1">Новых доступных инструкторов для добавления не найдено.</p>
      </div>

      <!-- Empty: No Search Matches -->
      <div
        v-else-if="filteredInstructors.length === 0"
        class="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center"
      >
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Ничего не найдено</p>
        <p class="text-xs text-slate-500 mt-1">Попробуйте изменить поисковый запрос</p>
      </div>

      <!-- Instructors List -->
      <div v-else class="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        <div
          v-for="ins in filteredInstructors"
          :key="ins.id"
          class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none"
          :class="[
            selectedIds.includes(ins.id)
              ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50',
          ]"
          @click="toggleSelection(ins.id)"
        >
          <input
            type="checkbox"
            :checked="selectedIds.includes(ins.id)"
            class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0 pointer-events-none"
          />

          <div
            class="h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border"
            :class="[
              selectedIds.includes(ins.id)
                ? 'bg-primary text-white border-primary'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            ]"
          >
            {{ getInitials(ins.fullName) }}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ ins.fullName }}
            </p>
            <div class="flex flex-wrap items-center gap-2 mt-0.5">
              <span
                v-if="ins.specialty"
                class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {{ ins.specialty }}
              </span>
              <span v-if="ins.phone" class="text-[11px] text-slate-400">
                {{ ins.phone }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          class="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          @click="handleClose"
        >
          Отмена
        </button>
        <UiButton
          variant="primary"
          class="gap-2 font-bold px-6 shadow-sm"
          :disabled="selectedIds.length === 0"
          :loading="submitting"
          @click="submitAdd"
        >
          <UserPlus class="w-4 h-4" />
          Добавить {{ selectedIds.length ? `(${selectedIds.length})` : "" }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Search, X, Users, UserPlus } from "lucide-vue-next";

interface InstructorItem {
  id: string;
  fullName: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
}

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  alreadySelectedIds: string[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "added", instructors: any[]): void;
}>();

const { authFetch } = useAuthFetch();
const toast = useToast();

const loading = ref(false);
const submitting = ref(false);
const instructors = ref<InstructorItem[]>([]);
const selectedIds = ref<string[]>([]);
const searchQuery = ref("");

const availableInstructors = computed(() => {
  const existingSet = new Set(props.alreadySelectedIds);
  return instructors.value.filter((i) => !existingSet.has(i.id));
});

const filteredInstructors = computed(() => {
  if (!searchQuery.value.trim()) return availableInstructors.value;
  const q = searchQuery.value.toLowerCase().trim();
  return availableInstructors.value.filter(
    (i) =>
      i.fullName.toLowerCase().includes(q) ||
      (i.specialty && i.specialty.toLowerCase().includes(q)) ||
      (i.phone && i.phone.toLowerCase().includes(q)) ||
      (i.email && i.email.toLowerCase().includes(q)),
  );
});

const allFilteredSelected = computed(() => {
  if (filteredInstructors.value.length === 0) return false;
  return filteredInstructors.value.every((i) => selectedIds.value.includes(i.id));
});

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
};

const loadInstructors = async () => {
  if (instructors.value.length > 0) return;
  loading.value = true;
  try {
    const res = await authFetch("/api/instructors/all");
    if (res.success) {
      instructors.value = res.instructors || [];
    }
  } catch (error) {
    console.error("Ошибка загрузки инструкторов:", error);
  } finally {
    loading.value = false;
  }
};

const toggleSelection = (id: string) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (allFilteredSelected.value) {
    const filteredIds = new Set(filteredInstructors.value.map((i) => i.id));
    selectedIds.value = selectedIds.value.filter((id) => !filteredIds.has(id));
  } else {
    const newIds = new Set([...selectedIds.value, ...filteredInstructors.value.map((i) => i.id)]);
    selectedIds.value = Array.from(newIds);
  }
};

const handleClose = () => {
  selectedIds.value = [];
  searchQuery.value = "";
  emit("close");
};

const submitAdd = async () => {
  if (!selectedIds.value.length) return;
  submitting.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${props.groupId}/instructors`, {
      method: "POST",
      body: { instructorIds: selectedIds.value },
    });
    if (res.success) {
      toast.success(`Добавлено инструкторов: ${selectedIds.value.length}`);
      emit("added", res.instructors);
      handleClose();
    } else {
      toast.error(res.message || "Не удалось добавить инструкторов");
    }
  } catch (error: any) {
    toast.error(error?.message || "Ошибка при добавлении инструкторов");
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      selectedIds.value = [];
      searchQuery.value = "";
      loadInstructors();
    }
  },
);
</script>
