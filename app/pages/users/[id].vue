<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">Загрузка информации о пользователе...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error || !userData" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400">
          <UserIcon class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">{{ error || 'Пользователь не найден' }}</h3>
        <UiButton class="mt-8 shadow-lg" @click="$router.push('/users')">К списку пользователей</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <NuxtLink to="/users" class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <!-- Profile Main Info -->
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="relative">
              <div class="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl flex items-center justify-center">
                <div class="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <span class="text-4xl font-black">{{ getInitials(userData.name) }}</span>
                </div>
              </div>
              <div class="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg"
                :class="userData.role === 'ADMIN' ? 'bg-danger' : userData.role === 'MANAGER' ? 'bg-warning' : 'bg-success'"
              >
                <ShieldCheck class="w-4 h-4 text-white" />
              </div>
            </div>

            <div class="space-y-3 text-center sm:text-left">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {{ userData.name }}
                </h1>
                <div 
                  class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                  :class="getRoleBadgeClass(userData.role)"
                >
                  {{ getRoleLabel(userData.role) }}
                </div>
              </div>
              
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
                <div class="flex items-center gap-2">
                  <MailIcon class="w-4 h-4 text-slate-400" />
                  {{ userData.email }}
                </div>
                <div v-if="userData.phone" class="flex items-center gap-2">
                  <PhoneIcon class="w-4 h-4 text-slate-400" />
                  {{ userData.phone }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-center lg:justify-end gap-2">
            <UiButton
              v-if="canEdit"
              variant="primary"
              size="sm"
              class="h-10 px-4 gap-2 font-bold shadow-lg shadow-primary/20"
              @click="openEditModal"
            >
              <SettingsIcon class="w-4 h-4" />
              Редактировать
            </UiButton>

            <UiButton
              v-if="canResetPassword"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="openPasswordModal"
            >
              <KeyRoundIcon class="w-4 h-4" />
              Сбросить пароль
            </UiButton>

            <UiButton
              v-if="canDelete"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-danger border-danger/20 hover:bg-danger/5"
              @click="isDeleteModalOpen = true"
            >
              <Trash2Icon class="w-4 h-4" />
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Role Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Роль в системе</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                {{ getRoleLabel(userData.role) }}
              </h3>
            </div>
            <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
              <ShieldCheck class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">Уровень доступа: {{ userData.role }}</span>
          </div>
        </div>

        <!-- Join Date Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Регистрация</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {{ formatDateShort(userData.created_at) }}
              </h3>
            </div>
            <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
              <CalendarIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">В системе {{ daysSinceJoin }} дней</span>
          </div>
        </div>

        <!-- Last Activity Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активность</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {{ lastActivityDate }}
              </h3>
            </div>
            <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
              <ActivityIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">Последнее действие</span>
          </div>
        </div>

        <!-- Status Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Статус</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Активен
              </h3>
            </div>
            <div class="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-400 transition-transform group-hover:rotate-12">
              <CheckIcon class="w-6 h-6 text-success" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-success font-medium flex items-center gap-1">
              <div class="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></div>
              Доступ разрешен
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main Content (8 cols) -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Tabs Navigation -->
          <div class="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            <button 
              v-for="tab in availableTabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              :class="activeTab === tab.id 
                ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="min-h-[400px]">
            <!-- PROFILE TAB -->
            <div v-show="activeTab === 'info'" class="space-y-8 animate-in fade-in duration-500">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Personal Info -->
                <div class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <UserIcon class="w-4 h-4" /> Персональные данные
                  </h3>
                  <div class="space-y-6">
                    <div v-if="userData.pinfl">
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">ПИНФЛ</p>
                      <p class="text-sm font-bold text-slate-900 dark:text-white font-mono">{{ userData.pinfl }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ф.И.О</p>
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ userData.name }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email адрес</p>
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ userData.email }}</p>
                    </div>
                  </div>
                </div>

                <!-- Workplace Info -->
                <div class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <BriefcaseIcon class="w-4 h-4" /> Рабочая информация
                  </h3>
                  <div class="space-y-6">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Место работы</p>
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ userData.workplace || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Должность</p>
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ userData.position || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Роль доступа</p>
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ getRoleLabel(userData.role) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ACTIVITY TAB -->
            <div v-show="activeTab === 'activity'" class="space-y-6 animate-in fade-in duration-500">
              <div v-if="logsLoading" class="flex justify-center py-12">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              
              <div v-else-if="activityLogs.length > 0" class="space-y-4">
                <div 
                  v-for="log in activityLogs" 
                  :key="log.id"
                  class="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4"
                >
                  <div class="p-2 rounded-xl" :class="getLogActionClass(log.action)">
                    <component :is="getLogIcon(log.action)" class="w-4 h-4" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <p class="text-sm font-bold text-slate-900 dark:text-white">{{ log.action }}</p>
                      <span class="text-[10px] font-bold text-slate-400">{{ formatDateTime(log.created_at) }}</span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400">{{ log.details || 'Действие выполнено в системе' }}</p>
                    <p v-if="log.ip_address" class="text-[10px] text-slate-300 dark:text-slate-600 mt-2 font-mono">IP: {{ log.ip_address }}</p>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <ActivityIcon class="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p class="text-slate-500 font-medium">История активности пуста</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <!-- System Info -->
          <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Системная информация</h4>
            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <ClockIcon class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Создан</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDate(userData.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <RefreshCwIcon class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Обновлен</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDate(userData.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Help Card -->
          <div class="rounded-3xl bg-primary/5 border border-primary/10 p-6">
            <h4 class="text-xs font-black uppercase tracking-widest text-primary mb-4">Подсказка</h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Здесь вы можете просмотреть детальную информацию о пользователе и его активности в системе. Администраторы и модераторы имеют возможность редактировать данные и сбрасывать пароли.
            </p>
          </div>
        </div>
      </div>
    </template>

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

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление пользователя"
      message="Вы уверены, что хотите удалить этого пользователя? Это действие безвозвратно удалит все связанные данные."
      :item-name="userData?.name"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  User as UserIcon,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Calendar as CalendarIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Settings as SettingsIcon,
  KeyRound as KeyRoundIcon,
  Trash2 as Trash2Icon,
  Activity as ActivityIcon,
  Briefcase as BriefcaseIcon,
  Clock as ClockIcon,
  RefreshCw as RefreshCwIcon,
  Check as CheckIcon,
  Plus as PlusIcon,
  FileText as FileTextIcon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Database as DatabaseIcon
} from "lucide-vue-next";
import type { UserPublic, UserRole } from "~/types/auth";

// Meta
definePageMeta({
  layout: "default",
});

// Route and Auth
const route = useRoute();
const { user: currentUser } = useAuth();
const { authFetch } = useAuthFetch();
const notification = useNotification();

// State
const isLoading = ref(true);
const isDeleting = ref(false);
const error = ref<string | null>(null);
const userData = ref<UserPublic | null>(null);
const activeTab = ref("info");
const isEditModalOpen = ref(false);
const isPasswordModalOpen = ref(false);
const isDeleteModalOpen = ref(false);

const activityLogs = ref<any[]>([]);
const logsLoading = ref(false);

// Computed
const userId = computed(() => route.params.id as string);

const availableTabs = computed(() => {
  const tabs = [{ id: "info", label: "Профиль", icon: UserIcon }];
  // Only admins/managers see activity logs for other users
  if (currentUser.value?.role === 'ADMIN' || currentUser.value?.role === 'MANAGER') {
    tabs.push({ id: "activity", label: "Активность", icon: ActivityIcon });
  }
  return tabs;
});

const daysSinceJoin = computed(() => {
  if (!userData.value?.created_at) return 0;
  const created = new Date(userData.value.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const lastActivityDate = computed(() => {
  if (activityLogs.value.length === 0) return '—';
  return formatDateShort(activityLogs.value[0].created_at);
});

// Permissions
const canEdit = computed(() => {
  if (!currentUser.value || !userData.value) return false;
  if (currentUser.value.role === "ADMIN") return true;
  if (currentUser.value.role === "MANAGER" && userData.value.role !== "ADMIN") return true;
  return currentUser.value.id === userData.value.id;
});

const canResetPassword = computed(() => {
  if (!currentUser.value || !userData.value) return false;
  if (currentUser.value.role === "ADMIN") return true;
  if (currentUser.value.role === "MANAGER" && userData.value.role !== "ADMIN") return true;
  return false;
});

const canDelete = computed(() => {
  if (!currentUser.value || !userData.value) return false;
  // Cannot delete self
  if (currentUser.value.id === userData.value.id) return false;
  // Admin can delete any non-admin
  if (currentUser.value.role === "ADMIN" && userData.value.role !== "ADMIN") return true;
  return false;
});

// Watch tab change to fetch logs
watch(activeTab, (newTab) => {
  if (newTab === 'activity') {
    fetchActivityLogs();
  }
});

// Methods
const getRoleLabel = (role?: UserRole | string): string => {
  const labels: Record<string, string> = {
    ADMIN: "Администратор",
    MANAGER: "Модератор",
    TEACHER: "Инструктор",
    STUDENT: "Студент",
    REPRESENTATIVE: "Представитель",
  };
  return labels[role || ""] || role || "";
};

const getRoleBadgeClass = (role?: UserRole | string): string => {
  const classes: Record<string, string> = {
    ADMIN: "border-danger/20 bg-danger/5 text-danger",
    MANAGER: "border-warning/20 bg-warning/5 text-warning",
    TEACHER: "border-primary/20 bg-primary/5 text-primary",
    STUDENT: "border-success/20 bg-success/5 text-success",
    REPRESENTATIVE: "border-info/20 bg-info/5 text-info",
  };
  return classes[role || ""] || "border-slate-200 bg-slate-50 text-slate-500";
};

const formatDate = (date: Date | string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (date: Date | string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date: Date | string): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const loadUser = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{
      success: boolean;
      user: UserPublic;
      message?: string;
    }>(`/api/users/${userId.value}`);

    if (response.success && response.user) {
      userData.value = response.user;
    } else {
      error.value = response.message || "Не удалось загрузить данные пользователя";
    }
  } catch (err: any) {
    console.error("Error loading user:", err);
    error.value = err?.data?.message || err?.message || "Ошибка загрузки пользователя";
  } finally {
    isLoading.value = false;
  }
};

const fetchActivityLogs = async () => {
  if (activityLogs.value.length > 0) return;
  logsLoading.value = true;
  try {
    const response = await authFetch<{ success: boolean; logs: any[] }>(`/api/activity-logs/user/${userId.value}`);
    if (response.success) {
      activityLogs.value = response.logs;
    }
  } catch (err) {
    console.error("Failed to fetch activity logs:", err);
  } finally {
    logsLoading.value = false;
  }
};

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    const response = await authFetch<{ success: boolean }>(`/api/users/${userId.value}`, {
      method: 'DELETE'
    });
    if (response.success) {
      notification.success("Пользователь удален");
      navigateTo('/users');
    }
  } catch (err) {
    notification.error("Ошибка при удалении");
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

const openEditModal = () => isEditModalOpen.value = true;
const closeEditModal = () => isEditModalOpen.value = false;

const handleUserSaved = async () => {
  await loadUser();
  closeEditModal();
};

const openPasswordModal = () => isPasswordModalOpen.value = true;
const closePasswordModal = () => isPasswordModalOpen.value = false;

const handlePasswordResetSuccess = () => closePasswordModal();

const getInitials = (fullName: string): string => {
  if (!fullName) return '?';
  const parts = fullName.split(" ").filter((p) => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
};

// Activity log helpers
const getLogActionClass = (action: string) => {
  if (action.includes('Создание') || action.includes('Create')) return 'bg-success/10 text-success';
  if (action.includes('Удаление') || action.includes('Delete')) return 'bg-danger/10 text-danger';
  if (action.includes('Обновление') || action.includes('Update')) return 'bg-warning/10 text-warning';
  if (action.includes('Вход') || action.includes('Login')) return 'bg-primary/10 text-primary';
  return 'bg-slate-100 text-slate-500';
};

const getLogIcon = (action: string) => {
  if (action.includes('Создание') || action.includes('Create')) return PlusIcon;
  if (action.includes('Удаление') || action.includes('Delete')) return Trash2Icon;
  if (action.includes('Обновление') || action.includes('Update')) return RefreshCwIcon;
  if (action.includes('Вход') || action.includes('Login')) return LogInIcon;
  if (action.includes('Выход') || action.includes('Logout')) return LogOutIcon;
  return FileTextIcon;
};

// Head
useHead({
  title: computed(() =>
    userData.value?.name
      ? `${userData.value.name} | Профиль пользователя`
      : "Профиль пользователя"
  ),
});

// Lifecycle
onMounted(() => {
  loadUser();
});
</script>
