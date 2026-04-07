<template>
  <div class="mx-auto max-w-screen-2xl space-y-8 pb-10">
    <!-- HERO БАННЕР -->
    <div
      class="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-blue-700 to-primary p-8 shadow-xl text-white shadow-indigo-500/20"
    >
      <div class="absolute inset-0 bg-[url('/img/noise.png')] opacity-10 mix-blend-overlay"></div>
      <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      <div class="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl"></div>
      
      <div class="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight lg:text-4xl drop-shadow-md">
            Обзор платформы
          </h1>
          <p class="mt-2 text-indigo-100 font-medium text-lg">
            С возвращением, {{ user?.name || "Администратор" }}! • {{ currentDate }}
          </p>
        </div>
        <NuxtLink to="/settings">
          <UiButton class="bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20 shadow-sm rounded-xl px-4 py-2 transition-all flex items-center gap-2">
            <IconsSettingsIcon class="w-5 h-5 shrink-0" />
            <span class="font-medium tracking-wide">Параметры</span>
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <!-- МЕТРИКИ (KPI КАРТОЧКИ) -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Контингент -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700/60 cursor-pointer"
        @click="navigateTo('/users?tab=students')"
      >
        <div class="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
          <IconsUserGroupIcon class="w-24 h-24 text-blue-500 -mr-6 -mt-6 transform rotate-12" />
        </div>
        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <IconsUserGroupIcon class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Контингент
            </h3>
          </div>
          <div>
            <div class="flex items-end gap-3">
              <p class="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {{ stats?.totalStudents || 0 }}
              </p>
              <span v-if="stats?.studentsTrend" class="mb-1 flex items-center text-sm font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                +{{ stats.studentsTrend }}%
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-400 font-medium">Слушателей в системе</p>
          </div>
        </div>
      </div>

      <!-- Инструкторы / Преподаватели -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700/60 cursor-pointer"
        @click="navigateTo('/users?tab=instructors')"
      >
        <div class="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
          <IconsInstructorIcon class="w-24 h-24 text-emerald-500 -mr-6 -mt-6 transform rotate-12" />
        </div>
        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
              <IconsInstructorIcon class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Инструкторы / Преподаватели
            </h3>
          </div>
          <div>
            <div class="flex items-end gap-3">
              <p class="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {{ stats?.totalInstructors || 0 }}
              </p>
            </div>
            <p class="mt-1 text-sm text-slate-400 font-medium">Активных сотрудников</p>
          </div>
        </div>
      </div>

      <!-- Активные группы -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700/60 cursor-pointer"
        @click="navigateTo('/groups')"
      >
        <div class="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
          <IconsUserGroupIcon class="w-24 h-24 text-amber-500 -mr-6 -mt-6 transform rotate-12" />
        </div>
        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <IconsUserGroupIcon class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Активные группы
            </h3>
          </div>
          <div>
            <div class="flex items-end gap-3">
              <p class="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {{ stats?.activeGroups || 0 }}
              </p>
            </div>
            <p class="mt-1 text-sm text-slate-400 font-medium">В процессе обучения</p>
          </div>
        </div>
      </div>

      <!-- Сертификаты -->
      <div
        class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700/60 cursor-pointer"
        @click="navigateTo('/certificates')"
      >
        <div class="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
          <IconsCertificateIcon class="w-24 h-24 text-fuchsia-500 -mr-6 -mt-6 transform rotate-12" />
        </div>
        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/30">
              <IconsCertificateIcon class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400 truncate">
              Выдано за месяц
            </h3>
          </div>
          <div>
            <div class="flex items-end gap-3">
              <p class="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {{ stats?.certificatesThisMonth || 0 }}
              </p>
            </div>
            <p class="mt-1 text-sm text-slate-400 font-medium">Новых сертификатов</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ЧАРТЫ И АНАЛИТИКА -->
    <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
      
      <!-- Распределение контингента (Круговая диаграмма) -->
      <div class="flex flex-col rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div class="border-b border-slate-100 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
              <IconsPieChartIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">Контингент по организациям</h3>
              <p class="text-sm text-slate-500 mt-0.5">Доля слушателей от партнеров</p>
            </div>
          </div>
          <NuxtLink
            to="/certificates?tab=orgs"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Детализация &rarr;
          </NuxtLink>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-center">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600"></div>
          </div>
          <div v-else-if="!organizationChartData.series.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="h-16 w-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <IconsUserGroupIcon class="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p class="text-slate-500 font-medium">Нет данных об организациях</p>
          </div>
          <div v-else class="h-[360px] w-full relative pt-4 pb-4">
            <ClientOnly>
              <PolarArea :data="organizationChartJsData" :options="polarOptions" />
            </ClientOnly>
          </div>
        </div>
      </div>

      <!-- Сертификаты по периодам (Динамический бар) -->
      <div class="flex flex-col rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div class="border-b border-slate-100 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <IconsBarChartIcon class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">Динамика сертификации</h3>
              <p class="text-sm text-slate-500 mt-0.5">Статистика выданных документов</p>
            </div>
          </div>
          <div class="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
            <button
              v-for="period in certificatePeriods"
              :key="period.value"
              class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300"
              :class="
                certificatePeriod === period.value
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              "
              @click="changeCertificatePeriod(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-center">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500"></div>
          </div>
          <div v-else-if="!currentCertificatesData.series[0]?.data?.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="h-16 w-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <IconsCertificateIcon class="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p class="text-slate-500 font-medium">Нет данных о сертификатах</p>
          </div>
          <div v-else class="transition-opacity duration-500" :class="certificateTransitioning ? 'opacity-30' : 'opacity-100'">
            <div class="h-[340px] w-full relative pt-4">
              <ClientOnly>
                <LineChart :key="certificatePeriod" :data="certificatesChartJsData" :options="lineOptions" :plugins="[alwaysShowDataLabelPlugin]" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ТОПЫ (Инструкторы и Курсы) -->
    <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <!-- Топ Инструкторов -->
      <div class="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
        <div class="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10">
              <IconsInstructorIcon class="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">Топ инструкторов по часам</h3>
              <p class="text-sm text-slate-500 mt-0.5">Вклад сотрудников в обучение</p>
            </div>
          </div>
        </div>
        <div class="p-2 sm:p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-orange-500"></div>
          </div>
          <div v-else-if="!stats?.topInstructors?.length" class="flex flex-col items-center justify-center py-10 text-center">
            <p class="text-slate-500">Нет данных об инструкторах</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(instructor, index) in stats.topInstructors"
              :key="instructor.id"
              class="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div class="relative flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg shadow-inner" :class="getRankBg(index)">
                  {{ getInitials(instructor.name) }}
                  <span class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-slate-800 text-xs font-black shadow-sm" :class="getRankBadge(index)">
                    {{ index + 1 }}
                  </span>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 dark:text-white truncate max-w-[160px] sm:max-w-xs group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {{ instructor.name }}
                  </h4>
                  <p class="text-xs font-medium text-slate-500 mt-0.5">{{ instructor.lessonsCount }} занятий</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xl font-black text-slate-800 dark:text-white group-hover:text-orange-500 transition-colors">{{ instructor.hours }} <span class="text-sm font-medium text-slate-400 dark:text-slate-500">ч</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Топ Курсов -->
      <div class="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
        <div class="border-b border-slate-100 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10">
              <IconsAcademicCapIcon class="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">Популярные курсы</h3>
              <p class="text-sm text-slate-500 mt-0.5">Востребованные программы обучения</p>
            </div>
          </div>
          <div class="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300"
              :class="courseTab === 'groups' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              @click="courseTab = 'groups'"
            >
              Группы
            </button>
            <button
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300"
              :class="courseTab === 'students' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              @click="courseTab = 'students'"
            >
              Контингент
            </button>
          </div>
        </div>
        <div class="p-2 sm:p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-cyan-500"></div>
          </div>
          <div v-else-if="!currentTopCourses?.length" class="flex flex-col items-center justify-center py-10 text-center">
            <p class="text-slate-500">Нет данных о курсах</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(course, index) in currentTopCourses"
              :key="course.id"
              class="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md cursor-pointer"
              @click="navigateTo(`/programs/${course.id}`)"
            >
              <div class="flex items-center gap-4">
                <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black shadow-inner" :class="index < 3 ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' : ''">
                  #{{ index + 1 }}
                </span>
                <div>
                  <h4 class="font-bold text-slate-800 dark:text-white truncate max-w-[160px] sm:max-w-[200px] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {{ course.name }}
                  </h4>
                  <p class="text-xs font-mono tracking-wide text-slate-400 mt-0.5">{{ course.code }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xl font-black text-slate-800 dark:text-white group-hover:text-cyan-500 transition-colors">
                  {{ courseTab === "groups" ? course.groups_count : course.students_count }}
                </p>
                <p class="text-[10px] uppercase font-bold text-slate-400">
                  {{ courseTab === "groups" ? "Групп" : "Слушателей" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ТРЕТИЙ БЛОК: СИСТЕМА И АКТИВНОСТЬ -->
    <div class="grid grid-cols-1 gap-8 xl:grid-cols-3">
      <!-- Статистика Системы -->
      <div class="xl:col-span-2 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
        <div class="border-b border-slate-100 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-500/20">
              <IconsBarChartIcon class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 dark:text-white">Состояние системы</h3>
              <p class="text-sm text-slate-500 mt-0.5">Метрики платформы в реальном времени</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600"></div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Пользователи -->
            <div class="group relative flex items-center justify-between p-5 rounded-2xl border border-indigo-50 bg-indigo-50/30 hover:bg-indigo-50 dark:border-indigo-500/10 dark:bg-indigo-500/5 dark:hover:bg-indigo-500/10 cursor-pointer overflow-hidden transition-all duration-300" @click="navigateTo('/users')">
              <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <IconsUserCircleIcon class="h-32 w-32 text-indigo-500" />
              </div>
              <div class="relative z-10">
                <p class="text-sm font-semibold text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider">Всего аккаунтов</p>
                <p class="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{{ stats?.totalUsers || 0 }}</p>
              </div>
              <div class="relative z-10 h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                <IconsUserCircleIcon class="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            <!-- Регистрации за сегодня -->
            <div class="group relative flex items-center justify-between p-5 rounded-2xl border border-emerald-50 bg-emerald-50/30 hover:bg-emerald-50 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 overflow-hidden transition-all duration-300">
              <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <IconsPlusIcon class="h-32 w-32 text-emerald-500" />
              </div>
              <div class="relative z-10">
                <p class="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Новые за сегодня</p>
                <p class="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{{ stats?.todayRegistrations || 0 }}</p>
              </div>
              <div class="relative z-10 h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                <IconsPlusIcon class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <!-- Активные сессии -->
            <div class="group relative flex items-center justify-between p-5 rounded-2xl border border-amber-50 bg-amber-50/30 hover:bg-amber-50 dark:border-amber-500/10 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 overflow-hidden transition-all duration-300">
              <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <IconsGridIcon class="h-32 w-32 text-amber-500" />
              </div>
              <div class="relative z-10">
                <p class="text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider">Онлайн сессии</p>
                <p class="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{{ stats?.activeSessions || 0 }}</p>
              </div>
              <div class="relative z-10 h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                <IconsGridIcon class="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            <!-- Активность -->
            <div class="group relative flex items-center justify-between p-5 rounded-2xl border border-sky-50 bg-sky-50/30 hover:bg-sky-50 dark:border-sky-500/10 dark:bg-sky-500/5 dark:hover:bg-sky-500/10 cursor-pointer overflow-hidden transition-all duration-300" @click="navigateTo('/activity-logs')">
              <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <IconsListIcon class="h-32 w-32 text-sky-500" />
              </div>
              <div class="relative z-10">
                <p class="text-sm font-semibold text-sky-600/80 dark:text-sky-400/80 uppercase tracking-wider">Событий за сутки</p>
                <p class="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{{ stats?.todayLogs || 0 }}</p>
              </div>
              <div class="relative z-10 h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                <IconsListIcon class="w-7 h-7 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Лента Действий / Уведомления -->
      <div class="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
        <div class="border-b border-slate-100 dark:border-slate-700/50 p-6 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div class="flex items-center gap-4">
            <div class="relative flex h-10 w-10 items-center justify-center rounded-lg bg-pink-600 shadow-md shadow-pink-500/20">
              <span class="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
              <IconsBellIcon class="w-5 h-5 text-white" />
            </div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-white">Лента событий</h3>
          </div>
        </div>
        <div class="p-6 overflow-y-auto max-h-[400px] custom-scrollbar">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-pink-600"></div>
          </div>
          <div v-else-if="!stats?.recentActivities?.length" class="flex flex-col items-center justify-center py-10 text-center">
            <p class="text-slate-500">Пока нет свежих действий</p>
          </div>
          <div v-else class="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
            
            <div v-for="(activity, index) in stats.recentActivities.slice(0, 5)" :key="activity.id" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10" :class="getActivityIconBg(activity.action)">
                  <div class="w-3 h-3 rounded-full bg-white"></div>
                </div>
                <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-700/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform group-hover:-translate-y-1">
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-800 dark:text-white text-sm">{{ activity.user_name }}</span>
                        <span class="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-snug">{{ activity.action }}</span>
                        <time class="mt-2 text-xs font-medium text-slate-400">{{ formatRelativeTime(activity.created_at) }}</time>
                    </div>
                </div>
            </div>

          </div>
          <div class="mt-6 text-center">
            <NuxtLink to="/activity-logs" class="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300">
              Посмотреть весь журнал <IconsArrowLeftIcon class="w-4 h-4 rotate-180" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- БЫСТРЫЕ ДЕЙСТВИЯ -->
    <div class="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3/4 h-32 bg-indigo-500/30 blur-[100px] rounded-full"></div>
      
      <div class="relative z-10">
        <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <IconsPlugInIcon class="w-6 h-6 text-indigo-400" /> Мастерская управления
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="group flex flex-col items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/50 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md"
          >
            <div class="h-12 w-12 shrink-0 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform group-hover:bg-indigo-500">
              <IconsUserGroupIcon v-if="action.icon === 'usergroup'" class="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
              <IconsAcademicCapIcon v-else-if="action.icon === 'academic'" class="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
              <IconsSettingsIcon v-else-if="action.icon === 'settings'" class="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
              <IconsListIcon v-else class="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
            </div>
            <div>
              <span class="block text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                {{ action.label }}
              </span>
              <span class="text-xs text-slate-400 mt-1 block">{{ action.desc }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { PolarArea, Line as LineChart } from "vue-chartjs";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.font.family = "'Montserrat', 'Roboto', 'Inter', system-ui, sans-serif";
ChartJS.defaults.color = "#64748b";
ChartJS.defaults.scale.ticks.color = "#64748b";

const { user } = useAuth();
const { authFetch } = useAuthFetch();
const router = useRouter();

const stats = ref(null);
const loading = ref(true);
const courseTab = ref("groups");

const currentDate = new Date().toLocaleDateString("ru-RU", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const quickActions = [
  { to: "/users", label: "Сотрудники и Контингент", desc: "Управление доступом", icon: "usergroup" },
  { to: "/programs/create", label: "Новый курс", desc: "Создание программы", icon: "academic" },
  { to: "/settings", label: "Настройки", desc: "Конфигурация портала", icon: "settings" },
  { to: "/activity-logs", label: "Журнал аудита", desc: "Безопасность", icon: "list" },
];

const certificatePeriod = ref("months");
const certificateTransitioning = ref(false);
const certificatePeriods = [
  { value: "months", label: "Месяцы" },
  { value: "quarters", label: "Кварталы" },
  { value: "years", label: "Годы" },
];

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

// Data Computed
const organizationChartData = computed(() => {
  const orgs = stats.value?.studentsByOrganization || [];
  return {
    series: orgs.map((o) => Number(o.count) || 0),
    labels: orgs.map((o) => o.name || "Не указано"),
  };
});

const organizationChartJsData = computed(() => ({
  labels: organizationChartData.value.labels,
  datasets: [
    {
      label: "Контингент",
      data: organizationChartData.value.series,
      backgroundColor: [
        "rgba(79, 70, 229, 0.7)",
        "rgba(6, 182, 212, 0.7)",
        "rgba(16, 185, 129, 0.7)",
        "rgba(245, 158, 11, 0.7)",
        "rgba(236, 72, 153, 0.7)",
        "rgba(139, 92, 246, 0.7)",
      ],
      borderWidth: 2,
      borderColor: "#ffffff",
    },
  ],
}));

const polarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "right", labels: { usePointStyle: true, padding: 20 } },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    r: {
      ticks: { display: false },
    },
  },
};

const certificatesChartData = computed(() => {
  const certs = stats.value?.certificatesByMonth || [];
  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

  return {
    series: [{ name: "Сертификаты", data: certs.map((c) => Number(c.count) || 0) }],
    categories: certs.map((c) => {
      const [year, month] = c.month.split("-");
      return monthNames[parseInt(month) - 1] + " " + year.slice(2);
    }),
    rawData: certs,
  };
});

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
    series: [{ name: "Сертификаты", data: sorted.map((q) => q.count) }],
    categories: sorted.map((q) => q.label),
  };
});

