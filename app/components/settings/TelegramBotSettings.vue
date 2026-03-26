<template>
  <!-- Загрузка -->
  <div v-if="loading" class="flex items-center justify-center p-8">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка данных бота...</span>
  </div>

  <div v-else class="space-y-6">
    <!-- Статус карты -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Статус бота -->
      <div class="rounded-lg border border-gray-200 bg-linear-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-700 dark:from-primary/10 dark:to-primary/20">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Bot class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Бот</p>
            <p class="truncate text-base font-bold text-gray-900 dark:text-white">
              {{ botInfo ? '@' + botInfo.username : 'Нет токена' }}
            </p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between border-t border-primary/10 pt-2">
          <span class="text-xs text-gray-500">ID: {{ botInfo?.id || '—' }}</span>
          <UiBadge v-if="botInfo" color="success">Онлайн</UiBadge>
          <UiBadge v-else color="error">Оффлайн</UiBadge>
        </div>
      </div>

      <!-- Статус Webhook -->
      <div class="rounded-lg border border-gray-200 bg-linear-to-br from-indigo-50 to-blue-50 p-4 dark:border-gray-700 dark:from-indigo-900/10 dark:to-blue-900/10">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
            <Globe class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Webhook</p>
            <p class="text-base font-bold" :class="webhookInfo?.url ? 'text-success' : 'text-danger'">
              {{ webhookInfo?.url ? 'Активен' : 'Не настроен' }}
            </p>
          </div>
        </div>
        <div class="mt-3 border-t border-indigo-100 dark:border-indigo-900/20 pt-2">
          <span class="block truncate text-xs text-gray-500" :title="webhookInfo?.url ?? ''">
            {{ webhookInfo?.url || 'URL не задан' }}
          </span>
        </div>
      </div>

      <!-- Представители -->
      <div class="rounded-lg border border-gray-200 bg-linear-to-br from-purple-50 to-pink-50 p-4 dark:border-gray-700 dark:from-purple-900/10 dark:to-pink-900/10">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
            <Users class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Представители</p>
            <p class="text-base font-bold text-gray-900 dark:text-white">{{ stats?.total || 0 }}</p>
          </div>
        </div>
        <div class="mt-3 flex gap-4 border-t border-purple-100 dark:border-purple-900/20 pt-2">
          <span class="text-xs text-gray-500">⏳ {{ stats?.pending || 0 }} ожидает</span>
          <span class="text-xs text-gray-500">✅ {{ stats?.approved || 0 }} одобрено</span>
        </div>
      </div>
    </div>

    <!-- Управление Webhook -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Форма Webhook -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/40">
        <h4 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Settings class="h-4 w-4 text-primary" />
          Настройка Webhook
        </h4>
        <div class="space-y-3">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
            <div class="relative">
              <input
                v-model="webhookSettings.webhookUrl"
                type="url"
                placeholder="https://your-domain.com/api/telegram/webhook"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 v-if="isWebhookUrlMatch" class="h-4 w-4 text-success" />
                <AlertCircle v-else class="h-4 w-4 text-warning" />
              </div>
            </div>
            <p class="mt-1 text-[11px] text-gray-400">Только HTTPS. Секрет подставляется из .env автоматически.</p>
          </div>

          <div class="flex items-center gap-2 rounded-lg bg-white p-3 dark:bg-gray-900">
            <input id="drop-updates" v-model="webhookSettings.dropPendingUpdates" type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <label for="drop-updates" class="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              Сбросить ожидающие обновления при установке
            </label>
          </div>

          <div class="flex gap-2 pt-1">
            <UiButton variant="primary" class="flex-1" size="sm" :loading="settingUpWebhook" @click="setupWebhook">
              Установить Webhook
            </UiButton>
            <UiButton variant="danger" size="sm" :loading="deletingWebhook" @click="deleteWebhook" title="Удалить Webhook">
              <Trash2 class="h-4 w-4" />
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Статус безопасности -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/40 flex flex-col">
        <h4 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <ShieldCheck class="h-4 w-4 text-success" />
          Безопасность
        </h4>
        <div class="flex-1 space-y-2">
          <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <span class="text-sm text-gray-600 dark:text-gray-400">Webhook Secret</span>
            <span class="flex items-center gap-1.5 text-sm font-medium"
              :class="config.hasWebhookSecret ? 'text-success' : 'text-warning'">
              <Lock class="h-3.5 w-3.5" />
              {{ config.hasWebhookSecret ? 'Настроен' : 'Не задан' }}
            </span>
          </div>
          <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs dark:border-gray-700 dark:bg-gray-900">
            <span class="font-sans text-sm text-gray-600 dark:text-gray-400">IP сервера</span>
            <span class="text-gray-700 dark:text-gray-300">{{ webhookInfo?.ipAddress || '—' }}</span>
          </div>

          <!-- Ошибка webhook -->
          <div v-if="webhookInfo?.lastErrorMessage" class="rounded-lg border border-danger/20 bg-danger/5 p-3">
            <p class="mb-1 flex items-center gap-1.5 text-xs font-bold text-danger">
              <AlertTriangle class="h-3.5 w-3.5" /> Последняя ошибка
            </p>
            <p class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2" :title="webhookInfo.lastErrorMessage">
              {{ webhookInfo.lastErrorMessage }}
            </p>
            <p class="mt-1 text-[10px] text-gray-500">{{ formatDate(webhookInfo.lastErrorDate) }}</p>
          </div>
          <div v-else class="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3">
            <CheckCircle2 class="h-4 w-4 text-success" />
            <p class="text-sm text-gray-700 dark:text-gray-300">Ошибок не зафиксировано</p>
          </div>
        </div>
        <div class="mt-4">
          <UiButton variant="outline" size="sm" class="w-full" @click="refreshData">
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
            Обновить данные
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Возможности бота -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-5 py-3">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Возможности бота (из API Telegram)</h4>
      </div>
      <div class="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-gray-700 divide-gray-200">
        <div v-for="cap in botCapabilities" :key="cap.key" class="p-5">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-md" :class="cap.bgClass">
              <component :is="cap.icon" class="h-4 w-4" :class="cap.iconClass" />
            </div>
            <span class="font-medium text-sm text-gray-900 dark:text-white">{{ cap.label }}</span>
          </div>
          <p class="text-xs text-gray-500 mb-2 leading-relaxed">{{ cap.description }}</p>
          <UiBadge :color="botInfo?.[cap.key] ? cap.trueColor : cap.falseColor">
            {{ botInfo?.[cap.key] ? cap.trueLabel : cap.falseLabel }}
          </UiBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Bot, Globe, Users, Settings, ShieldCheck,
  CheckCircle2, AlertCircle, AlertTriangle,
  RefreshCw, Trash2, UserPlus, MessageSquareText, Zap, Lock
} from 'lucide-vue-next';

