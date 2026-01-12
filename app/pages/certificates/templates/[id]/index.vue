<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Навигация -->
    <div class="mb-6">
      <NuxtLink
        to="/certificates/templates"
        class="inline-flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Назад к списку шаблонов
      </NuxtLink>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-8 text-center">
      <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ошибка</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">{{ error }}</p>
      <UiButton @click="loadTemplate">Попробовать снова</UiButton>
    </div>

    <!-- Контент -->
    <template v-else-if="template">
      <!-- Заголовок -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-title-md2 font-bold text-black dark:text-white">
            {{ template.name }}
          </h2>
          <p v-if="template.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ template.description }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              template.isActive
                ? 'bg-success/10 text-success'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            ]"
          >
            {{ template.isActive ? 'Активен' : 'Неактивен' }}
          </span>
          <NuxtLink :to="`/certificates/templates/${template.id}/editor`">
            <UiButton variant="primary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Открыть редактор
            </UiButton>
          </NuxtLink>
          <UiButton variant="outline" @click="showEditModal = true">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Настройки
          </UiButton>
        </div>
      </div>

      <!-- Основной контент в 2 колонки -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Левая колонка: Превью шаблона -->
        <div class="space-y-6">
          <!-- Превью шаблона -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Предпросмотр шаблона
            </h3>
            <div 
              class="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden"
              :class="previewContainerClass"
            >
              <div v-if="!template.templateData" class="text-center p-8">
                <div class="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Шаблон не создан
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Откройте визуальный редактор, чтобы создать дизайн сертификата
                </p>
                <NuxtLink :to="`/certificates/templates/${template.id}/editor`">
                  <UiButton>
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Создать шаблон
                  </UiButton>
                </NuxtLink>
              </div>
              <!-- Preview шаблона если есть -->
              <div v-else class="w-full h-full flex items-center justify-center p-4">
                <div 
                  class="bg-white shadow-lg rounded relative overflow-hidden"
                  :style="previewWrapperStyle"
                >
                  <!-- Рендеринг элементов шаблона (упрощённый preview) -->
                  <div
                    v-for="element in template.templateData.elements"
                    :key="element.id"
                    class="absolute"
                    :style="getElementPreviewStyle(element)"
                  >
                    <template v-if="element.type === 'text'">
                      <span :style="getTextPreviewStyle(element)">
                        {{ element.content }}
                      </span>
                    </template>
                    <template v-else-if="element.type === 'variable'">
                      <span :style="getTextPreviewStyle(element)" class="text-primary">
                        [{{ getVariableLabel(element.variableKey) }}]
                      </span>
                    </template>
                    <template v-else-if="element.type === 'image'">
                      <img :src="element.src" class="w-full h-full object-contain" />
                    </template>
                    <template v-else-if="element.type === 'qr'">
                      <div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        QR
                      </div>
                    </template>
                    <template v-else-if="element.type === 'shape'">
                      <div 
                        class="w-full h-full"
                        :style="getShapePreviewStyle(element)"
                      ></div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Информация о шаблоне -->
            <div v-if="template.templateData" class="mt-4 grid grid-cols-3 gap-4 text-center">
              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-2xl font-bold text-primary">{{ template.templateData.elements?.length || 0 }}</p>
                <p class="text-xs text-gray-500">элементов</p>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ getLayoutLabel(template.layout) }}</p>
                <p class="text-xs text-gray-500">макет</p>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-lg font-bold text-success">Готов</p>
                <p class="text-xs text-gray-500">статус</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка: Настройки -->
        <div class="space-y-6">
          <!-- Формат номера -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Формат номера сертификата
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Шаблон номера
                </label>
                <input
                  v-model="numberFormat"
                  type="text"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Пример:</p>
                <code class="text-primary font-mono">{{ previewNumber }}</code>
              </div>
              <p class="text-xs text-gray-500">
                <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{YY}</code> — год (25), 
                <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{YYYY}</code> — год (2025), 
                <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{CODE}</code> — код курса, 
                <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{NUM}</code> — номер (0001)
              </p>
              <UiButton @click="saveNumberFormat" :loading="isSavingFormat" variant="outline" class="w-full">
                Сохранить формат
              </UiButton>
            </div>
          </div>

          <!-- Статистика -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Статистика
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span class="text-gray-600 dark:text-gray-400">Последний номер</span>
                <span class="font-mono font-bold text-gray-900 dark:text-white">{{ template.lastNumber || 0 }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span class="text-gray-600 dark:text-gray-400">Создан</span>
                <span class="text-gray-900 dark:text-white">{{ formatDate(template.createdAt) }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span class="text-gray-600 dark:text-gray-400">Обновлён</span>
                <span class="text-gray-900 dark:text-white">{{ formatDate(template.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Действия -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Действия
            </h3>
            <div class="space-y-3">
              <NuxtLink :to="`/certificates/templates/${template.id}/editor`" class="block">
                <UiButton variant="primary" class="w-full">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Редактировать шаблон
                </UiButton>
              </NuxtLink>
              <UiButton 
                variant="outline" 
                class="w-full"
                @click="toggleActive"
                :loading="isTogglingActive"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="template.isActive" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ template.isActive ? 'Деактивировать' : 'Активировать' }}
              </UiButton>
              <UiButton 
                variant="danger" 
                class="w-full"
                @click="confirmDelete"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить шаблон
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка редактирования настроек -->
    <CertificatesTemplateEditModal
      :is-open="showEditModal"
      :template="template"
      @close="showEditModal = false"
      @updated="handleUpdated"
    />

    <!-- Модалка подтверждения удаления -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteConfirm = false"></div>
        <div class="relative bg-white dark:bg-boxdark rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Удалить шаблон?
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Вы уверены, что хотите удалить шаблон "{{ template?.name }}"? Это действие нельзя отменить.
          </p>
          <div class="flex gap-3 justify-end">
            <UiButton variant="outline" @click="showDeleteConfirm = false">
              Отмена
            </UiButton>
            <UiButton variant="danger" @click="deleteTemplate" :loading="isDeleting">
              Удалить
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { CertificateTemplate, TemplateElement, VariableSource } from '~/types/certificate';
import { AVAILABLE_VARIABLES } from '~/composables/useCertificateEditor';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const template = ref<CertificateTemplate | null>(null);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);

// Number format
const numberFormat = ref('ATC{YY}_{CODE}_{NUM}');
const isSavingFormat = ref(false);

// Actions
const isTogglingActive = ref(false);
const isDeleting = ref(false);

// Computed
const id = computed(() => route.params.id as string);

const previewNumber = computed(() => {
  const now = new Date();
  return numberFormat.value
    .replace('{YY}', now.getFullYear().toString().slice(-2))
    .replace('{YYYY}', now.getFullYear().toString())
    .replace('{CODE}', 'SAMPLE')
    .replace('{NUM}', '0001');
});

// Динамический класс для контейнера preview (соотношение сторон)
const previewContainerClass = computed(() => {
  const layout = template.value?.layout || template.value?.templateData?.layout;
  
  if (layout === 'A4_portrait' || layout === 'letter_portrait') {
    // Книжная ориентация: высота > ширины
    return 'aspect-[1/1.414]';
  }
  // Альбомная ориентация: ширина > высоты
  return 'aspect-[1.414/1]';
});

// Стили для wrapper preview (внутренний контейнер с сертификатом)
const previewWrapperStyle = computed(() => {
  if (!template.value?.templateData) return {};
  
  const data = template.value.templateData;
  const bg = data.background;
  
  const style: Record<string, string> = {
    width: '100%',
    maxWidth: '100%',
    aspectRatio: `${data.width} / ${data.height}`,
  };
  
  // Фон
  if (bg?.type === 'color') {
    style.background = bg.value;
  } else if (bg?.type === 'image') {
    style.backgroundImage = `url(${bg.value})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  } else {
    style.background = '#fff';
  }
  
  return style;
});

// Title
useHead(() => ({
  title: template.value 
    ? `${template.value.name} - Шаблоны сертификатов`
    : 'Загрузка...',
}));

// Load template
const loadTemplate = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{ success: boolean; template: CertificateTemplate }>(`/api/certificates/templates/${id.value}`);

    if (response.success) {
      template.value = response.template;
      numberFormat.value = response.template.numberFormat || 'ATC{YY}_{CODE}_{NUM}';
    } else {
      error.value = 'Шаблон не найден';
    }
  } catch (e: any) {
    console.error('Error loading template:', e);
    error.value = e.message || 'Ошибка загрузки шаблона';
  } finally {
    loading.value = false;
  }
};

// Save number format
const saveNumberFormat = async () => {
  isSavingFormat.value = true;
  try {
    await authFetch(`/api/certificates/templates/${id.value}`, {
      method: 'PUT',
      body: { numberFormat: numberFormat.value },
    });

    showSuccess('Формат номера сохранён');
  } catch (e: any) {
    console.error('Save format error:', e);
    showError(e.data?.message || e.message || 'Ошибка сохранения');
  } finally {
    isSavingFormat.value = false;
  }
};

// Toggle active
const toggleActive = async () => {
  if (!template.value) return;
  
  isTogglingActive.value = true;
  try {
    const response = await authFetch<{ success: boolean; template: CertificateTemplate }>(`/api/certificates/templates/${id.value}`, {
      method: 'PUT',
      body: { isActive: !template.value.isActive },
    });

    if (response.success) {
      template.value = response.template;
      showSuccess(template.value.isActive ? 'Шаблон активирован' : 'Шаблон деактивирован');
    }
  } catch (e: any) {
    console.error('Toggle active error:', e);
    showError(e.data?.message || e.message || 'Ошибка');
  } finally {
    isTogglingActive.value = false;
  }
};

// Delete
const confirmDelete = () => {
  showDeleteConfirm.value = true;
};

const deleteTemplate = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/certificates/templates/${id.value}`, {
      method: 'DELETE',
    });

    showSuccess('Шаблон удалён');
    router.push('/certificates/templates');
  } catch (e: any) {
    console.error('Delete error:', e);
    showError(e.data?.message || e.message || 'Ошибка удаления');
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

// Handle template updated
const handleUpdated = (updatedTemplate: CertificateTemplate) => {
  template.value = updatedTemplate;
  showEditModal.value = false;
};

// Helper functions
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLayoutLabel(layout: string | null): string {
  const labels: Record<string, string> = {
    A4_landscape: 'A4 альб.',
    A4_portrait: 'A4 кн.',
    letter_landscape: 'Letter альб.',
    letter_portrait: 'Letter кн.',
  };
  return labels[layout || ''] || 'A4';
}

function getVariableLabel(key: VariableSource): string {
  const variable = AVAILABLE_VARIABLES.find(v => v.key === key);
  return variable?.label || key;
}

function getPreviewStyle() {
  if (!template.value?.templateData) return {};
  const bg = template.value.templateData.background;
  if (bg?.type === 'color') {
    return { background: bg.value };
  } else if (bg?.type === 'image') {
    return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover' };
  }
  return { background: '#fff' };
}

function getElementPreviewStyle(element: TemplateElement) {
  // Используем процентные значения для адаптивности
  const templateWidth = template.value?.templateData?.width || 1123;
  const templateHeight = template.value?.templateData?.height || 794;
  
  return {
    left: `${(element.x / templateWidth) * 100}%`,
    top: `${(element.y / templateHeight) * 100}%`,
    width: `${(element.width / templateWidth) * 100}%`,
    height: `${(element.height / templateHeight) * 100}%`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  };
}

function getTextPreviewStyle(element: any) {
  // Используем относительные единицы для шрифта
  const templateWidth = template.value?.templateData?.width || 1123;
  const baseFontSize = element.fontSize / templateWidth * 100; // vw-подобный
  
  return {
    fontFamily: element.fontFamily,
    fontSize: `clamp(6px, ${baseFontSize}vw, ${element.fontSize * 0.5}px)`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    color: element.color,
    lineHeight: element.lineHeight,
    textAlign: element.textAlign,
    display: 'flex',
    alignItems: 'center',
    justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
  };
}

function getShapePreviewStyle(element: any) {
  const style: Record<string, string> = {};
  
  if (element.shapeType === 'circle') {
    style.borderRadius = '50%';
  } else if (element.shapeType === 'line') {
    style.height = `${element.strokeWidth || 2}px`;
    style.backgroundColor = element.strokeColor || '#000';
    return style;
  }
  
  if (element.fillColor && element.fillColor !== 'transparent') {
    style.backgroundColor = element.fillColor;
  }
  
  if (element.strokeWidth && element.strokeColor) {
    style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
  }
  
  return style;
}

// Load on mount
onMounted(() => {
  loadTemplate();
});
</script>
