<template>
  <div class="flex flex-col gap-6">
    <!-- Header & Actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {{ roleLabel }}
        </h3>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Управление пользователями с ролью "{{ roleLabel }}"
        </p>
      </div>
      <button 
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg transition-all whitespace-nowrap"
      >
        <Plus class="w-4 h-4" />
        Добавить {{ roleLabel.toLowerCase() }}а
      </button>
    </div>

    <!-- Filters Section -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по имени, email..."
            class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
          />
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        
        <!-- Status Filter -->
        <div class="sm:w-56">
          <div class="relative">
            <select
              v-model="statusFilter"
              class="w-full appearance-none rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
            <Filter class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div
      class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
    >
      <UsersUserTable
        :users="filteredUsers"
        :loading="loading"
        :role="role"
        @edit="openEditModal"
        @reset-password="openPasswordModal"
        @delete="handleDelete"
      />
    </div>

    <!-- Модальное окно создания/редактирования -->
    <UsersUserFormModal
      v-if="showModal"
      :user="selectedUser"
      :role="role"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Модальное окно сброса пароля -->
    <UsersUserPasswordModal
      v-if="showPasswordModal && selectedUser"
      :is-open="showPasswordModal"
      :user-id="selectedUser.id"
      :user-name="selectedUser.name"
      @close="closePasswordModal"
      @success="handlePasswordResetSuccess"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление пользователя"
      :message="`Вы действительно хотите удалить пользователя?`"
      :item-name="userToDelete?.name"
      warning="Это действие необратимо."
      confirm-text="Удалить"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { UserRole, UserPublic } from "~/types/auth";
import { Search, Plus, Filter } from "lucide-vue-next";

interface Props {
  role: UserRole;
}

const props = defineProps<Props>();

// Состояние
const loading = ref(false);
const users = ref<UserPublic[]>([]);
const searchQuery = ref("");
const statusFilter = ref("all");
const showModal = ref(false);
const showPasswordModal = ref(false);
const showDeleteModal = ref(false); // Modal state for delete confirmation
const selectedUser = ref<UserPublic | null>(null);
const userToDelete = ref<UserPublic | null>(null); // Store user to delete specifically

// Вычисляемые свойства
const roleLabel = computed(() => {
  const labels: Record<UserRole, string> = {
    ADMIN: "Администратор",
    MANAGER: "Модератор",
    TEACHER: "Учитель",
    STUDENT: "Студент",
  };
  return labels[props.role];
});

const filteredUsers = computed(() => {
  let result = users.value;

  // Фильтр по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }

  // Фильтр по статусу (пока заглушка, позже добавим поле status в БД)
  // if (statusFilter.value !== 'all') {
  //   result = result.filter(user => user.status === statusFilter.value);
  // }

  return result;
});

// Методы
const fetchUsers = async () => {
  loading.value = true;
  try {
    const { authFetch } = useAuthFetch();
    const response = await authFetch<{ success: boolean; users: UserPublic[] }>(
      `/api/users?role=${props.role}`
    );
    if (response.success) {
      users.value = response.users;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    // TODO: Показать уведомление об ошибке
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  selectedUser.value = null;
  showModal.value = true;
};

const openEditModal = (user: UserPublic) => {
  selectedUser.value = user;
  showModal.value = true;
};

const openPasswordModal = (user: UserPublic) => {
  selectedUser.value = user;
  showPasswordModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedUser.value = null;
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  selectedUser.value = null;
};

const handleSave = async () => {
  await fetchUsers();
  closeModal();
};

const handlePasswordResetSuccess = () => {
  closePasswordModal();
};

const handleDelete = (userId: string) => {
  const user = users.value.find((u) => u.id === userId);
  if (user) {
    userToDelete.value = user;
    showDeleteModal.value = true;
  }
};

const confirmDelete = async () => {
  if (!userToDelete.value) return;

  try {
    const { authFetch } = useAuthFetch();

    await authFetch(`/api/users/${userToDelete.value.id}`, {
      method: "DELETE",
    });

    showDeleteModal.value = false;
    userToDelete.value = null;

    await fetchUsers();
    // TODO: Показать уведомление об успехе
  } catch (error) {
    console.error("Error deleting user:", error);
    // TODO: Показать уведомление об ошибке e.g. toast
    alert("Ошибка при удалении пользователя"); // Fallback alert for error
    showDeleteModal.value = false;
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  userToDelete.value = null;
};

// Загрузка данных при монтировании
onMounted(() => {
  fetchUsers();
});
</script>
