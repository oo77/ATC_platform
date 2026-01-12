<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      @click.stop="toggleDropdown"
      aria-label="Уведомления"
    >
      <span
        :class="[
          { hidden: !hasActiveNotification, flex: hasActiveNotification }, 
          indicatorColor
        ]"
        class="absolute right-0 top-0.5 z-1 h-2 w-2 rounded-full"
      >
        <span
          class="absolute inline-flex w-full h-full rounded-full opacity-75 -z-1 animate-ping"
          :class="indicatorColor"
        ></span>
      </span>
      <svg
        class="fill-current"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          fill=""
        />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="dropdownOpen"
        class="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 z-99999"
      >
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
          <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Уведомления</h5>

          <button @click="closeDropdown" class="text-gray-500 dark:text-gray-400">
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        <ul class="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          <!-- TODO: Разделить логику для Админа и Студента более явно -->
          
          <!-- Студенческие уведомления -->
          <template v-if="isStudent">
             <li v-for="notification in studentNotifications" :key="notification.id" class="mb-2">
                <div 
                  @click="handleStudentNotificationClick(notification)"
                  class="flex gap-3 rounded-lg border p-3 border-gray-100 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-800 cursor-pointer relative group"
                  :class="getPriorityClass(notification.priority)"
                >
                  <span 
                    class="relative block h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    :class="getIconColorClass(notification.type)"
                  >
                    <!-- Иконка в зависимости от типа -->
                    <svg v-if="notification.type === 'TEST_TODAY' || notification.type === 'DEADLINE_CRITICAL'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                     <svg v-else-if="notification.type === 'TEST_UPCOMING'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </span>
                  
                  <div class="block w-full pr-5">
                    <span class="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">
                        {{ notification.title }}
                    </span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {{ notification.message }}
                    </span>
                    <span class="block text-[10px] text-gray-400 mt-1">
                        {{ formatDate(notification.created_at) }}
                    </span>
                  </div>

                  <!-- Кнопка закрытия (пометить прочитанным) -->
                  <button 
                     @click.stop="markAsRead(notification.id)"
                     class="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                     title="Отметить как прочитанное"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
             </li>
          </template>

          <template v-else>
              <!-- Certificate Issue Progress Item -->
              <li 
                v-if="showCertificateNotification" 
                @click="handleCertificateClick" 
                class="mb-2"
              >
                <!-- ... existing admin code ... -->
                <!-- Для краткости я использую существующий код, но здесь нужно полностью скопировать либы и template -->
                <!-- Так как я заменяю весь файл, я должен вставить полный код. Я скопирую его из sourceView выше, добавив isStudent check -->
                <a
                  :class="[
                    'flex gap-3 rounded-lg border p-3 px-4.5 py-3 cursor-pointer',
                    isCertIssueActive
                      ? 'border-green-100 bg-green-50 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                      : certIssueStore.errorCount.value > 0
                        ? 'border-red-100 bg-red-50 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                        : 'border-green-100 bg-green-50 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                  ]"
                  href="#"
                >
                  <span class="relative block w-full h-10 rounded-full z-1 max-w-10 flex items-center justify-center" :class="isCertIssueActive ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200' : 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200'">
                    <svg 
                      v-if="isCertIssueActive" 
                      class="w-6 h-6 animate-spin" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </span>

                  <span class="block w-full">
                    <span class="mb-1.5 block text-theme-sm text-gray-800 dark:text-gray-200">
                      <span class="font-medium">
                        Выдача сертификатов
                      </span>
                      <span v-if="certIssueStore.currentJob.value" class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        ({{ certIssueStore.currentJob.value.groupCode }})
                      </span>
                    </span>

                    <span class="flex flex-col gap-1">
                      <div class="flex items-center justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                        <span>{{ isCertIssueActive ? certIssueStore.currentStudentName.value || 'Обработка...' : 'Выдача завершена' }}</span>
                        <span>{{ certIssuePercentage }}%</span>
                      </div>
                      <div class="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                        <div 
                          class="h-full rounded-full transition-all duration-300" 
                          :class="certIssueStore.errorCount.value > 0 && !isCertIssueActive ? 'bg-orange-500' : 'bg-green-500'"
                          :style="{ width: `${certIssuePercentage}%` }"
                        ></div>
                      </div>
                      <!-- Статистика -->
                      <div v-if="certIssueStore.processedCount.value > 0" class="flex items-center gap-2 text-theme-xs mt-1">
                        <span class="text-green-600 dark:text-green-400">✓ {{ certIssueStore.successCount.value }}</span>
                        <span v-if="certIssueStore.warningCount.value > 0" class="text-yellow-600 dark:text-yellow-400">⚠ {{ certIssueStore.warningCount.value }}</span>
                        <span v-if="certIssueStore.errorCount.value > 0" class="text-red-600 dark:text-red-400">✕ {{ certIssueStore.errorCount.value }}</span>
                      </div>
                    </span>
                  </span>

                  <!-- Кнопка закрытия для завершённых -->
                  <button 
                    v-if="!isCertIssueActive"
                    @click.stop="dismissCertificateNotification"
                    class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Скрыть"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </a>
              </li>

              <!-- Import Progress Item -->
              <li 
                v-if="showImportNotification" 
                @click="handleImportClick" 
                class="mb-2"
              >
                <a
                  class="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 px-4.5 py-3 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 cursor-pointer"
                  href="#"
                >
                  <span class="relative block w-full h-10 rounded-full z-1 max-w-10 flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200">
                    <svg 
                      v-if="isImportActive" 
                      class="w-6 h-6 animate-spin" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>

                  <span class="block w-full">
                    <span class="mb-1.5 block text-theme-sm text-gray-800 dark:text-gray-200">
                      <span class="font-medium">
                        {{ importFileName || 'Импорт данных' }}
                      </span>
                    </span>

                    <span class="flex flex-col gap-1">
                      <div class="flex items-center justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                        <span>{{ isImportActive ? 'Идет импорт...' : 'Импорт завершен' }}</span>
                        <span>{{ importPercentage }}%</span>
                      </div>
                      <div class="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                        <div 
                          class="h-full bg-blue-500 rounded-full transition-all duration-300" 
                          :style="{ width: `${importPercentage}%` }"
                        ></div>
                      </div>
                    </span>
                  </span>
                </a>
              </li>
          </template>

          <!-- Пустое состояние -->
          <li v-if="!hasActiveNotification" class="flex flex-col items-center justify-center py-8">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Нет новых уведомлений</p>
          </li>
        </ul>

        <button
          @click="handleViewAllClick"
          class="mt-3 flex justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Все уведомления
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const importStore = useImportStore();
const certIssueStore = useCertificateIssueStore();