interface BotInfo {
  id: number;
  firstName: string;
  username: string;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
}

interface WebhookInfo {
  url: string | null;
  hasCustomCertificate: boolean;
  pendingUpdateCount: number;
  ipAddress: string | null;
  lastErrorDate: string | null;
  lastErrorMessage: string | null;
}

interface RepStats { total: number; pending: number; approved: number; blocked: number; }

const loading = ref(true);
const settingUpWebhook = ref(false);
const deletingWebhook = ref(false);

const botInfo = ref<BotInfo | null>(null);
const webhookInfo = ref<WebhookInfo | null>(null);
const stats = ref<RepStats | null>(null);
const config = reactive({ hasWebhookSecret: false, appUrl: '' });
const webhookSettings = reactive({ webhookUrl: '', dropPendingUpdates: true });

const { show: showNotification } = useNotification();

const isWebhookUrlMatch = computed(() =>
  !!(webhookInfo.value?.url && webhookSettings.webhookUrl &&
    webhookInfo.value.url === webhookSettings.webhookUrl)
);

const botCapabilities = [
  {
    key: 'canJoinGroups', label: 'Группы', description: 'Разрешение боту вступать в группы.',
    icon: UserPlus, bgClass: 'bg-blue-50 dark:bg-blue-900/20', iconClass: 'text-blue-600',
    trueColor: 'success', falseColor: 'light', trueLabel: 'Разрешено', falseLabel: 'Запрещено'
  },
  {
    key: 'canReadAllGroupMessages', label: 'Чтение сообщений', description: 'Может ли бот читать все сообщения в группах.',
    icon: MessageSquareText, bgClass: 'bg-indigo-50 dark:bg-indigo-900/20', iconClass: 'text-indigo-600',
    trueColor: 'success', falseColor: 'warning', trueLabel: 'Все сообщения', falseLabel: 'Только команды'
  },
  {
    key: 'supportsInlineQueries', label: 'Inline режим', description: 'Поддержка инлайн-запросов.',
    icon: Zap, bgClass: 'bg-purple-50 dark:bg-purple-900/20', iconClass: 'text-purple-600',
    trueColor: 'success', falseColor: 'light', trueLabel: 'Поддерживается', falseLabel: 'Нет'
  },
];

