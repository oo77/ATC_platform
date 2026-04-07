<template>
  <div class="mx-auto max-w-screen-2xl space-y-6">
    <!-- Заголовок страницы (Hero) -->
    <div
      class="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-primary p-8 shadow-2xl shadow-indigo-200 dark:shadow-none sm:p-10"
    >
      <!-- Декоративные элементы фона -->
      <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      <div class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"></div>

      <div class="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md">
            <span class="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            <span class="text-xs font-black uppercase tracking-widest text-white/90">Панель управления</span>
          </div>
          <h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Добрый день, <span class="text-emerald-300">{{ user?.name?.split(' ')[0] || "Менеджер" }}</span>!
          </h1>
          <p class="text-lg font-bold text-indigo-100/90">
            {{ currentDate }}
            <span v-if="stats?.activeGroups > 0" class="mx-2 opacity-50">•</span>
            <span v-if="stats?.activeGroups > 0" class="text-white">
              В работе {{ stats.activeGroups }} активных групп
            </span>
          </p>
        </div>
        <NuxtLink to="/groups" class="group shrink-0">
          <button
            class="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 font-black text-indigo-600 shadow-xl transition-all hover:scale-105 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <IconsUserGroupIcon class="h-6 w-6 transition-transform group-hover:rotate-12" />
            Все группы
          </button>
        </NuxtLink>
      </div>
    </div>

    <!-- Статистика (Bento Grid) -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Активные группы -->
      <div
        class="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
        @click="navigateTo('/groups')"
      >
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150"></div>
        <div class="relative flex flex-col gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <IconsUserGroupIcon class="h-7 w-7" />
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-slate-400">Активные группы</p>
            <h3 class="mt-1 text-3xl font-black text-slate-900 dark:text-white">{{ stats?.activeGroups || 0 }}</h3>
          </div>
        </div>
      </div>

      <!-- Контингент на курсах -->
      <div
        class="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
        @click="navigateTo('/users?tab=students')"
      >
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150"></div>
        <div class="relative flex flex-col gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400">
            <IconsUserCircleIcon class="h-7 w-7" />
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-slate-400">Контингент на курсах</p>
            <h3 class="mt-1 text-3xl font-black text-slate-900 dark:text-white">{{ stats?.studentsOnCourses || 0 }}</h3>
          </div>
        </div>
      </div>

      <!-- Тесты сегодня -->
      <div
        class="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
        @click="navigateTo('/schedule')"
      >
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 transition-transform group-hover:scale-150"></div>
        <div class="relative flex flex-col gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white dark:bg-amber-500/10 dark:text-amber-400">
            <IconsClipboardCheckIcon class="h-7 w-7" />
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-slate-400">Экзамены сегодня</p>
            <h3 class="mt-1 text-3xl font-black text-slate-900 dark:text-white">{{ stats?.testsToday || 0 }}</h3>
          </div>
        </div>
      </div>

      <!-- К выдаче сертификатов -->
      <div
        class="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
        @click="navigateTo('/certificates')"
      >
        <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sky-500/5 transition-transform group-hover:scale-150"></div>
        <div class="relative flex flex-col gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white dark:bg-sky-500/10 dark:text-sky-400">
            <IconsCertificateIcon class="h-7 w-7" />
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-slate-400">К выдаче дипломов</p>
            <h3 class="mt-1 text-3xl font-black text-slate-900 dark:text-white">{{ stats?.certificatesPending || 0 }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Чарты: Контингент по курсам и Динамика сертификации -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- Распределение контингента по программам (Круговая диаграмма) -->
      <div
        class="group overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100/60 px-6 py-5 dark:border-slate-800/60"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
            >
              <IconsPieChartIcon class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Контингент по программам
            </h3>
          </div>
          <NuxtLink to="/groups" class="group/link flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
            Все программы
            <IconsArrowRightIcon class="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
          <div
            v-else-if="!coursesChartData.series.length"
            class="flex flex-col items-center justify-center py-16 text-center"
          >
            <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <IconsUserGroupIcon class="h-10 w-10 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-500">Нет данных о контингенте</p>
          </div>
          <ChartsDonutChart
            v-else
            chart-id="students-by-course"
            :series="coursesChartData.series"
            :labels="coursesChartData.labels"
            :height="360"
            legend-position="bottom"
            :colors="['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#0EA5E9']"
            @click="handleCourseChartClick"
          />
        </div>
      </div>

      <!-- Динамика сертификации (Bar Chart) -->
      <div
        class="group overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100/60 px-6 py-5 dark:border-slate-800/60"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              <IconsBarChartIcon class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Динамика выдачи
            </h3>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
              <button
                v-for="period in certificatePeriods"
                :key="period.value"
                class="rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                :class="
                  certificatePeriod === period.value
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                "
                @click="changeCertificatePeriod(period.value)"
              >
                {{ period.label }}
              </button>
            </div>
            <NuxtLink
              to="/certificates"
              class="group/link flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
              title="Все сертификаты"
            >
              <IconsArrowRightIcon class="h-5 w-5" />
            </NuxtLink>
          </div>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
          <div
            v-else-if="!currentCertificatesData.series[0]?.data?.length"
            class="flex flex-col items-center justify-center py-16 text-center"
          >
            <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <IconsCertificateIcon class="h-10 w-10 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-500">Данные отсутствуют</p>
          </div>
          <div
            v-else
            class="transition-all duration-500"
            :class="certificateTransitioning ? 'scale-95 blur-sm opacity-50' : 'scale-100 blur-0 opacity-100'"
          >
            <ChartsDynamicBarChart
              :key="certificatePeriod"
              chart-id="certificates-chart-manager"
              :series="currentCertificatesData.series"
              :categories="currentCertificatesData.categories"
              :colors="['#10B981']"
              :height="320"
              y-axis-title="Выдано"
              :animation-speed="800"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Топ программ и Группы в работе -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- Популярные программы -->
      <div
        class="group overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100/60 px-6 py-5 dark:border-slate-800/60"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
            >
              <IconsAcademicCapIcon class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Популярные программы
            </h3>
          </div>
          <NuxtLink to="/programs" class="group/link flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
            Все программы
            <IconsArrowRightIcon class="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          </div>
          <div
            v-else-if="!stats?.topCourses?.length"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <IconsAcademicCapIcon class="h-8 w-8 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-500">Нет данных о программах</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(course, index) in stats.topCourses"
              :key="course.id"
              class="group/item relative flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-all hover:border-sky-200 hover:bg-sky-50/30 dark:border-slate-800/40 dark:bg-slate-800/20 dark:hover:border-sky-900/40 dark:hover:bg-sky-900/10"
              @click="navigateTo(`/groups?course=${course.id}`)"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-sm transition-transform group-hover/item:scale-110"
                :class="getRankClass(index)"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-900 dark:text-slate-200 truncate group-hover/item:text-sky-600 dark:group-hover/item:text-sky-400">
                  {{ course.name }}
                </p>
                <p class="text-xs font-semibold text-slate-400">{{ course.code }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xl font-black text-sky-600 dark:text-sky-400">
                  {{ course.students_count }}
                </p>
                <p class="text-[10px] font-black uppercase tracking-tighter text-slate-400">чел.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Активные группы -->
      <div
        class="group overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100/60 px-6 py-5 dark:border-slate-800/60"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary dark:bg-primary/10"
            >
              <IconsUserGroupIcon class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Активные группы
            </h3>
          </div>
          <NuxtLink to="/groups" class="group/link flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
            Все группы
            <IconsArrowRightIcon class="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
          <div
            v-else-if="!stats?.groups?.length"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <IconsUserGroupIcon class="h-8 w-8 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-500">Нет активных групп</p>
          </div>
          <div v-else class="flex flex-col gap-4">
            <NuxtLink
              v-for="group in stats.groups"
              :key="group.id"
              :to="`/groups/${group.id}`"
              class="group/item relative flex flex-col gap-3 rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-all hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-slate-200/20 dark:border-slate-800/40 dark:bg-slate-800/20 dark:hover:border-primary/40 dark:hover:bg-slate-800/40"
            >
              <div class="flex justify-between items-start">
                <div class="min-w-0 flex-1">
                  <h4 class="font-black text-slate-900 dark:text-white truncate">
                    {{ group.code }}
                  </h4>
                  <p class="text-xs font-bold text-slate-400 truncate">{{ group.course_name }}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span
                    class="rounded-lg bg-primary/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-tight text-primary dark:bg-primary/10"
                  >
                    {{ group.student_count }} чел.
                  </span>
                  <span class="text-[10px] font-bold text-slate-400 italic">
                    До {{ formatShortDate(group.end_date) }}
                  </span>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span class="text-slate-400">Прогресс обучения</span>
                  <span class="text-primary">{{ group.progress }}%</span>
                </div>
                <div class="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    :style="{ width: `${group.progress}%` }"
                  ></div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Расписание и алерты -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
    <!-- Расписание и алерты -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Расписание на сегодня -->
      <div
        class="xl:col-span-2 overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-none"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100/60 px-6 py-5 dark:border-slate-800/60"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              <IconsCalenderIcon class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Расписание сегодня
            </h3>
          </div>
          <NuxtLink to="/schedule" class="group/link flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
            Календарь
            <IconsArrowRightIcon class="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
          <div
            v-else-if="!stats?.todaySchedule?.length"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <IconsCalenderIcon class="h-8 w-8 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-500">Занятий нет</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="event in stats.todaySchedule"
              :key="event.id"
              class="group/event relative flex flex-col gap-3 rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-all hover:bg-white hover:shadow-lg dark:border-slate-800/40 dark:bg-slate-800/20 dark:hover:bg-slate-800/60"
            >
              <div class="flex items-center justify-between">
                <span
                  class="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                >
                  {{ formatTime(event.start_time) }}
                </span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                  :class="getEventTypeClass(event.event_type)"
                >
                  {{ getEventTypeLabel(event.event_type) }}
                </span>
              </div>
              <h5
                class="font-bold text-slate-900 transition-colors group-hover/event:text-emerald-600 dark:text-slate-200 dark:group-hover/event:text-emerald-400 truncate"
              >
                {{ event.title }}
              </h5>
              <div class="flex items-center gap-3 text-xs font-bold text-slate-400">
                <div class="flex items-center gap-1.5 min-w-0">
                  <IconsUserGroupIcon class="h-3.5 w-3.5 shrink-0" />
                  <span class="truncate">{{ event.group_code }}</span>
                </div>
                <div v-if="event.instructor_name" class="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3 min-w-0">
                  <IconsUserCircleIcon class="h-3.5 w-3.5 shrink-0" />
                  <span class="truncate">{{ event.instructor_name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Завершаются в ближайшие 7 дней -->
      <div
        v-if="stats?.groupsEndingSoon?.length"
        class="rounded-lg bg-warning/5 border border-warning/30 shadow-md overflow-hidden"
      >
        <div
          class="border-b border-warning/30 py-4 px-6 flex justify-between items-center"
        >
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"
            >
              <IconsWarningIcon class="w-5 h-5 text-warning" />
            </div>
            <h3 class="text-lg font-semibold text-warning">
              Завершаются скоро
            </h3>
            <span
              class="bg-warning text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ stats.groupsEndingSoon.length }}
            </span>
          </div>
        </div>
        <div class="p-6">
          <div class="flex flex-col gap-3">
            <div
              v-for="group in stats.groupsEndingSoon"
              :key="group.id"
              class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-2.5 w-2.5 rounded-full"
                  :class="getDaysUntilEndClass(group.end_date)"
                ></span>
                <div>
                  <h5 class="font-medium text-black dark:text-white text-sm">
                    {{ group.code }}
                  </h5>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(group.end_date) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <NuxtLink
                  :to="`/groups/${group.id}/certificates`"
                  class="block text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded-md transition-colors"
                >
                  Сертификаты
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Если нет завершающихся групп, показываем Требуют внимания на всю высоту -->
      <div
        v-else-if="stats?.alerts?.length"
        class="rounded-lg bg-danger/5 border border-danger/30 shadow-md overflow-hidden"
      >
        <div class="border-b border-danger/30 py-4 px-6">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center"
            >
              <IconsErrorIcon class="w-5 h-5 text-danger" />
            </div>
            <h3 class="text-lg font-semibold text-danger">Требуют внимания</h3>
          </div>
        </div>
        <div class="p-6">
          <ul class="space-y-3">
            <li
              v-for="(alert, index) in stats.alerts"
              :key="index"
              class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span
                class="mt-1 h-1.5 w-1.5 rounded-full bg-danger shrink-0"
              ></span>
              {{ alert }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Быстрые переходы -->
    <div>
      <h3 class="text-base font-semibold text-black dark:text-white mb-3">
        Быстрые переходы
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all duration-200 group"
        >
          <div
            class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors"
          >
            <IconsUserGroupIcon
              v-if="action.icon === 'usergroup'"
              class="w-5 h-5 text-primary group-hover:text-white transition-colors"
            />
            <IconsArchiveIcon
              v-else-if="action.icon === 'archive'"
              class="w-5 h-5 text-primary group-hover:text-white transition-colors"
            />
            <IconsCertificateIcon
              v-else-if="action.icon === 'certificate'"
              class="w-5 h-5 text-primary group-hover:text-white transition-colors"
            />
            <IconsCalenderIcon
              v-else
              class="w-5 h-5 text-primary group-hover:text-white transition-colors"
            />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-primary transition-colors">
            {{ action.label }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
const router = useRouter();

const { user } = useAuth();
const { authFetch } = useAuthFetch();

const stats = ref(null);
const loading = ref(true);

// Периоды для фильтрации дипломов
const certificatePeriod = ref("months");
const certificateTransitioning = ref(false);
const certificatePeriods = [
  { value: "months", label: "Месяцы" },
  { value: "quarters", label: "Кварталы" },
  { value: "years", label: "Годы" },
];

const currentDate = new Date().toLocaleDateString("ru-RU", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const quickActions = [
  { to: "/groups", label: "Все группы", icon: "usergroup" },
  { to: "/database/import", label: "Импорт контингента", icon: "archive" },
  { to: "/certificates", label: "Дипломы", icon: "certificate" },
  { to: "/schedule", label: "Календарь", icon: "calendar" },
];

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch("/api/manager/dashboard");
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error("Failed to fetch manager dashboard stats:", error);
  } finally {
    loading.value = false;
  }
};

const navigateTo = (path) => {
  router.push(path);
};

// Функция смены периода с анимацией
const changeCertificatePeriod = (period) => {
  if (certificatePeriod.value === period) return;

  certificateTransitioning.value = true;
  setTimeout(() => {
    certificatePeriod.value = period;
    setTimeout(() => {
      certificateTransitioning.value = false;
    }, 100);
  }, 250);
};

// Данные для диаграммы контингента по программам
const coursesChartData = computed(() => {
  const courses = stats.value?.studentsByCourse || [];
  return {
    series: courses.map((c) => Number(c.count) || 0),
    labels: courses.map((c) => c.name || "Не указано"),
  };
});

// Базовые данные дипломов по месяцам
const certificatesChartData = computed(() => {
  const certs = stats.value?.certificatesByMonth || [];
  const monthNames = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];

  return {
    series: [
      {
        name: "Дипломы",
        data: certs.map((c) => Number(c.count) || 0),
      },
    ],
    categories: certs.map((c) => {
      const [year, month] = c.month.split("-");
      return monthNames[parseInt(month) - 1] + " " + year.slice(2);
    }),
    rawData: certs,
  };
});

// Агрегация по кварталам
const certificatesByQuarters = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const quarterMap = new Map();

  rawData.forEach((item) => {
    const [year, month] = item.month.split("-");
    const quarter = Math.ceil(parseInt(month) / 3);
    const key = `${year}-Q${quarter}`;

    if (!quarterMap.has(key)) {
      quarterMap.set(key, { count: 0, year, quarter });
    }
    quarterMap.get(key).count += Number(item.count) || 0;
  });

  const sorted = Array.from(quarterMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, data]) => ({
      label: `Q${data.quarter} ${data.year.slice(2)}`,
      count: data.count,
    }));

  return {
    series: [
      {
        name: "Сертификаты",
        data: sorted.map((q) => q.count),
      },
    ],
    categories: sorted.map((q) => q.label),
  };
});