// Студенческие уведомления
const { 
  notifications: studentNotifications, 
  unreadCount: studentUnreadCount, 
  isStudent, 
  startPolling, 
  stopPolling,
  markAsRead
} = useStudentNotifications();

// Import computed свойства
const isImportActive = computed(() => importStore.isImporting.value);
const importFileName = computed(() => importStore.fileName.value);
const importPercentage = computed(() => importStore.percentage.value);

// Certificate issue computed свойства
const isCertIssueActive = computed(() => certIssueStore.isIssuing.value);
const certIssuePercentage = computed(() => certIssueStore.percentage.value);

// Показывать уведомление об импорте
const showImportNotification = computed(() => {
  const hasActiveImport = importStore.isImporting.value && importStore.jobId.value;
  const hasCompletedImport = importStore.currentStep.value === 4 && importStore.progress.value !== null;
  return hasActiveImport || hasCompletedImport;
});

// Показывать уведомление о выдаче сертификатов
const showCertificateNotification = computed(() => {
  return certIssueStore.isIssuing.value || 
    (certIssueStore.isCompleted.value && certIssueStore.results.value.length > 0);
});

// Есть ли активное уведомление
const hasActiveNotification = computed(() => {
  if (isStudent.value) {
    return studentUnreadCount.value > 0;
  }
  return showImportNotification.value || showCertificateNotification.value;
});

// Цвет индикатора
const indicatorColor = computed(() => {
  if (isStudent.value) return 'bg-blue-500';
  if (isCertIssueActive.value) return 'bg-green-500';
  if (isImportActive.value) return 'bg-blue-500';
  return 'bg-orange-400';
});

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

const handleImportClick = (event: MouseEvent) => {
  event.preventDefault();
  closeDropdown();
  navigateTo('/database/import');
};

const handleCertificateClick = (event: MouseEvent) => {
  event.preventDefault();
  closeDropdown();
  if (certIssueStore.currentJob.value) {
    navigateTo(`/groups/${certIssueStore.currentJob.value.groupId}/certificates`);
  }
};

const dismissCertificateNotification = () => {
  certIssueStore.dismissNotification();
};

const handleViewAllClick = (event: MouseEvent) => {
  event.preventDefault();
  closeDropdown();
  if (isStudent.value) {
      // Можно сделать страницу архива уведомлений, но пока редирект на /tests/my, так как там основное
      navigateTo('/tests/my');
  }
};

// Стили уведомлений
const getPriorityClass = (priority: string) => {
    switch (priority) {
        case 'high':
        case 'critical':
            return 'border-l-4 border-l-red-500';
        case 'medium':
            return 'border-l-4 border-l-orange-500';
        default:
            return '';
    }
}

const getIconColorClass = (type: string) => {
     switch (type) {
        case 'TEST_TODAY':
        case 'DEADLINE_CRITICAL':
        case 'TEST_OVERDUE':
            return 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400';
        case 'TEST_UPCOMING':
        case 'DEADLINE_WARNING':
            return 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400';
        default:
            return 'bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400';
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', { 
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
    });
}

const handleStudentNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    closeDropdown();
    if (notification.link) {
        navigateTo(notification.link);
    }
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 100);
  
  if (isStudent.value) {
      startPolling();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  stopPolling();
});
</script>
