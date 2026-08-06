<template>
  <div class="space-y-6">
    <!-- Статус интеграции -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Статус включения -->
      <div class="rounded-xl border border-gray-200 bg-linear-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-700 dark:from-primary/10 dark:to-primary/20">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Share2 class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Интеграция</p>
            <p class="truncate text-base font-bold text-gray-900 dark:text-white">
              {{ isEnabled ? 'Включена' : 'Отключена' }}
            </p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between border-t border-primary/10 pt-2">
          <span class="text-xs text-gray-500">Статус модуля</span>
          <UiBadge v-if="isEnabled" color="success">Активна</UiBadge>
          <UiBadge v-else color="warning">Выключена</UiBadge>
        </div>
      </div>

      <!-- URL Сервера -->
      <div class="rounded-xl border border-gray-200 bg-linear-to-br from-blue-50 to-indigo-50 p-4 dark:border-gray-700 dark:from-blue-900/10 dark:to-indigo-900/10">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
            <Globe class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Сервер course-planner2</p>
            <p class="truncate text-sm font-bold text-gray-900 dark:text-white" :title="form.COURSE_PLANNER_URL">
              {{ form.COURSE_PLANNER_URL || 'Не задан' }}
            </p>
          </div>
        </div>
        <div class="mt-3 border-t border-blue-100 dark:border-blue-900/20 pt-2">
          <span class="block truncate text-xs text-gray-500">
            Порт по умолчанию: 3000
          </span>
        </div>
      </div>

      <!-- Состояние подключения -->
      <div class="rounded-xl border border-gray-200 bg-linear-to-br from-emerald-50 to-teal-50 p-4 dark:border-gray-700 dark:from-emerald-900/10 dark:to-teal-900/10">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg"
            :class="connectionStatus === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : connectionStatus === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'">
            <CheckCircle2 v-if="connectionStatus === 'success'" class="h-5 w-5" />
            <XCircle v-else-if="connectionStatus === 'error'" class="h-5 w-5" />
            <Radio v-else class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Проверка API</p>
            <p class="text-sm font-bold"
              :class="connectionStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' : connectionStatus === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'">
              {{ connectionStatus === 'success' ? 'Подключено' : connectionStatus === 'error' ? 'Ошибка связи' : 'Не проверялось' }}
            </p>
          </div>
        </div>
        <div class="mt-3 border-t border-emerald-100 dark:border-emerald-900/20 pt-2">
          <span class="text-xs text-gray-500 truncate block">
            {{ connectionMessage || 'Нажмите «Проверить подключение»' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Форма конфигурации .env -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
      <div class="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700 mb-6">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings class="h-5 w-5 text-primary" />
            Конфигурация подключения (.env)
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Параметры соединения с внешним сервисом курс-планировщика
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Переключатель активности -->
        <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
          <div>
            <span class="font-medium text-gray-900 dark:text-white text-sm">Включить интеграцию с Course Planner 2</span>
            <p class="text-xs text-gray-500 dark:text-gray-400">Разрешает запросы к внешнему сервису и обратно</p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" v-model="enabledBool" class="peer sr-only" />
            <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
          </label>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- COURSE_PLANNER_URL -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL сервера course-planner2 <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.COURSE_PLANNER_URL"
              type="url"
              placeholder="http://localhost:3000"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <p class="mt-1 text-[11px] text-gray-400">Например: http://localhost:3000 или https://planner.domain.uz</p>
          </div>

          <!-- COURSE_PLANNER_API_TOKEN -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              API-Токен доступа (Outbound) <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model="form.COURSE_PLANNER_API_TOKEN"
                :type="showSecrets.COURSE_PLANNER_API_TOKEN ? 'text' : 'password'"
                placeholder="Вставьте токен из course-planner2"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button type="button" @click="showSecrets.COURSE_PLANNER_API_TOKEN = !showSecrets.COURSE_PLANNER_API_TOKEN" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Eye v-if="!showSecrets.COURSE_PLANNER_API_TOKEN" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
            <p class="mt-1 text-[11px] text-gray-400">Сгенерированный API-токен из раздела Настройки -> API Токены в course-planner2</p>
          </div>

          <!-- PLANNER_API_TOKEN -->
          <div class="md:col-span-2">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              API-Токен входящих запросов PLANNER_API_TOKEN
            </label>
            <div class="relative">
              <input
                v-model="form.PLANNER_API_TOKEN"
                :type="showSecrets.PLANNER_API_TOKEN ? 'text' : 'password'"
                placeholder="Токен для обращения course-planner2 к ATC_platform"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button type="button" @click="showSecrets.PLANNER_API_TOKEN = !showSecrets.PLANNER_API_TOKEN" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Eye v-if="!showSecrets.PLANNER_API_TOKEN" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
            <p class="mt-1 text-[11px] text-gray-400">Используется при обращениях course-planner2 к API /api/integration/* этой платформы</p>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700 mt-6">
          <UiButton variant="outline" :loading="testing" @click="testConnection">
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': testing }" />
            Проверить подключение
          </UiButton>

          <UiButton variant="primary" :loading="saving" @click="saveSettings">
            <Save class="mr-2 h-4 w-4" />
            Сохранить в .env
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Блок тестирования вызовов API -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-boxdark">
      <div class="border-b border-gray-100 pb-4 dark:border-gray-700 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Code class="h-5 w-5 text-indigo-500" />
            Интерактивное тестирование API
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Проверка онлайн-получения данных из course-planner2 (ресурсы student и group)
          </p>
        </div>

        <!-- Табы выбора ресурса -->
        <div class="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            @click="testTab = 'student'"
            class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
            :class="testTab === 'student' ? 'bg-white text-primary shadow-xs dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
          >
            <User class="h-3.5 w-3.5" />
            Слушатель (Student)
          </button>
          <button
            @click="testTab = 'group'"
            class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
            :class="testTab === 'group' ? 'bg-white text-primary shadow-xs dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
          >
            <Users class="h-3.5 w-3.5" />
            Группа (Group)
          </button>
        </div>
      </div>

      <!-- Вкладка 1: Слушатель -->
      <div v-if="testTab === 'student'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Искать по полю</label>
            <select v-model="studentSearchField" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
              <option value="pinfl">ПИНФЛ (14 цифр)</option>
              <option value="id">ID (UUID)</option>
              <option value="onecId">1С ID</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Значение для поиска</label>
            <div class="flex gap-2">
              <input
                v-model="studentSearchValue"
                type="text"
                :placeholder="studentSearchField === 'pinfl' ? '12345678901234' : 'Значение...'"
                @keyup.enter="searchStudent"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <UiButton variant="primary" :loading="searchingStudent" @click="searchStudent">
                <Search class="h-4 w-4 mr-1" />
                Найти
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Ошибка поиска -->
        <div v-if="studentError" class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400">
          {{ studentError }}
        </div>

        <!-- Результат слушателя -->
        <div v-if="studentResult" class="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 space-y-4">
          <div class="flex flex-col sm:flex-row items-start gap-4">
            <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-center">
              <img v-if="studentPhotoUrl" :src="studentPhotoUrl" alt="Photo" class="h-full w-full object-cover" />
              <User v-else class="h-10 w-10 text-gray-400" />
            </div>

            <div class="flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="text-base font-bold text-gray-900 dark:text-white">{{ studentResult.name }}</h4>
                <UiBadge :color="studentResult.isActive ? 'success' : 'error'">
                  {{ studentResult.isActive ? 'Активен' : 'Неактивен' }}
                </UiBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                ПИНФЛ: <span class="font-mono font-medium text-gray-700 dark:text-gray-300">{{ studentResult.pinfl }}</span>
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2">
                <div><span class="text-gray-400">Организация:</span> {{ studentResult.organization?.name || '—' }} (ИНН: {{ studentResult.organization?.tin || '—' }})</div>
                <div><span class="text-gray-400">Подразделение:</span> {{ studentResult.department || '—' }}</div>
                <div><span class="text-gray-400">Должность:</span> {{ studentResult.position || '—' }}</div>
                <div><span class="text-gray-400">1С ID:</span> {{ studentResult.onecId || '—' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка 2: Группа -->
      <div v-if="testTab === 'group'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Искать по полю</label>
            <select v-model="groupSearchField" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
              <option value="name">Название группы</option>
              <option value="code">Код курса</option>
              <option value="id">ID группы (UUID)</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Значение для поиска</label>
            <div class="flex gap-2">
              <input
                v-model="groupSearchValue"
                type="text"
                placeholder="Группа или код курса..."
                @keyup.enter="searchGroup"
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <UiButton variant="primary" :loading="searchingGroup" @click="searchGroup">
                <Search class="h-4 w-4 mr-1" />
                Найти
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Ошибка поиска -->
        <div v-if="groupError" class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400">
          {{ groupError }}
        </div>

        <!-- Результат группы -->
        <div v-if="groupResult" class="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-base font-bold text-gray-900 dark:text-white">{{ groupResult.group.name }}</h4>
              <UiBadge color="primary">{{ groupResult.group.status }}</UiBadge>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div v-if="groupResult.group.course">
                <span class="text-gray-400">Курс:</span> {{ groupResult.group.course.name }} (Код: {{ groupResult.group.course.code || '—' }})
              </div>
              <div><span class="text-gray-400">Даты:</span> {{ groupResult.group.startDate || '—' }} — {{ groupResult.group.endDate || '—' }}</div>
              <div><span class="text-gray-400">Слушателей:</span> {{ groupResult.total }} / {{ groupResult.group.maxStudents }}</div>
            </div>

            <!-- Список слушателей группы -->
            <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Состав группы ({{ groupResult.students.length }} чел.):</p>
              <div v-if="groupResult.students.length" class="max-h-40 overflow-y-auto space-y-1 pr-1">
                <div v-for="(st, idx) in groupResult.students" :key="idx"
                  class="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <span class="font-medium text-gray-800 dark:text-gray-200">{{ st.name }}</span>
                  <span class="font-mono text-gray-400">ПИНФЛ: {{ st.pinfl }}</span>
                </div>
              </div>
              <p v-else class="text-xs italic text-gray-400">В группе пока нет слушателей</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  Share2, Globe, CheckCircle2, XCircle, Radio, Settings,
  Eye, EyeOff, Save, RefreshCw, Code, Search, User, Users
} from 'lucide-vue-next';

const { show: showNotification } = useNotification();

// ============================================================================
// STATE & FORM
// ============================================================================
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);

const connectionStatus = ref<'none' | 'success' | 'error'>('none');
const connectionMessage = ref('');

const enabledBool = ref(false);

const form = reactive({
  COURSE_PLANNER_URL: 'http://localhost:3000',
  COURSE_PLANNER_API_TOKEN: '',
  COURSE_PLANNER_ENABLED: 'false',
  PLANNER_API_TOKEN: '',
});

const showSecrets = reactive({
  COURSE_PLANNER_API_TOKEN: false,
  PLANNER_API_TOKEN: false,
});

watch(enabledBool, (v) => {
  form.COURSE_PLANNER_ENABLED = v ? 'true' : 'false';
});

const isEnabled = computed(() => form.COURSE_PLANNER_ENABLED === 'true');

// ============================================================================
// API TESTING STATE
// ============================================================================
const testTab = ref<'student' | 'group'>('student');

// Student test
const studentSearchField = ref<'pinfl' | 'id' | 'onecId'>('pinfl');
const studentSearchValue = ref('');
const searchingStudent = ref(false);
const studentError = ref('');
const studentResult = ref<any>(null);

const studentPhotoUrl = computed(() => {
  const photo = studentResult.value?.photo;
  if (!photo) return null;
  const str = String(photo).trim();
  if (!str) return null;
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  let mimeType = 'image/jpeg';
  if (str.startsWith('iVBORw0KGgo')) {
    mimeType = 'image/png';
  } else if (str.startsWith('R0lGOD')) {
    mimeType = 'image/gif';
  }
  return `data:${mimeType};base64,${str}`;
});

// Group test
const groupSearchField = ref<'name' | 'code' | 'id'>('name');
const groupSearchValue = ref('');
const searchingGroup = ref(false);
const groupError = ref('');
const groupResult = ref<any>(null);

// ============================================================================
// METHODS
// ============================================================================
const loadConfig = async () => {
  loading.value = true;
  try {
    const res: any = await ($fetch as any)('/api/environment/current');
    if (res?.coursePlanner) {
      form.COURSE_PLANNER_URL = res.coursePlanner.COURSE_PLANNER_URL || 'http://localhost:3000';
      form.COURSE_PLANNER_API_TOKEN = res.coursePlanner.COURSE_PLANNER_API_TOKEN === '••••••••' ? '' : (res.coursePlanner.COURSE_PLANNER_API_TOKEN || '');
      form.COURSE_PLANNER_ENABLED = res.coursePlanner.COURSE_PLANNER_ENABLED || 'false';
      form.PLANNER_API_TOKEN = res.coursePlanner.PLANNER_API_TOKEN === '••••••••' ? '' : (res.coursePlanner.PLANNER_API_TOKEN || '');
      enabledBool.value = form.COURSE_PLANNER_ENABLED === 'true';
    }
  } catch (err: any) {
    console.error('[CoursePlannerSettings] Failed to fetch current config:', err);
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  saving.value = true;
  try {
    const payload: Record<string, string> = {
      COURSE_PLANNER_URL: form.COURSE_PLANNER_URL,
      COURSE_PLANNER_ENABLED: form.COURSE_PLANNER_ENABLED,
    };
    if (form.COURSE_PLANNER_API_TOKEN) {
      payload.COURSE_PLANNER_API_TOKEN = form.COURSE_PLANNER_API_TOKEN;
    }
    if (form.PLANNER_API_TOKEN) {
      payload.PLANNER_API_TOKEN = form.PLANNER_API_TOKEN;
    }

    await ($fetch as any)('/api/environment/save', {
      method: 'POST',
      body: payload,
    });

    showNotification({
      type: 'success',
      title: 'Сохранено',
      message: 'Настройки интеграции Course Planner 2 записаны в .env',
    });
  } catch (err: any) {
    showNotification({
      type: 'error',
      title: 'Ошибка сохранения',
      message: err.data?.message || 'Не удалось сохранить настройки',
    });
  } finally {
    saving.value = false;
  }
};

const testConnection = async () => {
  testing.value = true;
  connectionStatus.value = 'none';
  connectionMessage.value = '';

  try {
    const res: any = await ($fetch as any)('/api/course-planner/test', {
      method: 'POST',
      body: {
        COURSE_PLANNER_URL: form.COURSE_PLANNER_URL,
        COURSE_PLANNER_API_TOKEN: form.COURSE_PLANNER_API_TOKEN,
      },
    });

    connectionStatus.value = 'success';
    connectionMessage.value = res.message || 'Подключение успешно установлено';
    showNotification({
      type: 'success',
      title: 'Подключение успешно',
      message: connectionMessage.value,
    });
  } catch (err: any) {
    connectionStatus.value = 'error';
    connectionMessage.value = err.data?.message || 'Не удалось подключиться к серверу';
    showNotification({
      type: 'error',
      title: 'Ошибка подключения',
      message: connectionMessage.value,
    });
  } finally {
    testing.value = false;
  }
};

const searchStudent = async () => {
  if (!studentSearchValue.value.trim()) {
    studentError.value = 'Введите значение для поиска';
    return;
  }
  searchingStudent.value = true;
  studentError.value = '';
  studentResult.value = null;

  try {
    const query: Record<string, string> = {
      [studentSearchField.value]: studentSearchValue.value.trim(),
    };
    if (form.COURSE_PLANNER_URL) query.url = form.COURSE_PLANNER_URL;
    if (form.COURSE_PLANNER_API_TOKEN) query.token = form.COURSE_PLANNER_API_TOKEN;

    const res: any = await ($fetch as any)('/api/course-planner/student', { query });
    studentResult.value = res.data;
  } catch (err: any) {
    studentError.value = err.data?.message || 'Слушатель не найден или произошла ошибка';
  } finally {
    searchingStudent.value = false;
  }
};

const searchGroup = async () => {
  if (!groupSearchValue.value.trim()) {
    groupError.value = 'Введите значение для поиска';
    return;
  }
  searchingGroup.value = true;
  groupError.value = '';
  groupResult.value = null;

  try {
    const query: Record<string, string> = {
      [groupSearchField.value]: groupSearchValue.value.trim(),
    };
    if (form.COURSE_PLANNER_URL) query.url = form.COURSE_PLANNER_URL;
    if (form.COURSE_PLANNER_API_TOKEN) query.token = form.COURSE_PLANNER_API_TOKEN;

    const res: any = await ($fetch as any)('/api/course-planner/group', { query });
    groupResult.value = res.data;
  } catch (err: any) {
    groupError.value = err.data?.message || 'Группа не найдена или произошла ошибка';
  } finally {
    searchingGroup.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>
