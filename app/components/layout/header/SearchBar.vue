<template>
  <div class="hidden lg:block" v-if="canSearch">
    <form @submit.prevent>
      <div class="relative" ref="containerRef">
        <button
          class="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none"
          type="button"
        >
          <svg
            class="fill-gray-500 dark:fill-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </button>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск пользователей по ФИО или ПИНФЛ..."
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
          @input="handleSearch"
          @focus="handleFocus"
        />

        <button
          v-if="searchQuery"
          @click="clearSearch"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Выпадающий список результатов -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="showResults && (searchResults.length > 0 || isSearching)"
            class="absolute z-50 mt-2 w-full rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-lg max-h-80 overflow-auto"
          >
            <!-- Индикатор загрузки -->
            <div
              v-if="isSearching"
              class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
            >
              <div class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                <span>Поиск...</span>
              </div>
            </div>

            <!-- Результаты поиска -->
            <div v-else class="py-2">
              <NuxtLink
                v-for="user in searchResults"
                :key="user.id"
                :to="getUserLink(user)"
                @click="closeResults"
                class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer transition-colors border-b border-stroke dark:border-strokedark last:border-b-0"
              >
                <!-- Аватар -->
                <div
                  class="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold"
                >
                  {{ getUserInitials(user.name) }}
                </div>

                <!-- Информация о пользователе -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white truncate"
                    >
                      {{ user.name }}
                    </p>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getRoleBadgeClass(user.role)"
                    >
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 mt-1">
                    <p
                      v-if="user.email"
                      class="text-xs text-gray-500 dark:text-gray-400 truncate"
                    >
                      {{ user.email }}
                    </p>
                    <p
                      v-if="user.pinfl"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      ПИНФЛ: {{ user.pinfl }}
                    </p>
                  </div>
                </div>

                <!-- Иконка перехода -->
                <svg
                  class="w-5 h-5 text-gray-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </Transition>

        <!-- Сообщение "Ничего не найдено" -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="
              showResults &&
              !isSearching &&
              searchResults.length === 0 &&
              searchQuery.length >= 2
            "
            class="absolute z-50 mt-2 w-full rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-lg"
          >
            <div
              class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
            >
              Пользователи не найдены
            </div>
          </div>
        </Transition>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { UserPublic } from "~/types/auth";

// Composables
const { user } = useAuth();
const { authFetch } = useAuthFetch();

// Refs
const containerRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const searchResults = ref<UserPublic[]>([]);
const isSearching = ref(false);
const showResults = ref(false);
let searchTimeout: NodeJS.Timeout | null = null;

// Computed
const canSearch = computed(() => {
  return user.value && ["ADMIN", "MANAGER"].includes(user.value.role);
});

// Methods
const handleSearch = () => {
  // Очищаем предыдущий таймаут
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Если запрос слишком короткий, очищаем результаты
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }

  // Устанавливаем debounce на 300ms
  searchTimeout = setTimeout(async () => {
    await performSearch();
  }, 300);
};

const performSearch = async () => {
  const query = searchQuery.value.trim();

  if (query.length < 2) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }

  try {
    isSearching.value = true;
    showResults.value = true;

    const response = await authFetch<{ success: boolean; users: UserPublic[] }>(
      `/api/users/search?q=${encodeURIComponent(query)}&limit=4`
    );

    if (response.success) {
      searchResults.value = response.users;

      // Детальный лог для отладки
      const firstUser = response.users[0];
      if (firstUser) {
        console.log("[SearchBar] Sample user:", {
          id: firstUser.id,
          name: firstUser.name,
          role: firstUser.role,
          studentId: firstUser.studentId,
          instructorId: firstUser.instructorId,
          link: getUserLink(firstUser),
        });
      }
    } else {
      searchResults.value = [];
    }
  } catch (error: any) {
    console.error("Search error:", error);
    searchResults.value = [];

    // Показываем ошибку только если это не 403 (нет прав)
    if (error.statusCode !== 403) {
      // Можно добавить toast уведомление
    }
  } finally {
    isSearching.value = false;
  }
};

const handleFocus = () => {
  if (searchQuery.value.trim().length >= 2 && searchResults.value.length > 0) {
    showResults.value = true;
  }
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
  showResults.value = false;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
};

const closeResults = () => {
  showResults.value = false;
};

const getUserLink = (user: UserPublic): string => {
  // Для студентов переходим на страницу студента
  if (user.role === "STUDENT" && user.studentId) {
    return `/students/${user.studentId}`;
  }

  // Для преподавателей переходим на страницу инструктора
  if (user.role === "TEACHER" && user.instructorId) {
    return `/instructors/${user.instructorId}`;
  }

  // Для админов, модераторов и пользователей без связанных сущностей
  // переходим на страницу пользователя
  return `/users/${user.id}`;
};

const getUserInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: "Администратор",
    MANAGER: "Модератор",
    TEACHER: "Преподаватель",
    STUDENT: "Студент",
  };
  return labels[role] || role;
};

const getRoleBadgeClass = (role: string): string => {
  const classes: Record<string, string> = {
    ADMIN: "bg-danger/10 text-danger",
    MANAGER: "bg-warning/10 text-warning",
    TEACHER: "bg-primary/10 text-primary",
    STUDENT: "bg-success/10 text-success",
  };
  return (
    classes[role] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  );
};

// Закрытие при клике вне компонента
const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    closeResults();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>
