<template>
  <UiModal
    :is-open="isOpen"
    @close="$emit('close')"
    :title="`Сертификаты - ${student?.fullName || ''}`"
    size="lg"
  >
    <div class="space-y-6">
      <!-- Кнопка добавления сертификата -->
      <div class="flex justify-end">
        <UiButton
          variant="primary"
          @click="openAddCertificateForm"
          class="flex items-center gap-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Добавить сертификат
        </UiButton>
      </div>

      <!-- Список сертификатов -->
      <div v-if="student && student.certificates.length > 0" class="space-y-4">
        <div
          v-for="certificate in student.certificates"
          :key="certificate.id"
          class="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 space-y-3">
              <!-- Название курса -->
              <div>
                <h4 class="text-lg font-semibold text-black dark:text-white">
                  {{ certificate.courseName }}
                </h4>
              </div>

              <!-- Информация о сертификате -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Номер сертификата:</p>
                  <p class="font-medium text-black dark:text-white font-mono">
                    {{ certificate.certificateNumber }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Дата получения:</p>
                  <p class="font-medium text-black dark:text-white">
                    {{ formatDate(certificate.issueDate) }}
                  </p>
                </div>
                <div v-if="certificate.expiryDate">
                  <p class="text-sm text-gray-600 dark:text-gray-400">Срок годности:</p>
                  <p class="font-medium" :class="isExpired(certificate.expiryDate) ? 'text-danger' : 'text-black dark:text-white'">
                    {{ formatDate(certificate.expiryDate) }}
                    <span v-if="isExpired(certificate.expiryDate)" class="text-xs">(Истек)</span>
                  </p>
                </div>
                <div v-if="certificate.fileUrl">
                  <p class="text-sm text-gray-600 dark:text-gray-400">Файл:</p>
                  <a
                    :href="certificate.fileUrl"
                    :download="getCertificateFileName(certificate)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Скачать
                  </a>
                </div>
              </div>
            </div>

            <!-- Кнопки действий -->
            <div class="flex items-center gap-2 ml-4">
              <UiButton
                variant="danger"
                size="sm"
                @click="handleDeleteCertificate(certificate.id)"
                title="Удалить сертификат"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  />
                </svg>
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div v-else class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="mt-4 text-gray-600 dark:text-gray-400">
          У этого студента пока нет сертификатов
        </p>
      </div>
    </div>

    <!-- Модальное окно добавления сертификата -->
    <DatabaseCertificateManualFormModal
      v-if="isAddCertificateOpen && student"
      :preselected-student="student"
      :is-open="isAddCertificateOpen"
      @close="closeAddCertificateForm"
      @created="handleCertificateCreated"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="isDeleteConfirmOpen"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить этот сертификат?"
      :item-name="certificateToDelete?.courseName"
      warning="Это действие нельзя отменить"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="isDeleting"
      @confirm="confirmDeleteCertificate"
      @cancel="cancelDeleteCertificate"
    />
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Student } from '~/types/student';

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const notification = useNotification();

interface Props {
  student: Student | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  refresh: []; // Событие для обновления данных студента
}>();

const isAddCertificateOpen = ref(false);
const isDeleteConfirmOpen = ref(false);
const isDeleting = ref(false);
const certificateToDelete = ref<any>(null);

// Открытие формы добавления сертификата
const openAddCertificateForm = () => {
  isAddCertificateOpen.value = true;
};

// Закрытие формы добавления сертификата
const closeAddCertificateForm = () => {
  isAddCertificateOpen.value = false;
};

// Обработка успешного создания сертификата
const handleCertificateCreated = () => {
  closeAddCertificateForm();
  // Обновляем данные студента
  emit('refresh');
  // Уведомление уже показано внутри модалки
};

// Открытие модалки подтверждения удаления
const handleDeleteCertificate = (certificateId: string) => {
  // Находим сертификат для отображения его названия в модалке
  const certificate = props.student?.certificates.find(c => c.id === certificateId);
  if (certificate) {
    certificateToDelete.value = certificate;
    isDeleteConfirmOpen.value = true;
  }
};

// Подтверждение удаления сертификата
const confirmDeleteCertificate = async () => {
  if (!certificateToDelete.value) return;

  isDeleting.value = true;

  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/certificates/${certificateToDelete.value.id}`,
      {
        method: 'DELETE',
      }
    );

    if (response.success) {
      // Обновляем данные студента
      emit('refresh');
      notification.success('Сертификат успешно удален', 'Успех');
      cancelDeleteCertificate();
    } else {
      notification.error(response.message || 'Не удалось удалить сертификат', 'Ошибка');
    }
  } catch (error: any) {
    console.error('Ошибка удаления сертификата:', error);
    
    // Извлекаем сообщение об ошибке
    const errorMessage = error?.data?.message || error?.message || 'Произошла ошибка при удалении сертификата';
    notification.error(errorMessage, 'Ошибка');
  } finally {
    isDeleting.value = false;
  }
};

// Отмена удаления сертификата
const cancelDeleteCertificate = () => {
  isDeleteConfirmOpen.value = false;
  certificateToDelete.value = null;
  isDeleting.value = false;
};

// Утилиты
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isExpired = (expiryDate: Date | string): boolean => {
  return new Date(expiryDate) < new Date();
};

// Формирование имени файла для скачивания
const getCertificateFileName = (certificate: any): string => {
  // Формируем имя файла: Сертификат_НомерСертификата.расширение
  const certNumber = certificate.certificateNumber.replace(/[^a-zA-Z0-9]/g, '_');
  return `Сертификат_${certNumber}.pdf`;
};
</script>
