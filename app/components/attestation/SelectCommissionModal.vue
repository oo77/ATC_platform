<template>
  <UiModal :is-open="isOpen" title="Формирование аттестационной комиссии" size="lg" @close="handleClose">
    <div class="p-5 space-y-4">
      <!-- Status Notice -->
      <div
        class="flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold"
        :class="[
          chairmanCount === 1 && selectedCount > 0
            ? 'bg-success/5 border-success/20 text-success'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        ]"
      >
        <Crown class="w-4 h-4 shrink-0" />
        <div class="flex-1 min-w-0">
          <span v-if="chairmanCount === 1">
            Председатель: <b class="font-bold">{{ chairmanMemberName }}</b> (всего выбрано: {{ selectedCount }})
          </span>
          <span v-else-if="chairmanCount === 0">
            В комиссии должен быть назначен ровно <b>один председатель</b> (выбрано: {{ selectedCount }})
          </span>
          <span v-else>
            Выбрано несколько председателей ({{ chairmanCount }}). Должен быть только один.
          </span>
        </div>
      </div>

      <!-- Search and Link Bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div class="relative flex-1">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по ФИО, должности или организации..."
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

        <NuxtLink
          to="/attestation/commission"
          target="_blank"
          class="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 px-2 py-1"
        >
          Реестр комиссии <ExternalLink class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-12 flex flex-col items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"></div>
        <p class="text-xs font-medium text-slate-500 mt-3">Загрузка членов комиссии...</p>
      </div>

      <!-- Empty: No commission members in database -->
      <div
        v-else-if="allMembers.length === 0"
        class="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center"
      >
        <div class="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
          <Gavel class="w-5 h-5" />
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Реестр членов комиссии пуст</p>
        <p class="text-xs text-slate-500 mt-1">Добавьте членов комиссии в реестре, чтобы формировать комиссию группы.</p>
        <NuxtLink
          to="/attestation/commission"
          class="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
        >
          Перейти в реестр комиссии
        </NuxtLink>
      </div>

      <!-- Empty: No search results -->
      <div
        v-else-if="filteredMembers.length === 0"
        class="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center"
      >
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Ничего не найдено</p>
        <p class="text-xs text-slate-500 mt-1">Попробуйте изменить поисковый запрос</p>
      </div>

      <!-- Members List -->
      <div v-else class="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        <div
          v-for="m in filteredMembers"
          :key="m.id"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all"
          :class="[
            isMemberSelected(m.id)
              ? getRole(m.id) === 'chairman'
                ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                : 'border-primary/40 bg-primary/5 dark:bg-primary/10'
              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50',
          ]"
        >
          <!-- Left: Checkbox + Avatar + Info -->
          <div
            class="flex items-center gap-3 min-w-0 cursor-pointer select-none flex-1"
            @click="toggleMember(m.id)"
          >
            <input
              type="checkbox"
              :checked="isMemberSelected(m.id)"
              class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0 pointer-events-none"
            />

            <div
              class="h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border"
              :class="[
                isMemberSelected(m.id) && getRole(m.id) === 'chairman'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : isMemberSelected(m.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
              ]"
            >
              <Crown v-if="isMemberSelected(m.id) && getRole(m.id) === 'chairman'" class="w-4 h-4" />
              <span v-else>{{ getInitials(m.fullName) }}</span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {{ m.fullName }}
                </p>
                <span
                  v-if="isMemberSelected(m.id) && getRole(m.id) === 'chairman'"
                  class="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400"
                >
                  Председатель
                </span>
              </div>
              <p class="text-xs text-slate-500 truncate mt-0.5">
                {{ m.position || m.organization || "Член комиссии" }}
              </p>
            </div>
          </div>

          <!-- Right: Role Selector (Only when selected) -->
          <div v-if="isMemberSelected(m.id)" class="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
            <select
              :value="getRole(m.id)"
              class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
              @change="setRole(m.id, ($event.target as HTMLSelectElement).value as any)"
            >
              <option value="chairman">👑 Председатель</option>
              <option value="responsible">🧭 Ответственный</option>
              <option value="secretary">📝 Секретарь</option>
              <option value="member">👤 Член комиссии</option>
            </select>
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
          :disabled="selectedCount === 0 || chairmanCount !== 1"
          :loading="submitting"
          @click="submitSave"
        >
          <Save class="w-4 h-4" />
          Сохранить состав ({{ selectedCount }})
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Search, X, Gavel, Crown, Save, ExternalLink } from "lucide-vue-next";

