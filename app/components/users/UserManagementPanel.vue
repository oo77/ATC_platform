<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок и кнопка добавления -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          {{ roleLabel }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Управление пользователями с ролью "{{ roleLabel }}"
        </p>
      </div>
      <UiButton
        variant="success"
        size="md"
        @click="openCreateModal"
      >
        <template #iconLeft>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </template>
        Добавить {{ roleLabel.toLowerCase() }}а
      </UiButton>
    </div>

    <!-- Фильтры и поиск -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по имени, email..."
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        />
      </div>
      <div class="sm:w-48">
        <select
          v-model="statusFilter"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>
    </div>

    <!-- Таблица пользователей -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { UserRole, UserPublic } from '~/types/auth';

interface Props {
  role: UserRole;
}

const props = defineProps<Props>();

// Состояние
const loading = ref(false);
const users = ref<UserPublic[]>([]);
const searchQuery = ref('');
const statusFilter = ref('all');
const showModal = ref(false);
const showPasswordModal = ref(false);
const selectedUser = ref<UserPublic | null>(null);

// Вычисляемые свойства
const roleLabel = computed(() => {
  const labels: Record<UserRole, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Модератор',
    TEACHER: 'Учитель',
    STUDENT: 'Студент',
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
        user.email.toLowerCase().includes(query)
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
    // Получаем токен для аутентификации
    const { token } = useAuth();
    
    const response = await $fetch<{ success: boolean; users: UserPublic[] }>(
      `/api/users?role=${props.role}`,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );
    if (response.success) {
      users.value = response.users;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
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

const handleDelete = async (userId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
    return;
  }

  try {
    const { token } = useAuth();
    
    await $fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    await fetchUsers();
    // TODO: Показать уведомление об успехе
  } catch (error) {
    console.error('Error deleting user:', error);
    // TODO: Показать уведомление об ошибке
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  fetchUsers();
});
</script>
