<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Поддержка
      </h2>
    </div>

    <!-- Основной контент -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Форма обращения и История -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Форма -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
          <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Обратиться в поддержку
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Опишите вашу проблему, и мы постараемся помочь вам как можно скорее
            </p>
          </div>

          <div class="p-6">
            <form @submit.prevent="submitTicket" class="space-y-5">
              <!-- Тип обращения -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Тип обращения <span class="text-danger">*</span>
                </label>
                <select v-model="ticket.ticket_type" required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                  <option value="" disabled>Выберите тип обращения</option>
                  <option value="technical">Техническая проблема</option>
                  <option value="question">Общий вопрос</option>
                  <option value="feature">Предложение по улучшению</option>
                  <option value="bug">Сообщить об ошибке</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <!-- Приоритет -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Приоритет
                </label>
                <div class="flex gap-3">
                  <label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-2.5 transition-all hover:border-success focus-within:border-success dark:bg-gray-900"
                    :class="ticket.priority === 'low' ? 'border-success ring-1 ring-success' : 'border-gray-300 dark:border-gray-600'">
                    <input type="radio" v-model="ticket.priority" value="low" class="peer sr-only" />
                    <span class="text-sm font-medium text-gray-700 peer-checked:text-success dark:text-gray-300">Низкий</span>
                  </label>
                  <label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-2.5 transition-all hover:border-warning focus-within:border-warning dark:bg-gray-900"
                    :class="ticket.priority === 'medium' ? 'border-warning ring-1 ring-warning' : 'border-gray-300 dark:border-gray-600'">
                    <input type="radio" v-model="ticket.priority" value="medium" class="peer sr-only" />
                    <span class="text-sm font-medium text-gray-700 peer-checked:text-warning dark:text-gray-300">Средний</span>
                  </label>
                  <label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-2.5 transition-all hover:border-danger focus-within:border-danger dark:bg-gray-900"
                    :class="ticket.priority === 'high' ? 'border-danger ring-1 ring-danger' : 'border-gray-300 dark:border-gray-600'">
                    <input type="radio" v-model="ticket.priority" value="high" class="peer sr-only" />
                    <span class="text-sm font-medium text-gray-700 peer-checked:text-danger dark:text-gray-300">Высокий</span>
                  </label>
                </div>
              </div>

              <!-- Тема обращения -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Тема обращения <span class="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="ticket.subject"
                  required
                  placeholder="Кратко опишите проблему"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" 
                />
              </div>

              <!-- Описание -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Подробное описание <span class="text-danger">*</span>
                </label>
                <textarea 
                  v-model="ticket.description"
                  required
                  rows="6"
                  placeholder="Опишите вашу проблему максимально подробно..."
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                ></textarea>
              </div>

              <!-- Кнопки -->
              <div class="flex justify-end gap-3 pt-2">
                <UiButton variant="primary" size="md" type="submit" :loading="loading">
                  Отправить обращение
                </UiButton>
              </div>
            </form>
          </div>
        </div>

        <!-- История обращений -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
          <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Мои обращения
            </h3>
            <button @click="fetchTickets" class="text-sm text-primary hover:underline">
              Обновить
            </button>
          </div>
          <div class="p-6">
            <div v-if="ticketsLoading" class="flex justify-center p-4">
               <div class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
            </div>
            <div v-else-if="tickets.length === 0" class="text-center text-gray-500 py-4">
              У вас пока нет обращений
            </div>
            <div v-else class="space-y-4">
              <div v-for="t in tickets" :key="t.id" class="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-bold text-gray-900 dark:text-white">{{ t.subject }}</h4>
                    <p class="text-sm text-gray-500">{{ formatDate(t.created_at) }}</p>
                  </div>
                  <span :class="{
                    'bg-blue-100 text-blue-800': t.status === 'new',
                    'bg-yellow-100 text-yellow-800': t.status === 'in_progress',
                    'bg-green-100 text-green-800': t.status === 'resolved',
                    'bg-gray-100 text-gray-800': t.status === 'closed'
                  }" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ getStatusLabel(t.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{{ t.description }}</p>
                <div class="flex gap-2 text-xs mt-2">
                  <span class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {{ getTypeLabel(t.ticket_type) }}
                  </span>
                  <span class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                    Приоритет: {{ getPriorityLabel(t.priority) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Боковая панель с информацией -->
      <div class="space-y-6">
        <!-- Контактная информация -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
          <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Контактная информация
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <!-- Email -->
            <div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                <a href="mailto:support@atc.uz" class="text-sm text-primary hover:underline">
                  support@atc.uz
                </a>
              </div>
            </div>

            <!-- Телефон -->
            <div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Телефон</p>
                <a href="tel:+998901234567" class="text-sm text-success hover:underline">
                  +998 (90) 123-45-67
                </a>
              </div>
            </div>

            <!-- Время работы -->
            <div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Время работы</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Пн-Пт: 9:00 - 18:00
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
          <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Часто задаваемые вопросы
            </h3>
          </div>
          <div class="p-6 space-y-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                Как сбросить пароль?
              </h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Обратитесь к администратору системы.
              </p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                Где мои результаты тестов?
              </h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                В разделе "Мои тесты" в личном кабинете.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Поддержка | TailAdmin - Nuxt Tailwind CSS Dashboard',
});

