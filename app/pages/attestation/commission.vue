<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-info/10 text-info shrink-0">
          <Gavel class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Комиссия аттестации</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">Реестр членов аттестационной комиссии</p>
        </div>
      </div>
      <UiButton size="sm" class="h-10 px-4 gap-2 font-bold shadow-sm shrink-0" @click="openCreate">
        <Plus class="w-4 h-4" /> Добавить
      </UiButton>
    </div>

    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>

      <div v-else-if="members.length === 0" class="p-16 text-center">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-full inline-block mb-4">
          <Gavel class="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <p class="text-slate-500 font-medium">Реестр пуст</p>
        <UiButton class="mt-6 gap-2 font-bold" @click="openCreate">
          <Plus class="w-4 h-4" /> Добавить первого члена комиссии
        </UiButton>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ф.И.О.</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Должность</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Организация</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Статус</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="m in members"
              :key="m.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-info/20 to-info/5 text-info flex items-center justify-center font-bold text-xs border border-info/10"
                  >
                    {{ getInitials(m.fullName) }}
                  </div>
                  <p class="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{{ m.fullName }}</p>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 max-w-[280px] truncate">
                {{ m.position || "—" }}
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                {{ m.organization || "—" }}
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border"
                  :class="m.isActive
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'"
                >
                  {{ m.isActive ? "Активен" : "Неактивен" }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                    @click="openEdit(m)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
                    @click="remove(m)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiModal :is-open="showModal" :title="editing ? 'Изменить члена комиссии' : 'Новый член комиссии'" @close="showModal = false">
      <div class="p-6 space-y-5">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ф.И.О. <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.fullName"
            type="text"
            placeholder="О.М. Мусаев"
            class="w-full rounded-xl border bg-transparent py-3 px-4 outline-none focus:ring-1 transition-all font-medium dark:bg-slate-800"
            :class="errors.fullName ? 'border-danger focus:border-danger focus:ring-danger' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary'"
          />
          <p v-if="errors.fullName" class="text-xs text-danger font-semibold">{{ errors.fullName }}</p>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Должность</label>
          <input
            v-model="form.position"
            type="text"
            placeholder="Директор ООО «Airports Training Center»"
            class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Организация</label>
          <input
            v-model="form.organization"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
          />
        </div>
        <label v-if="editing" class="flex items-center gap-3 pt-1 cursor-pointer select-none">
          <input type="checkbox" v-model="form.isActive" class="peer sr-only" />
          <span
            class="relative w-11 h-6 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors peer-checked:bg-success after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5"
            @click="form.isActive = !form.isActive"
          ></span>
          <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Активен</span>
        </label>
      </div>
      <template #footer>
        <div class="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button class="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" @click="showModal = false">
            Отмена
          </button>
          <UiButton :loading="saving" class="font-bold px-6 min-w-[140px]" @click="save">Сохранить</UiButton>
        </div>
      </template>
    </UiModal>
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

const remove = async (m) => {
  if (!confirm(`Удалить ${m.fullName} из комиссии?`)) return;
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
