<template>
  <div class="space-y-6">
    <div>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Управление аудиториями
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Настройте список доступных аудиторий для проведения занятий
          </p>
        </div>
        <UiButton variant="primary" size="md" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          Добавить аудиторию
        </UiButton>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          <span class="text-gray-600 dark:text-gray-400">Загрузка аудиторий...</span>
        </div>
      </div>

      <!-- Список аудиторий -->
      <div v-else-if="classrooms.length > 0" class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-boxdark">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Название
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Вместимость
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Описание
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Статус
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr 
                v-for="classroom in classrooms" 
                :key="classroom.id"
                class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <DoorOpen class="h-4 w-4 text-gray-400" />
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ classroom.name }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Users class="h-4 w-4" />
                    <span>{{ classroom.capacity || 0 }} мест</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ classroom.description || '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span 
                    :class="[
                      'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                      classroom.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    ]"
                  >
                    {{ classroom.isActive ? 'Активна' : 'Неактивна' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="openEditModal(classroom)"
                      class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700"
                      title="Редактировать"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button
                      @click="toggleClassroomStatus(classroom)"
                      class="rounded p-1.5 transition-colors"
                      :class="classroom.isActive 
                        ? 'text-gray-600 hover:bg-gray-100 hover:text-warning dark:text-gray-400 dark:hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-success dark:text-gray-400 dark:hover:bg-gray-700'
                      "
                      :title="classroom.isActive ? 'Деактивировать' : 'Активировать'"
                    >
                      <component :is="classroom.isActive ? Ban : Check" class="h-4 w-4" />
                    </button>
                    <button
                      @click="confirmDelete(classroom)"
                      class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-danger dark:text-gray-400 dark:hover:bg-gray-700"
                      title="Удалить"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div v-else class="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <DoorOpen class="mx-auto h-12 w-12 text-gray-400" />
        <h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Нет аудиторий
        </h4>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Добавьте первую аудиторию для проведения занятий
        </p>
        <UiButton variant="primary" size="md" class="mt-4" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          Добавить аудиторию
        </UiButton>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования -->
    <UiModal
      :is-open="isModalOpen"
      :title="editingClassroom ? 'Редактирование аудитории' : 'Новая аудитория'"
      @close="closeModal"
    >
      <form @submit.prevent="saveClassroom" class="space-y-4">
        <!-- Название -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Название аудитории <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Например: Аудитория 101"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <!-- Вместимость -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Вместимость (количество мест)
          </label>
          <input
            v-model.number="form.capacity"
            type="number"
            min="0"
            placeholder="0"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <!-- Описание -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Дополнительная информация об аудитории"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          ></textarea>
        </div>

        <!-- Статус (только при редактировании) -->
        <div v-if="editingClassroom" class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50">
          <div>
            <h5 class="text-sm font-medium text-gray-900 dark:text-white">Активная аудитория</h5>
            <p class="text-xs text-gray-500 dark:text-gray-400">Доступна для использования в расписании</p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" v-model="form.isActive" class="peer sr-only" />
            <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
          </label>
        </div>

        <!-- Кнопки -->
        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" size="md" type="button" @click="closeModal">
            Отмена
          </UiButton>
          <UiButton variant="primary" size="md" type="submit" :loading="saving">
            {{ editingClassroom ? 'Сохранить' : 'Создать' }}
          </UiButton>
        </div>
      </form>
    </UiModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, DoorOpen, Users, Pencil, Trash2, Ban, Check } from 'lucide-vue-next';

const notification = useNotification();
const { authFetch } = useAuthFetch();

const loading = ref(false);
const saving = ref(false);
const classrooms = ref([]);
const isModalOpen = ref(false);
const editingClassroom = ref(null);

const form = ref({
  name: '',
  capacity: 0,
  description: '',
  isActive: true,
});

// Загрузка аудиторий
const loadClassrooms = async () => {
  loading.value = true;
  try {
    const response = await authFetch('/api/classrooms?activeOnly=false');
    if (response.success) {
      classrooms.value = response.classrooms;
    }
  } catch (error) {
    console.error('Error loading classrooms:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось загрузить список аудиторий',
    });
  } finally {
    loading.value = false;
  }
};

// Открыть модальное окно создания
const openCreateModal = () => {
  editingClassroom.value = null;
  form.value = {
    name: '',
    capacity: 0,
    description: '',
    isActive: true,
  };
  isModalOpen.value = true;
};

// Открыть модальное окно редактирования
const openEditModal = (classroom) => {
  editingClassroom.value = classroom;
  form.value = {
    name: classroom.name,
    capacity: classroom.capacity || 0,
    description: classroom.description || '',
    isActive: classroom.isActive,
  };
  isModalOpen.value = true;
};

// Закрыть модальное окно
const closeModal = () => {
  isModalOpen.value = false;
  editingClassroom.value = null;
};

// Сохранить аудиторию
const saveClassroom = async () => {
  saving.value = true;
  try {
    if (editingClassroom.value) {
      // Обновление
      const response = await authFetch(`/api/classrooms/${editingClassroom.value.id}`, {
        method: 'PUT',
        body: form.value,
      });
      
      if (response.success) {
        notification.show({
          type: 'success',
          title: 'Успешно',
          message: 'Аудитория обновлена',
        });
        await loadClassrooms();
        closeModal();
      }
    } else {
      // Создание
      const response = await authFetch('/api/classrooms', {
        method: 'POST',
        body: form.value,
      });
      
      if (response.success) {
        notification.show({
          type: 'success',
          title: 'Успешно',
          message: 'Аудитория создана',
        });
        await loadClassrooms();
        closeModal();
      }
    }
  } catch (error) {
    console.error('Error saving classroom:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: editingClassroom.value 
        ? 'Не удалось обновить аудиторию' 
        : 'Не удалось создать аудиторию',
    });
  } finally {
    saving.value = false;
  }
};

// Переключить статус аудитории
const toggleClassroomStatus = async (classroom) => {
  try {
    const response = await authFetch(`/api/classrooms/${classroom.id}`, {
      method: 'PUT',
      body: { isActive: !classroom.isActive },
    });
    
    if (response.success) {
      notification.show({
        type: 'success',
        title: 'Успешно',
        message: `Аудитория ${!classroom.isActive ? 'активирована' : 'деактивирована'}`,
      });
      await loadClassrooms();
    }
  } catch (error) {
    console.error('Error toggling classroom status:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось изменить статус аудитории',
    });
  }
};

// Подтверждение удаления
const confirmDelete = async (classroom) => {
  if (!confirm(`Вы уверены, что хотите удалить аудиторию "${classroom.name}"?`)) {
    return;
  }

  try {
    const response = await authFetch(`/api/classrooms/${classroom.id}`, {
      method: 'DELETE',
    });
    
    if (response.success) {
      notification.show({
        type: 'success',
        title: 'Успешно',
        message: 'Аудитория удалена',
      });
      await loadClassrooms();
    }
  } catch (error) {
    console.error('Error deleting classroom:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось удалить аудиторию. Возможно, она используется в расписании.',
    });
  }
};

onMounted(() => {
  loadClassrooms();
});
</script>
