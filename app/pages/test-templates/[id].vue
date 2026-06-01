<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="text-center py-12">
      <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle class="h-12 w-12 text-danger" />
      </div>
      <p class="mt-4 text-lg font-bold text-danger">{{ error }}</p>
      <UiButton class="mt-4" @click="navigateTo('/test-templates')">
        Вернуться к списку
      </UiButton>
    </div>

    <template v-else-if="template">
      <!-- Хлебные крошки и заголовок -->
      <div class="mb-6">
        <nav class="flex items-center gap-2 text-sm text-slate-500 font-medium mb-4">
          <NuxtLink to="/test-templates" class="hover:text-primary transition-colors">
            Шаблоны тестов
          </NuxtLink>
          <ChevronRight class="w-4 h-4" />
          <span class="text-slate-900 dark:text-white">{{ template.name }}</span>
        </nav>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <FileText class="w-7 h-7 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
                  {{ template.name }}
                </h2>
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                    template.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                  ]"
                >
                  {{ template.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ template.code }}
                </span>
                <span v-if="template.description" class="text-sm text-slate-500">
                  {{ template.description }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UiButton variant="outline" size="sm" @click="navigateTo('/test-templates')">
              <ArrowLeft class="w-4 h-4" />
              Назад
            </UiButton>
            <UiButton v-if="canManage" variant="primary" size="sm" @click="openEditModal">
              <Pencil class="w-4 h-4" />
              Редактировать
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-primary/10 p-2">
              <HelpCircle class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Режим</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {{ template.questions_mode === 'all' ? 'Все вопросы' : 'Случайная выборка' }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-success/10 p-2">
              <CheckCircle class="w-5 h-5 text-success" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Проходной балл</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">{{ template.passing_score }}%</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-warning/10 p-2">
              <Clock class="w-5 h-5 text-warning" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Время</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {{ template.time_limit_minutes ? `${template.time_limit_minutes} мин` : 'Без лимита' }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-info/10 p-2">
              <RotateCcw class="w-5 h-5 text-info" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Попыток</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">{{ template.max_attempts }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Подробная информация -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Настройки теста</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Банк вопросов</label>
            <p class="mt-1 text-slate-900 dark:text-white font-medium">{{ template.bank_name || '—' }}</p>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Вопросов на странице</label>
            <p class="mt-1 text-slate-900 dark:text-white font-medium">
              {{ template.questions_per_page === 0 ? 'Все сразу' : `По ${template.questions_per_page}` }}
            </p>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Показ результатов</label>
            <p class="mt-1 text-slate-900 dark:text-white font-medium">
              {{ showResultsLabels[template.show_results] || template.show_results }}
            </p>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Перемешивание</label>
            <p class="mt-1 text-slate-900 dark:text-white font-medium">
              Вопросы: {{ template.shuffle_questions ? 'Да' : 'Нет' }},
              Ответы: {{ template.shuffle_options ? 'Да' : 'Нет' }}
            </p>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Возврат назад</label>
            <p class="mt-1 text-slate-900 dark:text-white font-medium">
              {{ template.allow_back ? 'Разрешен' : 'Запрещен' }}
            </p>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Языки</label>
            <div class="mt-1 flex items-center gap-1">
              <span
                v-for="lang in (template.allowed_languages || ['ru'])"
                :key="lang"
                class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm"
                :class="languageBadgeClasses[lang]"
                :title="languageLabels[lang]"
              >
                {{ languageFlags[lang] }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="template.questions_mode === 'random'" class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Количество вопросов</label>
              <p class="mt-1 text-slate-900 dark:text-white font-medium">{{ template.questions_count || 0 }}</p>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Всего вопросов в банке</label>
              <p class="mt-1 text-slate-900 dark:text-white font-medium">{{ template.questions_total || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Антипрокторинг -->
        <div v-if="template.proctoring_enabled" class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield class="w-4 h-4 text-danger" />
            Антипрокторинг включен
          </h4>
          <div class="flex flex-wrap gap-2">
            <span v-if="template.proctoring_settings?.blockTabSwitch" class="px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-bold">
              Блок вкладок
            </span>
            <span v-if="template.proctoring_settings?.blockCopyPaste" class="px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-bold">
              Блок копирования
            </span>
            <span v-if="template.proctoring_settings?.blockRightClick" class="px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-bold">
              Блок правой кнопки
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальное окно редактирования -->
    <UiModal
      :is-open="modalOpen"
      title="Редактировать шаблон"
      size="xl"
      @close="closeModal"
    >
      <form @submit.prevent="saveTemplate" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Название</label>
            <input v-model="form.name" type="text" class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Код</label>
            <input v-model="form.code" type="text" class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium uppercase" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Описание</label>
          <textarea v-model="form.description" rows="2" class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Время (мин)</label>
            <input v-model.number="form.time_limit_minutes" type="number" min="0" class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Порог (%)</label>
            <input v-model.number="form.passing_score" type="number" min="1" max="100" class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Попыток</label>
            <input v-model.number="form.max_attempts" type="number" min="1" class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Активен</label>
            <div class="flex items-center h-full">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal">Отмена</UiButton>
          <UiButton :loading="saving" @click="saveTemplate">Сохранить</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Уведомления -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ArrowLeft, ChevronRight, FileText, HelpCircle, CheckCircle, Clock, RotateCcw, Pencil, Shield, AlertCircle } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const { authFetch } = useAuthFetch();
const { canManageTestTemplates } = usePermissions();
const canManage = canManageTestTemplates;

const loading = ref(true);
const error = ref(null);
const template = ref(null);
const modalOpen = ref(false);
const saving = ref(false);
const form = ref({});

const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

const languageLabels = { ru: 'Русский', uz: "O'zbek", en: 'English' };
const languageFlags = { ru: '🇷🇺', uz: '🇺🇿', en: '🇬🇧' };
const languageBadgeClasses = {
  ru: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  uz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  en: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const showResultsLabels = {
  immediately: 'Сразу после завершения',
  after_deadline: 'После дедлайна',
  manual: 'Вручную преподавателем',
  never: 'Скрыты',
};

const loadTemplate = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}`);
    if (response.success) {
      template.value = response.template;
    } else {
      error.value = response.message || 'Шаблон не найден';
    }
  } catch (e) {
    error.value = 'Ошибка загрузки шаблона';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openEditModal = () => {
  form.value = { ...template.value };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
};

const saveTemplate = async () => {
  saving.value = true;
  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}`, {
      method: 'PUT',
      body: form.value,
    });
    if (response.success) {
      showNotification('success', 'Успешно', 'Шаблон обновлён');
      closeModal();
      loadTemplate();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось сохранить');
    }
  } catch (e) {
    showNotification('error', 'Ошибка', 'Произошла ошибка');
  } finally {
    saving.value = false;
  }
};

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => { notification.value.show = false; }, 5000);
};

onMounted(() => {
  loadTemplate();
});
</script>