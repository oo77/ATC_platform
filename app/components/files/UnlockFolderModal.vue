<template>
  <UiModal :is-open="isOpen" title="Папка защищена паролем" size="sm" @close="emit('close')">
    <form id="unlock-form" class="space-y-2" @submit.prevent="submit">
      <p class="text-sm text-gray-600 dark:text-gray-300">Введите пароль, чтобы открыть «{{ folderName }}».</p>
      <input
        ref="inputRef"
        v-model="password"
        type="password"
        autocomplete="off"
        placeholder="Пароль"
        aria-label="Пароль"
        class="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white"
        :class="{ 'border-error-500': error }"
      />
      <p v-if="error" class="text-sm text-error-600">{{ error }}</p>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="loading" @click="emit('close')">Отмена</UiButton>
        <UiButton type="submit" form="unlock-form" :loading="loading" :disabled="!password">Открыть</UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{ isOpen: boolean; folderName: string; loading: boolean; error: string }>();
const emit = defineEmits<{ close: []; submit: [password: string] }>();

const password = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.isOpen, async (open) => {
  if (!open) return;
  password.value = '';
  await nextTick();
  inputRef.value?.focus();
});
// После неверного пароля очищаем поле, но оставляем фокус
watch(() => props.error, async (e) => {
  if (!e) return;
  password.value = '';
  await nextTick();
  inputRef.value?.focus();
});

const submit = () => {
  if (password.value && !props.loading) emit('submit', password.value);
};
</script>
