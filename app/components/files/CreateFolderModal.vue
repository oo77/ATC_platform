<template>
  <UiModal :is-open="isOpen" title="Новая папка" size="sm" @close="emit('close')">
    <form id="create-folder-form" class="space-y-2" @submit.prevent="submit">
      <label for="folder-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
      <input
        id="folder-name"
        ref="inputRef"
        v-model="name"
        type="text"
        maxlength="255"
        autocomplete="off"
        placeholder="Например, Приказы 2026"
        class="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white"
        :class="{ 'border-error-500': error }"
      />
      <p v-if="error" class="text-sm text-error-600">{{ error }}</p>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="loading" @click="emit('close')">Отмена</UiButton>
        <UiButton type="submit" form="create-folder-form" :loading="loading" :disabled="!name.trim()">Создать</UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{ isOpen: boolean; onSubmit: (name: string) => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();

const name = ref('');
const error = ref('');
const loading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.isOpen, async (open) => {
  if (!open) return;
  name.value = '';
  error.value = '';
  await nextTick();
  inputRef.value?.focus();
});

const submit = async () => {
  const value = name.value.trim();
  if (!value || loading.value) return;
  if (/[\\/]/.test(value)) { error.value = 'Имя не должно содержать / и \\'; return; }
  loading.value = true;
  error.value = '';
  try {
    await props.onSubmit(value);
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Не удалось создать папку';
  } finally {
    loading.value = false;
  }
};
</script>
