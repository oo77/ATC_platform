<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Кнопка назад -->
    <div class="mb-6">
      <NuxtLink to="/my-courses" class="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад к списку курсов
      </NuxtLink>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <div v-else-if="!course" class="text-center py-10">
      <h3 class="text-xl font-medium">Курс не найден</h3>
    </div>

    <div v-else class="space-y-6">
      <!-- Информация о курсе -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-6 shadow-md dark:bg-boxdark">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-title-md2 font-bold text-black dark:text-white mb-2">
              {{ course.info.course_name }}
            </h2>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Группа: {{ course.info.group_name }} • {{ course.info.teacher_name || 'Преподаватель не назначен' }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span 
              :class="[
                'rounded-full px-3 py-1 text-sm font-medium',
                course.info.status === 'active' ? 'bg-success/10 text-success' : 
                course.info.status === 'completed' ? 'bg-primary/10 text-primary' : 
                'bg-danger/10 text-danger'
              ]"
            >
              {{ getStatusLabel(course.info.status) }}
            </span>
            <span class="text-sm text-gray-500">
              {{ formatDate(course.info.start_date) }} — {{ formatDate(course.info.end_date) }}
            </span>
          </div>
        </div>

        <div class="mt-6">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium text-black dark:text-white">Прогресс обучения</span>
            <span class="text-sm font-medium text-primary">{{ course.info.progress }}%</span>
          </div>
          <div class="relative h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              class="absolute left-0 h-full rounded-full bg-primary"
              :style="{ width: `${course.info.progress}%` }"
            ></div>
          </div>
           <div class="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Посещено: {{ course.info.attended_lessons }} / {{ course.info.total_lessons }} занятий</span>
            </div>
        </div>
      </div>

      <!-- Вкладки -->
      <div class="flex flex-col gap-6">
        <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800 w-fit overflow-x-auto max-w-full">
          <nav class="flex gap-1">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            >
              {{ tab.label }}
              <!-- Badge for counts -->
              <span v-if="tab.id === 'tests' && tests.length > 0" 
                    class="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold"
                    :class="activeTab === tab.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'">
                {{ tests.length }}
              </span>
               <span v-if="tab.id === 'documents' && certificates.length > 0" 
                    class="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold"
                    :class="activeTab === tab.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'">
                {{ certificates.length }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Содержимое вкладок -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
          
          <!-- Расписание / План -->
          <div v-show="activeTab === 'schedule'" class="p-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Программа курса</h3>
              
              <div v-if="course.schedule.length === 0" class="text-gray-500">Расписание пока не составлено</div>

              <div v-for="(lesson, index) in course.schedule" :key="lesson.id" 
                class="relative flex gap-4 pb-6 last:pb-0 border-l border-gray-200 dark:border-gray-700 ml-3 pl-6"
              >
                <!-- Маркер статуса -->
                <div class="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-white dark:border-boxdark"
                  :class="{
                    'bg-success': lesson.attendance_status === 'present',
                    'bg-danger': lesson.attendance_status === 'absent',
                    'bg-warning': lesson.attendance_status === 'late',
                    'bg-primary': lesson.attendance_status === 'excused',
                    'bg-gray-300 dark:bg-gray-600': !lesson.attendance_status && isPast(lesson.start_time),
                    'bg-blue-400': !lesson.attendance_status && !isPast(lesson.start_time)
                  }"
                ></div>
                
                <div class="flex-1">
                  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <h4 class="text-base font-semibold text-black dark:text-white">
                      {{ lesson.title }}
                      <span v-if="lesson.event_type !== 'theory'" class="ml-2 text-xs font-normal px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        {{ getEventTypeLabel(lesson.event_type) }}
                      </span>
                    </h4>
                    <span class="text-sm font-medium" :class="isPast(lesson.start_time) ? 'text-gray-500' : 'text-primary'">
                      {{ formatDateTime(lesson.start_time) }}
                    </span>
                  </div>
                  
                  <p class="text-sm text-gray-500 mt-1">{{ lesson.description || 'Нет описания' }}</p>

                  <!-- Оценки и посещаемость -->
                  <div class="mt-3 flex items-center gap-3">
                    <span v-if="lesson.attendance_status" 
                      :class="[
                        'text-xs px-2 py-1 rounded font-medium',
                        lesson.attendance_status === 'present' ? 'bg-success/10 text-success' : 
                        lesson.attendance_status === 'absent' ? 'bg-danger/10 text-danger' : 
                        lesson.attendance_status === 'late' ? 'bg-warning/10 text-warning' : 
                        'bg-primary/10 text-primary'
                      ]"
                    >
                      {{ getAttendanceLabel(lesson.attendance_status) }}
                    </span>
                    <span v-else-if="isPast(lesson.start_time)" class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">
                      Нет статуса
                    </span>

                    <span v-if="lesson.grade !== null" class="text-xs px-2 py-1 rounded font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      Оценка: {{ lesson.grade }} / {{ lesson.max_grade || 100 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Тесты -->
          <div v-show="activeTab === 'tests'" class="p-6">
             <div class="flex justify-between items-center mb-4">
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Тестирование</h3>
               <NuxtLink to="/tests/my" class="text-sm text-primary hover:underline">Все мои тесты</NuxtLink>
             </div>

             <div v-if="testsLoading" class="flex justify-center py-10">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
             </div>
             
             <div v-else-if="tests.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-500">
                <svg class="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Тесты пока не назначены</p>
             </div>

             <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                <div v-for="test in tests" :key="test.id" 
                   class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-5 shadow-sm dark:bg-boxdark hover:shadow-md transition-shadow"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                       <h4 class="text-lg font-semibold text-black dark:text-white">{{ test.template_name }}</h4>
                       <span class="text-xs text-gray-500">{{ test.discipline_name || 'Основной курс' }}</span>
                    </div>
                    <span :class="[
                      'px-2 py-1 text-xs font-medium rounded',
                      getTestStatusClass(test.status, test.passed)
                    ]">
                       {{ getTestStatusLabel(test.status, test.passed) }}
                    </span>
                  </div>

                  <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                     <div v-if="test.end_date" class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Дедлайн: {{ formatDateTime(test.end_date) }}</span>
                     </div>
                     <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Попыток: {{ test.attempts_used }} / {{ test.max_attempts }}</span>
                     </div>
                     <div v-if="test.best_score !== null" class="flex items-center gap-2">
                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         <span :class="test.passed ? 'text-success font-medium' : 'text-danger font-medium'">
                            Результат: {{ test.best_score }}% {{ test.passed ? '(Сдан)' : '(Не сдан)' }}
                         </span>
                     </div>
                  </div>

                  <NuxtLink v-if="test.status === 'in_progress'" :to="`/tests/session/${test.active_session_id}`" class="flex w-full justify-center rounded bg-primary p-2 font-medium text-gray hover:bg-opacity-90">
                     Продолжить попытку
                  </NuxtLink>
                   <NuxtLink v-else-if="canTakeTest(test)" :to="`/tests/start/${test.id}`" class="flex w-full justify-center rounded bg-primary p-2 font-medium text-gray hover:bg-opacity-90">
                     Начать тест
                  </NuxtLink>
                   <button v-else class="flex w-full justify-center rounded bg-gray-200 p-2 font-medium text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400" disabled>
                     Недоступен
                  </button>
                </div>
             </div>
          </div>

          <!-- Документы / Сертификаты -->
          <div v-show="activeTab === 'documents'" class="p-6">
             <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Сертификаты и документы</h3>
             
             <div v-if="certificates.length === 0" class="text-gray-500">Документов пока нет</div>
             
             <div class="grid gap-4 md:grid-cols-2">
                <div v-for="cert in certificates" :key="cert.id" 
                  class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-4 shadow-sm dark:bg-boxdark"
                >
                   <div class="flex items-center gap-4">
                      <div class="flex h-12 w-12 items-center justify-center rounded bg-primary/5 text-primary">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                      </div>
                      <div>
                         <h4 class="font-medium text-black dark:text-white">Сертификат {{ cert.certificate_number }}</h4>
                         <p class="text-sm text-gray-500">Выдан: {{ formatDate(cert.issue_date) }}</p>
                      </div>
                   </div>
                   
                   <a :href="`/certificates/view/${cert.uuid || ''}`" target="_blank" class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90">
                      Скачать
                   </a>
                </div>
             </div>
          </div>

          <!-- Журнал -->
          <div v-show="activeTab === 'grades'" class="p-0">
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Успеваемость</h3>
            </div>
            <div class="max-w-full overflow-x-auto">
              <table class="w-full table-auto">
                <thead>
                  <tr class="bg-gray-2 text-left dark:bg-meta-4">
                    <th class="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Занятие</th>
                    <th class="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Дата</th>
                    <th class="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Посещаемость</th>
                    <th class="py-4 px-4 font-medium text-black dark:text-white">Оценка</th>
                  </tr>
                </thead>
                <tbody>
                   <tr v-if="gradedLessons.length === 0">
                      <td colspan="4" class="py-5 px-4 pl-9 xl:pl-11 text-center text-gray-500">Оценок пока нет</td>
                   </tr>
                  <tr v-for="lesson in gradedLessons" :key="lesson.id">
                    <td class="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <h5 class="font-medium text-black dark:text-white">{{ lesson.title }}</h5>
                      <span class="text-xs text-gray-500">{{ getEventTypeLabel(lesson.event_type) }}</span>
                    </td>
                    <td class="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p class="text-sm text-black dark:text-white">{{ formatDate(lesson.start_time) }}</p>
                    </td>
                    <td class="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span 
                        :class="[
                          'inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium',
                          lesson.attendance_status === 'present' ? 'bg-success text-success' :
                          lesson.attendance_status === 'absent' ? 'bg-danger text-danger' :
                          lesson.attendance_status === 'late' ? 'bg-warning text-warning' :
                          lesson.attendance_status === 'excused' ? 'bg-primary text-primary' :
                          'bg-gray-100 text-gray-500'
                        ]"
                      >
                       {{ getAttendanceLabel(lesson.attendance_status) || '-' }}
                      </span>
                    </td>
                    <td class="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span v-if="lesson.grade !== null" class="font-bold text-black dark:text-white">
                        {{ lesson.grade }} / {{ lesson.max_grade || 100 }}
                      </span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const groupId = route.params.id;

