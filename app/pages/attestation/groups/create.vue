<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="mb-6">
        <NuxtLink
          to="/attestation"
          class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
          Назад к списку групп
        </NuxtLink>
      </div>
      <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        Новая группа аттестации
      </h1>
      <p class="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
        Инструкторов, комиссию и расписание можно будет добавить сразу после создания
      </p>
    </div>

    <div class="max-w-2xl">
      <div
        class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        <div class="border-b border-slate-100 dark:border-slate-800 p-6">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-primary" />
            Основная информация
          </h3>
        </div>

        <div class="p-6 space-y-5">
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Код группы <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="ATT-2026-08"
              class="w-full rounded-xl border bg-transparent py-3 px-4 outline-none focus:ring-1 transition-all font-medium dark:bg-slate-800"
              :class="errors.code ? 'border-danger focus:border-danger focus:ring-danger' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary'"
            />
            <p v-if="errors.code" class="text-xs text-danger font-semibold">{{ errors.code }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Название <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Сертификационный экзамен инструкторов ПАБ"
              class="w-full rounded-xl border bg-transparent py-3 px-4 outline-none focus:ring-1 transition-all font-medium dark:bg-slate-800"
              :class="errors.name ? 'border-danger focus:border-danger focus:ring-danger' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary'"
            />
            <p v-if="errors.name" class="text-xs text-danger font-semibold">{{ errors.name }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Описание</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Необязательно"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium resize-none"
            ></textarea>
          </div>

          <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 flex items-start gap-2.5">
            <Info class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p class="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
              После создания группы вы сможете добавить инструкторов, сформировать комиссию и назначить
              тест с датой экзамена на странице редактирования.
            </p>
          </div>
        </div>

        <div class="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <NuxtLink to="/attestation" class="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            Отмена
          </NuxtLink>
          <UiButton class="gap-2 font-bold px-6 min-w-[160px]" :loading="creating" @click="createGroup">
            <Plus class="w-4 h-4" /> Создать группу
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ArrowLeft, ShieldCheck, Info, Plus } from "lucide-vue-next";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const toast = useToast();

const creating = ref(false);
const form = ref({ code: "", name: "", description: "" });
const errors = ref({});

const validate = () => {
  errors.value = {};
  if (!form.value.code.trim()) errors.value.code = "Укажите код группы";
  if (!form.value.name.trim()) errors.value.name = "Укажите название группы";
  return Object.keys(errors.value).length === 0;
};

const createGroup = async () => {
  if (!validate()) return;
  creating.value = true;
  try {
    const res = await authFetch("/api/attestation/groups", {
      method: "POST",
      body: form.value,
    });
    if (res.success) {
      toast.success("Группа создана");
      await navigateTo(`/attestation/groups/${res.group.id}/edit`);
    } else {
      toast.error(res.message || "Не удалось создать группу");
    }
  } finally {
    creating.value = false;
  }
};
</script>
