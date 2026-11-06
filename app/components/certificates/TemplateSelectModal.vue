<template>
  <UiModal
    :is-open="isOpen"
    title="По какому шаблону выдать?"
    size="sm"
    @close="emit('close')"
  >
    <p v-if="student" class="text-gray-500 dark:text-gray-400 mb-4">
      Слушатель:
      <span class="font-medium text-gray-900 dark:text-white">{{
        student.fullName
      }}</span>
    </p>

    <CertificatesTemplateChoice
      v-model="selectedTemplate"
      :standard-template="standardTemplate"
    />

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="emit('close')"> Отмена </UiButton>
        <UiButton
          variant="primary"
          :disabled="!selectedTemplate"
          @click="handleConfirm"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Выдать сертификат
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { CertificateTemplate } from "~/types/certificate";

type TemplateChoiceValue = Pick<CertificateTemplate, "id" | "name">;

defineProps<{
  isOpen: boolean;
  student: { id: string; fullName: string } | null;
  /** Шаблон, прикреплённый к программе (курсу) */
  standardTemplate: TemplateChoiceValue | null;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [template: TemplateChoiceValue];
}>();

const selectedTemplate = ref<TemplateChoiceValue | null>(null);

const handleConfirm = () => {
  if (!selectedTemplate.value) return;
  emit("confirm", selectedTemplate.value);
};
</script>
