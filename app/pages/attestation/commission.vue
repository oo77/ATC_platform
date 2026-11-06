<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; «Добавить» — главное действие -->
    <UiPageHeader title="Комиссия аттестации" description="Реестр членов аттестационной комиссии">
      <template #actions>
        <UiButton size="sm" @click="openCreate"><Plus class="mr-1.5 h-4 w-4" /> Добавить</UiButton>
      </template>
    </UiPageHeader>

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>

      <!-- Пусто: общий компонент с кнопкой следующего шага -->
      <UiEmptyState v-else-if="members.length === 0" :icon="Gavel" title="Реестр пуст">
        <template #actions>
          <UiButton size="sm" @click="openCreate"><Plus class="mr-1.5 h-4 w-4" /> Добавить первого члена комиссии</UiButton>
        </template>
      </UiEmptyState>

      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full border-collapse text-left">
          <!-- Sticky-шапка без CAPS -->
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Ф.И.О.</th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Должность</th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Организация</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="m in members" :key="m.id" class="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <!-- Аватар-инициалы без градиента -->
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/10 text-xs font-semibold text-info">
                    {{ getInitials(m.fullName) }}
                  </div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ m.fullName }}</p>
                </div>
              </td>
              <td class="max-w-[280px] truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ m.position || "—" }}</td>
              <td class="max-w-[220px] truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ m.organization || "—" }}</td>
              <td class="px-4 py-3 text-center">
                <UiBadge size="sm" :color="m.isActive ? 'success' : 'light'">{{ m.isActive ? "Активен" : "Неактивен" }}</UiBadge>
              </td>
              <td class="px-4 py-3">
                <!-- Действия: одна иконка (изменить) + «⋯» с опасным удалением последним. Всегда видимы на touch, на lg — по hover/focus -->
                <div class="flex items-center justify-end gap-1 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                  <UiButton variant="ghost" size="xs" icon title="Изменить" aria-label="Изменить" @click="openEdit(m)">
                    <Pencil class="h-4 w-4" />
                  </UiButton>
                  <UiDropdown
                    icon-only
                    :groups="[{ items: [{ key: 'delete', label: 'Удалить', icon: Trash2, danger: true }] }]"
                    @select="remove(m)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модалка формы: поля h-9..h-10, подписи без CAPS -->
    <UiModal :is-open="showModal" :title="editing ? 'Изменить члена комиссии' : 'Новый член комиссии'" @close="showModal = false">
      <div class="space-y-4 p-6">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ф.И.О. <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.fullName"
            type="text"
            placeholder="О.М. Мусаев"
            class="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition-all focus:ring-1 dark:bg-gray-900"
            :class="errors.fullName ? 'border-danger focus:border-danger focus:ring-danger' : 'border-gray-200 focus:border-primary focus:ring-primary dark:border-gray-700'"
          />
          <p v-if="errors.fullName" class="text-xs font-medium text-danger">{{ errors.fullName }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Должность</label>
          <input
            v-model="form.position"
            type="text"
            placeholder="Директор ООО «Airports Training Center»"
            class="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Организация</label>
          <input
            v-model="form.organization"
            type="text"
            class="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <label v-if="editing" class="flex cursor-pointer select-none items-center gap-3 pt-1">
          <input type="checkbox" v-model="form.isActive" class="peer sr-only" />
          <span
            class="relative h-6 w-11 rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-success peer-checked:after:trangray-x-5 dark:bg-gray-700"
            @click="form.isActive = !form.isActive"
          ></span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Активен</span>
        </label>
      </div>
      <template #footer>
        <div class="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <UiButton variant="ghost" size="sm" @click="showModal = false">Отмена</UiButton>
          <UiButton :loading="saving" class="min-w-[140px]" @click="save">Сохранить</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Подтверждение удаления участника комиссии (заменяет нативный confirm) -->
    <UiConfirmModal
      :is-open="!!pendingRemove"
      title="Удалить из комиссии?"
      :message="`Удалить ${pendingRemove?.fullName ?? ''} из комиссии?`"
      @confirm="removeConfirmed"
      @cancel="pendingRemove = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Gavel, Plus, Pencil, Trash2 } from "lucide-vue-next";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const toast = useToast();

const loading = ref(true);
const members = ref([]);
const showModal = ref(false);
const saving = ref(false);
const editing = ref(null);
const form = ref({ fullName: "", position: "", organization: "", isActive: true });
const errors = ref({});

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
};

const load = async () => {
  loading.value = true;
  try {
    const res = await authFetch("/api/attestation/commission-members");
    if (res.success) members.value = res.members || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  errors.value = {};
  form.value = { fullName: "", position: "", organization: "", isActive: true };
  showModal.value = true;
};

const openEdit = (m) => {
  editing.value = m;
  errors.value = {};
  form.value = { fullName: m.fullName, position: m.position || "", organization: m.organization || "", isActive: m.isActive };
  showModal.value = true;
};

const save = async () => {
  errors.value = {};
  if (!form.value.fullName.trim()) {
    errors.value.fullName = "Укажите Ф.И.О.";
    return;
  }
  saving.value = true;
  try {
    const res = editing.value
      ? await authFetch(`/api/attestation/commission-members/${editing.value.id}`, { method: "PUT", body: form.value })
      : await authFetch("/api/attestation/commission-members", { method: "POST", body: form.value });

    if (res.success) {
      showModal.value = false;
      await load();
      toast.success("Сохранено");
    } else {
      toast.error(res.message || "Не удалось сохранить");
    }
  } finally {
    saving.value = false;
  }
};

// Безопасность UX: вместо нативного confirm() сначала запоминаем участника и открываем UiConfirmModal
const pendingRemove = ref(null);
const remove = (m) => {
  pendingRemove.value = m;
};

// Прежняя логика удаления выполняется после подтверждения в модалке
const removeConfirmed = async () => {
  const m = pendingRemove.value;
  if (!m) return;
  pendingRemove.value = null;
  const res = await authFetch(`/api/attestation/commission-members/${m.id}`, { method: "DELETE" });
  if (res.success) {
    members.value = members.value.filter((x) => x.id !== m.id);
    toast.success("Удалено");
  } else {
    toast.error(res.message || "Не удалось удалить");
  }
};

onMounted(load);
</script>
