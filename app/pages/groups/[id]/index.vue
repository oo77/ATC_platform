<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка информации о группе...</p>
      </div>
    </div>

    <!-- Группа не найдена -->
    <div v-else-if="!group" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Группа не найдена</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Возможно, группа была удалена или перемещена</p>
        <UiButton class="mt-6" @click="$router.push('/groups')">
          Вернуться к списку групп
        </UiButton>
      </div>
    </div>

    <!-- Содержимое -->
    <template v-else>
      <!-- Заголовок и навигация -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <NuxtLink to="/groups" class="hover:text-primary transition-colors">Учебные группы</NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-white">{{ group.code }}</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
              {{ group.code.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-black dark:text-white">{{ group.code }}</h1>
              <p class="text-gray-500 dark:text-gray-400">{{ group.course?.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink v-if="canIssueCertificates" :to="`/groups/${group.id}/certificates`">
              <UiButton variant="primary">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Выдача сертификатов
              </UiButton>
            </NuxtLink>
            <UiButton v-if="canEditGroups" variant="outline" @click="showEditModal = true">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </UiButton>
            <UiButton v-if="canDeleteGroups" variant="danger" @click="showDeleteModal = true">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Блок дисциплин на всю ширину -->
      <div v-if="disciplines.length > 0" class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-black dark:text-white">Журналы дисциплин</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ disciplines.length }} дисциплин в программе</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NuxtLink
            v-for="discipline in disciplines"
            :key="discipline.id"
            :to="`/groups/journal/${group?.id}_${discipline.id}`"
            class="group p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all duration-200"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{{ discipline.name }}</h4>
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ discipline.theoryHours }} т
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ discipline.practiceHours }} п
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ discipline.assessmentHours }} о
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Информация о группе и Учебная программа в один ряд -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Карточка информации -->
        <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
          <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Информация о группе</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Код группы</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ group.code }}</p>
            </div>
            
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Статус</label>
              <p>
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium',
                    statusClass
                  ]"
                >
                  {{ statusText }}
                </span>
              </p>
            </div>
            
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Даты обучения</label>
              <p class="text-gray-900 dark:text-white font-medium">
                {{ formatDate(group.startDate) }} — {{ formatDate(group.endDate) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ daysInfo }}</p>
            </div>
            
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Аудитория</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ group.classroom || '—' }}</p>
            </div>
            
            <div v-if="group.description" class="col-span-2">
              <label class="text-sm text-gray-500 dark:text-gray-400">Описание</label>
              <p class="text-gray-900 dark:text-white">{{ group.description }}</p>
            </div>
          </div>
        </div>

        <!-- Карточка курса -->
        <div v-if="group.course" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
          <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Учебная программа</h3>
          
          <div class="space-y-3">
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">Название</label>
              <p class="text-gray-900 dark:text-white font-medium">{{ group.course.name }}</p>
            </div>
            
            <div class="flex gap-6">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Код</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ group.course.code }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Всего часов</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ group.course.totalHours }} а-ч</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">Дисциплин</label>
                <p class="text-gray-900 dark:text-white font-medium">{{ disciplines.length }}</p>
              </div>
            </div>
            
            <NuxtLink
              :to="`/programs/${group.courseId}`"
              class="inline-flex items-center gap-1 text-primary hover:underline text-sm"
            >
              Перейти к программе
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Слушатели на всю ширину -->
      <div class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white">Слушатели</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ group.students?.length || 0 }} человек</p>
              </div>
            </div>
            <UiButton v-if="canManageGroupStudents" @click="showManageStudentsModal = true">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Управление слушателями
            </UiButton>
          </div>
        </div>

        <div v-if="!group.students || group.students.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="mt-4">В группе пока нет слушателей</p>
          <UiButton v-if="canManageGroupStudents" class="mt-4" @click="showManageStudentsModal = true">
            Добавить слушателей
          </UiButton>
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Слушатель
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Организация
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Должность
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Посещаемость
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Дата зачисления
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="gs in paginatedStudents"
                  :key="gs.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success font-semibold">
                        {{ getInitials(gs.student?.fullName) }}
                      </div>
                      <span class="font-medium text-gray-900 dark:text-white truncate max-w-[200px]" :title="gs.student?.fullName">{{ gs.student?.fullName }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <span class="truncate max-w-[200px] inline-block" :title="gs.student?.organization">{{ gs.student?.organization || '—' }}</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <span class="truncate max-w-[180px] inline-block" :title="gs.student?.position">{{ gs.student?.position || '—' }}</span>
                  </td>
                  <td class="px-6 py-4 text-center whitespace-nowrap">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
                      :class="getAttendanceColorClass(getStudentAttendance(gs.studentId))"
                    >
                      {{ getStudentAttendance(gs.studentId).toFixed(0) }}%
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {{ formatDate(gs.enrolledAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Пагинация -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Показать:</span>
              <select
                v-model="studentsPerPage"
                class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                @change="currentStudentsPage = 1"
              >
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
              <span>записей</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ paginationInfo }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button
                :disabled="currentStudentsPage === 1"
                class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="currentStudentsPage = 1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                :disabled="currentStudentsPage === 1"
                class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="currentStudentsPage--"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <template v-for="page in visiblePages" :key="page">
                <button
                  v-if="page !== '...'"
                  :class="[
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                    page === currentStudentsPage
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="currentStudentsPage = page as number"
                >
                  {{ page }}
                </button>
                <span v-else class="px-2 text-gray-400">...</span>
              </template>

              <button
                :disabled="currentStudentsPage === totalStudentsPages"
                class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="currentStudentsPage++"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                :disabled="currentStudentsPage === totalStudentsPages"
                class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="currentStudentsPage = totalStudentsPages"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Расписание занятий как шторка -->
      <div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <button 
          class="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          @click="scheduleExpanded = !scheduleExpanded"
        >
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="text-left">
              <h3 class="text-lg font-semibold text-black dark:text-white">Расписание занятий</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ scheduleEvents.length }} запланировано</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink 
              to="/schedule" 
              class="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
              @click.stop
            >
              Открыть расписание
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </NuxtLink>
            <svg 
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': scheduleExpanded }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[1000px]"
          leave-from-class="opacity-100 max-h-[1000px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-show="scheduleExpanded" class="overflow-hidden border-t border-gray-200 dark:border-gray-700">
            <div v-if="loadingSchedule" class="p-12 text-center">
              <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p class="mt-2 text-gray-500 dark:text-gray-400">Загрузка расписания...</p>
            </div>

            <div v-else-if="scheduleEvents.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="mt-4">Занятия не запланированы</p>
              <NuxtLink to="/schedule" class="inline-block mt-4 text-primary hover:underline">
                Добавить занятие
              </NuxtLink>
            </div>

            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="event in scheduleEvents.slice(0, 10)"
                :key="event.id"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div class="flex items-start gap-4">
                  <!-- Дата -->
                  <div class="shrink-0 w-16 text-center">
                    <div class="text-2xl font-bold text-black dark:text-white">
                      {{ new Date(event.startTime).getDate() }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {{ new Date(event.startTime).toLocaleDateString('ru-RU', { month: 'short' }) }}
                    </div>
                  </div>
                  
                  <!-- Информация -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span 
                        class="inline-block w-3 h-3 rounded-full"
                        :class="{
                          'bg-primary': event.color === 'primary',
                          'bg-success': event.color === 'success',
                          'bg-warning': event.color === 'warning',
                          'bg-danger': event.color === 'danger',
                        }"
                      ></span>
                      <h4 class="font-medium text-black dark:text-white truncate">{{ event.title }}</h4>
                    </div>
                    <div class="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
                      </span>
                      <span v-if="event.classroom" class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {{ event.classroom.name }}
                      </span>
                      <span v-if="event.instructor" class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {{ event.instructor.fullName }}
                      </span>
                    </div>
                    <span 
                      class="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium"
                      :class="{
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': event.eventType === 'theory',
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': event.eventType === 'practice',
                        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400': event.eventType === 'assessment',
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': event.eventType === 'other',
                      }"
                    >
                      {{ eventTypeLabels[event.eventType] }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Ссылка на все занятия -->
              <div v-if="scheduleEvents.length > 10" class="p-4 text-center">
                <NuxtLink 
                  :to="`/schedule?groupId=${group?.id}`" 
                  class="text-primary hover:underline text-sm font-medium"
                >
                  Показать все {{ scheduleEvents.length }} занятий →
                </NuxtLink>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <!-- Модальные окна -->
    <GroupsGroupFormModal
      :is-open="showEditModal"
      :group="group"
      @close="showEditModal = false"
      @updated="handleGroupUpdated"
    />

    <GroupsManageStudentsModal
      :is-open="showManageStudentsModal"
      :group="group"
      @close="showManageStudentsModal = false"
      @updated="loadGroup"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы"
      message="Вы уверены, что хотите удалить эту группу?"
      :item-name="group?.code"
      warning="Все слушатели будут удалены из этой группы. Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="deleteGroup"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { StudyGroup } from '~/types/group';

// Интерфейс для дисциплины
interface Discipline {
  id: string;
  name: string;
  theoryHours: number;
  practiceHours: number;
  assessmentHours: number;
  hours: number;
}

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuthFetch();
const toast = useNotification();

// Проверка прав доступа
const { 
  canEditGroups, 
  canDeleteGroups, 
  canManageGroupStudents,
  canIssueCertificates 
} = usePermissions();

// State
const loading = ref(true);
const group = ref<StudyGroup | null>(null);
const showEditModal = ref(false);
const showManageStudentsModal = ref(false);
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const loadingSchedule = ref(false);
const scheduleEvents = ref<any[]>([]);
const disciplines = ref<Discipline[]>([]);
const scheduleExpanded = ref(false); // Шторка расписания
const studentAttendanceData = ref<Map<string, { attended: number; total: number }>>(new Map());

// Пагинация слушателей
const currentStudentsPage = ref(1);
const studentsPerPage = ref(10);

// Функция для получения посещаемости студента
const getStudentAttendance = (studentId: string): number => {
  const data = studentAttendanceData.value.get(studentId);
  if (!data || data.total === 0) return 0;
  return (data.attended / data.total) * 100;
};

// Цвет для посещаемости
const getAttendanceColorClass = (percent: number): string => {
  if (percent >= 75) return 'bg-success/10 text-success';
  if (percent >= 50) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
};

// Загрузка посещаемости для всех студентов
const loadStudentAttendance = async () => {
  if (!group.value?.id || !group.value?.students?.length) return;
  
  const groupId = group.value.id;
  const newData = new Map<string, { attended: number; total: number }>();
  
  // Для каждой дисциплины загружаем данные журнала
  for (const discipline of disciplines.value) {
    try {
      const response = await authFetch<{
        success: boolean;
        rows?: Array<{
          student: { id: string };
          totalHoursAttended: number;
          totalMaxHours: number;
        }>;
      }>(`/api/attendance/journal?groupId=${groupId}&disciplineId=${discipline.id}`);
      
      if (response.success && response.rows) {
        for (const row of response.rows) {
          const current = newData.get(row.student.id) || { attended: 0, total: 0 };
          current.attended += row.totalHoursAttended || 0;
          current.total += row.totalMaxHours || 0;
          newData.set(row.student.id, current);
        }
      }
    } catch (err) {
      console.error('Error loading attendance for discipline:', discipline.id, err);
    }
  }
  
  studentAttendanceData.value = newData;
};

// Метки типов событий
const eventTypeLabels: Record<string, string> = {
  theory: 'Теория',
  practice: 'Практика',
  assessment: 'Проверка знаний',
  other: 'Другое',
};

// Computed
const statusClass = computed(() => {
  if (!group.value) return '';
  
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive) {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }

  if (endDate < today) {
    return 'bg-warning/10 text-warning';
  }

  if (startDate > today) {
    return 'bg-info/10 text-info';
  }

  return 'bg-success/10 text-success';
});

