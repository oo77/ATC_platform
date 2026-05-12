<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent shadow-lg"></div>
        <p class="text-slate-500 font-medium animate-pulse">Загрузка профиля...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-3xl border border-danger/20 bg-danger/5 p-8 text-center backdrop-blur-sm animate-in fade-in zoom-in duration-300">
      <AlertCircle class="h-16 w-16 text-danger mx-auto mb-4" />
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
      <UiButton variant="primary" @click="loadProfile" class="shadow-lg shadow-primary/20">
        Попробовать снова
      </UiButton>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- Header Section - New Design -->
      <div class="mb-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <!-- Profile Main Info -->
          <div class="flex items-center gap-6">
            <div class="relative shrink-0">
              <div class="w-24 h-24 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl relative group">
                <img 
                  v-if="profile.photo_base64 || (isTeacher && instructorData?.photo_base64) || (isStudent && studentData?.photo_base64)"
                  :src="profile.photo_base64 || (isTeacher ? instructorData?.photo_base64 : studentData?.photo_base64)" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <span class="text-3xl font-black">{{ getInitials(profile.name) }}</span>
                </div>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                   <Camera class="w-8 h-8 text-white" />
                </div>
              </div>
              <div class="absolute -bottom-1 -right-1 h-7 w-7 bg-success rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                <Check class="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                  {{ profile.name }}
                </h1>
                <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary shadow-sm">
                  {{ getRoleLabel(profile.role) }}
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
                <div class="flex items-center gap-2"><Mail class="w-4 h-4 text-slate-400" />{{ profile.email }}</div>
                <div v-if="profile.phone" class="flex items-center gap-2"><Phone class="w-4 h-4 text-slate-400" />{{ profile.phone }}</div>
                <div v-if="isStudent && studentData?.organization" class="flex items-center gap-2"><BuildingIcon class="w-4 h-4 text-slate-400" />{{ studentData.organization }}</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-3">
            <template v-if="isTeacher || isStudent">
              <UiButton variant="primary" size="md" class="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 px-6" @click="exportProfilePDF">
                <FileDown class="w-4 h-4" /> Карточка PDF
              </UiButton>
            </template>
            <UiButton v-if="isAdmin || isManager" variant="outline" size="md" class="rounded-2xl gap-2 font-bold border-slate-200 dark:border-slate-700 px-6" @click="openEditModal">
              <Settings class="w-4 h-4" /> Изменить данные
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid -->
      <div v-if="isTeacher && instructorData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Квалификация</p>
              <h3 class="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                {{ instructorData.academic_degree || instructorData.education || "Не указана" }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ instructorData.academic_rank || '—' }}</p>
            </div>
            <div class="rounded-2xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
              <GraduationCap class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <GraduationCap class="w-24 h-24 text-primary" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Загрузка часов</p>
              <h3 class="text-xl font-black text-slate-900 dark:text-white">
                {{ instructorData.usedHours || 0 }} / {{ instructorData.maxHours || '∞' }}
              </h3>
              <div class="mt-2 h-1.5 w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div class="h-full bg-success rounded-full transition-all duration-1000" :style="{ width: `${Math.min(((instructorData.usedHours || 0) / (instructorData.maxHours || 1)) * 100, 100)}%` }"></div>
              </div>
            </div>
            <div class="rounded-2xl bg-success/10 p-3 text-success group-hover:scale-110 transition-transform">
              <Clock class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Clock class="w-24 h-24 text-success" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Стаж в центре</p>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ teacherExperience }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">С {{ formatDateShort(instructorData.hireDate) }}</p>
            </div>
            <div class="rounded-2xl bg-warning/10 p-3 text-warning group-hover:scale-110 transition-transform">
              <Calendar class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Calendar class="w-24 h-24 text-warning" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Языки</p>
              <div class="flex flex-wrap gap-1 mt-1">
                <span v-for="lang in instructorData.languages" :key="lang" class="px-2 py-0.5 rounded-lg bg-info/10 text-info text-[10px] font-black uppercase">
                  {{ languageMap[lang] || lang }}
                </span>
                <span v-if="!instructorData.languages?.length" class="text-base font-bold text-slate-900 dark:text-white">Не указаны</span>
              </div>
            </div>
            <div class="rounded-2xl bg-info/10 p-3 text-info group-hover:scale-110 transition-transform">
              <GlobeIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <GlobeIcon class="w-24 h-24 text-info" />
          </div>
        </div>
      </div>

      <div v-else-if="isStudent && studentData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Сертификаты</p>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ studentData.certificates?.length || 0 }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">Всего получено</p>
            </div>
            <div class="rounded-2xl bg-warning/10 p-3 text-warning group-hover:scale-110 transition-transform">
              <Award class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Award class="w-24 h-24 text-warning" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Курсы</p>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ studentCourses.length }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ activeStudentCourses.length }} активных</p>
            </div>
            <div class="rounded-2xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
              <BookOpen class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <BookOpen class="w-24 h-24 text-primary" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Посещаемость</p>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ averageStudentProgress }}%</h3>
              <div class="mt-2 h-1.5 w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div class="h-full bg-success rounded-full transition-all duration-1000" :style="{ width: `${averageStudentProgress}%` }"></div>
              </div>
            </div>
            <div class="rounded-2xl bg-success/10 p-3 text-success group-hover:scale-110 transition-transform">
              <Activity class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Activity class="w-24 h-24 text-success" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">В системе</p>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ studentRegistrationDays }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">С {{ formatDateShort(profile.created_at) }}</p>
            </div>
            <div class="rounded-2xl bg-info/10 p-3 text-info group-hover:scale-110 transition-transform">
              <Calendar class="w-6 h-6" />
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Calendar class="w-24 h-24 text-info" />
          </div>
        </div>
      </div>

      <div v-else-if="isAdmin" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="stat in adminStatsList" :key="stat.label" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm group">
          <div class="flex items-center gap-4">
            <div :class="`rounded-2xl p-3 bg-${stat.color}/10 text-${stat.color} group-hover:scale-110 transition-transform`">
              <component :is="stat.icon" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{{ stat.label }}</p>
              <p class="text-2xl font-black text-slate-900 dark:text-white leading-none">{{ stat.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-6 overflow-x-auto custom-scrollbar pb-1">
        <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/50 backdrop-blur-sm">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in roleTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all duration-300 whitespace-nowrap uppercase tracking-wider',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-lg dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Main Content Area -->
        <div class="lg:col-span-8 space-y-6">
          <!-- OVERVIEW TAB -->
          <div v-show="activeTab === 'overview'" class="space-y-6 animate-in fade-in duration-500">
            <!-- Personal Info Card -->
            <div class="rounded-4xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <User class="w-4 h-4 text-info" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Основные данные</h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Полное имя</p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ profile.name }}</p>
                  </div>
                  <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email адрес</p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ profile.email }}</p>
                  </div>
                  <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Телефон</p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ profile.phone || 'Не указан' }}</p>
                  </div>
                  <div v-if="profile.pinfl" class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">ПИНФЛ</p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-wider">{{ profile.pinfl }}</p>
                  </div>
                  <div v-if="profile.workplace" class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Место работы</p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ profile.workplace }}</p>
                  </div>
                  <div v-if="profile.position" class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Должность</p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ profile.position }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Role Specific Data -->
            <template v-if="isTeacher && instructorData">
              <!-- Education for Teacher -->
              <div class="rounded-4xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <SchoolIcon class="w-4 h-4 text-primary" />
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Образование</h3>
                </div>
                <div v-if="!instructorData.education_history?.length" class="p-8 text-center text-slate-400">
                  Сведения об образовании не указаны
                </div>
                <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                  <div v-for="(edu, idx) in instructorData.education_history" :key="idx" class="p-6">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-4">
                         <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                           <SchoolIcon class="w-5 h-5" />
                         </div>
                         <div>
                           <p class="text-base font-bold text-slate-900 dark:text-white">{{ edu.university }}</p>
                           <p class="text-xs font-black text-primary mt-1 uppercase tracking-widest">{{ edu.education }}</p>
                           <p class="text-sm text-slate-500 mt-1">{{ edu.specialty }}</p>
                         </div>
                      </div>
                      <div class="text-right">
                        <span class="text-sm font-black text-slate-400">{{ edu.year_start }} - {{ edu.year_end }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Experience for Teacher -->
              <div class="rounded-4xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <BriefcaseIcon class="w-4 h-4 text-info" />
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Опыт работы</h3>
                </div>
                <div v-if="!instructorData.work_experience?.length" class="p-8 text-center text-slate-400">Опыт работы не указан</div>
                <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                  <div v-for="(exp, idx) in instructorData.work_experience" :key="idx" class="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="text-base font-bold text-slate-900 dark:text-white">{{ exp.employer }}</p>
                        <p class="text-xs font-black text-info uppercase tracking-widest mt-1">{{ exp.position }}</p>
                      </div>
                      <span class="text-sm font-black text-slate-400">{{ exp.period }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- TEACHER: HOURS & HISTORY -->
          <template v-if="isTeacher && instructorData">
            <div v-show="activeTab === 'hours'" class="animate-in fade-in duration-500">
              <InstructorsHoursStats :instructor-id="instructorData.id" :initial-load="false" ref="hoursStatsRef" />
            </div>
            <div v-show="activeTab === 'history'" class="animate-in fade-in duration-500">
              <InstructorsCourseHistory :instructor-id="instructorData.id" :initial-load="false" ref="courseHistoryRef" />
            </div>
          </template>

          <!-- STUDENT: COURSES & CERTIFICATES -->
          <template v-if="isStudent && studentData">
            <div v-show="activeTab === 'courses'" class="space-y-4 animate-in fade-in duration-500">
              <div v-if="coursesLoading" class="flex justify-center py-20">
                <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
              <template v-else-if="studentCourses.length > 0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="course in studentCourses" :key="course.group_id" class="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/30 transition-all shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <h4 class="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{{ course.course_name }}</h4>
                        <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{{ course.group_name }}</p>
                      </div>
                      <div :class="`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${course.status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`">
                        {{ course.status === 'active' ? 'Активен' : 'Завершен' }}
                      </div>
                    </div>
                    <div class="space-y-3">
                      <div class="flex justify-between text-xs font-black uppercase text-slate-400">
                        <span>Прогресс</span>
                        <span class="text-primary">{{ course.progress }}%</span>
                      </div>
                      <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all duration-1000" :style="{ width: `${course.progress}%` }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="p-10 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200">
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Курсы не найдены</p>
              </div>
            </div>

            <div v-show="activeTab === 'certificates'" class="space-y-4 animate-in fade-in duration-500">
              <div v-if="studentData.certificates?.length > 0" class="grid grid-cols-1 gap-3">
                <div v-for="cert in studentData.certificates" :key="cert.id" class="flex items-center justify-between p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
                      <Award class="w-6 h-6" />
                    </div>
                    <div>
                      <h4 class="text-base font-bold text-slate-900 dark:text-white">{{ cert.courseName }}</h4>
                      <p class="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">№ {{ cert.certificateNumber }} • {{ formatDateShort(cert.issueDate) }}</p>
                    </div>
                  </div>
                  <a v-if="cert.fileUrl" :href="`/api/certificates/download/${cert.id}`" target="_blank" class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all">
                    <DownloadIcon class="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div v-else class="p-10 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200">
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Сертификаты отсутствуют</p>
              </div>
            </div>
          </template>

          <!-- SECURITY TAB (Shared) -->
          <div v-show="activeTab === 'security'" class="animate-in fade-in duration-500">
            <div class="rounded-4xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <Lock class="w-4 h-4 text-warning" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Безопасность аккаунта</h3>
              </div>
              <div class="p-6 max-w-xl">
                <form @submit.prevent="changePassword" class="space-y-6">
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Текущий пароль</label>
                      <input v-model="passwordForm.currentPassword" type="password" required class="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:border-primary focus:ring-primary/20 transition-all" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Новый пароль</label>
                      <input v-model="passwordForm.newPassword" type="password" required minlength="6" class="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:border-primary focus:ring-primary/20 transition-all" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Подтверждение</label>
                      <input v-model="passwordForm.confirmPassword" type="password" required class="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:border-primary focus:ring-primary/20 transition-all" />
                    </div>
                  </div>
                  <div class="flex justify-end pt-2">
                    <UiButton variant="primary" size="md" type="submit" :disabled="changingPassword" class="rounded-2xl px-8 shadow-lg shadow-primary/20">
                      {{ changingPassword ? 'Обновление...' : 'Обновить пароль' }}
                    </UiButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / System Info -->
        <div class="lg:col-span-4 space-y-6">
          <div class="rounded-4xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
               <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Системные данные</h4>
            </div>
            <div class="p-6 space-y-5">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Clock class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Зарегистрирован</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDateShort(profile.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <RefreshCwIcon class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Последнее обновление</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDateShort(profile.updated_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <ShieldCheck class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Статус аккаунта</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="w-2 h-2 rounded-full bg-success"></span>
                    <span class="text-sm font-bold text-success">Активен</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-4xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-xl shadow-primary/20">
             <div class="flex items-center gap-3 mb-4">
               <div class="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                 <ShieldCheck class="w-5 h-5 text-white" />
               </div>
               <h4 class="text-xs font-black uppercase tracking-widest">Безопасность</h4>
             </div>
             <p class="text-xs leading-relaxed font-medium text-white/80 mb-4">
               Ваши персональные данные защищены и видны только вам и администраторам центра. Регулярно обновляйте пароль для поддержания высокого уровня безопасности.
             </p>
             <UiButton variant="white" size="sm" class="w-full rounded-xl font-bold text-primary" @click="activeTab = 'security'">
               Настройки безопасности
             </UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <UsersInstructorFormModal
      v-if="isEditModalOpen && isTeacher && instructorData"
      :instructor="instructorData"
      @close="isEditModalOpen = false"
      @saved="loadProfile"
    />

    <DatabaseStudentFormModal
      v-if="isEditModalOpen && isStudent && studentData"
      :student="studentData"
      :is-open="isEditModalOpen"
      @close="isEditModalOpen = false"
      @submit="handleStudentUpdate"
    />

    <!-- Modal for generic user edit (Admin/Manager) -->
    <UiModal v-if="isEditModalOpen && !isTeacher && !isStudent" :is-open="isEditModalOpen" @close="isEditModalOpen = false" title="Редактировать профиль">
       <div class="p-6 space-y-5">
         <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Полное имя</label>
            <input v-model="editForm.name" type="text" class="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:border-primary transition-all" />
         </div>
         <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Телефон</label>
            <input v-model="editForm.phone" type="text" class="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:border-primary transition-all" />
         </div>
       </div>
       <template #footer>
         <div class="flex justify-end gap-3 p-4">
           <UiButton variant="outline" @click="isEditModalOpen = false">Отмена</UiButton>
           <UiButton variant="primary" @click="updateProfile" :disabled="updatingProfile">
             {{ updatingProfile ? 'Сохранение...' : 'Сохранить' }}
           </UiButton>
         </div>
       </template>
    </UiModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
  Check,
  Mail,
  Phone,
  Camera,
  Settings,
  FileDown,
  Clock,
  Calendar,
  Award,
  Download as DownloadIcon,
  Globe as GlobeIcon,
  Building as BuildingIcon,
  Briefcase as BriefcaseIcon,
  School as SchoolIcon,
  RefreshCw as RefreshCwIcon,
  Search,
} from 'lucide-vue-next'
import { usePDFExport } from "~/composables/usePDFExport"

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Личный кабинет | ATC Platform',
})

const toast = useNotification()
const { user: authUser } = useAuth()
const { authFetch } = useAuthFetch()

// Состояния
const loading = ref(true)
const error = ref(null)
const profile = ref(null)
const adminStats = ref(null)
const instructorData = ref(null)
const studentData = ref(null)
const studentCourses = ref([])
const coursesLoading = ref(false)
const updatingProfile = ref(false)
const changingPassword = ref(false)
const isEditModalOpen = ref(false)

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
const isManager = computed(() => profile.value?.role === 'MANAGER')
const isTeacher = computed(() => profile.value?.role === 'TEACHER')
const isStudent = computed(() => profile.value?.role === 'STUDENT')

const languageMap = {
  uz: "Узбекский",
  ru: "Русский",
  en: "Английский",
  de: "Немецкий",
}

const roleTabs = computed(() => {
  const tabs = [
    { id: 'overview', label: 'Обзор', icon: User },
  ]

  if (isTeacher.value) {
    tabs.push({ id: 'hours', label: 'Часы', icon: Clock })
    tabs.push({ id: 'history', label: 'История', icon: BookOpen })
  }

  if (isStudent.value) {
    tabs.push({ id: 'courses', label: 'Обучение', icon: BookOpen })
    tabs.push({ id: 'certificates', label: 'Сертификаты', icon: Award })
  }

  tabs.push({ id: 'security', label: 'Безопасность', icon: Lock })
  
  return tabs
})

const teacherExperience = computed(() => {
  if (!instructorData.value?.hireDate) return "—"
  const hireDate = new Date(instructorData.value.hireDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - hireDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return `${diffDays} дн.`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} мес.`
  const diffYears = Math.floor(diffMonths / 12)
  const remainingMonths = diffMonths % 12
  return `${diffYears} г. ${remainingMonths} мес.`
})

const averageStudentProgress = computed(() => {
  if (studentCourses.value.length === 0) return 0
  const sum = studentCourses.value.reduce((acc, c) => acc + c.progress, 0)
  return Math.round(sum / studentCourses.value.length)
})

const activeStudentCourses = computed(() => 
  studentCourses.value.filter(c => c.status === 'active')
)

const studentRegistrationDays = computed(() => {
  if (!profile.value?.created_at) return "—"
  const created = new Date(profile.value.created_at)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return `${diffDays} дн.`
  const months = Math.floor(diffDays / 30)
  if (months < 12) return `${months} мес.`
  return `${Math.floor(months / 12)} г. ${months % 12} мес.`
})

const adminStatsList = computed(() => {
  if (!adminStats.value) return []
  return [
    { label: 'Пользователи', value: adminStats.value.totalUsers, icon: Users, color: 'primary' },
    { label: 'Студенты', value: adminStats.value.totalStudents, icon: GraduationCap, color: 'success' },
    { label: 'Группы', value: adminStats.value.activeGroups, icon: BookOpen, color: 'warning' },
    { label: 'Активность', value: adminStats.value.todayActivities, icon: Activity, color: 'info' },
  ]
})

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

const getInitials = (name) => {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatDateShort = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const loadProfile = async () => {
  try {
    loading.value = true
    error.value = null

    // 1. Загружаем основной профиль
    const profileData = await authFetch('/api/profile')
    if (profileData?.success) {
      profile.value = profileData.user
      
      // Инициализируем форму редактирования
      editForm.value = {
        name: profile.value.name,
        phone: profile.value.phone || '',
        workplace: profile.value.workplace || '',
        position: profile.value.position || '',
        pinfl: profile.value.pinfl || '',
      }

      // 2. Загружаем дополнительные данные по ролям
      if (isTeacher.value && profile.value.instructorId) {
        const instData = await authFetch(`/api/instructors/${profile.value.instructorId}`)
        if (instData?.success) {
          instructorData.value = instData.instructor
        }
      } else if (isStudent.value && profile.value.studentId) {
        const stdData = await authFetch(`/api/students/${profile.value.studentId}`)
        if (stdData?.success) {
          studentData.value = stdData.student
          await fetchStudentCourses()
        }
      } else if (isAdmin.value) {
        const statsData = await authFetch('/api/profile/stats/admin')
        if (statsData?.success) {
          adminStats.value = statsData.stats
        }
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    error.value = err.message || 'Ошибка при загрузке профиля'
  } finally {
    loading.value = false
  }
}

const fetchStudentCourses = async () => {
  coursesLoading.value = true
  try {
    const response = await authFetch(`/api/students/${profile.value.studentId}/courses`)
    if (response.success) {
      studentCourses.value = response.courses
    }
  } catch (err) {
    console.error("Failed to load courses:", err)
  } finally {
    coursesLoading.value = false
  }
}

const openEditModal = () => {
  isEditModalOpen.value = true
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
      isEditModalOpen.value = false
    }
  } catch (err) {
    toast.error(err.data?.message || 'Ошибка при обновлении профиля')
  } finally {
    updatingProfile.value = false
  }
}

const handleStudentUpdate = async (data) => {
  try {
    const response = await authFetch(`/api/students/${profile.value.studentId}`, {
      method: "PUT",
      body: data,
    });
    if (response.success) {
      studentData.value = response.student;
      profile.value.name = response.student.fullName;
      isEditModalOpen.value = false;
      toast.success("Данные успешно обновлены");
    }
  } catch (e) {
    toast.error("Ошибка при обновлении данных");
  }
};

const exportProfilePDF = async () => {
  toast.info("Подготовка PDF документа...")
  try {
    const { exportInstructorProfile, exportStudentProfile } = usePDFExport()
    if (isTeacher.value && instructorData.value) {
      await exportInstructorProfile(instructorData.value)
    } else if (isStudent.value && studentData.value) {
      await exportStudentProfile(studentData.value, studentCourses.value)
    }
    toast.success("PDF успешно сформирован")
  } catch (err) {
    toast.error("Ошибка при генерации PDF")
  }
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
    toast.error(err.data?.message || 'Ошибка при изменении пароля')
  } finally {
    changingPassword.value = false
  }
}

// Refs for child components
const hoursStatsRef = ref(null)
const courseHistoryRef = ref(null)

// Trigger updates when tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'hours') {
    setTimeout(() => hoursStatsRef.value?.load?.(), 100)
  } else if (newTab === 'history') {
    setTimeout(() => courseHistoryRef.value?.load?.(), 100)
  }
})

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
