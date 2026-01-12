<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Шаблоны сертификатов
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Управление шаблонами для генерации сертификатов
        </p>
      </div>
      <UiButton v-if="canCreateTemplates" @click="showCreateModal = true">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Создать шаблон
      </UiButton>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Пустой список -->
    <div v-else-if="templates.length === 0" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-12 text-center">
      <div class="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Нет шаблонов
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Создайте первый шаблон сертификата для начала работы
      </p>
      <UiButton v-if="canCreateTemplates" @click="showCreateModal = true">
        Создать шаблон
      </UiButton>
    </div>

    <!-- Список шаблонов -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="group rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden hover:shadow-lg transition-all duration-200"
      >
        <!-- Превью или плейсхолдер -->
        <div class="relative h-48 bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
          <!-- Реальное превью шаблона (если есть backgroundUrl) -->
          <div v-if="template.backgroundUrl" class="absolute inset-0">
            <img 
              :src="template.backgroundUrl" 
              :alt="template.name"
              class="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <!-- Затемнение для лучшей читаемости -->
            <div class="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div>
          </div>
          <!-- Если есть только оригинальный файл (docx) но нет преью фона -->
          <div v-else-if="template.originalFileUrl" class="absolute inset-0 flex flex-col items-center justify-center">
            <!-- Стилизованный документ -->
            <div class="w-24 h-28 bg-white dark:bg-gray-200 rounded-lg shadow-lg flex flex-col items-center justify-center transform -rotate-2 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105">
              <svg class="w-10 h-10 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="text-xs font-semibold text-gray-600">.docx</span>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Word шаблон загружен</p>
          </div>
          <!-- Файл не загружен -->
          <div v-else class="text-center px-4">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Загрузите шаблон</span>
          </div>

          <!-- Индикатор готовности (отображается поверх превью) -->
          <div 
            v-if="template.originalFileUrl || template.backgroundUrl"
            class="absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm"
            :class="template.variables && template.variables.length > 0 
              ? 'bg-success/80 text-white' 
              : 'bg-warning/80 text-white'"
          >
            <svg v-if="template.variables && template.variables.length > 0" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ template.variables && template.variables.length > 0 ? 'Готов' : 'Настройте' }}
          </div>

          <!-- Badges -->
          <div class="absolute top-3 left-3 flex gap-2">
            <span
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                template.isActive
                  ? 'bg-success/20 text-success'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              ]"
            >
              {{ template.isActive ? 'Активен' : 'Неактивен' }}
            </span>
          </div>

          <!-- Actions overlay -->
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <NuxtLink
              :to="`/certificates/templates/${template.id}/editor`"
              class="p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
              title="Открыть редактор"
            >
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </NuxtLink>
            <NuxtLink
              :to="`/certificates/templates/${template.id}`"
              class="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              title="Настройки"
            >
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </NuxtLink>
            <button
              v-if="canDeleteTemplates"
              @click="confirmDelete(template)"
              class="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
              title="Удалить"
            >
              <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Контент -->
        <div class="p-5">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2 truncate">
            {{ template.name }}
          </h3>
          <p v-if="template.description" class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {{ template.description }}
          </p>

          <!-- Статистика -->
          <div class="flex flex-wrap gap-3 text-xs">
            <span class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {{ template.variables?.length || 0 }} переменных
            </span>
            <span class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ template.lastNumber }} выдано
            </span>
          </div>

          <!-- Формат номера -->
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span class="text-xs text-gray-400">Формат:</span>
            <code class="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {{ template.numberFormat }}
            </code>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка создания -->
    <CertificatesTemplateFormModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCreated"
    />

    <!-- Модалка подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление шаблона"
      message="Вы уверены, что хотите удалить этот шаблон?"
      :item-name="templateToDelete?.name"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { CertificateTemplate } from '~/types/certificate';

definePageMeta({
  layout: 'default',
  title: 'Шаблоны сертификатов',
});

useHead({
  title: 'Шаблоны сертификатов - АТЦ Платформа',
});

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();
const { canCreateTemplates, canDeleteTemplates } = usePermissions();

// State
const loading = ref(true);
const templates = ref<CertificateTemplate[]>([]);
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const templateToDelete = ref<CertificateTemplate | null>(null);
const isDeleting = ref(false);

// Загрузка списка
const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await authFetch<{ success: boolean; templates: CertificateTemplate[] }>(
      '/api/certificates/templates'
    );
    if (response.success) {
      templates.value = response.templates;
    }
  } catch (error: any) {
    console.error('Error loading templates:', error);
    showError(error.message || 'Ошибка загрузки шаблонов');
  } finally {
    loading.value = false;
  }
};

// Обработчик создания
const handleCreated = (template: CertificateTemplate) => {
  showCreateModal.value = false;
  // Переходим на страницу редактирования созданного шаблона
  navigateTo(`/certificates/templates/${template.id}`);
};

// Подтверждение удаления
const confirmDelete = (template: CertificateTemplate) => {
  templateToDelete.value = template;
  showDeleteModal.value = true;
};

// Удаление
const handleDelete = async () => {
  if (!templateToDelete.value) return;

  isDeleting.value = true;
  try {
    await authFetch(`/api/certificates/templates/${templateToDelete.value.id}`, {
      method: 'DELETE',
    });
    showSuccess('Шаблон успешно удалён');
    await loadTemplates();
  } catch (error: any) {
    console.error('Error deleting template:', error);
    showError(error.data?.message || error.message || 'Ошибка удаления');
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
    templateToDelete.value = null;
  }
};

// Загружаем при монтировании
onMounted(() => {
  loadTemplates();
});
</script>
