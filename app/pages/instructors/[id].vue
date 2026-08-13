<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка информации об инструкторе...
        </p>
      </div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error || !instructor"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center max-w-md">
        <div
          class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400"
        >
          <UserIcon class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ error || "Инструктор не найден" }}
        </h3>
        <UiButton class="mt-8 shadow-lg" @click="$router.push('/instructors')"
          >К списку инструкторов</UiButton
        >
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <NuxtLink
            to="/instructors"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft
                class="w-4 h-4 transition-transform group-hover:-translate-x-1"
              />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Profile Main Info — compact -->
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-xl">
                <img v-if="instructor.photo_base64" :src="instructor.photo_base64" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <span class="text-2xl font-black">{{ getInitials(instructor.fullName) }}</span>
                </div>
              </div>
              <div v-if="instructor.isActive" class="absolute -bottom-1 -right-1 h-5 w-5 bg-success rounded-lg border-2 border-white dark:border-slate-900 flex items-center justify-center shadow">
                <CheckIcon class="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{{ instructor.fullName }}</h1>
                <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border" :class="instructor.isActive ? 'border-success/20 bg-success/5 text-success' : 'border-danger/20 bg-danger/5 text-danger'">
                  {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <div class="flex items-center gap-1.5"><MailIcon class="w-3.5 h-3.5 text-slate-400" />{{ instructor.email || 'Email не указан' }}</div>
                <div class="flex items-center gap-1.5"><PhoneIcon class="w-3.5 h-3.5 text-slate-400" />{{ instructor.phone || 'Телефон не указан' }}</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex flex-wrap items-center justify-center lg:justify-end gap-2"
          >
            <UiButton variant="primary" size="sm" class="h-9 px-3 gap-1.5 font-bold shadow-lg shadow-primary/20" @click="exportCertificate">
              <FileDownIcon class="w-3.5 h-3.5" /> Карточку PDF
            </UiButton>
            <UiButton v-if="canEditInstructors" variant="outline" size="sm" class="h-9 px-3 gap-1.5 font-bold" @click="isEditModalOpen = true">
              <SettingsIcon class="w-3.5 h-3.5" /> Изменить
            </UiButton>
            <UiButton v-if="canDeleteInstructors" variant="outline" size="sm" class="h-9 px-3 gap-1.5 font-bold text-danger border-danger/20 hover:bg-danger/5" @click="isDeleteModalOpen = true">
              <Trash2Icon class="w-3.5 h-3.5" /> Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid — compact -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <!-- Qualification Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Квалификация</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white truncate">
                {{ instructor.academic_degree || instructor.education || "Не указана" }}
              </h3>
              <span class="text-[10px] text-slate-400">{{ instructor.academic_rank || '—' }}</span>
            </div>
            <div class="rounded-lg bg-primary/10 p-2 text-primary ml-2 shrink-0">
              <GraduationCapIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Teaching Hours Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Загрузка часов</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                {{ instructor.usedHours || 0 }} / {{ instructor.maxHours || '∞' }}
              </h3>
            </div>
            <div class="rounded-lg bg-success/10 p-2 text-success ml-2 shrink-0">
              <ClockIcon class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div class="h-full rounded-full bg-success transition-all duration-500" :style="{ width: `${Math.min(((instructor.usedHours || 0) / (instructor.maxHours || 1)) * 100, 100)}%` }"></div>
          </div>
        </div>

        <!-- Experience Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Стаж в центре</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{{ experienceText }}</h3>
              <span class="text-[10px] text-slate-400">С {{ formatDate(instructor.hireDate) }}</span>
            </div>
            <div class="rounded-lg bg-warning/10 p-2 text-warning ml-2 shrink-0">
              <CalendarIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Languages Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Языки</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{{ instructor.languages?.length || 0 }}</h3>
            </div>
            <div class="rounded-lg bg-info/10 p-2 text-info ml-2 shrink-0">
              <GlobeIcon class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-1 flex flex-wrap gap-1">
            <span v-for="lang in instructor.languages" :key="lang" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold uppercase tracking-tight text-slate-500">
              {{ languageMap[lang] || lang }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation — compact -->
      <div class="mb-5 overflow-x-auto custom-scrollbar pb-1">
        <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <nav class="flex gap-0.5" aria-label="Tabs">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              ]"
            >
              <component :is="tab.icon" class="h-3.5 w-3.5" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Main Content Area (8 cols) -->
        <div class="lg:col-span-8 space-y-4">
          <!-- INFO TAB -->
          <div
            v-show="activeTab === 'info'"
            class="space-y-4 animate-in fade-in duration-500"
          >
            <!-- Personal Info — compact row list -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <UserIcon class="w-4 h-4 text-info" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Данные инструктора</h3>
              </div>
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-36 shrink-0">Дата рождения</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200 text-right">{{ formatDate(instructor.birthDate) }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-36 shrink-0">Паспортные данные</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200 text-right">{{ instructor.passportData || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-36 shrink-0">Учёная степень</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200 text-right">{{ instructor.academic_degree || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-36 shrink-0">Учёное звание</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200 text-right">{{ instructor.academic_rank || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-36 shrink-0">Языки</span>
                  <div class="flex flex-wrap gap-1 justify-end">
                    <span v-if="!instructor.languages?.length" class="text-sm font-bold text-slate-400">—</span>
                    <span
                      v-for="lang in instructor.languages"
                      :key="lang"
                      class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400"
                    >{{ languageMap[lang] || lang }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Education — compact rows -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <SchoolIcon class="w-4 h-4 text-primary" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Образование</h3>
              </div>
              <div
                v-if="!instructor.education_history?.length && !instructor.education && !instructor.university"
                class="px-4 py-6 text-center text-xs text-slate-400"
              >
                Сведения об образовании не указаны
              </div>
              <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="(edu, index) in ((instructor.education_history?.length ? instructor.education_history : [{ education: instructor.education, university: instructor.university, specialty: instructor.specialty, diploma_file_ids: instructor.diploma_file_ids }]) as any[])"
                  :key="index"
                  class="px-4 py-3"
                >
                  <div class="flex items-start justify-between gap-3 mb-1">
                    <div class="flex items-start gap-2 min-w-0">
                      <div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                        <SchoolIcon class="w-3.5 h-3.5" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{{ edu.university || '—' }}</p>
                        <p v-if="edu.education" class="text-[10px] font-semibold text-primary mt-0.5 uppercase tracking-wide">{{ edu.education }}</p>
                      </div>
                    </div>
                    <span v-if="edu.year_start || edu.year_end || edu.date_start || edu.date_end" class="text-xs font-bold text-slate-500 shrink-0 whitespace-nowrap">
                      {{ edu.year_start || (edu.date_start ? new Date(edu.date_start).getFullYear() : '?') }} – {{ edu.year_end || (edu.date_end ? new Date(edu.date_end).getFullYear() : '?') }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-2 ml-8">
                    <span class="text-xs text-slate-500 truncate">{{ edu.specialty || '' }}</span>
                    <span v-if="edu.diploma_series || edu.diploma_number" class="text-[10px] font-bold text-slate-400 shrink-0 whitespace-nowrap">
                      Диплом: {{ [edu.diploma_series, edu.diploma_number].filter(Boolean).join(' ') }}
                    </span>
                  </div>
                  <div v-if="edu.diploma_file_ids?.length" class="flex flex-wrap gap-1.5 mt-2 ml-8">
                    <div
                      v-for="fileId in edu.diploma_file_ids"
                      :key="fileId"
                      @click="allEducationFilesMap[fileId] && previewFile(fileId, allEducationFilesMap[fileId].filename)"
                      class="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      <FileTextIcon class="w-3 h-3 text-primary" />
                      <span class="text-[10px] font-bold text-slate-500">{{ allEducationFilesMap[fileId]?.filename || 'Документ' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Work Experience — compact -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <BookOpenIcon class="w-4 h-4 text-info" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Опыт работы</h3>
              </div>
              <div v-if="!instructor.work_experience?.length" class="px-4 py-6 text-center text-xs text-slate-400">Опыт работы не указан</div>
              <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="(exp, index) in instructor.work_experience"
                  :key="index"
                  class="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{{ exp.employer }}</p>
                    <p class="text-[10px] font-semibold text-info uppercase tracking-wide mt-0.5">{{ exp.position }}</p>
                  </div>
                  <span class="text-xs font-bold text-slate-400 shrink-0 whitespace-nowrap">{{ exp.period }}</span>
                </div>
              </div>
            </div>

            <!-- Certificates — compact list with series+number+date -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <AwardIcon class="w-4 h-4 text-warning" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Сертификаты</h3>
              </div>
              <div v-if="!instructor.certificates?.length" class="px-4 py-6 text-center text-xs text-slate-400">Список сертификатов пуст</div>
              <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="(cert, index) in instructor.certificates"
                  :key="index"
                  class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div class="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <AwardIcon class="w-3.5 h-3.5 text-warning" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{{ cert.name }}</p>
                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span v-if="(cert as any).series || cert.certificate_number" class="text-[10px] font-semibold text-slate-400">
                        № <span class="text-slate-600 dark:text-slate-300">{{ [(cert as any).series, cert.certificate_number].filter(Boolean).join(' ') }}</span>
                      </span>
                      <span v-if="cert.date" class="text-[10px] font-semibold text-slate-400">{{ formatDate(cert.date) }}</span>
                    </div>
                  </div>
                  <div v-if="cert.fileId" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button @click="previewFile(cert.fileId, cert.name)" class="p-1.5 text-slate-400 hover:text-primary transition-colors"><EyeIcon class="w-3.5 h-3.5" /></button>
                    <button @click="downloadFile(cert.fileId, cert.name)" class="p-1.5 text-slate-400 hover:text-success transition-colors"><DownloadIcon class="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Attestation certificates — issued automatically after passing certification exams -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <ShieldCheckIcon class="w-4 h-4 text-success" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Сертификаты аттестации</h3>
              </div>
              <div v-if="!attestationCertificates.length" class="px-4 py-6 text-center text-xs text-slate-400">
                Сертификаты аттестации ещё не выданы
              </div>
              <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  v-for="cert in attestationCertificates"
                  :key="cert.id"
                  class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div class="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <AwardIcon class="w-3.5 h-3.5 text-success" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{{ cert.templateName || "Сертификат" }}</p>
                    <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span class="text-[10px] font-semibold text-slate-400">№ <span class="text-slate-600 dark:text-slate-300">{{ cert.certificateNumber }}</span></span>
                      <span class="text-[10px] font-semibold text-slate-400">{{ formatDate(cert.issueDate) }}</span>
                    </div>
                  </div>
                  <a
                    v-if="cert.id"
                    :href="`/api/certificates/download/${cert.id}`"
                    target="_blank"
                    class="p-1.5 text-slate-400 hover:text-success transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <DownloadIcon class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- HOURS TAB -->
          <div
            v-show="activeTab === 'hours'"
            class="animate-in fade-in duration-500"
          >
            <InstructorsHoursStats
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="hoursStatsRef"
            />
          </div>

          <!-- HISTORY TAB -->
          <div
            v-show="activeTab === 'history'"
            class="animate-in fade-in duration-500"
          >
            <InstructorsCourseHistory
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="courseHistoryRef"
            />
          </div>
        </div>

        <!-- Sidebar / Additional Info (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          <!-- Employment Info — compact -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <CalendarIcon class="w-4 h-4 text-slate-500" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Трудоустройство</h4>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-slate-800">
              <div class="flex items-center justify-between px-4 py-2.5">
                <span class="text-xs font-semibold text-slate-400">Дата приёма</span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ formatDate(instructor.hireDate) }}</span>
              </div>
              <div class="px-4 py-2.5">
                <span class="text-xs font-semibold text-slate-400 block mb-1">Контрактные данные</span>
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{{ instructor.contractInfo || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Files List — compact -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <FileTextIcon class="w-4 h-4 text-slate-500" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Документы</h4>
            </div>
            <div v-if="!additionalFilesList.length" class="px-4 py-5 text-center text-xs text-slate-400">Нет дополнительных файлов</div>
            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
              <div
                v-for="file in additionalFilesList"
                :key="file.uuid"
                class="group flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <FileTextIcon class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{{ file.filename }}</span>
                </div>
                <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button @click="previewFile(file.uuid, file.filename)" class="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <EyeIcon class="w-3.5 h-3.5" />
                  </button>
                  <button @click="downloadFile(file.uuid, file.filename)" class="p-1.5 text-slate-400 hover:text-success transition-colors">
                    <DownloadIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <UsersInstructorFormModal
      v-if="isEditModalOpen && instructor"
      :instructor="instructor"
      @close="isEditModalOpen = false"
      @saved="loadInstructor"
    />

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление инструктора"
      message="Вы уверены, что хотите удалить этого инструктора? Это действие может повлиять на связанные курсы и расписание."
      :item-name="instructor?.fullName"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="isDeleteModalOpen = false"
    />

    <!-- Добавленное окно просмотра документа -->
    <UiModal
      :is-open="showPreviewModal"
      @close="closePreview"
      :title="previewingFileName"
      size="xl"
    >
      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closePreview">Закрыть</UiButton>
          <UiButton
            v-if="instructor && previewingFileId"
            variant="primary"
            @click="downloadFile(previewingFileId, previewingFileName)"
            class="gap-2"
          >
            <DownloadIcon class="w-4 h-4" /> Скачать
          </UiButton>
        </div>
      </template>

      <div v-if="loadingPreview" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
          ></div>
          <p class="mt-4 text-sm text-gray-500">Загрузка документа...</p>
        </div>
      </div>
      <div v-else-if="previewError" class="text-center py-12">
        <AlertCircleIcon class="mx-auto h-12 w-12 text-danger mb-4" />
        <p class="text-danger">{{ previewError }}</p>
      </div>
      <div v-else-if="previewUrl" class="w-full" style="height: 70vh">
        <iframe
          :src="previewUrl"
          class="w-full h-full border-0 rounded-xl shadow-inner"
          title="Document Preview"
        ></iframe>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import type { Instructor, UpdateInstructorInput } from "~/types/instructor";
import {
  ArrowLeft,
  User as UserIcon,
  Clock as ClockIcon,
  History as HistoryIcon,
  AlertCircle as AlertCircleIcon,
  GraduationCap as GraduationCapIcon,
  Calendar as CalendarIcon,
  Check as CheckIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  Trash2 as Trash2Icon,
  Award as AwardIcon,
  School as SchoolIcon,
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  Plus as PlusIcon,
  FileDown as FileDownIcon,
  Eye as EyeIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  BookOpen as BookOpenIcon,
  ShieldCheck as ShieldCheckIcon,
} from "lucide-vue-next";
import InstructorsHoursStats from "~/components/instructors/HoursStats.vue";
import InstructorsCourseHistory from "~/components/instructors/CourseHistory.vue";
import UsersInstructorFormModal from "~/components/users/InstructorFormModal.vue";
import { usePDFExport } from "~/composables/usePDFExport"; // Will need to implement this

// Route and Auth
const route = useRoute();
const router = useRouter();
const instructorId = route.params.id as string;
const { authFetch } = useAuthFetch();
const notification = useNotification();
const { canEditInstructors, canDeleteInstructors } = usePermissions();
const { getFilesByUuids } = useFileManager();

const languageMap: Record<string, string> = {
  uz: "Узбекский",
  ru: "Русский",
  en: "Английский",
  de: "Немецкий",
};

// State
const instructor = ref<Instructor | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isDeleting = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);

// Document Preview State
const showPreviewModal = ref(false);
const previewUrl = ref("");
const loadingPreview = ref(false);
const previewError = ref("");
const previewingFileName = ref("");
const previewingFileId = ref("");

// Файлы для предпросмотра
const additionalFilesList = ref<any[]>([]);
const allEducationFilesMap = ref<Record<string, any>>({});

const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Профиль и Квалификация", icon: UserIcon },
  { id: "hours", label: "Отчётность и Часы", icon: ClockIcon },
  { id: "history", label: "История Дисциплин", icon: HistoryIcon },
];

// Computed
const experienceText = computed(() => {
  if (!instructor.value?.hireDate) return "—";
  const hireDate = new Date(instructor.value.hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hireDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) return `${diffDays} дн.`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} мес.`;
  const diffYears = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  return `${diffYears} г. ${remainingMonths} мес.`;
});

// Methods
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const previewFile = async (fileId: string, fileName: string = "Документ") => {
  try {
    previewingFileName.value = fileName;
    previewingFileId.value = fileId;
    showPreviewModal.value = true;
    loadingPreview.value = true;
    previewError.value = "";
    previewUrl.value = "";

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      previewError.value = "Ошибка авторизации";
      loadingPreview.value = false;
      return;
    }

    const response = await fetch(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    previewUrl.value = window.URL.createObjectURL(blob);
  } catch (error) {
    console.error("[previewFile] Error:", error);
    previewError.value = "Ошибка при загрузке документа";
  } finally {
    loadingPreview.value = false;
  }
};

const downloadFile = async (fileId: string, fileName: string = "document") => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      notification.error("Ошибка авторизации");
      return;
    }

    const response = await fetch(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("[downloadFile] Error:", error);
    notification.error("Ошибка при скачивании файла");
  }
};

const closePreview = () => {
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
  }
  showPreviewModal.value = false;
  previewUrl.value = "";
  previewingFileName.value = "";
};

const fetchFileMetadata = async () => {
  if (!instructor.value) return;

  const educationFileIds =
    instructor.value.education_history?.flatMap(
      (edu) => edu.diploma_file_ids || [],
    ) || [];
  const legacyDiplomaIds = instructor.value.diploma_file_ids || [];

  const allUuids = [
    ...educationFileIds,
    ...legacyDiplomaIds,
    ...(instructor.value.additional_files || []),
    ...((instructor.value.certificates
      ?.map((c) => c.fileId)
      .filter(Boolean) as string[]) || []),
  ];

  if (allUuids.length === 0) return;

  try {
    const files = await getFilesByUuids(allUuids);

    // Map education files
    files.forEach((f) => {
      if (
        educationFileIds.includes(f.uuid) ||
        legacyDiplomaIds.includes(f.uuid)
      ) {
        allEducationFilesMap.value[f.uuid] = f;
      }
    });

    additionalFilesList.value = files.filter((f) =>
      instructor.value?.additional_files?.includes(f.uuid),
    );
  } catch (error) {
    console.error("Error fetching file metadata:", error);
  }
};

const attestationCertificates = ref<any[]>([]);

const loadAttestationCertificates = async () => {
  try {
    const res = await authFetch<{ success: boolean; certificates: any[] }>(
      `/api/instructors/${instructorId}/certificates`,
    );
    if (res.success) attestationCertificates.value = res.certificates || [];
  } catch (err) {
    console.error("Error loading attestation certificates:", err);
  }
};

const loadInstructor = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch<{
      success: boolean;
      instructor: Instructor;
    }>(`/api/instructors/${instructorId}`);

    if (response.success) {
      instructor.value = response.instructor;
      fetchFileMetadata();
      loadAttestationCertificates();
    } else {
      error.value = "Не удалось загрузить данные инструктора";
    }
  } catch (err: any) {
    error.value = err.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
};

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/instructors/${instructorId}`, {
      method: "DELETE",
    });
    notification.success("Инструктор удален");
    router.push("/users");
  } catch (err) {
    console.error("Error deleting instructor:", err);
    notification.error("Ошибка при удалении инструктора");
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

const exportCertificate = async () => {
  if (!instructor.value) return;
  notification.info("Подготовка справки к экспорту...");

  try {
    const { exportInstructorProfile } = usePDFExport();
    await exportInstructorProfile(instructor.value);
    notification.success("Справка успешно сформирована");
  } catch (err) {
    console.error("Export error:", err);
    notification.error("Ошибка при генерации PDF");
  }
};

// Refs for child components
const hoursStatsRef = ref<any>(null);
const courseHistoryRef = ref<any>(null);

// Trigger updates when tab changes
watch(activeTab, (newTab) => {
  if (newTab === "hours") {
    setTimeout(() => hoursStatsRef.value?.load?.(), 100);
  } else if (newTab === "history") {
    setTimeout(() => courseHistoryRef.value?.load?.(), 100);
  }
});

// Lifecycle
onMounted(() => {
  loadInstructor();
});
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