const refreshData = async () => {
  loading.value = true;
  try {
    // Загрузка данных бота (токен может быть ещё не задан)
    let botDataLoaded = false;
    try {
      const data: any = await $fetch('/api/telegram/webhook-info');
      if (data.success) {
        botInfo.value = data.bot;
        webhookInfo.value = data.webhook;
        if (data.webhook.url) {
          webhookSettings.webhookUrl = data.webhook.url;
        }
        botDataLoaded = true;
      }
    } catch {
      // Бот не настроен — ничего не делаем
    }

    const [repStats, envData]: [any, any] = await Promise.all([
      $fetch('/api/representatives/stats').catch(() => null),
      $fetch('/api/environment/current').catch(() => null),
    ]);

    // API возвращает { success, data }
    if (repStats?.data) stats.value = repStats.data;
    if (envData) {
      config.hasWebhookSecret = !!envData.telegram?.TELEGRAM_WEBHOOK_SECRET;
      config.appUrl = envData.application?.APP_URL || '';
      if (!webhookSettings.webhookUrl && config.appUrl) {
        webhookSettings.webhookUrl = `${config.appUrl}/api/telegram/webhook`;
      }
    }
  } catch (error: any) {
    showNotification({ type: 'danger', title: 'Ошибка', message: 'Не удалось загрузить данные бота' });
  } finally {
    loading.value = false;
  }
};

const setupWebhook = async () => {
  if (!webhookSettings.webhookUrl) {
    showNotification({ type: 'warning', title: 'Валидация', message: 'Укажите URL для Webhook' });
    return;
  }
  settingUpWebhook.value = true;
  try {
    const response: any = await $fetch('/api/telegram/setup-webhook', {
      method: 'POST',
      body: { webhookUrl: webhookSettings.webhookUrl, dropPendingUpdates: webhookSettings.dropPendingUpdates },
    });
    if (response.success) {
      showNotification({ type: 'success', title: 'Готово', message: 'Webhook успешно установлен' });
      webhookInfo.value = response.webhookInfo;
    }
  } catch (error: any) {
    showNotification({ type: 'danger', title: 'Ошибка', message: error.data?.statusMessage || 'Ошибка при установке Webhook' });
  } finally {
    settingUpWebhook.value = false;
  }
};

const deleteWebhook = async () => {
  if (!confirm('Удалить Webhook? Бот перестанет получать обновления в реальном времени.')) return;
  deletingWebhook.value = true;
  try {
    await $fetch('/api/telegram/webhook', { method: 'DELETE' });
    showNotification({ type: 'success', title: 'Удалено', message: 'Webhook успешно удалён' });
    await refreshData();
  } catch (error: any) {
    showNotification({ type: 'danger', title: 'Ошибка', message: error.data?.statusMessage || 'Ошибка при удалении' });
  } finally {
    deletingWebhook.value = false;
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
};

onMounted(() => refreshData());
</script>
