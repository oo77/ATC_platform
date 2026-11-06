<template>
  <!-- Внешний враппер без двойного отступа (отступ задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка: компактный спиннер -->
    <div v-if="isLoading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка информации о пользователе...</p>
      </div>
    </div>

    <!-- Ошибка: единственное действие — вернуться к списку -->
    <div v-else-if="error || !userData" class="flex min-h-[400px] items-center justify-center">
      <div class="max-w-md text-center">
        <div class="mb-4 inline-block rounded-full bg-gray-100 p-5 text-gray-400 dark:bg-white/[0.06]">
          <UserIcon class="h-10 w-10" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ error || 'Пользователь не найден' }}</h3>
        <UiButton class="mt-6" @click="$router.push('/users')">К списку пользователей</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Единая шапка: крошки, имя (text-xl/2xl вместо 4xl uppercase), роль бейджем -->
      <UiPageHeader
        :title="userData.name"
        :breadcrumbs="[{ label: 'Пользователи', to: '/users' }, { label: userData.name }]"
      >
        <!-- Бейдж роли рядом с заголовком (раньше дублировался ещё и в карточке метрик) -->
        <template #badge>
          <span class="rounded-md border px-2 py-0.5 text-xs font-medium" :class="getRoleBadgeClass(userData.role)">
            {{ getRoleLabel(userData.role) }}
          </span>
        </template>

        <!-- Контакты: email и телефон (телефон — через маскирование) -->
        <template #meta>
          <span class="inline-flex items-center gap-1.5"><MailIcon class="h-3.5 w-3.5 text-gray-400" />{{ userData.email }}</span>
          <span v-if="userData.phone" class="inline-flex items-center gap-1.5">
            <PhoneIcon class="h-3.5 w-3.5 text-gray-400" />
            <UiSensitiveValue :value="userData.phone" :visible-tail="4" />
          </span>
        </template>

        <!-- Действия: одно главное «Редактировать» + «⋯» с группой «Опасные» (условия прав сохранены) -->
        <template #actions>
          <UiButton v-if="canEdit" variant="primary" :start-icon="SettingsIcon" @click="openEditModal">Редактировать</UiButton>
          <UiDropdown
            v-if="canResetPassword || canDelete"
            icon-only
            variant="outline"
            aria-label="Другие действия"
            :groups="menuGroups"
            @select="onMenuSelect"
          />
        </template>
      </UiPageHeader>

      <!-- Полоса метрик в одну строку: убрана карточка «Роль» (дубль бейджа в шапке) -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <UiStat label="Регистрация" :value="formatDateShort(userData.created_at)" :hint="`В системе ${daysSinceJoin} дн.`" :icon="CalendarIcon" tone="success" />
        <UiStat label="Активность" :value="lastActivityDate" hint="Последнее действие" :icon="ActivityIcon" tone="warning" />
        <UiStat label="Статус" value="Активен" hint="Доступ разрешён" :icon="CheckIcon" tone="success" />
      </div>

      <!-- Вкладки через UiTabs -->
      <UiTabs v-model="activeTab" :tabs="availableTabs" />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <!-- Основная область (8 колонок) -->
        <div class="lg:col-span-8">
          <div class="min-h-[300px]">
            <!-- Вкладка «Профиль» -->
            <div v-show="activeTab === 'info'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <!-- Персональные данные -->
              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <UserIcon class="h-4 w-4 text-gray-400" /> Персональные данные
                </h3>
                <div class="space-y-4">
                  <div v-if="userData.pinfl">
                    <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">ПИНФЛ</p>
                    <!-- ПИНФЛ: маска + показать + копировать -->
                    <UiSensitiveValue :value="userData.pinfl" class="text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Ф.И.О</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userData.name }}</p>
                  </div>
                  <div>
                    <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Email адрес</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userData.email }}</p>
                  </div>
                </div>
              </div>

              <!-- Рабочая информация -->
              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <BriefcaseIcon class="h-4 w-4 text-gray-400" /> Рабочая информация
                </h3>
                <div class="space-y-4">
                  <div>
                    <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Место работы</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userData.workplace || '—' }}</p>
                  </div>
                  <div>
                    <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Должность</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userData.position || '—' }}</p>
                  </div>
                  <div>
                    <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Роль доступа</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ getRoleLabel(userData.role) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Вкладка «Активность» -->
            <div v-show="activeTab === 'activity'" class="space-y-3">
              <div v-if="logsLoading" class="flex justify-center py-12">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>

              <div v-else-if="activityLogs.length > 0" class="space-y-2">
                <div
                  v-for="log in activityLogs"
                  :key="log.id"
                  class="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div class="rounded-lg p-2" :class="getLogActionClass(log.action)">
                    <component :is="getLogIcon(log.action)" class="h-4 w-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="mb-0.5 flex items-center justify-between gap-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ log.action }}</p>
                      <span class="shrink-0 text-xs text-gray-400">{{ formatDateTime(log.created_at) }}</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ log.details || 'Действие выполнено в системе' }}</p>
                    <p v-if="log.ip_address" class="mt-1.5 font-mono text-xs text-gray-400 dark:text-gray-500">IP: {{ log.ip_address }}</p>
                  </div>
                </div>
              </div>

              <!-- Пустое состояние через UiEmptyState -->
              <UiEmptyState v-else title="История активности пуста" :icon="ActivityIcon" />
            </div>
          </div>
        </div>

        <!-- Боковая колонка: системная информация; блок «Подсказка» убран как лишний шум -->
        <div class="lg:col-span-4">
          <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Системная информация</h4>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="rounded-lg bg-gray-100 p-2 dark:bg-white/[0.06]">
                  <ClockIcon class="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Создан</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(userData.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="rounded-lg bg-gray-100 p-2 dark:bg-white/[0.06]">
                  <RefreshCwIcon class="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Обновлен</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(userData.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна (логика без изменений) -->
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

    <!-- Подтверждение удаления -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление пользователя"
      message="Вы уверены, что хотите удалить этого пользователя? Это действие безвозвратно удалит все связанные данные."
      :item-name="userData?.name"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      loading-text="Удаление…"
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

// Меню «⋯» в шапке: «Сбросить пароль» и «Удалить» собраны в группу «Опасные», видимость — по прежним флагам прав
const menuGroups = computed(() => [
  {
    label: "Опасные",
    items: [
      { key: "reset-password", label: "Сбросить пароль", icon: KeyRoundIcon, hidden: !canResetPassword.value },
      { key: "delete", label: "Удалить пользователя", icon: Trash2Icon, danger: true, hidden: !canDelete.value },
    ],
  },
]);
// Пункты меню вызывают прежние обработчики (openPasswordModal / открытие ConfirmModal удаления)
const onMenuSelect = (key: string) => {
  if (key === "reset-password") openPasswordModal();
  else if (key === "delete") isDeleteModalOpen.value = true;
};

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
  return classes[role || ""] || "border-gray-200 bg-gray-50 text-gray-500";
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
  return 'bg-gray-100 text-gray-500 dark:bg-white/[0.06]';
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
