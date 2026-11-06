<template>
  <div class="space-y-4">
    <!-- Фильтры и главное действие в одной строке: поиск слева, «Добавить» справа (одно primary-действие на экран) -->
    <UiFilterBar
      v-model:search="searchQuery"
      search-placeholder="Поиск по имени, email..."
      :debounce="0"
      :total="filteredUsers.length"
    >
      <template #actions>
        <UiButton variant="primary" size="md" :start-icon="Plus" @click="openCreateModal">
          Добавить {{ roleLabel.toLowerCase() }}а
        </UiButton>
      </template>
    </UiFilterBar>

    <!-- Таблица пользователей в стандартной карточке -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
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

    <!-- Модальное окно подтверждения удаления (обработчики прежние) -->
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
// Search/Filter больше не нужны: поиск рисует UiFilterBar. Остался только Plus для кнопки «Добавить»
import { Plus } from "lucide-vue-next";

interface Props {
  role: UserRole;
}

const props = defineProps<Props>();

// Состояние
const loading = ref(false);
const users = ref<UserPublic[]>([]);
const searchQuery = ref("");
// statusFilter не участвовал в фильтрации (заглушка), поэтому селект статуса из интерфейса убран — он вводил в заблуждение
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
