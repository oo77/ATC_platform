<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        {{ error }}
      </p>
      <UiButton variant="primary" class="mt-4" @click="loadUser">
        Попробовать снова
      </UiButton>
    </div>

    <!-- User Profile -->
    <template v-else-if="userData">
      <!-- Кнопка назад -->
      <div class="mb-6">
        <NuxtLink 
          to="/users"
          class="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft class="h-4 w-4" />
          Назад к списку пользователей
        </NuxtLink>
      </div>

      <!-- Header с градиентом -->
      <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- Cover Image -->
        <div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600">
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Profile Info -->
        <div class="px-6 pb-6">
          <div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <!-- Avatar -->
            <div class="relative">
              <div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900">
                <img 
                  :src="avatarUrl" 
                  :alt="userData.name" 
                  class="h-full w-full object-cover"
                />
              </div>
            </div>

            <!-- User Info -->
            <div class="flex-1 text-center sm:text-left">
              <h3 class="mb-1 text-2xl font-bold text-white dark:text-gray-900">
                {{ userData.name }}
              </h3>
              <p class="mb-2 text-gray-600 dark:text-gray-400">
                {{ userData.email }}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span 
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  :class="getRoleBadgeClass(userData.role)"
                >
                  <ShieldCheck class="h-4 w-4" />
                  {{ getRoleLabel(userData.role) }}
                </span>
              </div>
            </div>

            <!-- Действия -->
            <div class="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                <UiButton 
                    v-if="canEdit" 
                    variant="primary" 
                    class="flex items-center gap-2"
                    @click="openEditModal"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                </UiButton>
                <UiButton 
                    v-if="canResetPassword" 
                    variant="warning" 
                    class="flex items-center gap-2"
                    @click="openPasswordModal"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Сбросить пароль
                </UiButton>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ formatDate(userData.created_at) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <ShieldCheck class="h-6 w-6 text-success" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Роль</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ getRoleLabel(userData.role) }}
                  </p>
                </div>
              </div>
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
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <!-- Информация -->
          <div v-show="activeTab === 'info'" class="p-6">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <!-- Личная информация -->
              <div>
                <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Личная информация
                </h3>
                <div class="space-y-3">
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p>
                    <p class="font-medium text-gray-900 dark:text-white">{{ userData.name }}</p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p class="font-medium text-gray-900 dark:text-white">{{ userData.email }}</p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.phone || '—' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ПИНФЛ</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.pinfl || '—' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Рабочая информация -->
              <div>
                <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Рабочая информация
                </h3>
                <div class="space-y-3">
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Роль в системе</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getRoleLabel(userData.role) }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Место работы</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.workplace || '—' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Должность</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ userData.position || '—' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Обновлено</p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ formatDate(userData.updated_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
      
      <!-- Modals -->
      <UsersUserFormModal
        v-if="isEditModalOpen && userData"
        :user="userData"
        :role="userData.role"
        @close="closeEditModal"
        @save="handleUserSaved"
      />

      <UsersUserPasswordModal
        v-if="isPasswordModalOpen && userData"
        :is-open="isPasswordModalOpen"
        :user-id="userData.id"
        :user-name="userData.name"
        @close="closePasswordModal"
        @success="handlePasswordResetSuccess"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  User, 
  ArrowLeft,
  AlertCircle, 
  ShieldCheck,
  Calendar,
} from 'lucide-vue-next';
import type { UserPublic, UserRole } from '~/types/auth';

// Meta
definePageMeta({
  layout: 'default',
});

// Route and Auth
const route = useRoute();
const { user: currentUser } = useAuth();
const { authFetch } = useAuthFetch();
const notification = useNotification();

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const userData = ref<UserPublic | null>(null);
const activeTab = ref('info');

const isEditModalOpen = ref(false);
const isPasswordModalOpen = ref(false);

// Computed
const userId = computed(() => route.params.id as string);

const avatarUrl = computed(() => {
  if (!userData.value?.name) return '';
  const name = encodeURIComponent(userData.value.name);
  return `https://ui-avatars.com/api/?name=${name}&size=128&background=465fff&color=fff&bold=true`;
});

const availableTabs = computed(() => {
  return [
    { id: 'info', label: 'Информация', icon: User },
  ];
});

// Permissions
const canEdit = computed(() => {
  if (!currentUser.value || !userData.value) return false;
  // Admin can edit all
  if (currentUser.value.role === 'ADMIN') return true;
  // Moderator can edit all except admins
  if (currentUser.value.role === 'MANAGER' && userData.value.role !== 'ADMIN') return true;
  // User can edit self (rare here, but possible)
  return currentUser.value.id === userData.value.id;
});

const canResetPassword = computed(() => {
    if (!currentUser.value || !userData.value) return false;
    // Admin can reset all
    if (currentUser.value.role === 'ADMIN') return true;
    // Moderator can reset all except admins
    if (currentUser.value.role === 'MANAGER' && userData.value.role !== 'ADMIN') return true;
    return false;
});

// Methods
const getRoleLabel = (role?: UserRole | string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Модератор',
    TEACHER: 'Инструктор',
    STUDENT: 'Студент',
  };
  return labels[role || ''] || role || '';
};

const getRoleBadgeClass = (role?: UserRole | string): string => {
  const classes: Record<string, string> = {
    ADMIN: 'bg-danger/10 text-danger',
    MANAGER: 'bg-warning/10 text-warning',
    TEACHER: 'bg-primary/10 text-primary',
    STUDENT: 'bg-success/10 text-success',
  };
  return classes[role || ''] || 'bg-gray-100 text-gray-600';
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const loadUser = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await authFetch<{ success: boolean; user: UserPublic; message?: string }>(
      `/api/users/${userId.value}`
    );
    
    if (response.success && response.user) {
      userData.value = response.user;
    } else {
      error.value = response.message || 'Не удалось загрузить данные пользователя';
    }
  } catch (err: any) {
    console.error('Error loading user:', err);
    error.value = err?.data?.message || err?.message || 'Ошибка загрузки пользователя';
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = () => {
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const handleUserSaved = async () => {
  await loadUser();
  closeEditModal();
};

const openPasswordModal = () => {
    isPasswordModalOpen.value = true;
};

const closePasswordModal = () => {
    isPasswordModalOpen.value = false;
};

const handlePasswordResetSuccess = () => {
    closePasswordModal();
};

// Head
useHead({
  title: computed(() => userData.value?.name 
    ? `${userData.value.name} | Профиль пользователя` 
    : 'Профиль пользователя'
  ),
});

// Lifecycle
onMounted(() => {
  loadUser();
});
</script>
