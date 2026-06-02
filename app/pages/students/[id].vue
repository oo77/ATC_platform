<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Состояние загрузки -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка информации о слушателе...
        </p>
      </div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error || !student"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center max-w-md">
        <div
          class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400"
        >
          <UserIcon class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ error || "Слушатель не найден" }}
        </h3>
        <UiButton
          class="mt-8 shadow-lg"
          @click="$router.push('/users?tab=students')"
          >К списку слушателей</UiButton
        >
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-4">
          <NuxtLink
            to="/users?tab=students"
            class="group inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft
                class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
              />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Profile Main Info — compact -->
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <div
                class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-xl"
              >
                <img
                  v-if="student.photo_base64"
                  :src="student.photo_base64"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-primary/10 text-primary"
                >
                  <span class="text-2xl font-black">{{
                    getInitials(student.fullName)
                  }}</span>
                </div>
              </div>
              <div
                class="absolute -bottom-1 -right-1 h-5 w-5 bg-success rounded-lg border-2 border-white dark:border-slate-900 flex items-center justify-center shadow"
              >
                <CheckIcon class="w-3 h-3 text-white" />
              </div>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1
                  class="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none"
                >
                  {{ student.fullName }}
                </h1>
              </div>

              <div
                class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500"
              >
                <div class="flex items-center gap-1.5">
                  <BuildingIcon class="w-3.5 h-3.5 text-slate-400" />
                  {{ student.organization }}
                </div>
                <div class="flex items-center gap-1.5">
                  <BriefcaseIcon class="w-3.5 h-3.5 text-slate-400" />
                  {{ student.position }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex flex-wrap items-center justify-center lg:justify-end gap-2"
          >
            <UiButton
              variant="primary"
              size="sm"
              class="h-9 px-3 gap-1.5 font-bold shadow-lg shadow-primary/20"
              @click="exportTranscript"
            >
              <FileDownIcon class="w-3.5 h-3.5" />
              Карточка PDF
            </UiButton>

            <UiButton
              v-if="canEditStudents"
              variant="outline"
              size="sm"
              class="h-9 px-3 gap-1.5 font-bold"
              @click="openEditModal"
            >
              <SettingsIcon class="w-3.5 h-3.5" />
              Изменить
            </UiButton>

            <UiButton
              v-if="canDeleteStudents"
              variant="outline"
              size="sm"
              class="h-9 px-3 gap-1.5 font-bold text-danger border-danger/20 hover:bg-danger/5"
              @click="handleDelete"
            >
              <Trash2Icon class="w-3.5 h-3.5" />
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid — compact -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <!-- Certificates Card -->
        <div
          class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Сертификаты</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                {{ student.certificates?.length || 0 }}
              </h3>
              <span class="text-[10px] text-slate-400 truncate block">Всего получено</span>
            </div>
            <div class="rounded-lg bg-warning/10 p-2 text-warning ml-2 shrink-0">
              <AwardIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Courses Card -->
        <div
          class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Курсы</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                {{ studentCourses.length }}
              </h3>
              <span class="text-[10px] text-slate-400 block">{{ activeCourses.length }} активных</span>
            </div>
            <div class="rounded-lg bg-primary/10 p-2 text-primary ml-2 shrink-0">
              <BookOpenIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Attendance Card -->
        <div
          class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Посещаемость</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                {{ averageProgress }}%
              </h3>
            </div>
            <div class="rounded-lg bg-success/10 p-2 text-success ml-2 shrink-0">
              <ActivityIcon class="w-4 h-4" />
            </div>
          </div>
          <div class="mt-2 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div class="h-full rounded-full bg-success transition-all duration-500" :style="{ width: `${averageProgress}%` }"></div>
          </div>
        </div>

        <!-- Registration Card -->
        <div
          class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">В системе</p>
              <h3 class="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                {{ registrationDays }}
              </h3>
              <span class="text-[10px] text-slate-400 block">С {{ formatDateShort(student.created_at) }}</span>
            </div>
            <div class="rounded-lg bg-info/10 p-2 text-info ml-2 shrink-0">
              <CalendarIcon class="w-4 h-4" />
            </div>
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
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all duration-300 whitespace-nowrap uppercase tracking-wider',
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
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Main Content Area (8 cols) -->
        <div class="lg:col-span-8 space-y-5">
          <!-- INFO TAB -->
          <div
            v-show="activeTab === 'info'"
            class="space-y-5 animate-in fade-in duration-500"
          >
            <!-- Student Data List — compact -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <UserIcon class="w-4 h-4 text-info" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Данные слушателя</h3>
              </div>
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                <!-- PINFL -->
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-bold text-slate-400">ПИНФЛ</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono tracking-wider">
                      {{ showPinfl ? student.pinfl : "••••••••••••••" }}
                    </span>
                    <div class="flex items-center gap-0.5">
                      <button @click="showPinfl = !showPinfl" class="p-1 text-slate-400 hover:text-primary transition-colors">
                        <component :is="showPinfl ? EyeOffIcon : EyeIcon" class="w-3.5 h-3.5" />
                      </button>
                      <button @click="copyToClipboard(student.pinfl)" class="p-1 text-slate-400 hover:text-primary transition-colors">
                        <CopyIcon class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Birth Date -->
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-bold text-slate-400">Дата рождения</span>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ formatDate(student.birthDate) }}</span>
                </div>

                <!-- Organization -->
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-bold text-slate-400">Организация</span>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200 text-right">{{ student.organization }}</span>
                </div>

                <!-- Department -->
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-bold text-slate-400">Подразделение</span>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ student.department || "—" }}</span>
                </div>

                <!-- Position -->
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-bold text-slate-400">Должность</span>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200 text-right">{{ student.position }}</span>
                </div>

                <!-- Registration Date -->
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-bold text-slate-400">Регистрация</span>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ formatDate(student.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- COURSES TAB -->
          <div
            v-show="activeTab === 'courses'"
            class="space-y-4 animate-in fade-in duration-500"
          >
            <div v-if="coursesLoading" class="flex justify-center py-10">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>

            <template v-else-if="studentCourses.length > 0">
              <!-- Active Courses -->
              <div v-if="activeCourses.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <div class="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></div>
                  <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Текущее обучение</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    v-for="course in activeCourses"
                    :key="course.group_id"
                    @click="openCourseDetailModal(course)"
                    class="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer relative"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 pr-6">{{ course.course_name }}</h4>
                      <ArrowRightIcon class="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4" />
                    </div>
                    <p class="text-[10px] text-slate-500 mb-4 truncate">Группа: {{ course.group_name }}</p>

                    <div class="space-y-2">
                      <div class="flex justify-between items-end">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Прогресс</span>
                        <span class="text-xs font-black text-primary">{{ course.progress }}%</span>
                      </div>
                      <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all duration-700" :style="{ width: `${course.progress}%` }"></div>
                      </div>
                      <div class="flex justify-between pt-1">
                        <span class="text-[10px] font-bold text-slate-400">{{ formatShortDate(course.start_date) }} - {{ formatShortDate(course.end_date) }}</span>
                        <span class="text-[10px] font-bold text-slate-400">{{ course.attended_lessons }}/{{ course.total_lessons }} ач</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Completed Courses -->
              <div v-if="completedCourses.length > 0" :class="{ 'mt-6': activeCourses.length > 0 }">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">История обучения</h3>
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div
                    v-for="course in completedCourses"
                    :key="course.group_id"
                    @click="openCourseDetailModal(course)"
                    class="group flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                        <CheckIcon class="w-4 h-4 text-success" />
                      </div>
                      <div class="min-w-0">
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{{ course.course_name }}</h4>
                        <p class="text-[10px] text-slate-500 font-semibold uppercase tracking-tighter">
                          Завершен {{ formatShortDate(course.end_date) }} • {{ course.total_lessons }} ач • {{ course.progress }}%
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon class="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- CERTIFICATES TAB — compact list -->
          <div
            v-show="activeTab === 'certificates'"
            class="space-y-4 animate-in fade-in duration-500"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Выданные документы</h3>
              <UiButton v-if="canEditStudents" variant="outline" size="sm" @click="openCertificatesModal" class="h-7 gap-1 px-2 text-[10px]">
                <PlusIcon class="w-3 h-3" /> Добавить
              </UiButton>
            </div>

            <div v-if="student.certificates?.length > 0" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div
                v-for="cert in student.certificates"
                :key="cert.id"
                @click="openCertificateDetailModal(cert)"
                class="group flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <AwardIcon class="w-4 h-4 text-warning" />
                  </div>
                  <div class="min-w-0">
                    <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-none mb-1.5">{{ cert.courseName }}</h4>
                    <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>№ {{ cert.certificateNumber }}</span>
                      <span>•</span>
                      <span>Выдан {{ formatDateShort(cert.issueDate) }}</span>
                      <span>•</span>
                      <span :class="getExpiryBadgeClass(cert.expiryDate).replace('px-2 py-0.5 rounded-md', 'text-primary uppercase')">{{ getExpiryLabel(cert.expiryDate) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a v-if="cert.fileUrl" :href="`/api/certificates/download/${cert.id}`" target="_blank" @click.stop class="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <DownloadIcon class="w-3.5 h-3.5" />
                  </a>
                  <ArrowRightIcon class="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            <div v-else class="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Сертификаты не найдены</p>
            </div>
          </div>
        </div>

        <!-- Sidebar (4 cols) — compact -->
        <div class="lg:col-span-4 space-y-4">
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Системная информация</h4>
            </div>
            <div class="p-4 space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                  <ClockIcon class="w-4 h-4 text-slate-500" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Создан</p>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ formatDate(student.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                  <RefreshCwIcon class="w-4 h-4 text-slate-500" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Обновлен</p>
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ formatDate(student.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-primary/5 border border-primary/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <InfoIcon class="w-3.5 h-3.5 text-primary" />
              <h4 class="text-[10px] font-black uppercase tracking-widest text-primary">Подсказка</h4>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Вы можете скачать полную справку о слушателе в формате PDF. В нее включены все пройденные курсы и выданные сертификаты.
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
import type {
  Student,
  UpdateStudentData,
  StudentCertificate,
} from "~/types/student";
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
  Download as DownloadIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Info as InfoIcon,
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
const showPinfl = ref(false);

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
  course_code: string;
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

const activeCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "active"),
);
const completedCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "completed"),
);

