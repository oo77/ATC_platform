<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Состояние загрузки -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">Загрузка информации о слушателе...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error || !student" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400">
          <UserIcon class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">{{ error || 'Слушатель не найден' }}</h3>
        <UiButton class="mt-8 shadow-lg" @click="$router.push('/users?tab=students')">К списку слушателей</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <NuxtLink to="/users?tab=students" class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <!-- Profile Main Info -->
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="relative">
              <div class="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-2xl">
                <img v-if="student.photo_base64" :src="student.photo_base64" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <span class="text-4xl font-black">{{ getInitials(student.fullName) }}</span>
                </div>
              </div>
              <div class="absolute -bottom-1 -right-1 h-8 w-8 bg-success rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                <CheckIcon class="w-4 h-4 text-white" />
              </div>
            </div>

            <div class="space-y-3 text-center sm:text-left">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {{ student.fullName }}
                </h1>
              </div>
              
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
                <div class="flex items-center gap-2">
                  <BuildingIcon class="w-4 h-4 text-slate-400" />
                  {{ student.organization }}
                </div>
                <div class="flex items-center gap-2">
                  <BriefcaseIcon class="w-4 h-4 text-slate-400" />
                  {{ student.position }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-center lg:justify-end gap-2">
            <UiButton
              variant="primary"
              size="sm"
              class="h-10 px-4 gap-2 font-bold shadow-lg shadow-primary/20"
              @click="exportTranscript"
            >
              <FileDownIcon class="w-4 h-4" />
              Экспорт справки
            </UiButton>

            <UiButton
              v-if="canEditStudents"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="openEditModal"
            >
              <SettingsIcon class="w-4 h-4" />
              Редактировать
            </UiButton>

            <UiButton
              v-if="canDeleteStudents"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-danger border-danger/20 hover:bg-danger/5"
              @click="handleDelete"
            >
              <Trash2Icon class="w-4 h-4" />
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Certificates Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Сертификаты</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ student.certificates?.length || 0 }}
              </h3>
            </div>
            <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
              <AwardIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">Всего получено</span>
          </div>
        </div>

        <!-- Courses Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Курсы</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ studentCourses.length }}
              </h3>
            </div>
            <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
              <BookOpenIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">{{ activeCourses.length }} активных сейчас</span>
          </div>
        </div>

        <!-- Attendance Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Посещаемость</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ averageProgress }}%
              </h3>
            </div>
            <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
              <ActivityIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div 
                class="h-full rounded-full bg-success transition-all duration-500"
                :style="{ width: `${averageProgress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Registration Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">В системе</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {{ registrationDays }}
              </h3>
            </div>
            <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
              <CalendarIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">С {{ formatDateShort(student.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
        <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Main Content Area (8 cols) -->
        <div class="lg:col-span-8 space-y-8">
          
          <!-- INFO TAB -->
          <div v-show="activeTab === 'info'" class="space-y-8 animate-in fade-in duration-500">
            <!-- Personal Info -->
            <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div class="flex items-center gap-3 mb-8">
                <div class="p-2 rounded-xl bg-info/10 text-info">
                  <UserIcon class="w-5 h-5" />
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Персональные данные</h3>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">ПИНФЛ</p>
                  <div class="flex items-center gap-2">
                    <p class="text-lg font-bold text-slate-900 dark:text-white font-mono">{{ student.pinfl }}</p>
                    <button @click="copyToClipboard(student.pinfl)" class="p-1 text-slate-400 hover:text-primary transition-colors">
                      <CopyIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Дата рождения</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatDate(student.birthDate) }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Дата регистрации</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatDate(student.created_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Work Info -->
            <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div class="flex items-center gap-3 mb-8">
                <div class="p-2 rounded-xl bg-primary/10 text-primary">
                  <BuildingIcon class="w-5 h-5" />
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Место работы</h3>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div class="sm:col-span-2 space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Организация</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ student.organization }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Подразделение</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ student.department || '—' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Должность</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ student.position }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- COURSES TAB -->
          <div v-show="activeTab === 'courses'" class="space-y-6 animate-in fade-in duration-500">
            <div v-if="coursesLoading" class="flex justify-center py-20">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            
            <template v-else-if="studentCourses.length > 0">
              <!-- Active Courses -->
              <div v-if="activeCourses.length > 0">
                <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                  Текущее обучение
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    v-for="course in activeCourses" 
                    :key="course.group_id"
                    @click="openCourseDetailModal(course)"
                    class="group p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/30 transition-all hover:shadow-xl cursor-pointer relative overflow-hidden"
                  >
                    <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRightIcon class="w-5 h-5 text-primary" />
                    </div>
                    <h4 class="font-bold text-slate-900 dark:text-white mb-1 pr-8">{{ course.course_name }}</h4>
                    <p class="text-xs text-slate-500 mb-6">Группа: {{ course.group_name }}</p>
                    
                    <div class="space-y-4">
                      <div class="flex justify-between items-end mb-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Прогресс</span>
                        <span class="text-sm font-black text-primary">{{ course.progress }}%</span>
                      </div>
                      <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all duration-1000" :style="{ width: `${course.progress}%` }"></div>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Период</p>
                          <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ formatShortDate(course.start_date) }} - {{ formatShortDate(course.end_date) }}</p>
                        </div>
                        <div>
                          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Занятия</p>
                          <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ course.attended_lessons }}/{{ course.total_lessons }} ач</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Completed Courses -->
              <div v-if="completedCourses.length > 0" :class="{ 'mt-10': activeCourses.length > 0 }">
                <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">История обучения</h3>
                <div class="grid grid-cols-1 gap-3">
                  <div 
                    v-for="course in completedCourses" 
                    :key="course.group_id"
                    @click="openCourseDetailModal(course)"
                    class="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                  >
                    <div class="flex items-center gap-4">
                      <div class="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <CheckIcon class="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ course.course_name }}</h4>
                        <p class="text-[10px] text-slate-500">Завершен {{ formatShortDate(course.end_date) }} • {{ course.total_lessons }} ач</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-6">
                      <div class="text-right hidden sm:block">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Результат</p>
                        <p class="text-xs font-bold text-slate-900 dark:text-white">{{ course.progress }}%</p>
                      </div>
                      <ArrowRightIcon class="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <BookOpenIcon class="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p class="text-slate-500 font-medium">История обучения отсутствует</p>
            </div>
          </div>

          <!-- CERTIFICATES TAB -->
          <div v-show="activeTab === 'certificates'" class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Выданные документы</h3>
              <UiButton v-if="canEditStudents" variant="outline" size="sm" @click="openCertificatesModal" class="h-9 gap-2">
                <PlusIcon class="w-4 h-4" /> Добавить
              </UiButton>
            </div>

            <div v-if="student.certificates?.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                v-for="cert in student.certificates" 
                :key="cert.id"
                @click="openCertificateDetailModal(cert)"
                class="group p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
              >
                <div class="absolute -top-4 -right-4 h-24 w-24 bg-warning/5 rounded-full blur-2xl group-hover:bg-warning/10 transition-colors"></div>
                
                <div class="flex justify-between items-start mb-6">
                  <div class="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
                    <AwardIcon class="w-6 h-6" />
                  </div>
                  <div v-if="cert.fileUrl">
                    <a 
                      :href="`/api/certificates/download/${cert.id}`" 
                      target="_blank" 
                      @click.stop
                      class="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <DownloadIcon class="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <h4 class="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 min-h-[40px]">{{ cert.courseName }}</h4>
                
                <div class="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div class="flex justify-between items-center text-[10px]">
                    <span class="font-black uppercase tracking-widest text-slate-400">Номер</span>
                    <span class="font-bold text-slate-900 dark:text-white font-mono">{{ cert.certificateNumber }}</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px]">
                    <span class="font-black uppercase tracking-widest text-slate-400">Выдан</span>
                    <span class="font-bold text-slate-900 dark:text-white">{{ formatDateShort(cert.issueDate) }}</span>
                  </div>
                  <div class="flex justify-between items-center text-[10px]">
                    <span class="font-black uppercase tracking-widest text-slate-400">Статус</span>
                    <span 
                      class="px-2 py-0.5 rounded-md font-black uppercase tracking-tighter"
                      :class="getExpiryBadgeClass(cert.expiryDate)"
                    >
                      {{ getExpiryLabel(cert.expiryDate) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <AwardIcon class="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p class="text-slate-500 font-medium">Сертификаты не найдены</p>
            </div>
          </div>
        </div>

        <!-- Sidebar (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Timeline / Stats -->
          <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Системная информация</h4>
            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <ClockIcon class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Создан</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDate(student.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <RefreshCwIcon class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Обновлен</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatDate(student.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Tips / Help -->
          <div class="rounded-3xl bg-primary/5 border border-primary/10 p-6">
            <h4 class="text-xs font-black uppercase tracking-widest text-primary mb-4">Подсказка</h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Вы можете скачать полную справку о слушателе в формате PDF, нажав на кнопку «Экспорт справки» в верхней части страницы. В справку будут включены все пройденные курсы и выданные сертификаты.
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <DatabaseStudentFormModal
      v-if="isEditModalOpen && student"
      :student="student"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @submit="handleUpdate"
    />

    <DatabaseStudentCertificatesModal
      v-if="isCertificatesModalOpen && student"
      :student="student"
      :is-open="isCertificatesModalOpen"
      @close="closeCertificatesModal"
      @refresh="fetchStudent"
    />

    <DatabaseCertificateDetailModal
      v-if="isCertificateDetailModalOpen && selectedCertificate"
      :certificate="selectedCertificate"
      :is-open="isCertificateDetailModalOpen"
      @close="closeCertificateDetailModal"
    />

    <DatabaseStudentCourseDetailModal
      v-if="isCourseDetailModalOpen && selectedCourse"
      :course="selectedCourse"
      :is-open="isCourseDetailModalOpen"
      @close="closeCourseDetailModal"
    />

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление слушателя"
      message="Вы уверены, что хотите удалить этого слушателя? Это действие безвозвратно удалит все связанные данные."
      :item-name="student?.fullName"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Student, UpdateStudentData, StudentCertificate } from "~/types/student";
import { 
  User as UserIcon, 
  ArrowLeft, 
  Check as CheckIcon, 
  Building as BuildingIcon, 
  Briefcase as BriefcaseIcon,
  FileDown as FileDownIcon,
  Settings as SettingsIcon,
  Trash2 as Trash2Icon,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  Activity as ActivityIcon,
  Calendar as CalendarIcon,
  ArrowRight as ArrowRightIcon,
  Clock as ClockIcon,
  RefreshCw as RefreshCwIcon,
  Copy as CopyIcon,
  Plus as PlusIcon,
  Download as DownloadIcon
} from "lucide-vue-next";
import { usePDFExport } from "~/composables/usePDFExport";

const route = useRoute();
const router = useRouter();
const studentId = route.params.id as string;
const { authFetch } = useAuthFetch();
const notification = useNotification();
const { canEditStudents, canDeleteStudents } = usePermissions();

// State
const student = ref<Student | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Профиль", icon: UserIcon },
  { id: "courses", label: "Обучение", icon: BookOpenIcon },
  { id: "certificates", label: "Сертификаты", icon: AwardIcon },
];

/**
 * Курсы слушателя
 */
interface CourseRecord {
  group_id: string;
  course_id: string;
  course_name: string;
  group_name: string;
  start_date: string;
  end_date: string;
  total_lessons: number;
  attended_lessons: number;
  progress: number;
  status: "active" | "completed" | "dropped";
  teacher_name: string | null;
}

const studentCourses = ref<CourseRecord[]>([]);
const coursesLoading = ref(false);
const isCourseDetailModalOpen = ref(false);
const selectedCourse = ref<CourseRecord | null>(null);

const activeCourses = computed(() => studentCourses.value.filter(c => c.status === "active"));
const completedCourses = computed(() => studentCourses.value.filter(c => c.status === "completed"));

// Вычисляемые метрики
const averageProgress = computed(() => {
  if (studentCourses.value.length === 0) return 0;
  const sum = studentCourses.value.reduce((acc, c) => acc + c.progress, 0);
  return Math.round(sum / studentCourses.value.length);
});

const registrationDays = computed(() => {
  if (!student.value?.created_at) return '—';
  const created = new Date(student.value.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} дн.`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} мес.`;
  return `${Math.floor(months / 12)} г. ${months % 12} мес.`;
});

// Методы
const fetchStudent = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(`/api/students/${studentId}`);
    if (response.success) {
      student.value = response.student;
      fetchStudentCourses();
    } else {
      error.value = "Не удалось загрузить данные";
    }
  } catch (e: any) {
    error.value = e.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
};

const fetchStudentCourses = async () => {
  coursesLoading.value = true;
  try {
    const response = await authFetch<{ success: boolean; courses: CourseRecord[] }>(`/api/students/${studentId}/courses`);
    if (response.success) {
      studentCourses.value = response.courses;
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
  } finally {
    coursesLoading.value = false;
  }
};

const openEditModal = () => isEditModalOpen.value = true;
const closeEditModal = () => isEditModalOpen.value = false;

const handleUpdate = async (data: UpdateStudentData) => {
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(`/api/students/${studentId}`, {
      method: "PUT",
      body: data,
    });

    if (response.success) {
      student.value = response.student;
      closeEditModal();
      notification.success("Данные слушателя обновлены");
    }
  } catch (e) {
    notification.error("Ошибка при обновлении данных");
  }
};

const handleDelete = () => isDeleteModalOpen.value = true;
const closeDeleteModal = () => isDeleteModalOpen.value = false;

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/students/${studentId}`, { method: "DELETE" });
    notification.success("Слушатель удален");
    router.push("/users?tab=students");
  } catch (e) {
    notification.error("Ошибка удаления");
  } finally {
    isDeleting.value = false;
    closeDeleteModal();
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  notification.success("ПИНФЛ скопирован");
};

const exportTranscript = async () => {
  if (!student.value) return;
  notification.info("Формирование справки...");
  try {
    const { exportStudentProfile } = usePDFExport();
    await exportStudentProfile(student.value, studentCourses.value);
    notification.success("Справка успешно сформирована");
  } catch (e) {
    notification.error("Ошибка при экспорте PDF");
  }
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const formatDate = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
};

const formatDateShort = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatShortDate = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

// Сертификаты
const isCertificatesModalOpen = ref(false);
const isCertificateDetailModalOpen = ref(false);
const selectedCertificate = ref<any>(null);

const openCertificatesModal = () => isCertificatesModalOpen.value = true;
const closeCertificatesModal = () => isCertificatesModalOpen.value = false;

const openCertificateDetailModal = (cert: StudentCertificate) => {
  if (!student.value) return;
  selectedCertificate.value = {
    ...cert,
    student: {
      id: student.value.id,
      fullName: student.value.fullName,
      pinfl: student.value.pinfl,
      organization: student.value.organization,
      position: student.value.position,
      department: student.value.department,
    },
  };
  isCertificateDetailModalOpen.value = true;
};

const closeCertificateDetailModal = () => {
  isCertificateDetailModalOpen.value = false;
  selectedCertificate.value = null;
};

const openCourseDetailModal = (course: CourseRecord) => {
  selectedCourse.value = course;
  isCourseDetailModalOpen.value = true;
};

const closeCourseDetailModal = () => {
  isCourseDetailModalOpen.value = false;
  selectedCourse.value = null;
};

const getExpiryStatus = (expiryDate?: string | Date | null) => {
  if (!expiryDate) return "valid";
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
};

const getExpiryBadgeClass = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  if (status === "expired") return "bg-danger/10 text-danger";
  if (status === "expiring") return "bg-warning/10 text-warning";
  return "bg-success/10 text-success";
};

const getExpiryLabel = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  if (status === "expired") return "Истек";
  if (status === "expiring") return "Истекает";
  return "Активен";
};

onMounted(() => {
  fetchStudent();
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
