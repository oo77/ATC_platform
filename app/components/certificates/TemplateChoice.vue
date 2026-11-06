<template>
  <div class="space-y-2">
    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Шаблон сертификата
    </p>

    <!-- Стандартный (привязан к программе) -->
    <label
      class="flex items-start gap-3 p-3 rounded-lg border transition-colors"
      :class="[
        mode === 'standard'
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
        standardTemplate ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
      ]"
    >
      <input
        v-model="mode"
        type="radio"
        value="standard"
        :disabled="!standardTemplate"
        class="mt-0.5"
      />
      <div class="min-w-0">
        <p class="font-medium text-gray-900 dark:text-white">Стандартный</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {{
            standardTemplate
              ? standardTemplate.name
              : "К программе шаблон не прикреплён"
          }}
        </p>
      </div>
    </label>

    <!-- Другой (любой из активных) -->
    <label
      class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
      :class="
        mode === 'other'
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      "
    >
      <input v-model="mode" type="radio" value="other" class="mt-0.5" />
      <div class="min-w-0">
        <p class="font-medium text-gray-900 dark:text-white">Другой</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Выбрать из всех активных шаблонов
        </p>
      </div>
    </label>

    <div v-if="mode === 'other'" class="pt-1">
      <p
        v-if="loading"
        class="text-sm text-gray-500 dark:text-gray-400 px-1 py-2"
      >
        Загрузка шаблонов...
      </p>
      <p v-else-if="loadError" class="text-sm text-danger px-1 py-2">
        {{ loadError }}
      </p>
      <p
        v-else-if="templates.length === 0"
        class="text-sm text-gray-500 dark:text-gray-400 px-1 py-2"
      >
        Активных шаблонов нет
      </p>
      <select
        v-else
        v-model="otherTemplateId"
        class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="" disabled>Выберите шаблон</option>
        <option v-for="t in templates" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CertificateTemplate } from "~/types/certificate";

type TemplateChoiceValue = Pick<CertificateTemplate, "id" | "name">;

const props = defineProps<{
  /** Шаблон, прикреплённый к программе (курсу) */
  standardTemplate: TemplateChoiceValue | null;
  modelValue: TemplateChoiceValue | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: TemplateChoiceValue | null];
}>();

const { authFetch } = useAuthFetch();

const mode = ref<"standard" | "other">(
  props.standardTemplate ? "standard" : "other",
);
const otherTemplateId = ref("");
const templates = ref<TemplateChoiceValue[]>([]);
const loading = ref(false);
const loaded = ref(false);
const loadError = ref("");

const loadTemplates = async () => {
  if (loaded.value || loading.value) return;
  loading.value = true;
  loadError.value = "";
  try {
    const res = await authFetch<{
      success: boolean;
      templates: TemplateChoiceValue[];
    }>("/api/certificates/templates?isActive=true");
    templates.value = (res.templates || []).map((t) => ({
      id: t.id,
      name: t.name,
    }));
    loaded.value = true;
  } catch (e: any) {
    console.error("Error loading certificate templates:", e);
    loadError.value =
      e?.statusCode === 403
        ? "Недостаточно прав для просмотра шаблонов"
        : e?.data?.message || "Не удалось загрузить шаблоны";
  } finally {
    loading.value = false;
  }
};

const selected = computed<TemplateChoiceValue | null>(() => {
  if (mode.value === "standard") return props.standardTemplate;
  return templates.value.find((t) => t.id === otherTemplateId.value) || null;
});

watch(
  mode,
  (value) => {
    if (value === "other") loadTemplates();
  },
  { immediate: true },
);

watch(selected, (value) => emit("update:modelValue", value), {
  immediate: true,
});
</script>
