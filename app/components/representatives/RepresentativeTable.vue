<template>
  <div class="w-full">
    <!-- Загрузка -->
    <div v-if="loading" class="p-8 text-center">
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
      ></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
    </div>

    <!-- Таблица -->
    <div v-else-if="representatives.length > 0" class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              ФИО
            </th>
            <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Организация
            </th>
            <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Телефон
            </th>
            <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Telegram
            </th>
            <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Статус
            </th>
            <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Дата заявки
            </th>
            <th
              class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr
            v-for="rep in representatives"
            :key="rep.id"
            class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <!-- ФИО -->
            <td class="px-6 py-4">
              <p class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                {{ rep.fullName }}
              </p>
            </td>

            <!-- Организация -->
            <td class="px-6 py-4">
              <p class="font-medium text-slate-700 dark:text-slate-300">
                {{ rep.organizationName || "Не указана" }}
              </p>
            </td>

            <!-- Телефон -->
            <td class="px-6 py-4">
              <p class="font-medium text-slate-700 dark:text-slate-300 font-mono">
                {{ rep.phone }}
              </p>
            </td>

            <!-- Telegram -->
            <td class="px-6 py-4">
              <p
                v-if="rep.telegramUsername"
                class="font-medium text-slate-700 dark:text-slate-300"
              >
                @{{ rep.telegramUsername }}
              </p>
              <p v-else class="text-xs font-bold text-slate-400 italic">
                Не указан
              </p>
            </td>

            <!-- Статус -->
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest border',
                  rep.status === 'pending' && 'bg-warning/5 text-warning border-warning/20',
                  rep.status === 'approved' && 'bg-success/5 text-success border-success/20',
                  rep.status === 'blocked' && 'bg-danger/5 text-danger border-danger/20',
                ]"
              >
                <span
                  :class="[
                    'h-1.5 w-1.5 rounded-full',
                    rep.status === 'pending' && 'bg-warning',
                    rep.status === 'approved' && 'bg-success',
                    rep.status === 'blocked' && 'bg-danger',
                  ]"
                ></span>
                {{ getStatusLabel(rep.status) }}
              </span>
            </td>

            <!-- Дата заявки -->
            <td class="px-6 py-4">
              <p class="font-medium text-slate-700 dark:text-slate-300">
                {{ formatDate(rep.createdAt) }}
              </p>
            </td>

            <!-- Действия -->
            <td class="px-6 py-4">
              <div class="flex items-center justify-center gap-2">
                <!-- Просмотр -->
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="$emit('view', rep)"
                  title="Просмотр"
                  class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
                >
                  <Eye class="w-4 h-4 text-slate-500" />
                </UiButton>

                <!-- Одобрить (только для pending) -->
                <UiButton
                  v-if="rep.status === 'pending'"
                  variant="success"
                  size="sm"
                  @click="$emit('approve', rep)"
                  title="Одобрить"
                  class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
                >
                  <Check class="w-4 h-4" />
                </UiButton>

                <!-- Заблокировать (для pending и approved) -->
                <UiButton
                  v-if="rep.status !== 'blocked'"
                  variant="warning"
                  size="sm"
                  @click="$emit('block', rep)"
                  title="Заблокировать"
                  class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
                >
                  <Ban class="w-4 h-4" />
                </UiButton>

                <!-- Разблокировать (только для blocked) -->
                <UiButton
                  v-if="rep.status === 'blocked'"
                  variant="success"
                  size="sm"
                  @click="$emit('unblock', rep)"
                  title="Разблокировать"
                  class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
                >
                  <Unlock class="w-4 h-4" />
                </UiButton>

                <!-- Удалить -->
                <UiButton
                  variant="danger"
                  size="sm"
                  @click="$emit('delete', rep)"
                  title="Удалить"
                  class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
                >
                  <Trash2 class="w-4 h-4" />
                </UiButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пусто -->
    <div v-else class="p-12 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mb-4 dark:bg-slate-800/50">
        <Users class="w-8 h-8" />
      </div>
      <p class="text-slate-500 dark:text-slate-400 font-medium">
        Представители не найдены
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, Check, Ban, Unlock, Trash2, Users } from 'lucide-vue-next';
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
  unblock: [representative: Representative];
  delete: [representative: Representative];
}>();

// Вспомогательные функции
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Ожидает",
    approved: "Одобрен",
    blocked: "Заблокирован",
  };
  return labels[status] || status;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
</script>
