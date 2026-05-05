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
            class="w-full max-w-3xl rounded-2xl bg-white dark:bg-boxdark shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-8 py-5 dark:border-strokedark flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-primary/10 text-primary">
                  <User class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-black dark:text-white uppercase tracking-tight">
                  Детали представителя
                </h3>
              </div>
              <button
                @click="handleClose"
                class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-all"
              >
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Контент -->
            <div class="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <!-- Статус -->
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                    representative.status === 'pending' &&
                      'bg-warning/10 text-warning',
                    representative.status === 'approved' &&
                      'bg-success/10 text-success',
                    representative.status === 'blocked' &&
                      'bg-danger/10 text-danger',
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
                  <UiButton
                    v-if="representative.status === 'blocked'"
                    variant="success"
                    @click="$emit('unblock', representative)"
                  >
                    Разблокировать
                  </UiButton>
                </div>
              </div>

              <!-- Основная информация -->
              <div
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <h4 class="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Основная информация
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">ФИО</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.fullName }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Телефон
                    </p>
                    <p class="font-medium text-black dark:text-white font-mono">
                      {{ representative.phone }}
                    </p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Организация
                    </p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.organizationName || "Не указана" }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Telegram -->
              <div
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <h4 class="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Telegram
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Username
                    </p>
                    <p class="font-medium text-black dark:text-white">
                      {{
                        representative.telegramUsername
                          ? `@${representative.telegramUsername}`
                          : "Не указан"
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase mb-1">Chat ID</p>
                    <p class="font-medium text-black dark:text-white font-mono">
                      {{ representative.telegramChatId || "Не указан" }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Доступ -->
              <div
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <h4 class="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Настройки доступа
                </h4>
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="text-xs font-bold text-slate-400 uppercase mb-1">
                        Доступ к группам
                      </p>
                      <p class="font-medium text-black dark:text-white">
                        {{
                          representative.accessGroups
                            ? `${representative.accessGroups.length} групп`
                            : "Все группы организации"
                        }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-400 uppercase mb-1 text-right">
                        Уведомления
                      </p>
                      <span
                        :class="[
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest border',
                          representative.notificationsEnabled
                            ? 'bg-success/5 text-success border-success/20'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                        ]"
                      >
                        {{
                          representative.notificationsEnabled
                            ? "Включены"
                            : "Выключены"
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Разрешения -->
              <div
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Разрешения Telegram-бота
                  </h4>
                  <UiButton
                    v-if="permissionsChanged"
                    variant="success"
                    size="sm"
                    @click="savePermissions"
                    :disabled="isSaving"
                    class="h-8 rounded-lg px-4 font-bold text-xs uppercase tracking-wider"
                  >
                    {{ isSaving ? "Сохранение..." : "Сохранить" }}
                  </UiButton>
                </div>
                <div class="space-y-6">
                  <!-- Просмотр слушателей -->
                  <label class="flex items-start gap-4 cursor-pointer group">
                    <div class="relative flex items-center pt-1">
                      <input
                        type="checkbox"
                        v-model="localPermissions.can_view_students"
                        class="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 cursor-pointer transition-all"
                      />
                    </div>
                    <div class="flex-1">
                      <p
                        class="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors"
                      >
                        Просмотр списка слушателей
                      </p>
                      <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Команда /students - показывает список всех слушателей
                        организации
                      </p>
                    </div>
                  </label>

                  <!-- Просмотр расписания -->
                  <label class="flex items-start gap-4 cursor-pointer group">
                    <div class="relative flex items-center pt-1">
                      <input
                        type="checkbox"
                        v-model="localPermissions.can_view_schedule"
                        class="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 cursor-pointer transition-all"
                      />
                    </div>
                    <div class="flex-1">
                      <p
                        class="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors"
                      >
                        Просмотр расписания
                      </p>
                      <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Команда /schedule - показывает расписание занятий на
                        неделю
                      </p>
                    </div>
                  </label>

                  <!-- Просмотр сертификатов -->
                  <label class="flex items-start gap-4 cursor-pointer group">
                    <div class="relative flex items-center pt-1">
                      <input
                        type="checkbox"
                        v-model="localPermissions.can_view_certificates"
                        class="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 cursor-pointer transition-all"
                      />
                    </div>
                    <div class="flex-1">
                      <p
                        class="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors"
                      >
                        Просмотр сертификатов
                      </p>
                      <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Команда /certificates - показывает список выданных
                        сертификатов
                      </p>
                    </div>
                  </label>

                  <!-- Запрос файлов сертификатов -->
                  <label class="flex items-start gap-4 cursor-pointer group">
                    <div class="relative flex items-center pt-1">
                      <input
                        type="checkbox"
                        v-model="localPermissions.can_request_certificates"
                        :disabled="!localPermissions.can_view_certificates"
                        class="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div class="flex-1">
                      <p
                        class="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors"
                        :class="{ 'opacity-50': !localPermissions.can_view_certificates }"
                      >
                        Запрос файлов сертификатов
                      </p>
                      <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Возможность скачивать PDF файлы сертификатов через бота
                      </p>
                      <p
                        v-if="!localPermissions.can_view_certificates"
                        class="text-xs text-warning mt-1"
                      >
                        ⚠️ Требуется разрешение на просмотр сертификатов
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Одобрение (если одобрен) -->
              <div
                v-if="
                  representative.status === 'approved' &&
                  representative.approvedBy
                "
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <h4 class="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Информация об одобрении
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase mb-1">Одобрил</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ representative.approvedByName || "Неизвестно" }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase mb-1">Дата одобрения</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ formatDate(representative.approvedAt) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Блокировка (если заблокирован) -->
              <div
                v-if="
                  representative.status === 'blocked' &&
                  representative.blockedReason
                "
                class="rounded-xl border border-danger/20 bg-danger/5 p-6 dark:bg-danger/10"
              >
                <h4 class="mb-2 text-xs font-black uppercase tracking-widest text-danger">Причина блокировки</h4>
                <p class="text-sm font-medium text-danger/80">
                  {{ representative.blockedReason }}
                </p>
              </div>

              <!-- Активность -->
              <div
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <h4 class="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Активность
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase mb-1">Дата регистрации</p>
                    <p class="font-medium text-black dark:text-white">
                      {{ formatDate(representative.createdAt) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-slate-400 uppercase mb-1">Последняя активность</p>
                    <p class="font-medium text-black dark:text-white">
                      {{
                        representative.lastActivityAt
                          ? formatDate(representative.lastActivityAt)
                          : "Нет данных"
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Журнал запросов Telegram-бота -->
              <div
                v-if="representative.status === 'approved'"
                class="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Журнал запросов к боту
                  </h4>
                  <button
                    v-if="!showRequestHistory"
                    @click="loadRequestHistory"
                    class="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                  >
                    Показать историю
                  </button>
                </div>

                <!-- Статистика -->
                <div
                  v-if="requestStats"
                  class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                >
                  <div class="rounded-xl bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Всего</p>
                    <p class="text-xl font-black text-slate-900 dark:text-white">
                      {{ requestStats.total }}
                    </p>
                  </div>
                  <div class="rounded-xl bg-success/5 p-4 border border-success/10 shadow-sm">
                    <p class="text-[10px] font-black text-success/60 uppercase tracking-widest mb-1">Успешных</p>
                    <p class="text-xl font-black text-success">
                      {{ requestStats.success }}
                    </p>
                  </div>
                  <div class="rounded-xl bg-danger/5 p-4 border border-danger/10 shadow-sm">
                    <p class="text-[10px] font-black text-danger/60 uppercase tracking-widest mb-1">Ошибок</p>
                    <p class="text-xl font-black text-danger">
                      {{ requestStats.error }}
                    </p>
                  </div>
                  <div class="rounded-xl bg-warning/5 p-4 border border-warning/10 shadow-sm">
                    <p class="text-[10px] font-black text-warning/60 uppercase tracking-widest mb-1">Отказано</p>
                    <p class="text-xl font-black text-warning">
                      {{ requestStats.denied }}
                    </p>
                  </div>
                </div>

                <!-- История запросов -->
                <div v-if="showRequestHistory">
                  <div v-if="loadingRequests" class="text-center py-8">
                    <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Загрузка...</p>
                  </div>

                  <div
                    v-else-if="requestHistory.length === 0"
                    class="text-center py-8"
                  >
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Нет запросов</p>
                  </div>

                  <div v-else class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                    <div
                      v-for="request in requestHistory"
                      :key="request.id"
                      class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/20 transition-all group"
                    >
                      <div
                        :class="[
                          'mt-1.5 h-2 w-2 rounded-full shrink-0 shadow-sm',
                          request.status === 'success' && 'bg-success shadow-success/20',
                          request.status === 'error' && 'bg-danger shadow-danger/20',
                          request.status === 'denied' && 'bg-warning shadow-warning/20',
                        ]"
                      ></div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3 mb-1.5">
                          <span
                            class="font-bold text-slate-900 dark:text-white font-mono text-sm group-hover:text-primary transition-colors"
                          >
                            {{ request.command }}
                          </span>
                          <span
                            :class="[
                              'text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border',
                              request.requestType === 'command' &&
                                'bg-primary/5 text-primary border-primary/10',
                              request.requestType === 'callback' &&
                                'bg-info/5 text-info border-info/10',
                              request.requestType === 'message' &&
                                'bg-slate-50 text-slate-500 border-slate-100',
                            ]"
                          >
                            {{ request.requestType }}
                          </span>
                        </div>
                        <div class="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{{ formatDate(request.createdAt) }}</span>
                          <span v-if="request.responseTimeMs" class="flex items-center gap-1">
                            <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                            {{ request.responseTimeMs }}ms
                          </span>
                        </div>
                        <p
                          v-if="request.errorMessage"
                          class="text-xs font-medium text-danger mt-2 p-2 rounded-lg bg-danger/5 border border-danger/10"
                        >
                          {{ request.errorMessage }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="requestHistory.length > 0"
                    @click="showRequestHistory = false"
                    class="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                  >
                    Скрыть историю
                  </button>
                </div>
              </div>
            </div>

            <!-- Футер -->
            <div
              class="sticky bottom-0 border-t border-slate-100 px-8 py-5 dark:border-slate-800 bg-white dark:bg-boxdark z-10"
            >
              <div class="flex justify-end gap-3">
                <UiButton variant="outline" @click="handleClose" class="h-11 px-8 rounded-xl font-bold">
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
import { ref, onMounted, computed, watch } from "vue";
import { User, X } from 'lucide-vue-next';

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
  status: "pending" | "approved" | "blocked";
  accessGroups: string[] | null;
  permissions?: RepresentativePermissions;
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
  unblock: [representative: Representative];
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
  if (!original) return false;
  const local = localPermissions.value;

  return (
    original.can_view_students !== local.can_view_students ||
    original.can_view_schedule !== local.can_view_schedule ||
    original.can_view_certificates !== local.can_view_certificates ||
    original.can_request_certificates !== local.can_request_certificates
  );
});

// Автоматическое отключение can_request_certificates если отключен can_view_certificates
watch(
  () => localPermissions.value.can_view_certificates,
  (newValue) => {
    if (!newValue) {
      localPermissions.value.can_request_certificates = false;
    }
  },
);

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

const savePermissions = async () => {
  isSaving.value = true;

  try {
    const { authFetch } = useAuthFetch();

    await authFetch(`/api/representatives/${props.representative.id}`, {
      method: "PATCH",
      body: {
        permissions: localPermissions.value,
      },
    });

    // Показываем уведомление
    const notification = useNotification();
    notification.success("Разрешения обновлены", "Успешно");

    emit("updated");
  } catch (error: any) {
    console.error("Ошибка сохранения разрешений:", error);

    const notification = useNotification();
    notification.error(
      error.message || "Не удалось сохранить разрешения",
      "Ошибка",
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
      method: "GET",
    });

    if (response.success) {
      requestHistory.value = response.data.history;
      requestStats.value = response.data.stats;
    }
  } catch (error: any) {
    console.error("Ошибка загрузки истории запросов:", error);

    const notification = useNotification();
    notification.error("Не удалось загрузить историю запросов", "Ошибка");
  } finally {
    loadingRequests.value = false;
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Ожидает одобрения",
    approved: "Одобрен",
    blocked: "Заблокирован",
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return "Не указано";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
