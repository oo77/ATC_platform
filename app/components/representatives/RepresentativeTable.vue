<template>
  <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
    <!-- Загрузка -->
    <div v-if="loading" class="p-8 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
    </div>

    <!-- Таблица -->
    <div v-else-if="representatives.length > 0" class="overflow-x-auto">
      <table class="w-full table-auto">
        <thead>
          <tr class="bg-gray-2 text-left dark:bg-meta-4">
            <th class="py-4 px-4 font-medium text-black dark:text-white">ФИО</th>
            <th class="py-4 px-4 font-medium text-black dark:text-white">Организация</th>
            <th class="py-4 px-4 font-medium text-black dark:text-white">Телефон</th>
            <th class="py-4 px-4 font-medium text-black dark:text-white">Telegram</th>
            <th class="py-4 px-4 font-medium text-black dark:text-white">Статус</th>
            <th class="py-4 px-4 font-medium text-black dark:text-white">Дата заявки</th>
            <th class="py-4 px-4 font-medium text-black dark:text-white text-center">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rep in representatives"
            :key="rep.id"
            class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
          >
            <!-- ФИО -->
            <td class="py-4 px-4">
              <p class="font-medium text-black dark:text-white">{{ rep.fullName }}</p>
            </td>

            <!-- Организация -->
            <td class="py-4 px-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ rep.organizationName || 'Не указана' }}
              </p>
            </td>

            <!-- Телефон -->
            <td class="py-4 px-4">
              <p class="text-sm font-mono text-gray-600 dark:text-gray-400">
                {{ rep.phone }}
              </p>
            </td>

            <!-- Telegram -->
            <td class="py-4 px-4">
              <p v-if="rep.telegramUsername" class="text-sm text-gray-600 dark:text-gray-400">
                @{{ rep.telegramUsername }}
              </p>
              <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">
                Не указан
              </p>
            </td>

            <!-- Статус -->
            <td class="py-4 px-4">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  rep.status === 'pending' && 'bg-warning/10 text-warning',
                  rep.status === 'approved' && 'bg-success/10 text-success',
                  rep.status === 'blocked' && 'bg-danger/10 text-danger',
                ]"
              >
                <span
                  :class="[
                    'h-2 w-2 rounded-full',
                    rep.status === 'pending' && 'bg-warning',
                    rep.status === 'approved' && 'bg-success',
                    rep.status === 'blocked' && 'bg-danger',
                  ]"
                ></span>
                {{ getStatusLabel(rep.status) }}
              </span>
            </td>

            <!-- Дата заявки -->
            <td class="py-4 px-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(rep.createdAt) }}
              </p>
            </td>

            <!-- Действия -->
            <td class="py-4 px-4">
              <div class="flex items-center justify-center gap-2">
                <!-- Просмотр -->
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="$emit('view', rep)"
                  title="Просмотр"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </UiButton>

                <!-- Одобрить (только для pending) -->
                <UiButton
                  v-if="rep.status === 'pending'"
                  variant="success"
                  size="sm"
                  @click="$emit('approve', rep)"
                  title="Одобрить"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </UiButton>

                <!-- Заблокировать (для pending и approved) -->
                <UiButton
                  v-if="rep.status !== 'blocked'"
                  variant="warning"
                  size="sm"
                  @click="$emit('block', rep)"
                  title="Заблокировать"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </UiButton>

                <!-- Удалить -->
                <UiButton
                  variant="danger"
                  size="sm"
                  @click="$emit('delete', rep)"
                  title="Удалить"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </UiButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пусто -->
    <div v-else class="p-8 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p class="mt-4 text-gray-500 dark:text-gray-400">Представители не найдены</p>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  representatives: Representative[];
  loading?: boolean;
}

defineProps<Props>();

defineEmits<{
  view: [representative: Representative];
  approve: [representative: Representative];
  block: [representative: Representative];
  delete: [representative: Representative];
}>();

// Вспомогательные функции
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Ожидает',
    approved: 'Одобрен',
    blocked: 'Заблокирован',
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
</script>