// Агрегация по годам
const certificatesByYears = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const yearMap = new Map();

  rawData.forEach((item) => {
    const [year] = item.month.split("-");

    if (!yearMap.has(year)) {
      yearMap.set(year, 0);
    }
    yearMap.set(year, yearMap.get(year) + (Number(item.count) || 0));
  });

  const sorted = Array.from(yearMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));

  return {
    series: [
      {
        name: "Сертификаты",
        data: sorted.map((y) => y.count),
      },
    ],
    categories: sorted.map((y) => y.year),
  };
});

// Текущие данные сертификатов
const currentCertificatesData = computed(() => {
  switch (certificatePeriod.value) {
    case "quarters":
      return certificatesByQuarters.value;
    case "years":
      return certificatesByYears.value;
    default:
      return certificatesChartData.value;
  }
});

const handleCourseChartClick = (data) => {
  console.log("Clicked on course:", data.label);
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
};

const formatShortDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getEventTypeLabel = (type) => {
  const map = {
    theory: "Лекция",
    practice: "Практика",
    assessment: "Тест",
    other: "Другое",
  };
  return map[type] || type;
};

const getEventTypeClass = (type) => {
  const map = {
    theory: "bg-primary/10 text-primary",
    practice: "bg-success/10 text-success",
    assessment: "bg-warning/10 text-warning",
    other: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return map[type] || map.other;
};

const getDaysUntilEnd = (endDate) => {
  const days = Math.ceil(
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  return `${days} дней`;
};

const getDaysUntilEndClass = (endDate) => {
  const days = Math.ceil(
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 1) return "bg-danger animate-pulse";
  if (days <= 3) return "bg-warning";
  return "bg-success";
};

const getRankClass = (index) => {
  if (index === 0)
    return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
  if (index === 1)
    return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
  if (index === 2)
    return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
  return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
};

onMounted(() => {
  fetchDashboardStats();
});
</script>

<style scoped>
.dashboard-hero {
  background-image: radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.1), transparent 45%);
}

@media (prefers-reduced-motion: no-preference) {
  :deep(.apexcharts-canvas) {
    animation: chart-fade-in 0.28s ease-out;
  }
}

@keyframes chart-fade-in {
  from {
    opacity: 0.75;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
