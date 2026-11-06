<template>
  <!-- Внешний враппер без двойного отступа (отступ задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка: компактный спиннер -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Загрузка профиля...</p>
      </div>
    </div>

    <!-- Ошибка: плоская карточка без blur и больших радиусов, одно действие -->
    <div v-else-if="error" class="rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
      <AlertCircle class="mx-auto mb-3 h-10 w-10 text-danger" />
      <h3 class="mb-1 text-xl font-semibold text-gray-900 dark:text-white">Ошибка загрузки</h3>
      <p class="mb-5 text-sm text-gray-600 dark:text-gray-400">{{ error }}</p>
      <UiButton variant="primary" @click="loadProfile">Попробовать снова</UiButton>
    </div>

    <!-- Содержимое профиля -->
    <div v-else-if="profile" class="space-y-4">
      <!-- Единая шапка: имя (text-xl/2xl), роль бейджем, контакты в мета-строке; крошка — «Личный кабинет» -->
      <UiPageHeader :title="profile.name" :breadcrumbs="[{ label: 'Личный кабинет' }]">
        <template #badge>
          <span class="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
            {{ getRoleLabel(profile.role) }}
          </span>
        </template>

        <!-- Контакты; телефон скрыт маской (показать/копировать по кнопке) -->
        <template #meta>
          <span class="inline-flex items-center gap-1.5"><Mail class="h-3.5 w-3.5 text-gray-400" />{{ profile.email }}</span>
          <span v-if="profile.phone" class="inline-flex items-center gap-1.5">
            <Phone class="h-3.5 w-3.5 text-gray-400" />
            <UiSensitiveValue :value="profile.phone" :visible-tail="4" />
          </span>
          <span v-if="isStudent && studentData?.organization" class="inline-flex items-center gap-1.5">
            <BuildingIcon class="h-3.5 w-3.5 text-gray-400" />{{ studentData.organization }}
          </span>
        </template>

        <!-- Действия: «Карточка PDF» — главное (для инструктора/студента), «Изменить данные» — вторичное -->
        <template #actions>
          <UiButton v-if="isTeacher || isStudent" variant="primary" :start-icon="FileDown" @click="exportProfilePDF">Карточка PDF</UiButton>
          <UiButton v-if="isAdmin || isManager" variant="outline" :start-icon="Settings" @click="openEditModal">Изменить данные</UiButton>
        </template>
      </UiPageHeader>

      <!-- Аватар + полоса метрик в одну строку (вместо «bento»-карточек с декоративными иконками) -->
      <div class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <!-- Фото: убран hover-оверлей с камерой (загрузки фото здесь нет — он вводил в заблуждение) -->
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
          <img
            v-if="profile.photo_base64 || (isTeacher && instructorData?.photo_base64) || (isStudent && studentData?.photo_base64)"
            :src="profile.photo_base64 || (isTeacher ? instructorData?.photo_base64 : studentData?.photo_base64)"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
            <span class="text-xl font-semibold">{{ getInitials(profile.name) }}</span>
          </div>
        </div>

        <!-- Метрики инструктора -->
        <div v-if="isTeacher && instructorData" class="grid min-w-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <UiStat
            label="Квалификация"
            :value="instructorData.academic_degree || instructorData.education || 'Не указана'"
            :hint="instructorData.academic_rank || '—'"
            :icon="GraduationCap"
            tone="primary"
          />
          <UiStat
            label="Загрузка часов"
            :value="`${instructorData.usedHours || 0} / ${instructorData.maxHours || '∞'}`"
            :icon="Clock"
            tone="success"
            :progress="Math.min(((instructorData.usedHours || 0) / (instructorData.maxHours || 1)) * 100, 100)"
          />
          <UiStat label="Стаж в центре" :value="teacherExperience" :hint="`С ${formatDateShort(instructorData.hireDate)}`" :icon="Calendar" tone="warning" />
          <UiStat
            label="Языки"
            :value="instructorData.languages?.length || 0"
            :hint="instructorData.languages?.length ? instructorData.languages.map((l) => languageMap[l] || l).join(', ') : 'Не указаны'"
            :icon="GlobeIcon"
            tone="info"
          />
        </div>

        <!-- Метрики студента -->
        <div v-else-if="isStudent && studentData" class="grid min-w-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <UiStat label="Сертификаты" :value="studentData.certificates?.length || 0" hint="Всего получено" :icon="Award" tone="warning" />
          <UiStat label="Курсы" :value="studentCourses.length" :hint="`${activeStudentCourses.length} активных`" :icon="BookOpen" tone="primary" />
          <UiStat label="Посещаемость" :value="`${averageStudentProgress}%`" :icon="Activity" tone="success" :progress="averageStudentProgress" />
          <UiStat label="В системе" :value="studentRegistrationDays" :hint="`С ${formatDateShort(profile.created_at)}`" :icon="Calendar" tone="info" />
        </div>

        <!-- Метрики администратора: цвет задаётся через tone, а не динамическим bg-${color} (Tailwind такие классы не генерирует) -->
        <div v-else-if="isAdmin" class="grid min-w-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <UiStat v-for="stat in adminStatsList" :key="stat.label" :label="stat.label" :value="stat.value" :icon="stat.icon" :tone="stat.color" />
        </div>
      </div>

      <!-- Вкладки через UiTabs -->
      <UiTabs v-model="activeTab" :tabs="roleTabs" />

      <!-- Содержимое вкладок -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <!-- Основная область -->
        <div class="space-y-4 lg:col-span-8">
          <!-- Вкладка «Обзор» -->
          <div v-show="activeTab === 'overview'" class="space-y-4">
            <!-- Основные данные -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                <User class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Основные данные</h3>
              </div>
              <div class="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
                <div>
                  <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Полное имя</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.name }}</p>
                </div>
                <div>
                  <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Email адрес</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.email }}</p>
                </div>
                <div>
                  <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Телефон</p>
                  <UiSensitiveValue v-if="profile.phone" :value="profile.phone" :visible-tail="4" class="text-gray-900 dark:text-white" />
                  <p v-else class="text-sm font-medium text-gray-900 dark:text-white">Не указан</p>
                </div>
                <div v-if="profile.pinfl">
                  <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">ПИНФЛ</p>
                  <!-- ПИНФЛ: маска + показать + копировать -->
                  <UiSensitiveValue :value="profile.pinfl" class="text-gray-900 dark:text-white" />
                </div>
                <div v-if="profile.workplace">
                  <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Место работы</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.workplace }}</p>
                </div>
                <div v-if="profile.position">
                  <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Должность</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ profile.position }}</p>
                </div>
              </div>
            </div>

            <!-- Данные, зависящие от роли -->
            <template v-if="isTeacher && instructorData">
              <!-- Образование инструктора -->
              <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                  <SchoolIcon class="h-4 w-4 text-gray-400" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Образование</h3>
                </div>
                <div v-if="!instructorData.education_history?.length" class="p-8 text-center text-sm text-gray-400">
                  Сведения об образовании не указаны
                </div>
                <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                  <div v-for="(edu, idx) in instructorData.education_history" :key="idx" class="p-5">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <SchoolIcon class="h-4 w-4" />
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ edu.university }}</p>
                          <p class="mt-0.5 text-xs font-medium text-primary">{{ edu.education }}</p>
                          <p class="mt-1 text-sm text-gray-500">{{ edu.specialty }}</p>
                        </div>
                      </div>
                      <span class="shrink-0 text-sm text-gray-400">{{ edu.year_start }} - {{ edu.year_end }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Опыт работы инструктора -->
              <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                  <BriefcaseIcon class="h-4 w-4 text-gray-400" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Опыт работы</h3>
                </div>
                <div v-if="!instructorData.work_experience?.length" class="p-8 text-center text-sm text-gray-400">Опыт работы не указан</div>
                <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                  <div v-for="(exp, idx) in instructorData.work_experience" :key="idx" class="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ exp.employer }}</p>
                        <p class="mt-0.5 text-xs text-gray-500">{{ exp.position }}</p>
                      </div>
                      <span class="shrink-0 text-sm text-gray-400">{{ exp.period }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Инструктор: часы и история -->
          <template v-if="isTeacher && instructorData">
            <div v-show="activeTab === 'hours'">
              <InstructorsHoursStats :instructor-id="instructorData.id" :initial-load="false" ref="hoursStatsRef" />
            </div>
            <div v-show="activeTab === 'history'">
              <InstructorsCourseHistory :instructor-id="instructorData.id" :initial-load="false" ref="courseHistoryRef" />
            </div>
          </template>

          <!-- Студент: обучение и сертификаты -->
          <template v-if="isStudent && studentData">
            <div v-show="activeTab === 'courses'" class="space-y-4">
              <div v-if="coursesLoading" class="flex justify-center py-16">
                <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
              <template v-else-if="studentCourses.length > 0">
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div v-for="course in studentCourses" :key="course.group_id" class="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary/40 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div class="mb-3 flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h4 class="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{{ course.course_name }}</h4>
                        <p class="mt-0.5 text-xs text-gray-500">{{ course.group_name }}</p>
                      </div>
                      <span :class="`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${course.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06]'}`">
                        {{ course.status === 'active' ? 'Активен' : 'Завершен' }}
                      </span>
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-xs text-gray-400">
                        <span>Прогресс</span>
                        <span class="font-semibold text-primary">{{ course.progress }}%</span>
                      </div>
                      <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div class="h-full rounded-full bg-primary transition-all duration-500" :style="{ width: `${course.progress}%` }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <!-- Пустое состояние через UiEmptyState -->
              <UiEmptyState v-else title="Курсы не найдены" :icon="BookOpen" />
            </div>

            <div v-show="activeTab === 'certificates'" class="space-y-4">
              <div v-if="studentData.certificates?.length > 0" class="grid grid-cols-1 gap-2">
                <div v-for="cert in studentData.certificates" :key="cert.id" class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <Award class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                      <h4 class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ cert.courseName }}</h4>
                      <p class="mt-0.5 text-xs text-gray-500">№ {{ cert.certificateNumber }} • {{ formatDateShort(cert.issueDate) }}</p>
                    </div>
                  </div>
                  <a v-if="cert.fileUrl" :href="`/api/certificates/download/${cert.id}`" target="_blank" title="Скачать" class="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-white/10">
                    <DownloadIcon class="h-4 w-4" />
                  </a>
                </div>
              </div>
              <UiEmptyState v-else title="Сертификаты отсутствуют" :icon="Award" />
            </div>
          </template>

          <!-- Вкладка «Безопасность» (общая) -->
          <div v-show="activeTab === 'security'">
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                <Lock class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Безопасность аккаунта</h3>
              </div>
              <div class="max-w-xl p-5">
                <!-- Форма смены пароля: поля h-9, text-sm, подписи не меньше 12px -->
                <form class="space-y-5" @submit.prevent="changePassword">
                  <div class="space-y-4">
                    <div class="space-y-1.5">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Текущий пароль</label>
                      <input v-model="passwordForm.currentPassword" type="password" required class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Новый пароль</label>
                      <input v-model="passwordForm.newPassword" type="password" required minlength="6" class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Подтверждение</label>
                      <input v-model="passwordForm.confirmPassword" type="password" required class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div class="flex justify-end pt-1">
                    <UiButton variant="primary" type="submit" :disabled="changingPassword" :loading="changingPassword">
                      {{ changingPassword ? 'Обновление...' : 'Обновить пароль' }}
                    </UiButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Боковая колонка: системные данные; градиентный промо-блок «Безопасность» убран (дубль вкладки) -->
        <div class="lg:col-span-4">
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Системные данные</h4>
            </div>
            <div class="space-y-4 p-5">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06]">
                  <Clock class="h-4 w-4" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Зарегистрирован</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDateShort(profile.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06]">
                  <RefreshCwIcon class="h-4 w-4" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Последнее обновление</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDateShort(profile.updated_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06]">
                  <ShieldCheck class="h-4 w-4" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Статус аккаунта</p>
                  <div class="mt-0.5 flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full bg-success"></span>
                    <span class="text-sm font-medium text-success">Активен</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальные окна (логика без изменений) -->
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

    <!-- Редактирование профиля администратора/менеджера: поля единого размера h-9 -->
    <UiModal v-if="isEditModalOpen && !isTeacher && !isStudent" :is-open="isEditModalOpen" title="Редактировать профиль" @close="isEditModalOpen = false">
      <div class="space-y-4 p-6">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Полное имя</label>
          <input v-model="editForm.name" type="text" class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Телефон</label>
          <input v-model="editForm.phone" type="text" class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 p-4">
          <UiButton variant="outline" @click="isEditModalOpen = false">Отмена</UiButton>
          <UiButton variant="primary" :disabled="updatingProfile" @click="updateProfile">
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

// Поле color используется как tone у UiStat (primary/success/warning/info) — динамические bg-${color} Tailwind не собирает
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
