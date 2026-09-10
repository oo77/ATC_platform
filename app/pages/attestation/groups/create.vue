<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 space-y-6">
    <!-- Header -->
    <div class="space-y-2 animate-in fade-in slide-in-from-top-3 duration-500">
      <NuxtLink
        to="/attestation"
        class="group inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        </div>
        Назад к списку групп
      </NuxtLink>

      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Новая группа аттестации
        </h1>
        <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
          Инструкторов, комиссию и параметры экзамена можно настроить сразу после создания
        </p>
      </div>
    </div>

    <!-- Main Card -->
    <div class="max-w-2xl">
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
      >
        <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Параметры группы
            </h3>
            <p class="text-[11px] text-slate-400">Укажите уникальный код и наименование группы</p>
          </div>
        </div>

        <form class="p-4 space-y-4" @submit.prevent="createGroup">
          <!-- Code Field with Auto-Suggest -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Код группы <span class="text-danger">*</span>
              </label>
              <button
                type="button"
                class="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                @click="suggestCode"
              >
                <Sparkles class="w-3 h-3" /> Сгенерировать код
              </button>
            </div>

            <input
              v-model="form.code"
              type="text"
              placeholder="ATT-2026-08"
              class="w-full rounded-lg border bg-slate-50/50 py-2 px-3 text-xs outline-none focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-900 font-mono font-bold uppercase transition-all"
              :class="[
                errors.code
                  ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
                  : 'border-slate-200 dark:border-slate-700 focus:border-primary',
              ]"
              @input="errors.code = ''"
            />
            <p v-if="errors.code" class="text-[11px] text-danger font-semibold">{{ errors.code }}</p>
          </div>

          <!-- Name Field -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Наименование группы <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Сертификационный экзамен инструкторов ПАБ"
              class="w-full rounded-lg border bg-slate-50/50 py-2 px-3 text-xs outline-none focus:bg-white dark:bg-slate-800/50 dark:focus:bg-slate-900 font-medium transition-all"
              :class="[
                errors.name
                  ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
                  : 'border-slate-200 dark:border-slate-700 focus:border-primary',
              ]"
              @input="errors.name = ''"
            />
            <p v-if="errors.name" class="text-[11px] text-danger font-semibold">{{ errors.name }}</p>
          </div>

          <!-- Description Field -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Описание / Примечание
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Необязательно (цель аттестации, особенности проведения)"
              class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 font-medium resize-none transition-all"
            ></textarea>
          </div>

          <!-- Helper Banner -->
          <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
            <Info class="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <p class="leading-relaxed">
              Сразу после создания откроется страница группы, где вы сможете с помощью удобных модальных окон выбрать инструкторов, назначить комиссию и задать дату экзамена.
            </p>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <NuxtLink
              to="/attestation"
              class="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Отмена
            </NuxtLink>

            <UiButton
              type="submit"
              variant="primary"
              class="gap-1.5 font-bold px-5 text-xs shadow-xs"
              :loading="creating"
            >
              <Plus class="w-3.5 h-3.5" /> Создать группу
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft, ShieldCheck, Info, Plus, Sparkles } from "lucide-vue-next";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const toast = useToast();

const creating = ref(false);
const form = ref({ code: "", name: "", description: "" });
const errors = ref<Record<string, string>>({});

const suggestCode = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  form.value.code = `ATT-${year}-${month}-${randomSuffix}`;
  errors.value.code = "";
};

const validate = () => {
  errors.value = {};
  if (!form.value.code.trim()) {
    errors.value.code = "Укажите код группы";
  }
  if (!form.value.name.trim()) {
    errors.value.name = "Укажите наименование группы";
  }
  return Object.keys(errors.value).length === 0;
};

const createGroup = async () => {
  if (!validate()) {
    toast.error("Заполните обязательные поля формы");
    return;
  }
  creating.value = true;
  try {
    const res = await authFetch("/api/attestation/groups", {
      method: "POST",
      body: {
        code: form.value.code.trim().toUpperCase(),
        name: form.value.name.trim(),
        description: form.value.description?.trim() || undefined,
      },
    });
    if (res.success) {
      toast.success("Группа аттестации успешно создана");
      await navigateTo(`/attestation/groups/${res.group.id}`);
    } else {
      if (res.message?.includes("кодом уже существует")) {
        errors.value.code = res.message;
      }
      toast.error(res.message || "Не удалось создать группу");
    }
  } catch (error: any) {
    toast.error(error?.message || "Ошибка при создании группы");
  } finally {
    creating.value = false;
  }
};
</script>
