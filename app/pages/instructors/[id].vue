<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Навигация назад -->
    <div class="mb-6">
      <NuxtLink
        to="/users"
        class="inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft class="h-4 w-4" />
        Назад к списку пользователей
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
        ></div>
        <p class="text-gray-600 dark:text-gray-400">
          Загрузка данных инструктора...
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center"
    >
      <AlertCircle class="mx-auto h-12 w-12 text-danger" />
      <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Ошибка загрузки
      </h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">{{ error }}</p>
      <UiButton variant="primary" class="mt-4" @click="loadInstructor">
        Попробовать снова
      </UiButton>
    </div>

    <!-- Instructor Profile -->
    <template v-else-if="instructor">
      <!-- Profile Header -->
      <div
        class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden mb-6"
      >
        <!-- Фоновый градиент -->
        <div
          class="h-32 bg-linear-to-r from-primary via-purple-500 to-pink-500 relative"
        >
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Основная информация -->
        <div class="relative px-8 pb-8">
          <!-- Аватар -->
          <div class="flex flex-col sm:flex-row items-end gap-6 -mt-16 mb-6">
            <div class="relative">
              <div
                class="h-32 w-32 rounded-2xl bg-white dark:bg-boxdark shadow-xl flex items-center justify-center border-4 border-white dark:border-boxdark"
              >
                <span class="text-5xl font-bold text-primary">
                  {{ getInitials(instructor.fullName) }}
                </span>
              </div>
              <div
                class="absolute -bottom-2 -right-2 h-10 w-10 bg-success rounded-full border-4 border-white dark:border-boxdark flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div class="flex-1 pb-2 text-center sm:text-left">
              <h1 class="text-3xl font-bold text-black dark:text-white mb-2">
                {{ instructor.fullName }}
              </h1>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                {{ instructor.email || "Email не указан" }}
              </p>
            </div>

            <!-- Кнопки действий -->
            <div
              class="flex gap-3 pb-2 w-full sm:w-auto justify-center sm:justify-end"
            >
              <UiButton
                variant="primary"
                @click="editInstructor"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586"
                  />
                </svg>
                Редактировать
              </UiButton>
              <UiButton
                variant="danger"
                @click="handleDelete"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  />
                </svg>
                Удалить
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex flex-col gap-6">
        <!-- Tabs Navigation -->
        <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            >
              <span class="flex items-center justify-center gap-2">
                <component :is="tab.icon" class="h-5 w-5" />
                {{ tab.label }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->

        <div v-show="activeTab === 'info'">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Личная информация -->
            <div
              class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
            >
              <h3
                class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
              >
                Личная информация
              </h3>
              <div class="space-y-3">
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Полное имя
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.fullName }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Email
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.email || "—" }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Телефон
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.phone || "—" }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    ID
                  </p>
                  <p
                    class="font-medium text-gray-900 dark:text-white font-mono text-sm"
                  >
                    {{ instructor.id }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Рабочая информация -->
            <div
              class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
            >
              <h3
                class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
              >
                Рабочая информация
              </h3>
              <div class="space-y-3">
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Дата приема на работу
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{
                      instructor.hireDate
                        ? formatDate(instructor.hireDate)
                        : "—"
                    }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Максимальное количество часов
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.maxHours }} часов
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Информация о контракте
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.contractInfo || "—" }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Статус
                  </p>
                  <span
                    :class="[
                      'inline-flex rounded-full px-3 py-1 text-sm font-medium',
                      instructor.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger',
                    ]"
                  >
                    {{ instructor.isActive ? "Активен" : "Неактивен" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'hours'">
          <InstructorsHoursStats
            v-if="instructor"
            :instructor-id="instructor.id"
            :initial-load="false"
            ref="hoursStatsRef"
          />
        </div>

        <div v-show="activeTab === 'history'">
          <InstructorsCourseHistory
            v-if="instructor"
            :instructor-id="instructor.id"
            :initial-load="false"
            ref="courseHistoryRef"
          />
        </div>
      </div>
    </template>

    <!-- Modals -->
    <UsersInstructorFormModal
      v-if="isEditModalOpen && instructor"
      :instructor="instructor"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @submit="handleUpdate"
    />

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление инструктора"
      message="Вы уверены, что хотите удалить этого инструктора? Это действие может повлиять на связанные курсы и расписание."
      :item-name="instructor?.fullName"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import type { Instructor, UpdateInstructorInput } from "~/types/instructor";
import { ArrowLeft, User, Clock, History, AlertCircle } from "lucide-vue-next";
import InstructorsHoursStats from "~/components/instructors/HoursStats.vue";
import InstructorsCourseHistory from "~/components/instructors/CourseHistory.vue";

// Route and Auth
const route = useRoute();
const router = useRouter();
const instructorId = route.params.id as string;
const { authFetch } = useAuthFetch();
const notification = useNotification();
const { canEditInstructors, canDeleteInstructors } = usePermissions();

// State
const instructor = ref<Instructor | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Информация", icon: User },
  { id: "hours", label: "Отчётность", icon: Clock },
  { id: "history", label: "История курсов", icon: History },
];

// Methods
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const loadInstructor = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch<{
      success: boolean;
      instructor: Instructor;
    }>(`/api/instructors/${instructorId}`);

    if (response.success) {
      instructor.value = response.instructor;
    } else {
      error.value = "Не удалось загрузить данные инструктора";
    }
  } catch (err: any) {
    error.value = err.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
};

const editInstructor = () => {
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const handleUpdate = async (data: UpdateInstructorInput) => {
  try {
    const response = await authFetch<{
      success: boolean;
      instructor: Instructor;
    }>(`/api/instructors/${instructorId}`, {
      method: "PUT",
      body: data,
    });

    if (response.success) {
      instructor.value = response.instructor;
      closeEditModal();
      notification.success("Данные инструктора обновлены");
    }
  } catch (err) {
    console.error("Error updating instructor:", err);
    notification.error("Ошибка при обновлении инструктора");
  }
};

const handleDelete = () => {
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/instructors/${instructorId}`, {
      method: "DELETE",
    });
    notification.success("Инструктор удален");
    router.push("/users");
  } catch (err) {
    console.error("Error deleting instructor:", err);
    notification.error("Ошибка при удалении инструктора");
  } finally {
    isDeleting.value = false;
    closeDeleteModal();
  }
};

// Hours Stats Logic
const hoursStatsRef = ref<InstanceType<typeof InstructorsHoursStats> | null>(
  null
); // Ref to component
// Course History Logic
const courseHistoryRef = ref<InstanceType<
  typeof InstructorsCourseHistory
> | null>(null); // Ref to component

// Trigger updates when tab changes
watch(activeTab, (newTab) => {
  if (newTab === "hours") {
    hoursStatsRef.value?.load();
  } else if (newTab === "history") {
    courseHistoryRef.value?.load();
  }
});

// Lifecycle
onMounted(() => {
  loadInstructor();
  // Optional: Auto-load stats if desired
  // loadHoursStats();
});
</script>
