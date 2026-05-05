<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">Загрузка информации об инструкторе...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error || !instructor" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400">
          <UserIcon class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">{{ error || 'Инструктор не найден' }}</h3>
        <UiButton class="mt-8 shadow-lg" @click="$router.push('/users')">К списку пользователей</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <NuxtLink to="/users" class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
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
                <img v-if="instructor.photo_base64" :src="instructor.photo_base64" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <span class="text-4xl font-black">{{ getInitials(instructor.fullName) }}</span>
                </div>
              </div>
              <div v-if="instructor.isActive" class="absolute -bottom-1 -right-1 h-8 w-8 bg-success rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                <CheckIcon class="w-4 h-4 text-white" />
              </div>
            </div>

            <div class="space-y-3 text-center sm:text-left">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {{ instructor.fullName }}
                </h1>
                <div 
                  class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                  :class="instructor.isActive ? 'border-success/20 bg-success/5 text-success' : 'border-danger/20 bg-danger/5 text-danger'"
                >
                  {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
                </div>
              </div>
              
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm font-bold text-slate-500">
                <div class="flex items-center gap-2">
                  <MailIcon class="w-4 h-4 text-slate-400" />
                  {{ instructor.email || 'Email не указан' }}
                </div>
                <div class="flex items-center gap-2">
                  <PhoneIcon class="w-4 h-4 text-slate-400" />
                  {{ instructor.phone || 'Телефон не указан' }}
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
              @click="exportCertificate"
            >
              <FileDownIcon class="w-4 h-4" />
              Экспорт справки
            </UiButton>

            <UiButton
              v-if="canEditInstructors"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="isEditModalOpen = true"
            >
              <SettingsIcon class="w-4 h-4" />
              Редактировать
            </UiButton>

            <UiButton
              v-if="canDeleteInstructors"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-danger border-danger/20 hover:bg-danger/5"
              @click="isDeleteModalOpen = true"
            >
              <Trash2Icon class="w-4 h-4" />
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Qualification Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Квалификация</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                {{ instructor.academic_degree || instructor.education || 'Не указана' }}
              </h3>
            </div>
            <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
              <GraduationCapIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="text-xs text-slate-400 font-medium">{{ instructor.academic_rank || 'Без ученого звания' }}</span>
          </div>
        </div>

        <!-- Teaching Hours Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Загрузка часов</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ instructor.usedHours || 0 }} / {{ instructor.maxHours || '∞' }}
              </h3>
            </div>
            <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
              <ClockIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div 
                class="h-full rounded-full bg-success transition-all duration-500"
                :style="{ width: `${Math.min((instructor.usedHours || 0) / (instructor.maxHours || 1) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Experience Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Стаж в центре</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ experienceText }}
              </h3>
            </div>
            <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
              <CalendarIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <span class="text-xs text-slate-400 font-medium">С {{ formatDate(instructor.hireDate) }}</span>
          </div>
        </div>

        <!-- Languages Card -->
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Знание языков</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {{ instructor.languages?.length || 0 }}
              </h3>
            </div>
            <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
              <GlobeIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-1">
            <span 
              v-for="lang in instructor.languages" 
              :key="lang"
              class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400"
            >
              {{ languageMap[lang] || lang }}
            </span>
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
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Дата рождения</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatDate(instructor.birthDate) }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Паспортные данные</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ instructor.passportData || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Education Detail -->
            <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div class="flex items-center gap-3 mb-8">
                <div class="p-2 rounded-xl bg-primary/10 text-primary">
                  <SchoolIcon class="w-5 h-5" />
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Образование и квалификация</h3>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Уровень образования</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ instructor.education || '—' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Учебное заведение</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ instructor.university || '—' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Специальность</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ instructor.specialty || '—' }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Учёная степень / звание</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">
                    {{ instructor.academic_degree || '—' }} 
                    <span v-if="instructor.academic_degree && instructor.academic_rank" class="text-slate-300 mx-2">|</span>
                    {{ instructor.academic_rank }}
                  </p>
                </div>
                <div class="sm:col-span-2 space-y-4">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-400">Сканы дипломов</p>
                  <div v-if="diplomaFiles.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      v-for="file in diplomaFiles" 
                      :key="file.uuid"
                      class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 group hover:border-primary/30 transition-all"
                    >
                      <div class="flex items-center gap-3 overflow-hidden">
                        <FileTextIcon class="w-5 h-5 text-primary shrink-0" />
                        <span class="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{{ file.filename }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button @click="previewFile(file.uuid, file.filename)" class="p-2 text-slate-400 hover:text-primary transition-colors">
                          <EyeIcon class="w-4 h-4" />
                        </button>
                        <button @click="downloadFile(file.uuid, file.filename)" class="p-2 text-slate-400 hover:text-success transition-colors">
                          <DownloadIcon class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-slate-400 font-medium">Файлы не прикреплены</p>
                </div>
              </div>
            </div>

            <!-- Certificates List -->
            <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
              <div class="flex items-center gap-3 mb-8">
                <div class="p-2 rounded-xl bg-warning/10 text-warning">
                  <AwardIcon class="w-5 h-5" />
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Сертификаты и достижения</h3>
              </div>

              <div v-if="!instructor.certificates?.length" class="text-center py-12">
                <AwardIcon class="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p class="text-slate-400">Список сертификатов пуст</p>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  v-for="(cert, index) in instructor.certificates" 
                  :key="index"
                  class="group p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 transition-all hover:shadow-lg"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-slate-900 dark:text-white">{{ cert.name }}</h4>
                    <AwardIcon class="w-4 h-4 text-warning" />
                  </div>
                  <p class="text-xs text-slate-500 mb-4">{{ formatDate(cert.date) }}</p>
                  <div v-if="cert.fileId" class="flex items-center gap-2 mt-4">
                    <UiButton variant="outline" size="sm" @click="previewFile(cert.fileId, cert.name)" class="h-8 flex-1 gap-2">
                      <EyeIcon class="w-4 h-4" /> Просмотреть
                    </UiButton>
                    <UiButton variant="ghost" size="sm" @click="downloadFile(cert.fileId, cert.name)" class="h-8 w-8 p-0 text-slate-400 hover:text-success">
                      <DownloadIcon class="w-4 h-4" />
                    </UiButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- HOURS TAB -->
          <div v-show="activeTab === 'hours'" class="animate-in fade-in duration-500">
            <InstructorsHoursStats
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="hoursStatsRef"
            />
          </div>

          <!-- HISTORY TAB -->
          <div v-show="activeTab === 'history'" class="animate-in fade-in duration-500">
            <InstructorsCourseHistory
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="courseHistoryRef"
            />
          </div>
        </div>

        <!-- Sidebar / Additional Info (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Employment Info -->
          <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Сведения о трудоустройстве</h4>
            
            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <CalendarIcon class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-xs text-slate-400 mb-1">Дата приема</p>
                  <p class="font-bold text-slate-900 dark:text-white">{{ formatDate(instructor.hireDate) }}</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <FileTextIcon class="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p class="text-xs text-slate-400 mb-1">Контрактные данные</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white line-clamp-3">{{ instructor.contractInfo || '—' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Files List -->
          <div class="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Прикрепленные документы</h4>
            
            <div v-if="!additionalFilesList.length" class="text-center py-6 text-slate-400 text-sm">
              Нет дополнительных файлов
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="file in additionalFilesList" 
                :key="file.uuid"
                class="group flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all hover:shadow-md"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 shrink-0">
                    <FileTextIcon class="w-4 h-4" />
                  </div>
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{{ file.filename }}</span>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="previewFile(file.uuid, file.filename)" class="p-1.5 text-slate-400 hover:text-primary transition-colors">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <button @click="downloadFile(file.uuid, file.filename)" class="p-1.5 text-slate-400 hover:text-success transition-colors">
                    <DownloadIcon class="w-4 h-4" />
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
          <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
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
  Download as DownloadIcon
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
  uz: 'Узбекский',
  ru: 'Русский',
  en: 'Английский',
  de: 'Немецкий'
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
const diplomaFiles = ref<any[]>([]);
const additionalFilesList = ref<any[]>([]);

const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Профиль и Квалификация", icon: UserIcon },
  { id: "hours", label: "Отчётность и Часы", icon: ClockIcon },
  { id: "history", label: "История Дисциплин", icon: HistoryIcon },
];

// Computed
const experienceText = computed(() => {
  if (!instructor.value?.hireDate) return '—';
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
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const previewFile = async (fileId: string, fileName: string = 'Документ') => {
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

const downloadFile = async (fileId: string, fileName: string = 'document') => {
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
  
  const allUuids = [
    ...(instructor.value.diploma_file_ids || []),
    ...(instructor.value.additional_files || []),
    ...(instructor.value.certificates?.map(c => c.fileId).filter(Boolean) as string[] || [])
  ];

  if (allUuids.length === 0) return;

  try {
    const files = await getFilesByUuids(allUuids);
    diplomaFiles.value = files.filter(f => instructor.value?.diploma_file_ids?.includes(f.uuid));
    additionalFilesList.value = files.filter(f => instructor.value?.additional_files?.includes(f.uuid));
  } catch (error) {
    console.error('Error fetching file metadata:', error);
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
