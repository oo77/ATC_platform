<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isVisible"
            class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl max-h-[90vh] overflow-y-auto"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="sticky top-0 z-10 border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between bg-white dark:bg-boxdark">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                Детали представителя
              </h3>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Контент -->
            <div class="p-6 space-y-6">
              <!-- Статус -->
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    representative.status === 'pending' && 'bg-warning/10 text-warning',
                    representative.status === 'approved' && 'bg-success/10 text-success',
                    representative.status === 'blocked' && 'bg-danger/10 text-danger',
                  ]"
                >
                  <span
                    :class="[
                      'h-2.5 w-2.5 rounded-full',
                      representative.status === 'pending' && 'bg-warning',
                      representative.status === 'approved' && 'bg-success',
                      representative.status === 'blocked' && 'bg-danger',
                    ]"
                  ></span>
                  {{ getStatusLabel(representative.status) }}
                </span>

                <!-- Действия -->
                <div class="flex gap-2">
                  <UiButton
                    v-if="representative.status === 'pending'"
                    variant="success"
                    @click="$emit('approve', representative)"
                  >
                    Одобрить
                  </UiButton>
                  <UiButton
                    v-if="representative.status !== 'blocked'"
                    variant="warning"
                    @click="$emit('block', representative)"
                  >
                    Заблокировать
                  </UiButton>
                </div>
              </div>

              <!-- Основная информация -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Основная информация</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">ФИО</p>
                    <p class="font-medium text-black dark:text-white">{{ representative.fullName }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                    <p class="font-medium text-black dark:text-white font-mono">{{ representative.phone }}</p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">Организация</p>
                    <p class="font-medium text-black dark:text-white">{{ representative.organizationName || 'Не указана' }}</p>
                  </div>
                </div>
              </div>

              <!-- Telegram -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Telegram</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Username</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.telegramUsername ? `@${representative.telegramUsername}` : 'Не указан' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Chat ID</p>
                    <p class="font-medium text-black dark:text-white font-mono">
                      {{ representative.telegramChatId || 'Не указан' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Доступ -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Настройки доступа</h4>
                <div class="space-y-3">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Доступ к группам</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.accessGroups ? `${representative.accessGroups.length} групп` : 'Все группы организации' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Уведомления</p>
                    <span
                      :class="[
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        representative.notificationsEnabled
                          ? 'bg-success/10 text-success'
                          : 'bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-400'
                      ]"
                    >
                      {{ representative.notificationsEnabled ? 'Включены' : 'Выключены' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Разрешения -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-medium text-black dark:text-white">Разрешения Telegram-бота</h4>
                  <UiButton
                    v-if="permissionsChanged"
                    variant="primary"
                    size="sm"
                    @click="savePermissions"
                    :disabled="isSaving"
                  >
                    {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
                  </UiButton>
                </div>
                <div class="space-y-3">
                  <!-- Просмотр слушателей -->
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      v-model="localPermissions.can_view_students"
                      class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <div class="flex-1">
                      <p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors">
                        Просмотр списка слушателей
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Команда /students - показывает список всех слушателей организации
                      </p>
                    </div>
                  </label>

                  <!-- Просмотр расписания -->
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      v-model="localPermissions.can_view_schedule"
                      class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <div class="flex-1">
                      <p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors">
                        Просмотр расписания
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Команда /schedule - показывает расписание занятий на неделю
                      </p>
                    </div>
                  </label>

                  <!-- Просмотр сертификатов -->
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      v-model="localPermissions.can_view_certificates"
                      class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <div class="flex-1">
                      <p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors">
                        Просмотр сертификатов
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Команда /certificates - показывает список выданных сертификатов
                      </p>
                    </div>
                  </label>

                  <!-- Запрос файлов сертификатов -->
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      v-model="localPermissions.can_request_certificates"
                      :disabled="!localPermissions.can_view_certificates"
                      class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div class="flex-1">
                      <p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors">
                        Запрос файлов сертификатов
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Возможность скачивать PDF файлы сертификатов через бота
                      </p>
                      <p v-if="!localPermissions.can_view_certificates" class="text-xs text-warning mt-1">
                        ⚠️ Требуется разрешение на просмотр сертификатов
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Одобрение (если одобрен) -->
              <div
                v-if="representative.status === 'approved' && representative.approvedBy"
                class="rounded-lg border border-stroke dark:border-strokedark p-4"
              >
                <h4 class="font-medium text-black dark:text-white mb-4">Информация об одобрении</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Одобрил</p>
                    <p class="font-medium text-black dark:text-white">{{ representative.approvedByName || 'Неизвестно' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Дата одобрения</p>
                    <p class="font-medium text-black dark:text-white">{{ formatDate(representative.approvedAt) }}</p>
                  </div>
                </div>
              </div>

              <!-- Блокировка (если заблокирован) -->
              <div
                v-if="representative.status === 'blocked' && representative.blockedReason"
                class="rounded-lg border border-danger/20 bg-danger/5 p-4"
              >
                <h4 class="font-medium text-danger mb-2">Причина блокировки</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ representative.blockedReason }}</p>
              </div>

              <!-- Активность -->
              <div class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <h4 class="font-medium text-black dark:text-white mb-4">Активность</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p>
                    <p class="font-medium text-black dark:text-white">{{ formatDate(representative.createdAt) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Последняя активность</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.lastActivityAt ? formatDate(representative.lastActivityAt) : 'Нет данных' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Журнал запросов Telegram-бота -->
              <div v-if="representative.status === 'approved'" class="rounded-lg border border-stroke dark:border-strokedark p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-medium text-black dark:text-white">Журнал запросов к боту</h4>
                  <button
                    v-if="!showRequestHistory"
                    @click="loadRequestHistory"
                    class="text-sm text-primary hover:underline"
                  >
                    Показать историю
                  </button>
                </div>

                <!-- Статистика -->
                <div v-if="requestStats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div class="rounded-lg bg-gray-50 dark:bg-meta-4 p-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Всего запросов</p>
                    <p class="text-lg font-bold text-black dark:text-white">{{ requestStats.total }}</p>
                  </div>
                  <div class="rounded-lg bg-success/10 p-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Успешных</p>
                    <p class="text-lg font-bold text-success">{{ requestStats.success }}</p>
                  </div>
                  <div class="rounded-lg bg-danger/10 p-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Ошибок</p>
                    <p class="text-lg font-bold text-danger">{{ requestStats.error }}</p>
                  </div>
                  <div class="rounded-lg bg-warning/10 p-3">
                    <p class="text-xs text-gray-600 dark:text-gray-400">Отказано</p>
                    <p class="text-lg font-bold text-warning">{{ requestStats.denied }}</p>
                  </div>
                </div>

                <!-- История запросов -->
                <div v-if="showRequestHistory">
                  <div v-if="loadingRequests" class="text-center py-4">
                    <p class="text-sm text-gray-500">Загрузка...</p>
                  </div>

                  <div v-else-if="requestHistory.length === 0" class="text-center py-4">
                    <p class="text-sm text-gray-500">Нет запросов</p>
                  </div>

                  <div v-else class="space-y-2 max-h-96 overflow-y-auto">
                    <div
                      v-for="request in requestHistory"
                      :key="request.id"
                      class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-meta-4"
                    >
                      <div
                        :class="[
                          'mt-1 h-2 w-2 rounded-full shrink-0',
                          request.status === 'success' && 'bg-success',
                          request.status === 'error' && 'bg-danger',
                          request.status === 'denied' && 'bg-warning',
                        ]"
                      ></div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-medium text-black dark:text-white font-mono text-sm">
                            {{ request.command }}
                          </span>
                          <span
                            :class="[
                              'text-xs px-2 py-0.5 rounded-full',
                              request.requestType === 'command' && 'bg-primary/10 text-primary',
                              request.requestType === 'callback' && 'bg-info/10 text-info',
                              request.requestType === 'message' && 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                            ]"
                          >
                            {{ request.requestType }}
                          </span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                          {{ formatDate(request.createdAt) }}
                          <span v-if="request.responseTimeMs" class="ml-2">
                            • {{ request.responseTimeMs }}ms
                          </span>
                        </p>
                        <p v-if="request.errorMessage" class="text-xs text-danger mt-1">
                          {{ request.errorMessage }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="requestHistory.length > 0"
                    @click="showRequestHistory = false"
                    class="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Скрыть историю
                  </button>
                </div>
              </div>
            </div>

            <!-- Футер -->
            <div class="sticky bottom-0 border-t border-stroke px-6 py-4 dark:border-strokedark bg-white dark:bg-boxdark">
              <div class="flex justify-end">
                <UiButton variant="secondary" @click="handleClose">
                  Закрыть
                </UiButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

interface RepresentativePermissions {
  can_view_students: boolean;
  can_view_schedule: boolean;
  can_view_certificates: boolean;
  can_request_certificates: boolean;
}

interface Representative {
  id: string;
  organizationId: string;
  organizationName?: string;
  fullName: string;
  phone: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  status: 'pending' | 'approved' | 'blocked';
  accessGroups: string[] | null;
  permissions: RepresentativePermissions;
  notificationsEnabled: boolean;
  lastActivityAt: Date | null;
  approvedBy: string | null;
  approvedByName?: string;
  approvedAt: Date | null;
  blockedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  representative: Representative;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  approve: [representative: Representative];
  block: [representative: Representative];
  updated: [];
}>();

// Состояние
const isVisible = ref(false);
const isSaving = ref(false);

// История запросов
const showRequestHistory = ref(false);
const loadingRequests = ref(false);
const requestHistory = ref<any[]>([]);
const requestStats = ref<any>(null);

// Локальные разрешения
const localPermissions = ref<RepresentativePermissions>({
  can_view_students: true,
  can_view_schedule: true,
  can_view_certificates: true,
  can_request_certificates: true,
});

// Проверка изменений
const permissionsChanged = computed(() => {
  const original = props.representative.permissions;
  const local = localPermissions.value;
  
  return (
    original.can_view_students !== local.can_view_students ||
    original.can_view_schedule !== local.can_view_schedule ||
    original.can_view_certificates !== local.can_view_certificates ||
    original.can_request_certificates !== local.can_request_certificates
  );
});

// Автоматическое отключение can_request_certificates если отключен can_view_certificates
watch(() => localPermissions.value.can_view_certificates, (newValue) => {
  if (!newValue) {
    localPermissions.value.can_request_certificates = false;
  }
});

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

const savePermissions = async () => {
  isSaving.value = true;
  
  try {
    const { authFetch } = useAuthFetch();
    
    await authFetch(`/api/representatives/${props.representative.id}`, {
      method: 'PATCH',
      body: {
        permissions: localPermissions.value,
      },
    });
    
    // Показываем уведомление
    const notification = useNotification();
    notification.success('Разрешения обновлены', 'Успешно');
    
    emit('updated');
  } catch (error: any) {
    console.error('Ошибка сохранения разрешений:', error);
    
    const notification = useNotification();
    notification.error(
      error.message || 'Не удалось сохранить разрешения',
      'Ошибка'
    );
  } finally {
    isSaving.value = false;
  }
};

const loadRequestHistory = async () => {
  if (showRequestHistory.value) {
    showRequestHistory.value = false;
    return;
  }

  loadingRequests.value = true;
  showRequestHistory.value = true;

  try {
    const { authFetch } = useAuthFetch();
    
    const response = await authFetch<{
      success: boolean;
      data: {
        history: any[];
        stats: any;
      };
    }>(`/api/representatives/${props.representative.id}/requests?limit=10`, {
      method: 'GET',
    });

    if (response.success) {
      requestHistory.value = response.data.history;
      requestStats.value = response.data.stats;
    }
  } catch (error: any) {
    console.error('Ошибка загрузки истории запросов:', error);
    
    const notification = useNotification();
    notification.error('Не удалось загрузить историю запросов', 'Ошибка');
  } finally {
    loadingRequests.value = false;
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Ожидает одобрения',
    approved: 'Одобрен',
    blocked: 'Заблокирован',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return 'Не указано';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Инициализация
onMounted(() => {
  // Копируем текущие разрешения
  if (props.representative.permissions) {
    localPermissions.value = { ...props.representative.permissions };
  }
  
  setTimeout(() => {
    isVisible.value = true;
  }, 10);
});
</script>
