<template>
  <div class="w-full">
    <!-- Загрузка -->
    <div v-if="loading" class="p-8 text-center">
      <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
    </div>

    <!-- Таблица: контейнер со скроллом, чтобы sticky-шапка работала при длинном списке -->
    <div v-else-if="representatives.length > 0" class="max-h-[calc(100vh-18rem)] min-h-[200px] overflow-auto">
      <table class="w-full border-collapse text-left text-sm">
        <!-- Шапка: обычный регистр, sticky -->
        <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
          <tr class="border-b border-gray-200 dark:border-gray-800">
            <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">ФИО</th>
            <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Организация</th>
            <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Телефон</th>
            <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Telegram</th>
            <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
            <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Дата заявки</th>
            <th class="w-24 px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <!-- Строка кликабельна: открывает карточку представителя (то же событие view, что и у иконки) -->
          <tr
            v-for="rep in representatives"
            :key="rep.id"
            class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            @click="$emit('view', rep)"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">{{ rep.fullName }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ rep.organizationName || "Не указана" }}</td>
            <td class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{{ rep.phone }}</td>
            <td class="px-4 py-3">
              <span v-if="rep.telegramUsername" class="text-gray-700 dark:text-gray-300">@{{ rep.telegramUsername }}</span>
              <span v-else class="text-xs italic text-gray-400">Не указан</span>
            </td>
            <!-- Статус: единый UiBadge вместо самописной плашки uppercase -->
            <td class="px-4 py-3">
              <UiBadge :color="statusColor(rep.status)">{{ getStatusLabel(rep.status) }}</UiBadge>
            </td>
            <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ formatDate(rep.createdAt) }}</td>
            <!-- Действия: одна главная иконка по состоянию (для заявки — «Одобрить», иначе «Просмотр») + «⋯»; клик не должен открывать строку -->
            <td class="px-4 py-3" @click.stop>
              <div class="flex items-center justify-end gap-1">
                <UiButton
                  v-if="rep.status === 'pending'"
                  variant="soft"
                  size="sm"
                  icon
                  title="Одобрить"
                  aria-label="Одобрить"
                  @click="$emit('approve', rep)"
                >
                  <Check class="h-4 w-4" />
                </UiButton>
                <UiButton v-else variant="ghost" size="sm" icon title="Просмотр" aria-label="Просмотр" @click="$emit('view', rep)">
                  <Eye class="h-4 w-4" />
                </UiButton>
                <UiDropdown
                  :groups="rowMenu(rep)"
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Ещё действия"
                  @select="(key) => onRowAction(key, rep)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пусто: единое пустое состояние -->
    <UiEmptyState v-else title="Представители не найдены" description="Измените запрос или сбросьте фильтры" :icon="Users" />
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

// Сохраняем emit в переменную, чтобы вызывать события из меню «⋯»
const emit = defineEmits<{
  view: [representative: Representative];
  approve: [representative: Representative];
  block: [representative: Representative];
  unblock: [representative: Representative];
  delete: [representative: Representative];
}>();

// Цвет UiBadge по статусу заявки
const statusColor = (status: string): 'warning' | 'success' | 'error' | 'light' => {
  if (status === "pending") return "warning";
  if (status === "approved") return "success";
  if (status === "blocked") return "error";
  return "light";
};

// Меню «⋯»: просмотр, затем блокировка/разблокировка, и отдельной группой внизу — удаление (danger)
const rowMenu = (rep: Representative) => [
  {
    items: [
      { key: "view", label: "Просмотр", icon: Eye },
      { key: "block", label: "Заблокировать", icon: Ban, hidden: rep.status === "blocked" },
      { key: "unblock", label: "Разблокировать", icon: Unlock, hidden: rep.status !== "blocked" },
    ],
  },
  { items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true }] },
];

// Выбранный пункт меню → прежнее событие с тем же аргументом (контракт эмитов не менялся)
const onRowAction = (key: string, rep: Representative) => {
  if (key === "view") emit("view", rep);
  else if (key === "block") emit("block", rep);
  else if (key === "unblock") emit("unblock", rep);
  else if (key === "delete") emit("delete", rep);
};

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
