<template>
  <div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Навигация назад -->
      <div class="mb-6">
        <NuxtLink
          to="/database"
          class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors group"
        >
          <svg
            class="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span class="font-medium">Назад к списку</span>
        </NuxtLink>
      </div>

      <!-- Состояние загрузки -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          <p class="text-gray-600 dark:text-gray-400">Загрузка данных студента...</p>
        </div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-100">Ошибка загрузки</h3>
            <p class="text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Карточка студента -->
      <div v-else-if="student" class="space-y-6">
        <!-- Заголовок с аватаром -->
        <div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden">
          <!-- Фоновый градиент -->
          <div class="h-32 bg-linear-to-r from-primary via-purple-500 to-pink-500 relative">
            <div class="absolute inset-0 bg-black/10"></div>
          </div>

          <!-- Основная информация -->
          <div class="relative px-8 pb-8">
            <!-- Аватар -->
            <div class="flex items-end gap-6 -mt-16 mb-6">
              <div class="relative">
                <div class="h-32 w-32 rounded-2xl bg-white dark:bg-boxdark shadow-xl flex items-center justify-center border-4 border-white dark:border-boxdark">
                  <span class="text-5xl font-bold text-primary">
                    {{ getInitials(student.fullName) }}
                  </span>
                </div>
                <div class="absolute -bottom-2 -right-2 h-10 w-10 bg-success rounded-full border-4 border-white dark:border-boxdark flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>

              <div class="flex-1 pb-2">
                <h1 class="text-3xl font-bold text-black dark:text-white mb-2">
                  {{ student.fullName }}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                  {{ student.position }}
                </p>
              </div>

              <!-- Кнопки действий -->
              <div class="flex gap-3 pb-2">
                <UiButton
                  v-if="canEditStudents"
                  variant="primary"
                  @click="openEditModal"
                  class="flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Редактировать
                </UiButton>
                <UiButton
                  v-if="canDeleteStudents"
                  variant="danger"
                  @click="handleDelete"
                  class="flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                  Удалить
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Основная информация -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Личные данные -->
          <div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center gap-3 mb-6">
              <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-black dark:text-white">Личные данные</h2>
            </div>

            <div class="space-y-4">
              <div class="group">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  ПИНФЛ
                </label>
                <div class="flex items-center gap-2">
                  <p class="text-lg font-mono font-semibold text-black dark:text-white bg-gray-50 dark:bg-meta-4 px-4 py-2 rounded-lg flex-1">
                    {{ student.pinfl }}
                  </p>
                  <button
                    @click="copyToClipboard(student.pinfl)"
                    class="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
                    title="Копировать"
                  >
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Дата регистрации
                </label>
                <p class="text-lg text-black dark:text-white">
                  {{ formatDate(student.created_at) }}
                </p>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Последнее обновление
                </label>
                <p class="text-lg text-black dark:text-white">
                  {{ formatDate(student.updated_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Место работы -->
          <div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center gap-3 mb-6">
              <div class="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-black dark:text-white">Место работы</h2>
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Организация
                </label>
                <p class="text-lg font-semibold text-black dark:text-white">
                  {{ student.organization }}
                </p>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Должность
                </label>
                <p class="text-lg text-black dark:text-white">
                  {{ student.position }}
                </p>
              </div>

              <div v-if="student.department">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Служба/Отдел
                </label>
                <p class="text-lg text-black dark:text-white">
                  {{ student.department }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Сертификаты -->
        <div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-black dark:text-white">Сертификаты</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Всего: {{ student.certificates.length }}
                </p>
              </div>
            </div>

            <UiButton
              variant="primary"
              @click="openCertificatesModal"
              class="flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Управление сертификатами
            </UiButton>
          </div>

          <!-- Список сертификатов -->
          <div v-if="student.certificates.length > 0" class="space-y-4">
            <div
              v-for="certificate in student.certificates"
              :key="certificate.id"
              class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer"
              @click="openCertificateDetailModal(certificate)"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="font-semibold text-black dark:text-white mb-2">
                    {{ certificate.courseName }}
                  </h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Номер:</span>
                      <span class="ml-2 font-mono text-black dark:text-white">{{ certificate.certificateNumber }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Дата выдачи:</span>
                      <span class="ml-2 text-black dark:text-white">{{ formatDate(certificate.issueDate) }}</span>
                    </div>
                    <!-- Срок действия с индикатором статуса -->
                    <div v-if="certificate.expiryDate">
                      <span class="text-gray-500 dark:text-gray-400">Срок действия:</span>
                      <span 
                        class="ml-2 font-medium"
                        :class="getExpiryStatusClass(certificate.expiryDate)"
                      >
                        {{ formatDate(certificate.expiryDate) }}
                        <span 
                          v-if="getExpiryStatus(certificate.expiryDate) !== 'valid'" 
                          class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                          :class="getExpiryBadgeClass(certificate.expiryDate)"
                        >
                          {{ getExpiryLabel(certificate.expiryDate) }}
                        </span>
                      </span>
                    </div>
                    <div v-else>
                      <span class="text-gray-500 dark:text-gray-400">Срок действия:</span>
                      <span class="ml-2 text-success font-medium">Бессрочный</span>
                    </div>
                  </div>
                </div>

                <div v-if="certificate.fileUrl" class="shrink-0">
                  <a
                    :href="certificate.fileUrl"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Скачать
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Пустое состояние -->
          <div v-else class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400 text-lg">
              У студента пока нет сертификатов
            </p>
            <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Нажмите "Управление сертификатами" чтобы добавить
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальные окна -->
    <DatabaseStudentFormModal
      v-if="isEditModalOpen && student"
      :student="student"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @submit="handleUpdate"
    />

    <DatabaseStudentCertificatesModal
      v-if="isCertificatesModalOpen && student"
      :student="student"
      :is-open="isCertificatesModalOpen"
      @close="closeCertificatesModal"
      @refresh="fetchStudent"
    />

    <!-- Модальное окно деталей сертификата -->
    <DatabaseCertificateDetailModal
      v-if="isCertificateDetailModalOpen && selectedCertificate"
      :certificate="certificateDetailData"
      :is-open="isCertificateDetailModalOpen"
      @close="closeCertificateDetailModal"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление студента"
      message="Вы уверены, что хотите удалить этого студента?"
      :item-name="student?.fullName"
      warning="Это действие нельзя отменить. Все данные студента будут удалены."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Student, UpdateStudentData, StudentCertificate } from '~/types/student';

// Получаем ID студента из маршрута
const route = useRoute();
const router = useRouter();
const studentId = route.params.id as string;

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();

// Проверка прав доступа
const { canEditStudents, canDeleteStudents } = usePermissions();

// Состояние
const student = ref<Student | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const isCertificatesModalOpen = ref(false);
const isCertificateDetailModalOpen = ref(false);
const selectedCertificate = ref<StudentCertificate | null>(null);

// Загрузка данных студента
const fetchStudent = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
      {
        method: 'GET',
      }
    );

    if (response.success) {
      student.value = response.student;
    } else {
      error.value = 'Студент не найден';
    }
  } catch (err) {
    console.error('Ошибка загрузки студента:', err);
    error.value = 'Не удалось загрузить данные студента';
  } finally {
    loading.value = false;
  }
};

// Модальные окна
const openEditModal = () => {
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const openCertificatesModal = () => {
  isCertificatesModalOpen.value = true;
};

const closeCertificatesModal = () => {
  isCertificatesModalOpen.value = false;
};

// Модальное окно деталей сертификата
const openCertificateDetailModal = (certificate: StudentCertificate) => {
  selectedCertificate.value = certificate;
  isCertificateDetailModalOpen.value = true;
};

const closeCertificateDetailModal = () => {
  isCertificateDetailModalOpen.value = false;
  selectedCertificate.value = null;
};

// Формирование данных сертификата для модального окна
const certificateDetailData = computed(() => {
  if (!selectedCertificate.value || !student.value) return null;
  
  return {
    ...selectedCertificate.value,
    student: {
      fullName: student.value.fullName,
      pinfl: student.value.pinfl,
      organization: student.value.organization,
      position: student.value.position,
    },
    course: {
      name: selectedCertificate.value.courseName,
      code: selectedCertificate.value.groupCode || null,
    },
    group: selectedCertificate.value.groupCode ? {
      code: selectedCertificate.value.groupCode
    } : null,
    pdfFileUrl: selectedCertificate.value.fileUrl,
    issuedAt: selectedCertificate.value.issueDate,
    createdAt: selectedCertificate.value.created_at,
    sourceType: selectedCertificate.value.groupId ? 'group_journal' : 'manual',
  };
});

// Обработка обновления
const handleUpdate = async (data: UpdateStudentData) => {
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
      {
        method: 'PUT',
        body: data,
      }
    );

    if (response.success) {
      student.value = response.student;
      closeEditModal();
      // TODO: Показать уведомление об успехе
    }
  } catch (err) {
    console.error('Ошибка обновления студента:', err);
    // TODO: Показать уведомление об ошибке
  }
};