const statusText = computed(() => {
  if (!group.value) return '';
  
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive) {
    return 'Неактивна';
  }

  if (endDate < today) {
    return 'Завершена';
  }

  if (startDate > today) {
    return 'Ожидает начала';
  }

  return 'В процессе';
});

const daysInfo = computed(() => {
  if (!group.value) return '';
  
  const today = new Date();
  const startDate = new Date(group.value.startDate);
  const endDate = new Date(group.value.endDate);
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (startDate > today) {
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `Начнётся через ${daysUntilStart} дн.`;
  }
  
  if (endDate < today) {
    return `Завершено (${totalDays} дн.)`;
  }
  
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return `${daysPassed} из ${totalDays} дн.`;
});

// Пагинация - computed свойства
const totalStudentsPages = computed(() => {
  if (!group.value?.students) return 1;
  return Math.ceil(group.value.students.length / studentsPerPage.value) || 1;
});

const paginatedStudents = computed(() => {
  if (!group.value?.students) return [];
  const start = (currentStudentsPage.value - 1) * studentsPerPage.value;
  const end = start + studentsPerPage.value;
  return group.value.students.slice(start, end);
});

const paginationInfo = computed(() => {
  if (!group.value?.students) return '';
  const total = group.value.students.length;
  const start = (currentStudentsPage.value - 1) * studentsPerPage.value + 1;
  const end = Math.min(currentStudentsPage.value * studentsPerPage.value, total);
  return `${start}–${end} из ${total}`;
});