// State
const loading = ref(true);
const course = ref(null);
const activeTab = ref('schedule');
const tests = ref([]);
const certificates = ref([]);
const testsLoading = ref(false);

const tabs = [
  { id: 'schedule', label: 'Программа обучения' },
  { id: 'tests', label: 'Тесты' },
  { id: 'documents', label: 'Документы' },
  { id: 'grades', label: 'Журнал оценок' },
];

// Computed
const gradedLessons = computed(() => {
  if (!course.value || !course.value.schedule) return [];
  return course.value.schedule.filter((l) => isPast(l.start_time) || l.grade !== null);
});

// Fetch
const { authFetch } = useAuthFetch();

const fetchCourseDetails = async () => {
  loading.value = true;
  try {
    const data = await authFetch(`/api/students/my-courses/${groupId}`);
    if (data) {
      course.value = data;
      useHead({
        title: `${data.info.course_name} | Занятия`,
      });
      
      // Загружаем связанные данные
      fetchRelatedData();
    }
  } catch (error) {
    console.error('Failed to fetch course details:', error);
    useNotification().error('Курс не найден');
  } finally {
    loading.value = false;
  }
};

const fetchRelatedData = async () => {
    testsLoading.value = true;
    try {
        // Fetch tests
        const testsResponse = await authFetch('/api/tests/my');
        if (testsResponse && testsResponse.assignments) {
            // Фильтруем тесты, относящиеся к этой группе
            tests.value = testsResponse.assignments.filter(t => String(t.group_id) === String(groupId));
        }
        
        // Fetch certificates
        const certsResponse = await authFetch('/api/certificates/my');
        if (certsResponse && certsResponse.certificates) {
            certificates.value = certsResponse.certificates.filter(c => String(c.group_id) === String(groupId));
        }
    } catch (e) {
        console.error("Error fetching related data", e);
    } finally {
        testsLoading.value = false;
    }
}