// Открытие модального окна удаления
const handleDelete = () => {
  isDeleteModalOpen.value = true;
};

// Закрытие модального окна удаления
const closeDeleteModal = () => {
  if (!isDeleting.value) {
    isDeleteModalOpen.value = false;
  }
};

// Подтверждение удаления
const confirmDelete = async () => {
  isDeleting.value = true;

  try {
    const response = await authFetch<{ success: boolean }>(
      `/api/students/${studentId}`,
      {
        method: 'DELETE',
      }
    );

    if (response.success) {
      // Перенаправляем на страницу списка
      router.push('/database');
    }
  } catch (err) {
    console.error('Ошибка удаления студента:', err);
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

// Утилиты
const getInitials = (fullName: string): string => {
  const parts = fullName.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (fullName.length >= 2) {
    return fullName.substring(0, 2).toUpperCase();
  }
  return fullName.toUpperCase();
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // TODO: Показать уведомление об успехе
  } catch (err) {
    console.error('Ошибка копирования:', err);
  }
};

// Функции для срока годности сертификата
const getExpiryStatus = (expiryDate: Date | string): 'expired' | 'expiring_soon' | 'valid' => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'valid';
};

const getExpiryStatusClass = (expiryDate: Date | string): string => {
  const status = getExpiryStatus(expiryDate);
  switch (status) {
    case 'expired': return 'text-danger';
    case 'expiring_soon': return 'text-warning';
    default: return 'text-black dark:text-white';
  }
};

const getExpiryBadgeClass = (expiryDate: Date | string): string => {
  const status = getExpiryStatus(expiryDate);
  switch (status) {
    case 'expired': return 'bg-danger/20 text-danger';
    case 'expiring_soon': return 'bg-warning/20 text-warning';
    default: return '';
  }
};

const getExpiryLabel = (expiryDate: Date | string): string => {
  const status = getExpiryStatus(expiryDate);
  if (status === 'expired') return 'Истёк';
  if (status === 'expiring_soon') {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Истекает через ${daysUntilExpiry} дн.`;
  }
  return '';
};


// Загрузка данных при монтировании
onMounted(() => {
  fetchStudent();
});
</script>
