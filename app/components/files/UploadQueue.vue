<template>
  <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-2 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-2 opacity-0">
    <div v-if="uploads.length" class="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900" role="status" aria-live="polite">
      <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <span class="text-sm font-medium text-gray-800 dark:text-gray-100">
          {{ active ? `Загрузка… ${doneCount}/${uploads.length}` : errorCount ? 'Загрузка завершена с ошибками' : 'Загрузка завершена' }}
        </span>
        <button v-if="!active" type="button" class="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Закрыть" @click="emit('dismiss')"><X class="h-4 w-4" /></button>
      </div>
      <ul class="max-h-52 divide-y divide-gray-50 overflow-y-auto dark:divide-gray-800/60">
        <li v-for="u in uploads" :key="u.id" class="flex items-center gap-2 px-3 py-2 text-sm">
          <Loader2 v-if="u.status === 'uploading'" class="h-4 w-4 shrink-0 animate-spin text-primary" />
          <Clock v-else-if="u.status === 'pending'" class="h-4 w-4 shrink-0 text-gray-400" />
          <CheckCircle2 v-else-if="u.status === 'done'" class="h-4 w-4 shrink-0 text-success-500" />
          <AlertCircle v-else class="h-4 w-4 shrink-0 text-error-500" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-gray-700 dark:text-gray-200" :title="u.name">{{ u.name }}</p>
            <p v-if="u.error" class="truncate text-xs text-error-600">{{ u.error }}</p>
          </div>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { X, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import type { UploadTask } from '~/composables/useFileManagerUI';

const props = defineProps<{ uploads: UploadTask[] }>();
const emit = defineEmits<{ dismiss: [] }>();

const active = computed(() => props.uploads.some((u) => u.status === 'uploading' || u.status === 'pending'));
const doneCount = computed(() => props.uploads.filter((u) => u.status === 'done' || u.status === 'error').length);
const errorCount = computed(() => props.uploads.filter((u) => u.status === 'error').length);
</script>
