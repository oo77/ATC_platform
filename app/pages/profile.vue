<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Профиль пользователя
      </h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark p-8">
      <div class="text-center">
        <AlertCircle class="h-16 w-16 text-danger mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
        <UiButton variant="primary" @click="loadProfile">
          Попробовать снова
        </UiButton>
      </div>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile">
      <!-- Профиль Header -->
      <div class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
        <!-- Cover Image -->
        <div class="relative h-48 overflow-hidden rounded-t-lg bg-linear-to-r from-primary to-primary-600">
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Profile Info -->
        <div class="px-6 pb-6">
          <div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <!-- Avatar -->
            <div class="relative">
              <div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900">
                <img 
                  :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=465fff&color=fff&bold=true`" 
                  :alt="profile.name" 
                  class="h-full w-full object-cover"
                />
              </div>
            </div>

            <!-- User Info -->
            <div class="flex-1 text-center sm:text-left">
              <h3 class="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                {{ profile.name }}
              </h3>
              <p class="mb-2 text-gray-600 dark:text-gray-400">
                {{ profile.email }}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                  <span class="h-2 w-2 rounded-full bg-success"></span>
                  Активен
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <ShieldCheck class="h-4 w-4" />
                  {{ getRoleLabel(profile.role) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Stats - только для администратора -->
          <div v-if="isAdmin && stats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalUsers }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <GraduationCap class="h-6 w-6 text-success" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Всего студентов</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalStudents }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <BookOpen class="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Активных групп</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.activeGroups }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-info/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <Activity class="h-6 w-6 text-info" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Активность сегодня</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.todayActivities }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex flex-col gap-6">
        <!-- Tabs Navigation -->
        <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in visibleTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            >
              <span class="flex items-center justify-center gap-2">
                <component :is="tab.icon" class="h-5 w-5" />
                {{ tab.label }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
          <!-- Обзор -->
          <div v-show="activeTab === 'overview'" class="p-6">
            <!-- Личная информация -->
            <div>
              <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Личная информация
              </h3>
              <div class="space-y-3">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ profile.name }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ profile.email }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ profile.phone || 'Не указан' }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Роль</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ getRoleLabel(profile.role) }}</p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p>
                  <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(profile.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Редактировать профиль -->
          <div v-show="activeTab === 'edit'" class="p-6">
            <h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              Редактировать профиль
            </h3>
            <form @submit.prevent="updateProfile" class="space-y-5">
              <div class="grid grid-cols-1 gap-5">
                <!-- Имя -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Полное имя *
                  </label>
                  <input 
                    v-model="editForm.name"
                    type="text" 
                    required
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>

                <!-- Телефон -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Телефон
                  </label>
                  <input 
                    v-model="editForm.phone"
                    type="tel" 
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>

                <!-- Место работы -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Место работы
                  </label>
                  <input 
                    v-model="editForm.workplace"
                    type="text" 
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>

                <!-- Должность -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Должность
                  </label>
                  <input 
                    v-model="editForm.position"
                    type="text" 
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>

                <!-- ПИНФЛ -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ПИНФЛ
                  </label>
                  <input 
                    v-model="editForm.pinfl"
                    type="text" 
                    maxlength="14"
                    pattern="[0-9]{14}"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <UiButton variant="outline" size="md" type="button" @click="cancelEdit">
                  Отмена
                </UiButton>
                <UiButton variant="primary" size="md" type="submit" :disabled="updatingProfile">
                  {{ updatingProfile ? 'Сохранение...' : 'Сохранить изменения' }}
                </UiButton>
              </div>
            </form>
          </div>

          <!-- Безопасность -->
          <div v-show="activeTab === 'security'" class="p-6">
            <h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              Настройки безопасности
            </h3>
            <div class="space-y-6">
              <!-- Изменить пароль -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                <h4 class="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                  <Lock class="h-5 w-5" />
                  Изменить пароль
                </h4>
                <form @submit.prevent="changePassword" class="space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Текущий пароль *
                    </label>
                    <input 
                      v-model="passwordForm.currentPassword"
                      type="password" 
                      required
                      autocomplete="current-password"
                      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Новый пароль *
                    </label>
                    <input 
                      v-model="passwordForm.newPassword"
                      type="password" 
                      required
                      minlength="6"
                      autocomplete="new-password"
                      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Подтвердите новый пароль *
                    </label>
                    <input 
                      v-model="passwordForm.confirmPassword"
                      type="password" 
                      required
                      autocomplete="new-password"
                      class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                    />
                  </div>
                  <div class="flex justify-end pt-2">
                    <UiButton variant="primary" size="md" type="submit" :disabled="changingPassword">
                      {{ changingPassword ? 'Обновление...' : 'Обновить пароль' }}
                    </UiButton>
                  </div>
                </form>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  User, 
  Edit, 
  Lock,
  Users,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Activity,
} from 'lucide-vue-next'

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Профиль пользователя | TailAdmin',
})

const toast = useNotification()
const { user } = useAuth()
const { authFetch } = useAuthFetch()

// Состояния
const loading = ref(true)
const error = ref(null)
const profile = ref(null)
const stats = ref(null)
const updatingProfile = ref(false)
const changingPassword = ref(false)

// Активная вкладка
const activeTab = ref('overview')

// Формы
const editForm = ref({
  name: '',
  phone: '',
  workplace: '',
  position: '',
  pinfl: '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Вычисляемые свойства
const isAdmin = computed(() => profile.value?.role === 'ADMIN')

const visibleTabs = computed(() => {
  return [
    {
      id: 'overview',
      label: 'Обзор',
      icon: User,
    },
    {
      id: 'edit',
      label: 'Редактировать',
      icon: Edit,
    },
    {
      id: 'security',
      label: 'Безопасность',
      icon: Lock,
    },
  ];
});

// Методы
const getRoleLabel = (role) => {
  const labels = {
    ADMIN: 'Администратор',
    MANAGER: 'Менеджер',
    TEACHER: 'Инструктор',
    STUDENT: 'Студент',
  }
  return labels[role] || role
}

const formatDate = (date) => {
  if (!date) return 'Не указано'
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}



const loadProfile = async () => {
  try {
    loading.value = true
    error.value = null

    // Загружаем профиль
    const profileData = await authFetch('/api/profile')
    if (profileData?.success) {
      profile.value = profileData.user
      
      // Заполняем форму редактирования
      editForm.value = {
        name: profile.value.name,
        phone: profile.value.phone || '',
        workplace: profile.value.workplace || '',
        position: profile.value.position || '',
        pinfl: profile.value.pinfl || '',
      }
    }

    // Если админ, загружаем статистику
    if (profile.value?.role === 'ADMIN') {
      const statsData = await authFetch('/api/profile/stats/admin')
      if (statsData?.success) {
        stats.value = statsData.stats
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    error.value = err.message || 'Ошибка при загрузке профиля'
  } finally {
    loading.value = false
  }
}



const updateProfile = async () => {
  try {
    updatingProfile.value = true

    const data = await authFetch('/api/profile', {
      method: 'PUT',
      body: editForm.value,
    })

    if (data?.success) {
      profile.value = data.user
      toast.success('Профиль успешно обновлен')
      activeTab.value = 'overview'
    }
  } catch (err) {
    console.error('Error updating profile:', err)
    toast.error(err.data?.message || 'Ошибка при обновлении профиля')
  } finally {
    updatingProfile.value = false
  }
}

const cancelEdit = () => {
  // Восстанавливаем данные из профиля
  editForm.value = {
    name: profile.value.name,
    phone: profile.value.phone || '',
    workplace: profile.value.workplace || '',
    position: profile.value.position || '',
    pinfl: profile.value.pinfl || '',
  }
  activeTab.value = 'overview'
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('Пароли не совпадают')
    return
  }

  try {
    changingPassword.value = true

    const data = await authFetch('/api/profile/password', {
      method: 'PUT',
      body: passwordForm.value,
    })

    if (data?.success) {
      toast.success('Пароль успешно изменен')
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }
    }
  } catch (err) {
    console.error('Error changing password:', err)
    toast.error(err.data?.message || 'Ошибка при изменении пароля')
  } finally {
    changingPassword.value = false
  }
}

// Загружаем данные при монтировании
onMounted(() => {
  loadProfile()
})
</script>