type CommissionRole = "chairman" | "responsible" | "secretary" | "member";

interface CommissionMemberItem {
  id: string;
  fullName: string;
  position?: string | null;
  organization?: string | null;
  isActive?: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  currentMembers: Array<{ commissionMemberId: string; role: CommissionRole }>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved", commission: any[]): void;
}>();

const { authFetch } = useAuthFetch();
const toast = useToast();

const loading = ref(false);
const submitting = ref(false);
const allMembers = ref<CommissionMemberItem[]>([]);
const draftMembers = ref<Map<string, CommissionRole>>(new Map());
const searchQuery = ref("");

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return allMembers.value;
  const q = searchQuery.value.toLowerCase().trim();
  return allMembers.value.filter(
    (m) =>
      m.fullName.toLowerCase().includes(q) ||
      (m.position && m.position.toLowerCase().includes(q)) ||
      (m.organization && m.organization.toLowerCase().includes(q)),
  );
});

const selectedCount = computed(() => draftMembers.value.size);

const chairmanCount = computed(() => {
  let count = 0;
  for (const role of draftMembers.value.values()) {
    if (role === "chairman") count++;
  }
  return count;
});

const chairmanMemberName = computed(() => {
  for (const [id, role] of draftMembers.value.entries()) {
    if (role === "chairman") {
      const found = allMembers.value.find((m) => m.id === id);
      return found?.fullName || "Неизвестный";
    }
  }
  return "";
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

const isMemberSelected = (id: string) => draftMembers.value.has(id);

const getRole = (id: string): CommissionRole => draftMembers.value.get(id) || "member";

const setRole = (id: string, newRole: CommissionRole) => {
  // If making this member chairman, demote any other chairman to member
  if (newRole === "chairman") {
    for (const [otherId, otherRole] of draftMembers.value.entries()) {
      if (otherRole === "chairman" && otherId !== id) {
        draftMembers.value.set(otherId, "member");
      }
    }
  }
  draftMembers.value.set(id, newRole);
};

const toggleMember = (id: string) => {
  if (draftMembers.value.has(id)) {
    draftMembers.value.delete(id);
  } else {
    // If no chairman exists, set first member as chairman by default
    const role: CommissionRole = chairmanCount.value === 0 ? "chairman" : "member";
    draftMembers.value.set(id, role);
  }
};

const loadMembers = async () => {
  if (allMembers.value.length > 0) return;
  loading.value = true;
  try {
    const res = await authFetch("/api/attestation/commission-members");
    if (res.success) {
      allMembers.value = (res.members || []).filter((m: CommissionMemberItem) => m.isActive !== false);
    }
  } catch (error) {
    console.error("Ошибка загрузки реестра комиссии:", error);
  } finally {
    loading.value = false;
  }
};

const initDraft = () => {
  const map = new Map<string, CommissionRole>();
  for (const item of props.currentMembers) {
    map.set(item.commissionMemberId, item.role);
  }
  draftMembers.value = map;
};

const handleClose = () => {
  searchQuery.value = "";
  emit("close");
};

const submitSave = async () => {
  if (draftMembers.value.size === 0) {
    toast.error("Добавьте хотя бы одного члена комиссии");
    return;
  }
  if (chairmanCount.value !== 1) {
    toast.error("В комиссии должен быть ровно один председатель");
    return;
  }

  const membersPayload = Array.from(draftMembers.value.entries()).map(([commissionMemberId, role]) => ({
    commissionMemberId,
    role,
  }));

  submitting.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${props.groupId}/commission`, {
      method: "PUT",
      body: { members: membersPayload },
    });
    if (res.success) {
      toast.success("Состав комиссии успешно сохранён");
      emit("saved", res.commission);
      handleClose();
    } else {
      toast.error(res.message || "Не удалось сохранить комиссию");
    }
  } catch (error: any) {
    toast.error(error?.message || "Ошибка сохранения комиссии");
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      searchQuery.value = "";
      initDraft();
      loadMembers();
    }
  },
  { immediate: true },
);
</script>
