<template>
  <UiModal
    :is-open="isOpen"
    title="Управление доступом"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="book" class="space-y-6">
      <!-- Информация о книге -->
      <div
        class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div
          class="h-16 w-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0"
        >
          <img
            v-if="book.cover_url"
            :src="book.cover_url"
            :alt="book.title"
            class="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ book.title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ book.author || "Автор не указан" }}
          </p>
        </div>
      </div>

      <!-- Форма назначения доступа -->
      <div class="space-y-4">
        <h4 class="font-semibold text-gray-900 dark:text-white">
          Назначить доступ
        </h4>

        <!-- Тип доступа -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Тип доступа
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="accessForm.type"
                type="radio"
                value="user"
                class="text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Пользователь
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="accessForm.type"
                type="radio"
                value="group"
                class="text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Группа
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="accessForm.type"
                type="radio"
                value="role"
                class="text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Роль
              </span>
            </label>
          </div>
        </div>

        <!-- Выбор пользователя/группы/роли -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{
              accessForm.type === "user"
                ? "Пользователь"
                : accessForm.type === "group"
                  ? "Группа"
                  : "Роль"
            }}
          </label>
          <select
            v-model="accessForm.targetId"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          >
            <option value="">
              {{
                accessForm.type === "user"
                  ? "Выберите пользователя"
                  : accessForm.type === "group"
                    ? "Выберите группу"
                    : "Выберите роль"
              }}
            </option>

            <template v-if="accessForm.type === 'user'">
              <option v-for="item in users" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </template>

            <template v-else-if="accessForm.type === 'group'">
              <option v-for="item in groups" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </template>

            <template v-else-if="accessForm.type === 'role'">
              <option v-for="item in roles" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </template>
          </select>
        </div>

        <!-- Срок действия удален по требованию -->

        <UiButton
          @click="grantAccess"
          :disabled="!accessForm.targetId || granting"
          class="w-full"
        >
          <span v-if="granting" class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Назначение...
          </span>
          <span v-else>Назначить доступ</span>
        </UiButton>
      </div>

      <!-- Список доступов -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
          Текущие доступы
        </h4>

        <div v-if="loadingAccess" class="text-center py-8">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
          ></div>
        </div>

        <div
          v-else-if="accesses.length === 0"
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <p>Доступы не назначены</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="access in accesses"
            :key="access.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <svg
                  v-if="access.type === 'user'"
                  class="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ access.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ access.type === "user" ? "Пользователь" : "Группа" }}
                  {{
                    access.expires_at
                      ? ` • До ${formatDate(access.expires_at)}`
                      : " • Бессрочно"
                  }}
                </p>
              </div>
            </div>
            <button
              @click="revokeAccess(access)"
              class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Отозвать доступ"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useToast } from "~/composables/useToast";

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
}

interface Access {
  id: number;
  type: "user" | "group" | "role";
  name: string;
  expires_at: string | null;
  user_id?: string;
  group_id?: number | string;
  role_name?: string;
}

interface Props {
  isOpen: boolean;
  book: Book | null;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
}>();

const toast = useToast();

const loadingAccess = ref(false);
const granting = ref(false);
const accesses = ref<Access[]>([]);
const users = ref<{ id: string; name: string }[]>([]);
const groups = ref<{ id: number; name: string }[]>([]);
const roles = [
  { id: "STUDENT", name: "Слушатель" },
  { id: "TEACHER", name: "Преподаватель" },
  { id: "MANAGER", name: "Менеджер" },
  { id: "ADMIN", name: "Администратор" },
];

const accessForm = ref({
  type: "user" as "user" | "group" | "role",
  targetId: "",
  expiresAt: "",
});

const fetchAccesses = async () => {
  if (!props.book) return;

  loadingAccess.value = true;
  try {
    const response = await $fetch<{ data: { accessList: Access[] } }>(
      `/api/library/admin/books/${props.book.id}/access`,
    );
    accesses.value = response.data.accessList;
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка загрузки списка доступов");
  } finally {
    loadingAccess.value = false;
  }
};

const fetchUsersAndGroups = async () => {
  try {
    // Загружаем пользователей
    const usersResponse = await $fetch("/api/users");
    users.value = usersResponse.users.map((u: any) => ({
      id: u.id,
      name: `${u.name} (${u.email})`, // Fixed: use name instead of first_name/last_name
    }));

    // Загружаем группы
    const groupsResponse = await $fetch("/api/groups");
    groups.value = groupsResponse.groups.map((g: any) => ({
      id: g.id,
      name: g.name,
    }));
  } catch (error) {
    console.error("Ошибка загрузки пользователей/групп:", error);
  }
};

const grantAccess = async () => {
  if (!props.book || !accessForm.value.targetId) return;

  granting.value = true;
  try {
    await $fetch(`/api/library/admin/books/${props.book.id}/access`, {
      method: "POST",
      body: {
        type: accessForm.value.type,
        userId:
          accessForm.value.type === "user"
            ? String(accessForm.value.targetId)
            : undefined,
        groupId:
          accessForm.value.type === "group"
            ? Number(accessForm.value.targetId)
            : undefined,
        roleName:
          accessForm.value.type === "role"
            ? accessForm.value.targetId
            : undefined,
        // expiresAt excluded
      },
    });

    toast.success("Доступ успешно назначен");
    accessForm.value.targetId = "";
    accessForm.value.expiresAt = "";
    fetchAccesses();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка назначения доступа");
  } finally {
    granting.value = false;
  }
};

const revokeAccess = async (access: Access) => {
  if (!props.book) return;

  try {
    await $fetch(`/api/library/admin/books/${props.book.id}/access`, {
      method: "DELETE",
      body: { accessId: access.id },
    });

    toast.success("Доступ успешно отозван");
    fetchAccesses();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка отзыва доступа");
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.book) {
      fetchAccesses();
    }
  },
);

onMounted(() => {
  fetchUsersAndGroups();
});
</script>