// Вычисляемые метрики
const averageProgress = computed(() => {
  if (studentCourses.value.length === 0) return 0;
  const sum = studentCourses.value.reduce((acc, c) => acc + c.progress, 0);
  return Math.round(sum / studentCourses.value.length);
});

const registrationDays = computed(() => {
  if (!student.value?.created_at) return "—";
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
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
    );
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
    const response = await authFetch<{
      success: boolean;
      courses: CourseRecord[];
    }>(`/api/students/${studentId}/courses`);
    if (response.success) {
      studentCourses.value = response.courses;
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
  } finally {
    coursesLoading.value = false;
  }
};

const openEditModal = () => (isEditModalOpen.value = true);
const closeEditModal = () => (isEditModalOpen.value = false);

const handleUpdate = async (data: UpdateStudentData) => {
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
      {
        method: "PUT",
        body: data,
      },
    );

    if (response.success) {
      student.value = response.student;
      closeEditModal();
      notification.success("Данные слушателя обновлены");
    }
  } catch (e) {
    notification.error("Ошибка при обновлении данных");
  }
};

const handleDelete = () => (isDeleteModalOpen.value = true);
const closeDeleteModal = () => (isDeleteModalOpen.value = false);

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
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateShort = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatShortDate = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

// Сертификаты
const isCertificatesModalOpen = ref(false);
const isCertificateDetailModalOpen = ref(false);
const selectedCertificate = ref<any>(null);

const openCertificatesModal = () => (isCertificatesModalOpen.value = true);
const closeCertificatesModal = () => (isCertificatesModalOpen.value = false);

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
