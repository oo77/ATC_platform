<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">Комиссия аттестации</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Реестр членов комиссии</p>
      </div>
      <UiButton @click="openCreate">+ Добавить</UiButton>
    </div>

    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-meta-4 text-left text-gray-600 dark:text-gray-300">
          <tr>
            <th class="px-6 py-3 font-medium">Ф.И.О.</th>
            <th class="px-6 py-3 font-medium">Должность</th>
            <th class="px-6 py-3 font-medium">Организация</th>
            <th class="px-6 py-3 font-medium">Статус</th>
            <th class="px-6 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="m in members" :key="m.id">
            <td class="px-6 py-3 font-medium text-gray-900 dark:text-white">{{ m.fullName }}</td>
            <td class="px-6 py-3">{{ m.position || "—" }}</td>
            <td class="px-6 py-3">{{ m.organization || "—" }}</td>
            <td class="px-6 py-3">
              <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', m.isActive ? 'bg-success/10 text-success' : 'bg-gray-100 dark:bg-gray-700 text-gray-500']">
                {{ m.isActive ? "Активен" : "Неактивен" }}
              </span>
            </td>
            <td class="px-6 py-3 text-right">
              <button class="text-primary hover:underline text-xs mr-3" @click="openEdit(m)">Изменить</button>
              <button class="text-danger hover:underline text-xs" @click="remove(m)">Удалить</button>
            </td>
          </tr>
          <tr v-if="members.length === 0">
            <td colspan="5" class="px-6 py-6 text-center text-gray-500 dark:text-gray-400">Реестр пуст</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiModal :is-open="showModal" :title="editing ? 'Изменить члена комиссии' : 'Новый член комиссии'" @close="showModal = false">
      <div class="p-6 space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Ф.И.О.</label>
          <input v-model="form.fullName" type="text" class="w-full rounded-lg border border-stroke dark:border-strokedark bg-transparent px-4 py-2.5 outline-none focus:border-primary" placeholder="О.М. Мусаев" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Должность</label>
          <input v-model="form.position" type="text" class="w-full rounded-lg border border-stroke dark:border-strokedark bg-transparent px-4 py-2.5 outline-none focus:border-primary" placeholder="Директор ООО «Airports Training Center»" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Организация</label>
          <input v-model="form.organization" type="text" class="w-full rounded-lg border border-stroke dark:border-strokedark bg-transparent px-4 py-2.5 outline-none focus:border-primary" />
        </div>
        <label v-if="editing" class="flex items-center gap-2 text-sm">
          <input v-model="form.isActive" type="checkbox" />
          Активен
        </label>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-stroke dark:border-strokedark">
          <UiButton variant="outline" @click="showModal = false">Отмена</UiButton>
          <UiButton :loading="saving" @click="save">Сохранить</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const toast = useToast();

const loading = ref(true);
const members = ref([]);
const showModal = ref(false);
const saving = ref(false);
const editing = ref(null);
const form = ref({ fullName: "", position: "", organization: "", isActive: true });

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
  form.value = { fullName: "", position: "", organization: "", isActive: true };
  showModal.value = true;
};

const openEdit = (m) => {
  editing.value = m;
  form.value = { fullName: m.fullName, position: m.position || "", organization: m.organization || "", isActive: m.isActive };
  showModal.value = true;
};

const save = async () => {
  if (!form.value.fullName.trim()) {
    toast.error("Укажите Ф.И.О.");
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
  } else {
    toast.error(res.message || "Не удалось удалить");
  }
};

onMounted(load);
</script>