// Utils
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusLabel = (status) => {
  const map = {
    active: 'Активен',
    completed: 'Завершен',
    dropped: 'Отчислен'
  };
  return map[status] || status;
};

const getEventTypeLabel = (type) => {
  const map = {
    theory: 'Лекция',
    practice: 'Практика',
    assessment: 'Тест/Экзамен',
    other: 'Другое'
  };
  return map[type] || type;
};

const getAttendanceLabel = (status) => {
  const map = {
    present: 'Присутствовал',
    absent: 'Пропуск',
    late: 'Опоздание',
    excused: 'Ув. причина'
  };
  return map[status] || status;
};

const isPast = (dateStr) => {
  return new Date(dateStr) < new Date();
};

const getTestStatusLabel = (status, passed) => {
    if (status === 'completed') return passed ? 'Сдан' : 'Не сдан';
    if (status === 'in_progress') return 'В процессе';
    return 'Назначен';
}

const getTestStatusClass = (status, passed) => {
    if (status === 'completed') return passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger';
    if (status === 'in_progress') return 'bg-warning/10 text-warning';
    return 'bg-primary/10 text-primary';
}

const canTakeTest = (test) => {
  const now = new Date();
  if (test.status === 'completed' && test.attempts_used >= test.max_attempts) return false;
  if (test.start_date && new Date(test.start_date) > now) return false;
  if (test.end_date && new Date(test.end_date) < now) return false;
  return true;
}

onMounted(() => {
  fetchCourseDetails();
});
</script>