const visiblePages = computed(() => {
  const total = totalStudentsPages.value;
  const current = currentStudentsPage.value;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    // Показываем все страницы, если их мало
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Всегда показываем первую страницу
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    // Показываем страницы вокруг текущей
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    // Всегда показываем последнюю страницу
    pages.push(total);
  }

  return pages;
});

// Methods
const loadGroup = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const response = await authFetch<{ success: boolean; group?: StudyGroup; message?: string }>(
      `/api/groups/${id}`
    );

    if (response.success && response.group) {
      group.value = response.group;
    } else {
      group.value = null;
    }
  } catch (error) {
    console.error('Error loading group:', error);
    group.value = null;
  } finally {
    loading.value = false;
  }
};

const handleGroupUpdated = (updatedGroup: StudyGroup) => {
  group.value = updatedGroup;
  showEditModal.value = false;
  loadGroup(); // Перезагружаем для получения связанных данных
};

const deleteGroup = async () => {
  if (!group.value) return;

  isDeleting.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/groups/${group.value.id}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      toast.success('Группа успешно удалена');
      router.push('/groups');
    } else {
      toast.error(response.message || 'Ошибка при удалении группы');
    }
  } catch (error) {
    toast.error('Произошла ошибка при удалении');
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

const formatDate = (date: string | Date): string => {
  // Если это строка в формате YYYY-MM-DD, парсим вручную
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const datePart = date.split('T')[0] || date;
    const parts = datePart.split('-').map(Number);
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  // Иначе используем обычное преобразование
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.split(' ');
  const first = parts[0] || '';
  const second = parts[1] || '';
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Загрузка расписания группы
const loadSchedule = async () => {
  if (!group.value) return;
  
  loadingSchedule.value = true;
  try {
    const response = await authFetch<{ success: boolean; events: any[] }>(
      `/api/schedule?groupId=${group.value.id}`
    );

    if (response.success && response.events) {
      // Сортируем по дате начала
      // Показываем все занятия (включая прошедшие), но сортируем так чтобы ближайшие были первыми
      const now = new Date();
      scheduleEvents.value = response.events
        .sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          // Сначала будущие события, потом прошедшие
          const aFuture = dateA >= now;
          const bFuture = dateB >= now;
          if (aFuture && !bFuture) return -1;
          if (!aFuture && bFuture) return 1;
          // Среди будущих - ближайшие первыми, среди прошедших - недавние первыми
          return aFuture 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime();
        });
    } else {
      scheduleEvents.value = [];
    }
  } catch (error) {
    console.error('Error loading schedule:', error);
    scheduleEvents.value = [];
  } finally {
    loadingSchedule.value = false;
  }
};

// Загрузка дисциплин курса
const loadDisciplines = async () => {
  if (!group.value?.courseId) {
    disciplines.value = [];
    return;
  }
  
  try {
    const response = await authFetch<{ success: boolean; course?: { disciplines?: Discipline[] } }>(
      `/api/courses/${group.value.courseId}`
    );
    
    if (response.success && response.course?.disciplines) {
      disciplines.value = response.course.disciplines;
    } else {
      disciplines.value = [];
    }
  } catch (error) {
    console.error('Error loading disciplines:', error);
    disciplines.value = [];
  }
};

// Initialize
onMounted(async () => {
  await loadGroup();
  await Promise.all([loadSchedule(), loadDisciplines()]);
  // Загружаем посещаемость после дисциплин
  await loadStudentAttendance();
});

// Watch for route changes
watch(() => route.params.id, async () => {
  await loadGroup();
  await Promise.all([loadSchedule(), loadDisciplines()]);
});
</script>
