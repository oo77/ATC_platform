<template>
  <UiModal :is-open="isOpen" @close="handleClose" title="Скачать архив сертификатов" size="md">
    <div class="space-y-5">
      <!-- Период выдачи -->
      <div>
        <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Период выдачи</span>
        <div class="flex items-center gap-2">
          <input
            v-model="form.dateFrom"
            type="date"
            aria-label="Выдан с"
            class="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
          />
          <span class="text-gray-400">—</span>
          <input
            v-model="form.dateTo"
            type="date"
            aria-label="Выдан по"
            class="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <!-- Курсы: мультивыбор; пусто = все курсы -->
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Курсы</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ form.courseNames.length ? `выбрано: ${form.courseNames.length}` : 'все' }}</span>
        </div>
        <div class="max-h-36 space-y-1 overflow-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <p v-if="!options.courses.length" class="px-1 py-2 text-xs text-gray-500">Курсов нет</p>
          <label
            v-for="name in options.courses"
            :key="name"
            class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/[0.04]"
          >
            <input
              type="checkbox"
              :checked="form.courseNames.includes(name)"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              @change="toggleCourse(name)"
            />
            <span class="truncate">{{ name }}</span>
          </label>
        </div>
      </div>

      <!-- Группы: мультивыбор, список сужается до групп выбранных курсов -->
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Группы</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ form.groupCodes.length ? `выбрано: ${form.groupCodes.length}` : 'все' }}</span>
        </div>
        <div class="max-h-36 space-y-1 overflow-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <p v-if="!filteredGroups.length" class="px-1 py-2 text-xs text-gray-500">Групп нет</p>
          <label
            v-for="g in filteredGroups"
            :key="g.code"
            class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/[0.04]"
          >
            <input
              type="checkbox"
              :checked="form.groupCodes.includes(g.code)"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              @change="toggleGroup(g.code)"
            />
            <span class="truncate">{{ g.code }}</span>
          </label>
        </div>
      </div>

      <!-- Организация -->
      <label class="block">
        <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Организация</span>
        <input
          v-model="form.organizationName"
          type="text"
          placeholder="Название организации (необязательно)"
          class="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
        />
      </label>

      <!-- Статус -->
      <div>
        <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Статус</span>
        <div class="flex gap-2">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            class="h-9 flex-1 rounded-lg border text-sm font-medium transition-colors"
            :class="form.status === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]'"
            @click="form.status = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Группировка файлов внутри архива -->
      <div>
        <span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Разложить по папкам</span>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="opt in groupByOptions"
            :key="opt.value"
            type="button"
            class="h-9 rounded-lg border text-sm font-medium transition-colors"
            :class="form.groupBy === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]'"
            @click="form.groupBy = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400">
        Файлы внутри архива называются «ФИО_НомерСертификата_Группа.pdf».
      </p>

      <div class="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <UiButton variant="outline" @click="handleClose" :disabled="isDownloading">Отмена</UiButton>
        <UiButton variant="primary" :loading="isDownloading" :disabled="isDownloading" @click="startDownload">
          Скачать архив
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  // Предзаполнение из активных фильтров таблицы на странице
  initialFilters?: {
    organizationName?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: 'all' | 'issued' | 'revoked';
  };
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const statusOptions = [
  { value: 'issued', label: 'Выданные' },
  { value: 'revoked', label: 'Отозванные' },
  { value: 'all', label: 'Все' },
] as const;

const groupByOptions = [
  { value: 'none', label: 'Без папок' },
  { value: 'organization', label: 'По организациям' },
  { value: 'group', label: 'По группам' },
  { value: 'course', label: 'По курсам' },
] as const;

const form = reactive({
  dateFrom: '',
  dateTo: '',
  courseNames: [] as string[],
  groupCodes: [] as string[],
  organizationName: '',
  status: 'issued' as 'all' | 'issued' | 'revoked',
  groupBy: 'organization' as 'none' | 'organization' | 'group' | 'course',
});

const options = ref<{ courses: string[]; groups: { code: string; courseName: string | null }[] }>({
  courses: [],
  groups: [],
});
const isLoadingOptions = ref(false);
const isDownloading = ref(false);

const filteredGroups = computed(() => {
  if (!form.courseNames.length) return options.value.groups;
  return options.value.groups.filter((g) => g.courseName && form.courseNames.includes(g.courseName));
});

function toggleCourse(name: string) {
  const idx = form.courseNames.indexOf(name);
  if (idx >= 0) form.courseNames.splice(idx, 1);
  else form.courseNames.push(name);
  // Убираем выбранные группы, которых больше нет в списке (их курс снят)
  const visible = new Set(filteredGroups.value.map((g) => g.code));
  form.groupCodes = form.groupCodes.filter((code) => visible.has(code));
}

function toggleGroup(code: string) {
  const idx = form.groupCodes.indexOf(code);
  if (idx >= 0) form.groupCodes.splice(idx, 1);
  else form.groupCodes.push(code);
}

async function loadOptions() {
  isLoadingOptions.value = true;
  try {
    const response = await authFetch<{ success: boolean; courses: string[]; groups: { code: string; courseName: string | null }[] }>(
      '/api/certificates/archive-options',
    );
    if (response.success) {
      options.value = { courses: response.courses, groups: response.groups };
    }
  } catch (error: any) {
    console.error('Error loading archive options:', error);
  } finally {
    isLoadingOptions.value = false;
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return;
    form.dateFrom = props.initialFilters?.dateFrom || '';
    form.dateTo = props.initialFilters?.dateTo || '';
    form.organizationName = props.initialFilters?.organizationName || '';
    form.status = props.initialFilters?.status && props.initialFilters.status !== 'all'
      ? props.initialFilters.status
      : 'issued';
    form.courseNames = [];
    form.groupCodes = [];
    loadOptions();
  },
  { immediate: true },
);

function handleClose() {
  if (!isDownloading.value) emit('close');
}

async function startDownload() {
  if (isDownloading.value) return;
  isDownloading.value = true;
  try {
    const filters: Record<string, string | string[]> = { status: form.status };
    if (form.dateFrom) filters.dateFrom = form.dateFrom;
    if (form.dateTo) filters.dateTo = form.dateTo;
    if (form.courseNames.length) filters.courseNames = [...form.courseNames];
    if (form.groupCodes.length) filters.groupCodes = [...form.groupCodes];
    if (form.organizationName) filters.organizationName = form.organizationName;

    const blob = await authFetch<Blob>('/api/certificates/archive', {
      method: 'POST',
      body: { filters, groupBy: form.groupBy },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `sertifikaty_${dateStr}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    notification.success('Архив сформирован', 'Скачивание началось');
    emit('close');
  } catch (error: any) {
    console.error('Error downloading certificates archive:', error);
    notification.error('Ошибка скачивания', error.data?.message || error.message || 'Не удалось скачать архив сертификатов');
  } finally {
    isDownloading.value = false;
  }
}
</script>