const certificatesByYears = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const yearMap = new Map();

  rawData.forEach((item) => {
    const [year] = item.month.split("-");
    if (!yearMap.has(year)) yearMap.set(year, 0);
    yearMap.set(year, yearMap.get(year) + (Number(item.count) || 0));
  });

  const sorted = Array.from(yearMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));

  return {
    series: [{ name: "Сертификаты", data: sorted.map((y) => y.count) }],
    categories: sorted.map((y) => y.year),
  };
});

const currentCertificatesData = computed(() => {
  switch (certificatePeriod.value) {
    case "quarters": return certificatesByQuarters.value;
    case "years": return certificatesByYears.value;
    default: return certificatesChartData.value;
  }
});

const certificatesChartJsData = computed(() => {
  const dataRef = currentCertificatesData.value;
  return {
    labels: dataRef.categories,
    datasets: [
      {
        label: "Сертификаты",
        data: dataRef.series[0].data,
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderWidth: 3,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(16, 185, 129, 1)",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };
});

const alwaysShowDataLabelPlugin = {
  id: "alwaysShowDataLabel",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        meta.data.forEach((element, index) => {
          const val = dataset.data[index];
          const dataString = val.toString();
          ctx.fillStyle = "#10B981"; // emerald-500
          ctx.font = "bold 13px 'Montserrat', 'Roboto', 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          const position = element.tooltipPosition();
          ctx.fillText(dataString, position.x, position.y - 12);
        });
      }
    });
    ctx.restore();
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 30 // Padding for top data labels
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: { 
      mode: "index", 
      intersect: false,
      backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900
      titleColor: "#fff",
      bodyColor: "#cbd5e1", // slate-300
      borderColor: "rgba(16, 185, 129, 0.5)",
      borderWidth: 1,
      padding: 12,
      bodySpacing: 8,
      titleFont: { size: 14, weight: "bold" },
      bodyFont: { size: 13, weight: "normal" },
      callbacks: {
        label: function (context) {
          return `${context.dataset.label}: ${context.parsed.y} шт.`;
        },
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: "rgba(200, 200, 200, 0.2)", borderDash: [5, 5] },
      beginAtZero: true,
      ticks: { stepSize: 1 }
    },
  },
};