const loading = ref(false);
const ticketsLoading = ref(false);
const tickets = ref([]);

const ticket = reactive({
  ticket_type: '',
  priority: 'medium',
  subject: '',
  description: ''
});

const { authFetch } = useAuthFetch();

// Получение списка тикетов
const fetchTickets = async () => {
  ticketsLoading.value = true;
  try {
    const data = await authFetch('/api/support/tickets');
    if (data) {
      tickets.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
  } finally {
    ticketsLoading.value = false;
  }
};

// Отправка тикета
const submitTicket = async () => {
  if (!ticket.ticket_type) {
    useNotification().error('Выберите тип обращения');
    return;
  }
  
  if (!ticket.subject || ticket.subject.length < 3) {
    useNotification().error('Тема должна содержать минимум 3 символа');
    return;
  }

  if (!ticket.description || ticket.description.length < 10) {
    useNotification().error('Описание должно содержать минимум 10 символов');
    return;
  }

  loading.value = true;
  try {
    await authFetch('/api/support/tickets', {
      method: 'POST',
      body: ticket
    });

    useNotification().success('Обращение успешно отправлено');
    
    // Сброс формы
    ticket.ticket_type = '';
    ticket.priority = 'medium';
    ticket.subject = '';
    ticket.description = '';

    // Обновление списка
    await fetchTickets();

  } catch (error) {
    console.error('Failed to submit ticket:', error);
    
    // Обработка ошибок валидации от сервера
    if (error.response?._data?.data) {
      const errors = error.response._data.data;
      if (Array.isArray(errors)) {
        errors.forEach(e => {
          // Перевод сообщений Zod (базовый)
          let message = e.message;
          if (e.code === 'too_small') {
            if (e.path.includes('subject')) message = 'Тема слишком короткая';
            if (e.path.includes('description')) message = 'Описание слишком короткое';
          }
          useNotification().error(message);
        });
        return;
      }
    }
    
    useNotification().error('Ошибка при отправке обращения');
  } finally {
    loading.value = false;
  }
};

// Форматирование даты
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Хелперы для лейблов
const getStatusLabel = (status) => {
  const map = {
    new: 'Новое',
    in_progress: 'В работе',
    resolved: 'Решено',
    closed: 'Закрыто'
  };
  return map[status] || status;
};

const getTypeLabel = (type) => {
   const map = {
    technical: 'Техническая',
    question: 'Вопрос',
    feature: 'Предложение',
    bug: 'Ошибка',
    other: 'Другое'
  };
  return map[type] || type;
};

const getPriorityLabel = (priority) => {
   const map = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  };
  return map[priority] || priority;
};

onMounted(() => {
  fetchTickets();
});
</script>

