<template>
  <UiModal :is-open="isOpen" :title="`Защитить паролем: ${folderName}`" size="sm" @close="emit('close')">
    <form id="set-password-form" class="space-y-3" @submit.prevent="submit">
      <div>
        <label for="fm-pass" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Пароль</label>
        <input id="fm-pass" ref="inputRef" v-model="password" type="password" autocomplete="new-password" placeholder="Минимум 6 символов" class="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white" />
      </div>
      <div>
        <label for="fm-pass2" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Повторите пароль</label>
        <input id="fm-pass2" v-model="confirm" type="password" autocomplete="new-password" class="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white" :class="{ 'border-error-500': error }" />
        <p v-if="error" class="mt-1 text-sm text-error-600">{{ error }}</p>
      </div>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="loading" @click="emit('close')">Отмена</UiButton>
        <UiButton type="submit" form="set-password-form" :loading="loading" :disabled="!password">Установить</UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{ isOpen: boolean; folderName: string; onSubmit: (password: string) => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();

const password = ref('');
const confirm = ref('');
const error = ref('');
const loading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.isOpen, async (open) => {
  if (!open) return;
  password.value = confirm.value = error.value = '';
  loading.value = false;
  await nextTick();
  inputRef.value?.focus();
});

const submit = async () => {
  if (password.value.length < 6) { error.value = 'Пароль должен содержать минимум 6 символов'; return; }
  if (password.value !== confirm.value) { error.value = 'Пароли не совпадают'; return; }
  loading.value = true;
  error.value = '';
  try {
    await props.onSubmit(password.value);
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось установить пароль';
  } finally {
    loading.value = false;
  }
};
</script>