const currentTopCourses = computed(() => {
  if (courseTab.value === "groups") return stats.value?.topCoursesByGroups || [];
  return stats.value?.topCoursesByStudents || [];
});

const navigateTo = (path) => router.push(path);
const handleOrgChartClick = (data) => console.log("Clicked on organization:", data.label);

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch("/api/admin/dashboard");
    if (data) stats.value = data;
  } catch (error) {
    console.error("Failed to fetch admin dashboard stats:", error);
  } finally {
    loading.value = false;
  }
};

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Только что";
  if (diffMins < 60) return `${diffMins} мин назад`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} дн назад`;
  return date.toLocaleDateString("ru-RU");
};

const getActivityIconBg = (action) => {
  const lower = action.toLowerCase();
  if (lower.includes("создал") || lower.includes("добавил")) return "bg-emerald-500 border-emerald-500";
  if (lower.includes("удалил")) return "bg-red-500 border-red-500";
  if (lower.includes("изменил") || lower.includes("обновил")) return "bg-amber-500 border-amber-500";
  return "bg-indigo-500 border-indigo-500";
};

const getRankBg = (index) => {
  if (index === 0) return "bg-gradient-to-br from-amber-400 to-orange-500";
  if (index === 1) return "bg-gradient-to-br from-slate-300 to-slate-500";
  if (index === 2) return "bg-gradient-to-br from-orange-300 to-amber-600";
  return "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
};

const getRankBadge = (index) => {
  if (index === 0) return "bg-amber-400 text-white";
  if (index === 1) return "bg-slate-300 text-slate-800";
  if (index === 2) return "bg-orange-500 text-white";
  return "bg-slate-100 text-slate-500 hidden";
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

onMounted(() => fetchDashboardStats());
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>
