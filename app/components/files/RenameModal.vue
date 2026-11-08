<template>
  <UiModal :is-open="isOpen" :title="title" size="sm" @close="emit('close')">
    <form id="rename-form" class="space-y-2" @submit.prevent="submit">
      <label for="rename-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Новое название</label>
      <input
        id="rename-input"
        ref="inputRef"
        v-model="newName"
        type="text"
        maxlength="255"
        autocomplete="off"
        class="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white"
        :class="{ 'border-error-500': error }"
      />
      <p v-if="error" class="text-sm text-error-600">{{ error }}</p>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="loading" @click="emit('close')">Отмена</UiButton>
        <UiButton type="submit" form="rename-form" :loading="loading" :disabled="!newName.trim() || newName.trim() === currentName">Переименовать</UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  currentName: string;
  title: string;
  onSubmit: (name: string) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();

const newName = ref('');
const error = ref('');
const loading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

// Предзаполняем текущим именем и выделяем его без расширения — как в Проводнике/Finder
watch(() => props.isOpen, async (open) => {
  if (!open) return;
  newName.value = props.currentName;
  error.value = '';
  await nextTick();
  const el = inputRef.value;
  if (!el) return;
  el.focus();
  const dot = props.currentName.lastIndexOf('.');
  el.setSelectionRange(0, dot > 0 ? dot : props.currentName.length);
});

const submit = async () => {
  const value = newName.value.trim();
  if (!value || value === props.currentName || loading.value) return;
  if (/[\\/]/.test(value)) { error.value = 'Имя не должно содержать / и \\'; return; }
  loading.value = true;
  error.value = '';
  try {
    await props.onSubmit(value);
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Не удалось переименовать';
  } finally {
    loading.value = false;
  }
};
</script>
